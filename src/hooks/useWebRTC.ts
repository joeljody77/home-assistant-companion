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
  start: () => Promise<void>;
  stop: () => void;
}

// Default ICE servers if HA doesn't provide any
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const useWebRTC = ({
  entityId,
  config,
  wsRef,
  sendCommand,
  enabled = true,
}: UseWebRTCOptions): UseWebRTCResult => {
  const [status, setStatus] = useState<WebRTCStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isMountedRef = useRef(true);

  // Clean up peer connection
  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Stop WebRTC connection
  const stop = useCallback(() => {
    cleanup();
    setStatus("idle");
    setError(null);
  }, [cleanup]);

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

      // Try to get ICE server configuration from HA
      let iceServers = DEFAULT_ICE_SERVERS;
      try {
        const iceConfig = await sendCommand({
          type: "auth/sign_path",
          path: "/api/webrtc/config",
        }) as { ice_servers?: RTCIceServer[] };
        
        if (iceConfig?.ice_servers?.length) {
          iceServers = iceConfig.ice_servers;
        }
      } catch {
        console.log("Using default ICE servers");
      }

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
        
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (!isMountedRef.current) return;
        console.log("WebRTC connection state:", pc.connectionState);
        
        switch (pc.connectionState) {
          case "connected":
            setStatus("connected");
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

      // Wait for ICE gathering to complete (or timeout after 3s)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        
        const timeout = setTimeout(resolve, 3000);
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") {
            clearTimeout(timeout);
            resolve();
          }
        };
      });

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

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && status === "idle" && config && entityId) {
      // Small delay to ensure WebSocket is ready
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          start();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [enabled, status, config, entityId, start]);

  return {
    status,
    error,
    videoRef,
    start,
    stop,
  };
};
