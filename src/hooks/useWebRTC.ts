import { useState, useRef, useCallback, useEffect } from "react";
import { HAConfig } from "./useHomeAssistant";

export type WebRTCStatus = "idle" | "connecting" | "connected" | "failed" | "unsupported";

interface UseWebRTCOptions {
  entityId: string;
  config: HAConfig | null;
  wsRef: React.RefObject<WebSocket | null>;
  sendCommand: (command: object) => Promise<unknown>;
  enabled?: boolean;
}

interface UseWebRTCResult {
  status: WebRTCStatus;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  retryCount: number;
  start: () => Promise<void>;
  stop: () => void;
  reconnect: () => void;
}

// Default ICE servers if HA doesn't provide any
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
const ICE_TIMEOUT = 1500; // Reduced from 3000ms for faster connection
const STREAM_HEALTH_CHECK_INTERVAL = 5000; // Check every 5 seconds

export const useWebRTC = ({
  entityId,
  config,
  wsRef,
  sendCommand,
  enabled = true,
}: UseWebRTCOptions): UseWebRTCResult => {
  const [status, setStatus] = useState<WebRTCStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isMountedRef = useRef(true);
  const healthCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Clean up peer connection
  const cleanup = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setStream(null);
  }, []);

  // Stop WebRTC connection
  const stop = useCallback(() => {
    cleanup();
    setStatus("idle");
    setError(null);
    setRetryCount(0);
  }, [cleanup]);

  // Start stream health monitoring
  const startHealthMonitoring = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    healthCheckIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      const video = videoRef.current;
      if (!video || status !== "connected") return;

      // Check if video is actually playing
      const isPlaying = !video.paused && video.readyState >= 2;
      const currentTime = video.currentTime;
      
      // If video time hasn't changed, stream might be frozen
      if (isPlaying && currentTime === lastFrameTimeRef.current && currentTime > 0) {
        console.log("WebRTC stream appears frozen, reconnecting...");
        // Trigger reconnect
        if (retryCount < MAX_RETRIES) {
          setStatus("connecting");
          cleanup();
          setRetryCount(prev => prev + 1);
        }
      }
      
      lastFrameTimeRef.current = currentTime;
    }, STREAM_HEALTH_CHECK_INTERVAL);
  }, [status, retryCount, cleanup]);

  // Start WebRTC connection
  const start = useCallback(async () => {
    if (!config || !entityId || !wsRef.current) {
      setError("Missing configuration");
      setStatus("failed");
      return;
    }

    // Check WebSocket is authenticated
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected");
      setStatus("failed");
      return;
    }

    try {
      setStatus("connecting");
      setError(null);

      // Try to get ICE server configuration from HA (in parallel with connection setup)
      let iceServers = DEFAULT_ICE_SERVERS;
      const iceConfigPromise = sendCommand({
        type: "auth/sign_path",
        path: "/api/webrtc/config",
      }).then((result) => {
        const iceConfig = result as { ice_servers?: RTCIceServer[] };
        if (iceConfig?.ice_servers?.length) {
          iceServers = iceConfig.ice_servers;
        }
      }).catch(() => {
        console.log("Using default ICE servers");
      });

      // Wait for ICE config before creating peer connection
      await iceConfigPromise;

      if (!isMountedRef.current) return;

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10,
      });
      peerConnectionRef.current = pc;

      // Add transceiver for receiving video
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      // Handle incoming tracks
      pc.ontrack = (event) => {
        if (!isMountedRef.current) return;
        console.log("WebRTC track received:", event.track.kind);
        
        if (event.streams[0]) {
          setStream(event.streams[0]);
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (!isMountedRef.current) return;
        console.log("WebRTC connection state:", pc.connectionState);
        
        switch (pc.connectionState) {
          case "connected":
            setStatus("connected");
            setRetryCount(0); // Reset retry count on successful connection
            lastFrameTimeRef.current = 0;
            break;
          case "failed":
          case "disconnected":
            setError("Connection lost");
            setStatus("failed");
            break;
          case "closed":
            setStatus("idle");
            break;
        }
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);

      // Use trickle ICE - don't wait for full gathering, just send offer quickly
      // Wait for at least one candidate or short timeout for faster connection
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        
        let hasCandidate = false;
        const timeout = setTimeout(resolve, ICE_TIMEOUT);
        
        pc.onicecandidate = (event) => {
          if (event.candidate && !hasCandidate) {
            hasCandidate = true;
            // Wait a tiny bit more to gather a few candidates
            setTimeout(() => {
              clearTimeout(timeout);
              resolve();
            }, 100);
          }
        };
        
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") {
            clearTimeout(timeout);
            resolve();
          }
        };
      });

      if (!isMountedRef.current) {
        cleanup();
        return;
      }

      // Send offer to Home Assistant
      const response = await sendCommand({
        type: "camera/web_rtc_offer",
        entity_id: entityId,
        offer: pc.localDescription?.sdp,
      }) as { answer?: string; error?: string };

      if (!isMountedRef.current) {
        cleanup();
        return;
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      if (!response?.answer) {
        throw new Error("No WebRTC answer received - go2rtc may not be configured");
      }

      // Set remote description (answer from HA/go2rtc)
      await pc.setRemoteDescription({
        type: "answer",
        sdp: response.answer,
      });

      console.log("WebRTC connection established");
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const message = err instanceof Error ? err.message : "WebRTC connection failed";
      console.error("WebRTC error:", message);
      setError(message);
      setStatus("failed");
      cleanup();
    }
  }, [config, entityId, wsRef, sendCommand, cleanup]);

  // Reconnect function for manual retry
  const reconnect = useCallback(() => {
    cleanup();
    setRetryCount(0);
    setStatus("idle");
    // Will trigger auto-start via effect
  }, [cleanup]);

  // Auto-retry on failure
  useEffect(() => {
    if (status === "failed" && retryCount < MAX_RETRIES && enabled) {
      const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
      console.log(`WebRTC retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          start();
        }
      }, delay);
      
      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    }
  }, [status, retryCount, enabled, start]);

  // Start health monitoring when connected
  useEffect(() => {
    if (status === "connected") {
      startHealthMonitoring();
    }
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
    };
  }, [status, startHealthMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Auto-start if enabled - NO ARTIFICIAL DELAY
  useEffect(() => {
    if (enabled && status === "idle" && config && entityId && wsRef.current?.readyState === WebSocket.OPEN) {
      start();
    }
  }, [enabled, status, config, entityId, start, wsRef]);

  return {
    status,
    error,
    videoRef,
    stream,
    retryCount,
    start,
    stop,
    reconnect,
  };
};
