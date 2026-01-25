import { RestreamType } from "@/types/camera";

/**
 * Detect if URL is an HLS stream
 */
export const isHlsUrl = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.m3u8') || 
         lowerUrl.includes('/hls/') || 
         lowerUrl.includes('format=hls');
};

/**
 * Detect if URL is an MJPEG stream
 */
export const isMjpegUrl = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('mjpeg') || 
         lowerUrl.includes('multipart') ||
         lowerUrl.includes('stream.mjpg') ||
         lowerUrl.endsWith('.mjpg');
};

/**
 * Detect stream type from URL
 */
export const detectStreamType = (url: string): "hls" | "mjpeg" | "unknown" => {
  if (isHlsUrl(url)) return "hls";
  if (isMjpegUrl(url)) return "mjpeg";
  return "unknown";
};

/**
 * Build go2rtc stream URL
 */
export const buildGo2rtcUrl = (
  baseUrl: string, 
  streamName: string, 
  format: "hls" | "mjpeg" = "hls"
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const encodedName = encodeURIComponent(streamName);
  
  if (format === "hls") {
    return `${cleanBase}/api/stream.m3u8?src=${encodedName}`;
  }
  return `${cleanBase}/api/stream.mjpeg?src=${encodedName}`;
};

/**
 * Build go2rtc WebRTC URL for signaling
 */
export const buildGo2rtcWebRtcUrl = (
  baseUrl: string,
  streamName: string
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const encodedName = encodeURIComponent(streamName);
  return `${cleanBase}/api/webrtc?src=${encodedName}`;
};

/**
 * Build Frigate stream URL
 */
export const buildFrigateUrl = (
  baseUrl: string, 
  cameraName: string,
  format: "hls" | "mjpeg" = "mjpeg"
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  
  if (format === "hls") {
    // Frigate uses a different path for HLS
    return `${cleanBase}/api/${cameraName}/latest.m3u8`;
  }
  // Default MJPEG stream
  return `${cleanBase}/api/${cameraName}`;
};

/**
 * Build Frigate snapshot URL
 */
export const buildFrigateSnapshotUrl = (
  baseUrl: string,
  cameraName: string
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/api/${cameraName}/latest.jpg`;
};

/**
 * Build web-playable URL from RTSP config
 */
export const buildRestreamUrl = (
  rtspUrl: string,
  restreamType: RestreamType,
  restreamBaseUrl: string,
  streamName?: string,
  format: "hls" | "mjpeg" = "hls"
): string => {
  // Use streamName if provided, otherwise extract from RTSP URL or use full URL
  const name = streamName || extractStreamNameFromRtsp(rtspUrl) || rtspUrl;
  
  if (restreamType === "frigate") {
    return buildFrigateUrl(restreamBaseUrl, name, format);
  }
  
  // Default to go2rtc
  return buildGo2rtcUrl(restreamBaseUrl, name, format);
};

/**
 * Extract stream name from RTSP URL
 * e.g., rtsp://192.168.1.100:554/stream1 -> stream1
 */
export const extractStreamNameFromRtsp = (rtspUrl: string): string | null => {
  try {
    const url = new URL(rtspUrl);
    const path = url.pathname.replace(/^\//, '');
    return path || null;
  } catch {
    return null;
  }
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate RTSP URL format
 */
export const isValidRtspUrl = (url: string): boolean => {
  return url.toLowerCase().startsWith('rtsp://') && isValidUrl(url);
};
