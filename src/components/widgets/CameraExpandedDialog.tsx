import { useRef, useEffect, useCallback, useState } from "react";
import { RefreshCw, Volume2, VolumeX, Wifi, WifiOff, Video, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WebRTCStatus } from "@/hooks/useWebRTC";

interface CameraExpandedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  room?: string;
  isOnline: boolean;
  effectiveMode: "snapshot" | "live" | "webrtc";
  webrtcStatus: WebRTCStatus;
  webrtcStream: MediaStream | null;
  webrtcRetryCount: number;
  onReconnect: () => void;
  imageUrl: string | null;
  isLoading: boolean;
  onRefresh: (e: React.MouseEvent) => void;
}

export const CameraExpandedDialog = ({
  isOpen,
  onOpenChange,
  name,
  room,
  isOnline,
  effectiveMode,
  webrtcStatus,
  webrtcStream,
  webrtcRetryCount,
  onReconnect,
  imageUrl,
  isLoading,
  onRefresh,
}: CameraExpandedDialogProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Sync stream to video when dialog opens
  useEffect(() => {
    if (isOpen && videoRef.current && webrtcStream) {
      videoRef.current.srcObject = webrtcStream;
      videoRef.current.muted = isMuted;
      setIsVideoReady(false);
    }
  }, [isOpen, webrtcStream, isMuted]);

  // Reset video ready state when stream changes
  useEffect(() => {
    setIsVideoReady(false);
  }, [webrtcStream]);

  const handleVideoCanPlay = useCallback(() => {
    setIsVideoReady(true);
  }, []);

  const toggleAudio = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => {
      const newMuted = !prev;
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  const getModeLabel = () => {
    if (effectiveMode === "webrtc") {
      if (webrtcStatus === "connected") return "WebRTC";
      if (webrtcStatus === "connecting") {
        return webrtcRetryCount > 0 ? `Retry ${webrtcRetryCount}/3` : "Connecting...";
      }
    }
    if (effectiveMode === "live") return "Live";
    return "Snapshot";
  };

  const getModeIcon = () => {
    if (effectiveMode === "webrtc") {
      return webrtcStatus === "connected" ? (
        <Wifi className="w-4 h-4 text-primary" />
      ) : webrtcStatus === "connecting" ? (
        <Wifi className="w-4 h-4 text-muted-foreground animate-pulse" />
      ) : (
        <WifiOff className="w-4 h-4 text-muted-foreground" />
      );
    }
    return effectiveMode === "live" ? (
      <Video className="w-4 h-4 text-foreground/70" />
    ) : (
      <Image className="w-4 h-4 text-foreground/70" />
    );
  };

  const renderContent = () => {
    // WebRTC mode with shared stream
    if (effectiveMode === "webrtc" && webrtcStream) {
      return (
        <div className="w-full h-full bg-black relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            onCanPlay={handleVideoCanPlay}
            className={cn(
              "w-full h-full object-contain transition-opacity duration-300",
              isVideoReady ? "opacity-100" : "opacity-0"
            )}
          />
          {!isVideoReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <Wifi className="w-10 h-10 mx-auto mb-3 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading stream...</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // WebRTC connecting
    if (effectiveMode === "webrtc" && webrtcStatus === "connecting") {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="text-center">
            <Wifi className="w-10 h-10 mx-auto mb-3 text-primary animate-pulse" />
            <p className="text-muted-foreground">
              {webrtcRetryCount > 0 ? `Retrying (${webrtcRetryCount}/3)...` : "Connecting WebRTC..."}
            </p>
          </div>
        </div>
      );
    }

    // Snapshot/Live polling mode
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain"
        />
      );
    }

    // Fallback
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-muted-foreground">No stream available</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <div className="relative w-full h-full bg-black">
          {renderContent()}
          
          {/* Top overlay with info and controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            {/* Camera info */}
            <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
              <div
                className={cn(
                  "status-indicator",
                  isOnline ? "status-online" : "status-offline"
                )}
              />
              <span className="text-foreground font-medium">{name}</span>
              {room && <span className="text-muted-foreground">• {room}</span>}
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                {getModeIcon()}
                <span>{getModeLabel()}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Audio toggle (WebRTC only) */}
              {effectiveMode === "webrtc" && webrtcStream && (
                <button
                  onClick={toggleAudio}
                  className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-foreground" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-primary" />
                  )}
                </button>
              )}

              {/* Reconnect button (WebRTC failed) */}
              {effectiveMode === "webrtc" && webrtcStatus === "failed" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReconnect(); }}
                  className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                  title="Reconnect"
                >
                  <RefreshCw className="w-5 h-5 text-foreground" />
                </button>
              )}

              {/* Refresh button (Snapshot/Live modes) */}
              {effectiveMode !== "webrtc" && (
                <button
                  onClick={onRefresh}
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
  );
};
