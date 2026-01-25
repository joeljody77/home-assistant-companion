import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, Maximize2, Video, Image, RefreshCw, Wifi, WifiOff, AlertTriangle, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { CameraExpandedDialog } from "./CameraExpandedDialog";
import { CameraSourceType, CameraViewMode, RestreamType, CameraStatus } from "@/types/camera";
import { 
  isHlsUrl, 
  isMjpegUrl, 
  buildRestreamUrl, 
  isValidUrl 
} from "@/utils/streamUtils";

interface CameraWidgetProps {
  name: string;
  room?: string;
  
  // Source type
  sourceType?: CameraSourceType;
  
  // HA Entity source
  entityId?: string;
  entity_id?: string;
  
  // Stream URL source
  streamUrl?: string;
  snapshotUrl?: string;
  
  // RTSP source
  rtspUrl?: string;
  restreamType?: RestreamType;
  restreamBaseUrl?: string;
  streamName?: string;
  
  // View settings
  viewMode?: CameraViewMode;
  refreshInterval?: number;
  liveFps?: number;
}

export const CameraWidget = ({
  name,
  room,
  sourceType = "ha_entity",
  entityId,
  entity_id,
  streamUrl,
  snapshotUrl,
  rtspUrl,
  restreamType = "go2rtc",
  restreamBaseUrl,
  streamName,
  viewMode = "live",
  refreshInterval = 10,
  liveFps = 5,
}: CameraWidgetProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [effectiveViewMode, setEffectiveViewMode] = useState<CameraViewMode>(viewMode);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const previousBlobUrl = useRef<string | null>(null);
  const hlsVideoRef = useRef<HTMLVideoElement>(null);
  
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, isConnected, config, wsRef, sendCommand } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;
  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  const isOnline = entity?.state !== "unavailable" && entity?.state !== "unknown";

  // Determine the actual playback URL based on source type
  const getPlaybackUrl = useCallback((): string | null => {
    if (sourceType === "stream_url" && streamUrl) {
      return streamUrl;
    }
    
    if (sourceType === "rtsp" && rtspUrl) {
      if (!restreamBaseUrl) {
        return null; // Need restream config
      }
      return buildRestreamUrl(rtspUrl, restreamType, restreamBaseUrl, streamName);
    }
    
    return null;
  }, [sourceType, streamUrl, rtspUrl, restreamType, restreamBaseUrl, streamName]);

  const playbackUrl = getPlaybackUrl();
  const isHls = playbackUrl ? isHlsUrl(playbackUrl) : false;
  const isMjpeg = playbackUrl ? isMjpegUrl(playbackUrl) : false;

  // WebRTC hook (only for HA entity source)
  const webrtc = useWebRTC({
    entityId: resolvedEntityId || "",
    config,
    wsRef,
    sendCommand,
    enabled: sourceType === "ha_entity" && effectiveViewMode === "live" && isConnected && !!resolvedEntityId,
  });

  // HLS player hook (for stream URL and RTSP with restream)
  const hlsPlayer = useHlsPlayer({
    videoRef: hlsVideoRef,
    url: isHls ? playbackUrl || undefined : undefined,
    enabled: effectiveViewMode === "live" && isHls && !!playbackUrl,
    autoPlay: true,
    muted: true,
  });

  // Calculate actual refresh rate based on mode
  const actualRefreshMs = effectiveViewMode === "live" 
    ? Math.max(100, Math.round(1000 / Math.min(10, liveFps)))
    : refreshInterval * 1000;

  // Fetch snapshot for HA entity source
  const fetchHaSnapshot = useCallback(async () => {
    if (!isMountedRef.current || !config || !resolvedEntityId) {
      setCameraStatus("error");
      setErrorMessage("No camera linked");
      setIsLoading(false);
      return;
    }

    try {
      if (!imageUrl) setIsLoading(true);
      
      const response = await fetch(
        `${config.url}/api/camera_proxy/${resolvedEntityId}`,
        { headers: { Authorization: `Bearer ${config.token}` } }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      if (!isMountedRef.current) return;
      
      const url = URL.createObjectURL(blob);
      if (previousBlobUrl.current) URL.revokeObjectURL(previousBlobUrl.current);
      previousBlobUrl.current = url;
      
      setImageUrl(url);
      setCameraStatus("streaming");
      setErrorMessage(null);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Failed to fetch camera snapshot:", error);
      setCameraStatus("error");
      setErrorMessage("Failed to load camera");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [config, resolvedEntityId, imageUrl]);

  // Fetch snapshot for stream URL source
  const fetchUrlSnapshot = useCallback(async (url: string) => {
    if (!isMountedRef.current) return;

    try {
      if (!imageUrl) setIsLoading(true);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      if (!isMountedRef.current) return;
      
      const urlObj = URL.createObjectURL(blob);
      if (previousBlobUrl.current) URL.revokeObjectURL(previousBlobUrl.current);
      previousBlobUrl.current = urlObj;
      
      setImageUrl(urlObj);
      setCameraStatus("streaming");
      setErrorMessage(null);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Failed to fetch snapshot:", error);
      setCameraStatus("error");
      setErrorMessage("Failed to load snapshot");
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [imageUrl]);

  // Handle WebRTC fallback for HA entity
  useEffect(() => {
    if (sourceType === "ha_entity" && viewMode === "live" && webrtc.status === "failed" && webrtc.retryCount >= 3) {
      console.log("WebRTC failed after max retries, falling back to snapshot polling");
      setEffectiveViewMode("snapshot");
    } else {
      setEffectiveViewMode(viewMode);
    }
  }, [sourceType, viewMode, webrtc.status, webrtc.retryCount]);

  // Update camera status based on WebRTC/HLS state
  useEffect(() => {
    if (sourceType === "ha_entity" && effectiveViewMode === "live") {
      if (webrtc.status === "connecting") setCameraStatus("connecting");
      else if (webrtc.status === "connected") setCameraStatus("streaming");
      else if (webrtc.status === "failed") setCameraStatus("error");
    } else if ((sourceType === "stream_url" || sourceType === "rtsp") && effectiveViewMode === "live" && isHls) {
      if (hlsPlayer.status === "loading") setCameraStatus("loading");
      else if (hlsPlayer.status === "playing") setCameraStatus("streaming");
      else if (hlsPlayer.status === "error") {
        setCameraStatus("error");
        setErrorMessage(hlsPlayer.error || "Stream error");
      }
    }
  }, [sourceType, effectiveViewMode, webrtc.status, hlsPlayer.status, hlsPlayer.error, isHls]);

  // Initial fetch and refresh timer for snapshots
  useEffect(() => {
    isMountedRef.current = true;
    
    // Skip if in live mode with working stream
    if (effectiveViewMode === "live") {
      if (sourceType === "ha_entity" && webrtc.status !== "failed") return;
      if ((sourceType === "stream_url" || sourceType === "rtsp") && (isHls || isMjpeg)) return;
    }

    // Determine snapshot URL
    let snapshotSource: string | null = null;
    
    if (sourceType === "ha_entity") {
      if (isConnected && resolvedEntityId) {
        fetchHaSnapshot();
        refreshTimerRef.current = setInterval(fetchHaSnapshot, actualRefreshMs);
      }
    } else if (sourceType === "stream_url") {
      snapshotSource = snapshotUrl || streamUrl || null;
      if (snapshotSource && isValidUrl(snapshotSource)) {
        fetchUrlSnapshot(snapshotSource);
        refreshTimerRef.current = setInterval(() => fetchUrlSnapshot(snapshotSource!), actualRefreshMs);
      }
    } else if (sourceType === "rtsp") {
      if (!restreamBaseUrl) {
        setCameraStatus("no_config");
        setErrorMessage("RTSP needs restream config (go2rtc/Frigate)");
      }
    }

    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [isConnected, resolvedEntityId, sourceType, effectiveViewMode, actualRefreshMs, webrtc.status, isHls, isMjpeg, snapshotUrl, streamUrl, restreamBaseUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previousBlobUrl.current) URL.revokeObjectURL(previousBlobUrl.current);
    };
  }, []);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sourceType === "ha_entity") {
      fetchHaSnapshot();
    } else if (sourceType === "stream_url" && (snapshotUrl || streamUrl)) {
      fetchUrlSnapshot(snapshotUrl || streamUrl!);
    }
  };

  const handleWidgetClick = () => {
    if (cameraStatus !== "error" && cameraStatus !== "no_config") {
      setIsExpanded(true);
    }
  };

  const handleVideoCanPlay = useCallback(() => {
    setIsVideoReady(true);
    setCameraStatus("streaming");
  }, []);

  useEffect(() => {
    if (webrtc.status === "connecting" || hlsPlayer.status === "loading") {
      setIsVideoReady(false);
    }
  }, [webrtc.status, hlsPlayer.status]);

  const minDim = Math.min(cols, rows);
  
  const iconSize = minDim >= 3 ? "w-20 h-20" : isLarge ? "w-16 h-16" : isTall ? "w-12 h-12" : isWide ? "w-10 h-10" : "w-8 h-8";
  const titleSize = minDim >= 3 ? "text-xl" : isLarge ? "text-lg" : "text-sm";
  const subtitleSize = minDim >= 3 ? "text-base" : isLarge ? "text-sm" : "text-xs";
  const padding = minDim >= 3 ? "p-4" : isLarge ? "p-3" : "p-2";

  const getModeLabel = () => {
    if (sourceType === "ha_entity") {
      if (effectiveViewMode === "live") {
        if (webrtc.status === "connected") return "WebRTC";
        if (webrtc.status === "connecting") return webrtc.retryCount > 0 ? `Retry ${webrtc.retryCount}/3` : "Connecting...";
      }
    }
    if (sourceType === "stream_url" || sourceType === "rtsp") {
      if (effectiveViewMode === "live") {
        if (isHls) return "HLS";
        if (isMjpeg) return "MJPEG";
      }
    }
    return effectiveViewMode === "live" ? "Live" : "Snapshot";
  };

  const getModeIcon = () => {
    if (sourceType === "ha_entity" && effectiveViewMode === "live") {
      return webrtc.status === "connected" ? (
        <Wifi className="w-3 h-3 text-primary" />
      ) : webrtc.status === "connecting" ? (
        <Wifi className="w-3 h-3 text-muted-foreground animate-pulse" />
      ) : (
        <WifiOff className="w-3 h-3 text-muted-foreground" />
      );
    }
    if ((sourceType === "stream_url" || sourceType === "rtsp") && effectiveViewMode === "live") {
      return <Link className="w-3 h-3 text-primary" />;
    }
    return effectiveViewMode === "live" ? (
      <Video className="w-3 h-3 text-foreground/70" />
    ) : (
      <Image className="w-3 h-3 text-foreground/70" />
    );
  };

  const renderCameraFeed = () => {
    const containerClasses = "absolute inset-0";

    // No source configured
    if (sourceType === "ha_entity" && (!isConnected || !resolvedEntityId)) {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
          <div className="text-center">
            <Camera className={cn("mx-auto mb-2 text-muted-foreground/50", iconSize)} />
            <p className="text-muted-foreground text-sm">No camera linked</p>
          </div>
        </div>
      );
    }

    if (sourceType === "stream_url" && !streamUrl) {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
          <div className="text-center">
            <Link className={cn("mx-auto mb-2 text-muted-foreground/50", iconSize)} />
            <p className="text-muted-foreground text-sm">No stream URL configured</p>
          </div>
        </div>
      );
    }

    if (sourceType === "rtsp" && !rtspUrl) {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
          <div className="text-center">
            <Video className={cn("mx-auto mb-2 text-muted-foreground/50", iconSize)} />
            <p className="text-muted-foreground text-sm">No RTSP URL configured</p>
          </div>
        </div>
      );
    }

    // RTSP without restream config
    if (cameraStatus === "no_config") {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
          <div className="text-center px-4">
            <AlertTriangle className={cn("mx-auto mb-2 text-warning", iconSize)} />
            <p className="text-foreground text-sm font-medium">RTSP needs restream</p>
            <p className="text-muted-foreground text-xs mt-1">Configure go2rtc or Frigate for live view</p>
          </div>
        </div>
      );
    }

    // Error state
    if (cameraStatus === "error") {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
          <div className="text-center">
            <Camera className={cn("mx-auto mb-2 text-destructive/50", iconSize)} />
            <p className="text-destructive text-sm">{errorMessage || "Failed to load"}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
      );
    }

    // HA Entity with WebRTC
    if (sourceType === "ha_entity" && effectiveViewMode === "live" && (webrtc.status !== "failed" || webrtc.retryCount < 3)) {
      return (
        <div className={cn(containerClasses, "bg-secondary")}>
          <video
            ref={webrtc.videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleVideoCanPlay}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isVideoReady && webrtc.status === "connected" ? "opacity-100" : "opacity-0"
            )}
          />
          {(webrtc.status === "connecting" || !isVideoReady) && (
            <div className={cn(
              "absolute inset-0 flex items-center justify-center bg-secondary transition-opacity duration-300",
              webrtc.status === "connected" && isVideoReady ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
              <div className="text-center">
                <Wifi className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  {webrtc.retryCount > 0 ? `Retrying (${webrtc.retryCount}/3)...` : "Connecting..."}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // HLS stream (Stream URL or RTSP with restream)
    if ((sourceType === "stream_url" || sourceType === "rtsp") && effectiveViewMode === "live" && isHls && playbackUrl) {
      return (
        <div className={cn(containerClasses, "bg-secondary")}>
          <video
            ref={hlsVideoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={handleVideoCanPlay}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isVideoReady ? "opacity-100" : "opacity-0"
            )}
          />
          {!isVideoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <div className="text-center">
                <Link className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">Loading HLS stream...</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // MJPEG stream
    if ((sourceType === "stream_url" || sourceType === "rtsp") && effectiveViewMode === "live" && isMjpeg && playbackUrl) {
      return (
        <img
          src={playbackUrl}
          alt={name}
          className={cn(containerClasses, "object-cover")}
          onLoad={() => setCameraStatus("streaming")}
          onError={() => {
            setCameraStatus("error");
            setErrorMessage("Failed to load MJPEG stream");
          }}
        />
      );
    }

    // Loading state
    if (isLoading && !imageUrl) {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary animate-pulse")}>
          <Camera className={cn("text-muted-foreground/30", iconSize)} />
        </div>
      );
    }

    // Snapshot image
    return (
      <img
        src={imageUrl || ""}
        alt={name}
        className={cn(containerClasses, "object-cover")}
        onError={() => {
          setCameraStatus("error");
          setErrorMessage("Failed to load image");
        }}
      />
    );
  };

  const renderExpandedDialog = () => (
    <CameraExpandedDialog
      isOpen={isExpanded}
      onOpenChange={setIsExpanded}
      name={name}
      room={room}
      isOnline={isOnline}
      sourceType={sourceType}
      effectiveMode={effectiveViewMode}
      webrtcStatus={webrtc.status}
      webrtcStream={webrtc.stream}
      webrtcRetryCount={webrtc.retryCount}
      onReconnect={webrtc.reconnect}
      imageUrl={imageUrl}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      playbackUrl={playbackUrl}
      isHls={isHls}
      isMjpeg={isMjpeg}
    />
  );

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <>
        <div 
          className={cn("widget-card p-0 overflow-hidden group h-full cursor-pointer")}
          onClick={handleWidgetClick}
        >
          <div className="relative w-full h-full min-h-[120px]">
            {renderCameraFeed()}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
            
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <div className={cn("status-indicator", isOnline ? "status-online" : "status-offline")} />
              {getModeIcon()}
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <h3 className="font-medium text-foreground text-xs truncate drop-shadow-md">{name}</h3>
            </div>
          </div>
        </div>
        {renderExpandedDialog()}
      </>
    );
  }

  // Wide layout
  if (isWide && !isTall) {
    return (
      <>
        <div 
          className={cn("widget-card p-0 overflow-hidden group h-full cursor-pointer")}
          onClick={handleWidgetClick}
        >
          <div className="relative w-full h-full min-h-[140px]">
            {renderCameraFeed()}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />

            <div className={cn("absolute top-3 left-3 flex items-center gap-2", minDim >= 3 && "top-4 left-4")}>
              <div className={cn("status-indicator", isOnline ? "status-online" : "status-offline")} />
              <span className={cn("text-foreground/80 drop-shadow-md", subtitleSize)}>{getModeLabel()}</span>
              {getModeIcon()}
            </div>

            <div className={cn("absolute top-3 right-3 flex items-center gap-2", minDim >= 3 && "top-4 right-4")}>
              {effectiveViewMode === "snapshot" && (
                <button 
                  onClick={handleRefresh}
                  className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity", minDim >= 3 && "p-3")}
                >
                  <RefreshCw className={cn("text-foreground", isLoading && "animate-spin", minDim >= 3 ? "w-5 h-5" : "w-4 h-4")} />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity", minDim >= 3 && "p-3")}
              >
                <Maximize2 className={minDim >= 3 ? "w-5 h-5 text-foreground" : "w-4 h-4 text-foreground"} />
              </button>
            </div>

            <div className={cn("absolute bottom-3 left-3 right-3", minDim >= 3 && "bottom-4 left-4 right-4")}>
              <h3 className={cn("font-medium text-foreground drop-shadow-md", titleSize)}>{name}</h3>
              {room && <p className={cn("text-muted-foreground drop-shadow-md", subtitleSize)}>{room}</p>}
            </div>
          </div>
        </div>
        {renderExpandedDialog()}
      </>
    );
  }

  // Tall or Large layout
  return (
    <>
      <div 
        className={cn("widget-card p-0 overflow-hidden group h-full cursor-pointer")}
        onClick={handleWidgetClick}
      >
        <div className="relative w-full h-full min-h-[200px]">
          {renderCameraFeed()}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />

          <div className={cn("absolute flex items-center gap-2", padding, "top-0 left-0")}>
            <div className={cn("status-indicator", isOnline ? "status-online" : "status-offline")} />
            <span className={cn("text-foreground/80 drop-shadow-md", subtitleSize)}>{getModeLabel()}</span>
            {getModeIcon()}
          </div>

          <div className={cn("absolute flex items-center gap-2", padding, "top-0 right-0")}>
            {effectiveViewMode === "snapshot" && (
              <button 
                onClick={handleRefresh}
                className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity", minDim >= 3 && "p-3")}
              >
                <RefreshCw className={cn("text-foreground", isLoading && "animate-spin", minDim >= 3 ? "w-5 h-5" : "w-4 h-4")} />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
              className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity", minDim >= 3 && "p-3")}
            >
              <Maximize2 className={minDim >= 3 ? "w-5 h-5 text-foreground" : "w-4 h-4 text-foreground"} />
            </button>
          </div>

          <div className={cn("absolute left-0 right-0 bottom-0", padding)}>
            <h3 className={cn("font-medium text-foreground drop-shadow-md", titleSize)}>{name}</h3>
            {room && <p className={cn("text-muted-foreground mt-1 drop-shadow-md", subtitleSize)}>{room}</p>}
          </div>
        </div>
      </div>
      {renderExpandedDialog()}
    </>
  );
};
