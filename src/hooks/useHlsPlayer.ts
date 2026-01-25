import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

export type HlsStatus = "idle" | "loading" | "playing" | "error";

interface UseHlsPlayerOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  url: string | undefined;
  enabled: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

interface UseHlsPlayerResult {
  status: HlsStatus;
  error: string | null;
  retry: () => void;
}

export const useHlsPlayer = ({
  videoRef,
  url,
  enabled,
  autoPlay = true,
  muted = true,
}: UseHlsPlayerOptions): UseHlsPlayerResult => {
  const [status, setStatus] = useState<HlsStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);

  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initPlayer = useCallback(() => {
    if (!enabled || !url || !videoRef.current) {
      setStatus("idle");
      return;
    }

    cleanup();
    setStatus("loading");
    setError(null);

    const video = videoRef.current;

    // Check for native HLS support (Safari, iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.muted = muted;
      
      const handleCanPlay = () => setStatus("playing");
      const handleError = () => {
        setStatus("error");
        setError("Failed to load HLS stream (native)");
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleError);

      if (autoPlay) {
        video.play().catch(() => {
          // Autoplay blocked, still show video
          setStatus("playing");
        });
      }

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("error", handleError);
      };
    }

    // Use HLS.js for other browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
        startLevel: -1, // Auto quality
      });

      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("playing");
        retryCountRef.current = 0;
        if (autoPlay) {
          video.muted = muted;
          video.play().catch(() => {
            // Autoplay blocked
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data.type, data.details);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try to recover from network error
              if (retryCountRef.current < 3) {
                retryCountRef.current++;
                console.log(`HLS network error, retrying (${retryCountRef.current}/3)...`);
                hls.startLoad();
              } else {
                setStatus("error");
                setError("Network error loading stream");
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("HLS media error, attempting recovery...");
              hls.recoverMediaError();
              break;
            default:
              setStatus("error");
              setError(`HLS error: ${data.details}`);
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // HLS not supported
    setStatus("error");
    setError("HLS playback not supported in this browser");
  }, [url, enabled, autoPlay, muted, videoRef, cleanup]);

  // Initialize player when dependencies change
  useEffect(() => {
    const cleanupFn = initPlayer();
    return () => {
      cleanupFn?.();
      cleanup();
    };
  }, [initPlayer, cleanup]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    initPlayer();
  }, [initPlayer]);

  return { status, error, retry };
};
