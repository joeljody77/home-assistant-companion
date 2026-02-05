// Camera source types
export type CameraSourceType = "ha_entity" | "stream_url" | "rtsp";

// Restream service types
export type RestreamType = "go2rtc" | "frigate";

// Camera view modes  
export type CameraViewMode = "snapshot" | "live" | "mjpeg";

// Snapshot refresh interval presets (in seconds)
export const REFRESH_INTERVALS = [1, 2, 5, 10, 30, 60, 0] as const; // 0 = manual
export type RefreshInterval = typeof REFRESH_INTERVALS[number];

// PTZ capability and configuration
export interface PTZConfig {
  enabled: boolean;
  // Service mappings for PTZ control
  panLeftService?: string;  // e.g., "camera.ptz_left" or custom
  panRightService?: string;
  tiltUpService?: string;
  tiltDownService?: string;
  zoomInService?: string;
  zoomOutService?: string;
  // Presets
  presets?: PTZPreset[];
}

export interface PTZPreset {
  id: string;
  name: string;
  service?: string; // Optional custom service, otherwise uses camera.goto_preset
}

// Audio configuration
export interface AudioConfig {
  enabled: boolean;
  supportsTwoWay: boolean;
  talkbackService?: string; // e.g., "camera.enable_audio" or custom
}

// Recording configuration  
export interface RecordingConfig {
  enabled: boolean;
  recordService?: string; // e.g., "camera.record" or custom
  clipService?: string;   // Service to save a clip
}

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
  refreshInterval: RefreshInterval; // For snapshot mode (seconds)
  
  // Advanced features
  ptz?: PTZConfig;
  audio?: AudioConfig;
  recording?: RecordingConfig;
  
  // Quality settings (for Camera Wall)
  quality?: "low" | "high";
  pauseWhenHidden?: boolean;
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
  viewMode: "snapshot",
  refreshInterval: 10,
  quality: "high",
  pauseWhenHidden: true,
};
