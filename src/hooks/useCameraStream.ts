 import { useState, useRef, useCallback, useEffect } from "react";
 import { CameraSourceType, CameraStatus, RefreshInterval, RestreamType } from "@/types/camera";
 import { HAConfig } from "./useHomeAssistant";
 import { 
   isHlsUrl, 
   isMjpegUrl, 
   buildRestreamUrl, 
   isValidUrl 
 } from "@/utils/streamUtils";
 
 export type StreamType = "mjpeg" | "hls" | "snapshot" | "none";
 
 interface UseCameraStreamOptions {
   sourceType: CameraSourceType;
   
   // HA Entity
   entityId?: string;
   haConfig?: HAConfig | null;
   
   // Direct URL
   streamUrl?: string;
   snapshotUrl?: string;
   
   // RTSP with restream
   rtspUrl?: string;
   restreamType?: RestreamType;
   restreamBaseUrl?: string;
   streamName?: string;
   
   // Settings
   refreshInterval: RefreshInterval;
   isPaused?: boolean;
   quality?: "low" | "high";
 }
 
 interface UseCameraStreamResult {
   status: CameraStatus;
   error: string | null;
   imageUrl: string | null;
   streamUrl: string | null;
   streamType: StreamType;
   isLoading: boolean;
   refresh: () => void;
   setRefreshInterval: (interval: RefreshInterval) => void;
 }
 
 export const useCameraStream = ({
   sourceType,
   entityId,
   haConfig,
   streamUrl,
   snapshotUrl,
   rtspUrl,
   restreamType = "go2rtc",
   restreamBaseUrl,
   streamName,
   refreshInterval,
   isPaused = false,
   quality = "high",
 }: UseCameraStreamOptions): UseCameraStreamResult => {
   const [status, setStatus] = useState<CameraStatus>("idle");
   const [error, setError] = useState<string | null>(null);
   const [imageUrl, setImageUrl] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [currentRefreshInterval, setCurrentRefreshInterval] = useState(refreshInterval);
   
   const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const previousBlobUrl = useRef<string | null>(null);
   const isMountedRef = useRef(true);
 
   // Determine the effective stream URL
   const getEffectiveStreamUrl = useCallback((): string | null => {
     if (sourceType === "stream_url" && streamUrl) {
       return streamUrl;
     }
     
     if (sourceType === "rtsp" && rtspUrl && restreamBaseUrl) {
       return buildRestreamUrl(rtspUrl, restreamType, restreamBaseUrl, streamName);
     }
     
     return null;
   }, [sourceType, streamUrl, rtspUrl, restreamType, restreamBaseUrl, streamName]);
 
   // Determine stream type
   const effectiveStreamUrl = getEffectiveStreamUrl();
   const streamType: StreamType = (() => {
     if (!effectiveStreamUrl && sourceType !== "ha_entity") return "none";
     if (effectiveStreamUrl && isMjpegUrl(effectiveStreamUrl)) return "mjpeg";
     if (effectiveStreamUrl && isHlsUrl(effectiveStreamUrl)) return "hls";
     return "snapshot"; // Default to snapshot polling for HA entities
   })();
 
   // Cleanup blob URLs
   const cleanupBlobUrl = useCallback(() => {
     if (previousBlobUrl.current) {
       URL.revokeObjectURL(previousBlobUrl.current);
       previousBlobUrl.current = null;
     }
   }, []);
 
   // Fetch snapshot for HA entity
   const fetchHaSnapshot = useCallback(async () => {
     if (!isMountedRef.current || !haConfig || !entityId) {
       return;
     }
 
     try {
       if (!imageUrl) setIsLoading(true);
       setStatus("connecting");
       
       const response = await fetch(
         `${haConfig.url}/api/camera_proxy/${entityId}`,
         { headers: { Authorization: `Bearer ${haConfig.token}` } }
       );
 
       if (!response.ok) throw new Error(`HTTP ${response.status}`);
 
       const blob = await response.blob();
       if (!isMountedRef.current) return;
       
       const url = URL.createObjectURL(blob);
       cleanupBlobUrl();
       previousBlobUrl.current = url;
       
       setImageUrl(url);
       setStatus("streaming");
       setError(null);
     } catch (err) {
       if (!isMountedRef.current) return;
       console.error("Failed to fetch camera snapshot:", err);
       setStatus("error");
       setError("Failed to load camera");
     } finally {
       if (isMountedRef.current) setIsLoading(false);
     }
   }, [haConfig, entityId, imageUrl, cleanupBlobUrl]);
 
   // Fetch snapshot for URL source
   const fetchUrlSnapshot = useCallback(async (url: string) => {
     if (!isMountedRef.current || !isValidUrl(url)) return;
 
     try {
       if (!imageUrl) setIsLoading(true);
       setStatus("connecting");
       
       const response = await fetch(url);
       if (!response.ok) throw new Error(`HTTP ${response.status}`);
 
       const blob = await response.blob();
       if (!isMountedRef.current) return;
       
       const urlObj = URL.createObjectURL(blob);
       cleanupBlobUrl();
       previousBlobUrl.current = urlObj;
       
       setImageUrl(urlObj);
       setStatus("streaming");
       setError(null);
     } catch (err) {
       if (!isMountedRef.current) return;
       console.error("Failed to fetch snapshot:", err);
       setStatus("error");
       setError("Failed to load snapshot");
     } finally {
       if (isMountedRef.current) setIsLoading(false);
     }
   }, [imageUrl, cleanupBlobUrl]);
 
   // Manual refresh function
   const refresh = useCallback(() => {
     if (sourceType === "ha_entity" && haConfig && entityId) {
       fetchHaSnapshot();
     } else if (sourceType === "stream_url") {
       const url = snapshotUrl || streamUrl;
       if (url && isValidUrl(url)) {
         fetchUrlSnapshot(url);
       }
     }
   }, [sourceType, haConfig, entityId, snapshotUrl, streamUrl, fetchHaSnapshot, fetchUrlSnapshot]);
 
   // Start/stop refresh timer
   useEffect(() => {
     isMountedRef.current = true;
     
     // Clear existing timer
     if (refreshTimerRef.current) {
       clearInterval(refreshTimerRef.current);
       refreshTimerRef.current = null;
     }
 
     // Don't start timer if paused or manual refresh
     if (isPaused || currentRefreshInterval === 0) {
       return;
     }
 
     // For MJPEG streams, no polling needed (browser handles it)
     if (streamType === "mjpeg") {
       setStatus("streaming");
       return;
     }
 
     // RTSP without restream config
     if (sourceType === "rtsp" && !restreamBaseUrl) {
       setStatus("no_config");
       setError("RTSP requires go2rtc or Frigate for streaming");
       return;
     }
 
     // Initial fetch
     if (sourceType === "ha_entity" && haConfig && entityId) {
       fetchHaSnapshot();
       refreshTimerRef.current = setInterval(fetchHaSnapshot, currentRefreshInterval * 1000);
     } else if (sourceType === "stream_url" && streamType === "snapshot") {
       const url = snapshotUrl || streamUrl;
       if (url && isValidUrl(url)) {
         fetchUrlSnapshot(url);
         refreshTimerRef.current = setInterval(() => fetchUrlSnapshot(url), currentRefreshInterval * 1000);
       }
     }
 
     return () => {
       isMountedRef.current = false;
       if (refreshTimerRef.current) {
         clearInterval(refreshTimerRef.current);
         refreshTimerRef.current = null;
       }
     };
   }, [
     sourceType, 
     entityId, 
     haConfig, 
     streamUrl, 
     snapshotUrl, 
     restreamBaseUrl, 
     currentRefreshInterval, 
     isPaused, 
     streamType,
     fetchHaSnapshot, 
     fetchUrlSnapshot
   ]);
 
   // Cleanup on unmount
   useEffect(() => {
     return () => {
       cleanupBlobUrl();
     };
   }, [cleanupBlobUrl]);
 
   return {
     status,
     error,
     imageUrl,
     streamUrl: effectiveStreamUrl,
     streamType,
     isLoading,
     refresh,
     setRefreshInterval: setCurrentRefreshInterval,
   };
 };