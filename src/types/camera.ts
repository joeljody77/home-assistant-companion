// Camera source types
export type CameraSourceType = "ha_entity" | "stream_url" | "rtsp";

// Restream service types
export type RestreamType = "go2rtc" | "frigate";

// Camera view modes
export type CameraViewMode = "snapshot" | "live";

// Camera widget configuration interface
export interface CameraConfig {
  // Display settings
  name: string;
  room?: string;
  
  // Source type
  sourceType: CameraSourceType;
  
  // Home Assistant Entity source
  entityId?: string;
  
  // Direct Stream URL source
  streamUrl?: string;           // HLS (.m3u8) or MJPEG URL
  snapshotUrl?: string;         // Optional snapshot URL for stream sources
  
  // RTSP source (requires restreaming)
  rtspUrl?: string;
  restreamType?: RestreamType;
  restreamBaseUrl?: string;     // e.g., "http://192.168.1.100:1984"
  streamName?: string;          // Optional stream name override
  
  // View mode and settings
  viewMode: CameraViewMode;
  refreshInterval: number;      // For snapshot mode (seconds)
  liveFps: number;              // For live polling fallback
}

// Camera connection status
export type CameraStatus = 
  | "idle" 
  | "connecting" 
  | "loading" 
  | "streaming" 
  | "error" 
  | "offline" 
  | "no_config";

// Camera error types
export type CameraErrorType = 
  | "connection_failed"
  | "auth_failed" 
  | "stream_unavailable"
  | "rtsp_no_restream"
  | "cors_blocked"
  | "unknown";

export interface CameraError {
  type: CameraErrorType;
  message: string;
}

// Default camera configuration
export const DEFAULT_CAMERA_CONFIG: Partial<CameraConfig> = {
  sourceType: "ha_entity",
  viewMode: "live",
  refreshInterval: 10,
  liveFps: 5,
};
