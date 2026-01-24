import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, Maximize2, Video, Image, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useWebRTC, WebRTCStatus } from "@/hooks/useWebRTC";

interface CameraWidgetProps {
  name: string;
  room?: string;
  entityId?: string;
  entity_id?: string;
  /** 'snapshot' shows a still image, 'live' uses snapshot polling, 'webrtc' uses WebRTC streaming */
  viewMode?: "snapshot" | "live" | "webrtc";
  /** Refresh interval for snapshots in seconds (default: 10) */
  refreshInterval?: number;
  /** Live mode frames per second (default: 5, max 10) */
  liveFps?: number;
}

export const CameraWidget = ({
  name,
  room,
  entityId,
  entity_id,
  viewMode = "webrtc",
  refreshInterval = 10,
  liveFps = 5,
}: CameraWidgetProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [effectiveMode, setEffectiveMode] = useState<"snapshot" | "live" | "webrtc">(viewMode);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const previousBlobUrl = useRef<string | null>(null);
  
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, isConnected, config, wsRef, sendCommand } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;
  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  
  const isOnline = entity?.state !== "unavailable" && entity?.state !== "unknown";

  // WebRTC hook
  const webrtc = useWebRTC({
    entityId: resolvedEntityId || "",
    config,
    wsRef,
    sendCommand,
    enabled: effectiveMode === "webrtc" && isConnected && !!resolvedEntityId,
  });
  
  // Calculate actual refresh rate based on mode (live uses FPS, snapshot uses seconds)
  const actualRefreshMs = effectiveMode === "live" 
    ? Math.max(100, Math.round(1000 / Math.min(10, liveFps))) // 100ms min (10fps max)
    : refreshInterval * 1000;

  // Fetch snapshot as blob to handle auth properly (used for both modes)
  const fetchSnapshot = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (!config || !resolvedEntityId) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Don't set loading on refresh to avoid flicker
      if (!imageUrl) {
        setIsLoading(true);
      }
      setHasError(false);
      
      const response = await fetch(
        `${config.url}/api/camera_proxy/${resolvedEntityId}`,
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      if (!isMountedRef.current) return;
      
      const url = URL.createObjectURL(blob);
      
      // Revoke previous URL to prevent memory leaks
      if (previousBlobUrl.current) {
        URL.revokeObjectURL(previousBlobUrl.current);
      }
      previousBlobUrl.current = url;
      
      setImageUrl(url);
      setHasError(false);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Failed to fetch camera snapshot:", error);
      setHasError(true);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [config, resolvedEntityId, imageUrl]);

  // Fallback to snapshot polling if WebRTC fails
  useEffect(() => {
    if (viewMode === "webrtc" && webrtc.status === "failed") {
      console.log("WebRTC failed, falling back to live polling");
      setEffectiveMode("live");
    } else if (viewMode !== "webrtc") {
      setEffectiveMode(viewMode);
    }
  }, [viewMode, webrtc.status]);

  // Initial fetch and refresh timer (only for non-WebRTC modes)
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!isConnected || !resolvedEntityId) {
      return;
    }

    // WebRTC mode doesn't need snapshot polling
    if (effectiveMode === "webrtc" && webrtc.status !== "failed") {
      return;
    }

    fetchSnapshot();

    // Set up refresh interval based on mode
    refreshTimerRef.current = setInterval(() => {
      fetchSnapshot();
    }, actualRefreshMs);

    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isConnected, resolvedEntityId, effectiveMode, actualRefreshMs, webrtc.status]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previousBlobUrl.current) {
        URL.revokeObjectURL(previousBlobUrl.current);
      }
    };
  }, []);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchSnapshot();
  };

  const handleWidgetClick = () => {
    if (viewMode === "snapshot" && imageUrl && !hasError) {
      setIsExpanded(true);
    }
  };

  const minDim = Math.min(cols, rows);
  
  // Calculate dynamic sizes
  const iconSize = minDim >= 3 ? "w-20 h-20" : isLarge ? "w-16 h-16" : isTall ? "w-12 h-12" : isWide ? "w-10 h-10" : "w-8 h-8";
  const titleSize = minDim >= 3 ? "text-xl" : isLarge ? "text-lg" : "text-sm";
  const subtitleSize = minDim >= 3 ? "text-base" : isLarge ? "text-sm" : "text-xs";
  const padding = minDim >= 3 ? "p-4" : isLarge ? "p-3" : "p-2";

  // Get mode label
  const getModeLabel = () => {
    if (effectiveMode === "webrtc" && webrtc.status === "connected") return "WebRTC";
    if (effectiveMode === "webrtc" && webrtc.status === "connecting") return "Connecting...";
    if (effectiveMode === "live") return "Live";
    return "Snapshot";
  };

  const getModeIcon = () => {
    if (effectiveMode === "webrtc") {
      return webrtc.status === "connected" ? (
        <Wifi className="w-3 h-3 text-primary" />
      ) : webrtc.status === "connecting" ? (
        <Wifi className="w-3 h-3 text-muted-foreground animate-pulse" />
      ) : (
        <WifiOff className="w-3 h-3 text-muted-foreground" />
      );
    }
    return effectiveMode === "live" ? (
      <Video className="w-3 h-3 text-foreground/70" />
    ) : (
      <Image className="w-3 h-3 text-foreground/70" />
    );
  };

  // Render camera image/stream
  const renderCameraFeed = (isDialog = false) => {
    const containerClasses = isDialog 
      ? "w-full h-full" 
      : "absolute inset-0";

    if (!isConnected || !resolvedEntityId) {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
          <div className="text-center">
            <Camera className={cn("mx-auto mb-2 text-muted-foreground/50", iconSize)} />
            <p className="text-muted-foreground text-sm">No camera linked</p>
          </div>
        </div>
      );
    }

    // WebRTC error (but not in fallback mode)
    if (effectiveMode === "webrtc" && webrtc.status === "failed" && viewMode === "webrtc") {
      // Will fallback to live polling via useEffect
    }

    // Snapshot/Live polling error
    if (hasError && effectiveMode !== "webrtc") {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
          <div className="text-center">
            <Camera className={cn("mx-auto mb-2 text-destructive/50", iconSize)} />
            <p className="text-destructive text-sm">Failed to load</p>
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

    // WebRTC mode
    if (effectiveMode === "webrtc" && webrtc.status !== "failed") {
      return (
        <div className={cn(containerClasses, "bg-secondary")}>
          <video
            ref={webrtc.videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {webrtc.status === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/80">
              <div className="text-center">
                <Wifi className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">Connecting WebRTC...</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Loading state (for initial load only)
    if (isLoading && !imageUrl) {
      return (
        <div className={cn(containerClasses, "flex items-center justify-center bg-secondary animate-pulse")}>
          <Camera className={cn("text-muted-foreground/30", iconSize)} />
        </div>
      );
    }

    return (
      <img
        src={imageUrl || ""}
        alt={name}
        className={cn(containerClasses, "object-cover")}
        onError={() => setHasError(true)}
      />
    );
  };

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <>
        <div 
          className={cn(
            "widget-card p-0 overflow-hidden group h-full",
            viewMode === "snapshot" && imageUrl && !hasError && "cursor-pointer"
          )}
          onClick={handleWidgetClick}
        >
          <div className="relative w-full h-full min-h-[120px]">
            {renderCameraFeed()}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
            
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <div
                className={cn(
                  "status-indicator",
                  isOnline ? "status-online" : "status-offline"
                )}
              />
              {getModeIcon()}
            </div>

            <div className="absolute bottom-2 left-2 right-2">
              <h3 className="font-medium text-foreground text-xs truncate drop-shadow-md">{name}</h3>
            </div>
          </div>
        </div>
        
        {/* Expanded Dialog */}
        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 overflow-hidden">
            <div className="relative w-full h-full bg-black">
              {renderCameraFeed(true)}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div
                    className={cn(
                      "status-indicator",
                      isOnline ? "status-online" : "status-offline"
                    )}
                  />
                  <span className="text-foreground font-medium">{name}</span>
                  {room && <span className="text-muted-foreground">• {room}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <RefreshCw className={cn("w-5 h-5 text-foreground", isLoading && "animate-spin")} />
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Wide layout (not tall)
  if (isWide && !isTall) {
    return (
      <>
        <div 
          className={cn(
            "widget-card p-0 overflow-hidden group h-full",
            viewMode === "snapshot" && imageUrl && !hasError && "cursor-pointer"
          )}
          onClick={handleWidgetClick}
        >
          <div className="relative w-full h-full min-h-[140px]">
            {renderCameraFeed()}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />

            <div className={cn("absolute top-3 left-3 flex items-center gap-2", minDim >= 3 && "top-4 left-4")}>
              <div
                className={cn(
                  "status-indicator",
                  isOnline ? "status-online" : "status-offline"
                )}
              />
              <span className={cn("text-foreground/80 drop-shadow-md", subtitleSize)}>
                {getModeLabel()}
              </span>
              {getModeIcon()}
            </div>

            <div className={cn("absolute top-3 right-3 flex items-center gap-2", minDim >= 3 && "top-4 right-4")}>
              {effectiveMode !== "webrtc" && (
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
              {room && (
                <p className={cn("text-muted-foreground drop-shadow-md", subtitleSize)}>{room}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded Dialog */}
        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 overflow-hidden">
            <div className="relative w-full h-full bg-black">
              {renderCameraFeed(true)}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div
                    className={cn(
                      "status-indicator",
                      isOnline ? "status-online" : "status-offline"
                    )}
                  />
                  <span className="text-foreground font-medium">{name}</span>
                  {room && <span className="text-muted-foreground">• {room}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {viewMode === "snapshot" && (
                    <button
                      onClick={handleRefresh}
                      className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <RefreshCw className={cn("w-5 h-5 text-foreground", isLoading && "animate-spin")} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Tall or Large layout
  return (
    <>
      <div 
        className={cn(
          "widget-card p-0 overflow-hidden group h-full",
          viewMode === "snapshot" && imageUrl && !hasError && "cursor-pointer"
        )}
        onClick={handleWidgetClick}
      >
        <div className="relative w-full h-full min-h-[200px]">
          {renderCameraFeed()}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />

          <div className={cn("absolute flex items-center gap-2", padding, "top-0 left-0")}>
            <div
              className={cn(
                "status-indicator",
                isOnline ? "status-online" : "status-offline"
              )}
            />
            <span className={cn("text-foreground/80 drop-shadow-md", subtitleSize)}>
              {getModeLabel()}
            </span>
            {getModeIcon()}
          </div>

          <div className={cn("absolute flex items-center gap-2", padding, "top-0 right-0")}>
            {effectiveMode !== "webrtc" && (
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
            {room && (
              <p className={cn("text-muted-foreground mt-1 drop-shadow-md", subtitleSize)}>{room}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Expanded Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] p-0 overflow-hidden">
          <div className="relative w-full h-full bg-black">
            {renderCameraFeed(true)}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
                <div
                  className={cn(
                    "status-indicator",
                    isOnline ? "status-online" : "status-offline"
                  )}
                />
                <span className="text-foreground font-medium">{name}</span>
                {room && <span className="text-muted-foreground">• {room}</span>}
              </div>
              <div className="flex items-center gap-2">
                {viewMode === "snapshot" && (
                  <button
                    onClick={handleRefresh}
                    className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  >
                    <RefreshCw className={cn("w-5 h-5 text-foreground", isLoading && "animate-spin")} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
