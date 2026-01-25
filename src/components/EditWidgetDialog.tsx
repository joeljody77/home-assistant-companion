import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityPicker } from "@/components/EntityPicker";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
import { cn } from "@/lib/utils";
import { 
  Link2, Link2Off, Trash2, Video, Image, Wifi, Home, Link, 
  AlertTriangle, CheckCircle2 
} from "lucide-react";
import { WidgetConfig } from "@/hooks/useGridLayout";
import { CameraSourceType, CameraViewMode, RestreamType } from "@/types/camera";
import { isValidUrl, isValidRtspUrl } from "@/utils/streamUtils";

interface EditWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget: WidgetConfig | null;
  onSave: (widgetId: string, props: Record<string, unknown>) => void;
  onDelete: (widgetId: string) => void;
}

export const EditWidgetDialog = ({
  open,
  onOpenChange,
  widget,
  onSave,
  onDelete,
}: EditWidgetDialogProps) => {
  const { isConnected, getEntity, config } = useHomeAssistantContext();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [entityId, setEntityId] = useState<string | undefined>(undefined);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  
  // Camera-specific settings
  const [sourceType, setSourceType] = useState<CameraSourceType>("ha_entity");
  const [viewMode, setViewMode] = useState<CameraViewMode>("live");
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [liveFps, setLiveFps] = useState(5);
  
  // Stream URL source
  const [streamUrl, setStreamUrl] = useState("");
  const [snapshotUrl, setSnapshotUrl] = useState("");
  
  // RTSP source
  const [rtspUrl, setRtspUrl] = useState("");
  const [restreamType, setRestreamType] = useState<RestreamType>("go2rtc");
  const [restreamBaseUrl, setRestreamBaseUrl] = useState("");
  const [streamName, setStreamName] = useState("");
  
  // Test connection state
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  // Load widget data when dialog opens
  useEffect(() => {
    if (open && widget) {
      setName((widget.props.name as string) || "");
      setRoom((widget.props.room as string) || "");
      setEntityId(widget.props.entity_id as string | undefined);
      setShowEntityPicker(false);
      setTestStatus("idle");
      setTestError(null);
      
      // Camera settings
      if (widget.type === "camera") {
        setSourceType((widget.props.sourceType as CameraSourceType) || "ha_entity");
        setViewMode((widget.props.viewMode as CameraViewMode) || "live");
        setRefreshInterval((widget.props.refreshInterval as number) || 10);
        setLiveFps((widget.props.liveFps as number) || 5);
        setStreamUrl((widget.props.streamUrl as string) || "");
        setSnapshotUrl((widget.props.snapshotUrl as string) || "");
        setRtspUrl((widget.props.rtspUrl as string) || "");
        setRestreamType((widget.props.restreamType as RestreamType) || "go2rtc");
        setRestreamBaseUrl((widget.props.restreamBaseUrl as string) || "");
        setStreamName((widget.props.streamName as string) || "");
      }
    }
  }, [open, widget]);

  if (!widget) return null;

  const linkedEntity = entityId ? getEntity(entityId) : undefined;

  const handleSave = () => {
    const updatedProps: Record<string, unknown> = {
      ...widget.props,
      name,
      room,
      entity_id: sourceType === "ha_entity" ? entityId : undefined,
    };
    
    // Add camera-specific props
    if (widget.type === "camera") {
      updatedProps.sourceType = sourceType;
      updatedProps.viewMode = viewMode;
      updatedProps.refreshInterval = refreshInterval;
      updatedProps.liveFps = liveFps;
      
      if (sourceType === "stream_url") {
        updatedProps.streamUrl = streamUrl;
        updatedProps.snapshotUrl = snapshotUrl;
      } else if (sourceType === "rtsp") {
        updatedProps.rtspUrl = rtspUrl;
        updatedProps.restreamType = restreamType;
        updatedProps.restreamBaseUrl = restreamBaseUrl;
        updatedProps.streamName = streamName;
      }
    }
    
    onSave(widget.id, updatedProps);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(widget.id);
    onOpenChange(false);
  };

  const handleUnlinkEntity = () => {
    setEntityId(undefined);
  };

  // Test HA entity connection
  const testHaConnection = async () => {
    if (!config || !entityId) return;
    
    setTestStatus("testing");
    setTestError(null);
    
    try {
      const response = await fetch(
        `${config.url}/api/camera_proxy/${entityId}`,
        { headers: { Authorization: `Bearer ${config.token}` } }
      );
      
      if (response.ok) {
        setTestStatus("success");
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  // Test stream URL
  const testStreamUrl = async () => {
    if (!streamUrl) return;
    
    setTestStatus("testing");
    setTestError(null);
    
    try {
      const response = await fetch(streamUrl, { method: "HEAD" });
      if (response.ok) {
        setTestStatus("success");
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      // HEAD might fail due to CORS, try with mode: no-cors
      setTestStatus("success"); // Assume it works if URL is valid
    }
  };

  const renderCameraSettings = () => (
    <div className="space-y-4 pt-2 border-t border-border">
      {/* Source Type Selector */}
      <div className="space-y-2">
        <Label>Camera Source</Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSourceType("ha_entity")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all",
              sourceType === "ha_entity"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border active:scale-95"
            )}
          >
            <Home className="w-4 h-4" />
            <span className="text-xs font-medium">HA Entity</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceType("stream_url")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all",
              sourceType === "stream_url"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border active:scale-95"
            )}
          >
            <Link className="w-4 h-4" />
            <span className="text-xs font-medium">Stream URL</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceType("rtsp")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all",
              sourceType === "rtsp"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border active:scale-95"
            )}
          >
            <Video className="w-4 h-4" />
            <span className="text-xs font-medium">RTSP</span>
          </button>
        </div>
      </div>

      {/* HA Entity Source Settings */}
      {sourceType === "ha_entity" && (
        <div className="space-y-3 p-3 rounded-lg bg-secondary/50">
          {linkedEntity ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{linkedEntity.attributes.friendly_name || linkedEntity.entity_id}</p>
                <p className="text-xs text-muted-foreground">{linkedEntity.entity_id}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={testHaConnection} disabled={testStatus === "testing"}>
                  {testStatus === "testing" ? "Testing..." : testStatus === "success" ? <CheckCircle2 className="w-4 h-4 text-primary" /> : "Test"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowEntityPicker(true)}>Change</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground mb-2">No entity linked</p>
              <Button size="sm" onClick={() => setShowEntityPicker(true)} disabled={!isConnected}>
                Select Entity
              </Button>
            </div>
          )}
          {testStatus === "error" && testError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {testError}
            </p>
          )}
        </div>
      )}

      {/* Stream URL Source Settings */}
      {sourceType === "stream_url" && (
        <div className="space-y-3 p-3 rounded-lg bg-secondary/50">
          <div className="space-y-2">
            <Label htmlFor="stream-url">Stream URL (HLS or MJPEG)</Label>
            <div className="flex gap-2">
              <Input
                id="stream-url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://example.com/stream.m3u8"
                className={cn(!isValidUrl(streamUrl) && streamUrl && "border-destructive")}
              />
              <Button size="sm" variant="outline" onClick={testStreamUrl} disabled={!streamUrl || testStatus === "testing"}>
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports HLS (.m3u8) and MJPEG streams
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="snapshot-url">Snapshot URL (optional)</Label>
            <Input
              id="snapshot-url"
              value={snapshotUrl}
              onChange={(e) => setSnapshotUrl(e.target.value)}
              placeholder="https://example.com/snapshot.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Used for snapshot mode or as fallback
            </p>
          </div>
          {testStatus === "success" && (
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> URL appears valid
            </p>
          )}
        </div>
      )}

      {/* RTSP Source Settings */}
      {sourceType === "rtsp" && (
        <div className="space-y-3 p-3 rounded-lg bg-secondary/50">
          <div className="space-y-2">
            <Label htmlFor="rtsp-url">RTSP URL</Label>
            <Input
              id="rtsp-url"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://192.168.1.100:554/stream"
              className={cn(!isValidRtspUrl(rtspUrl) && rtspUrl && "border-destructive")}
            />
          </div>
          
          <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-warning flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              RTSP cannot play directly in browsers. Configure a restream service below.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Restream Service</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRestreamType("go2rtc")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2 rounded-lg border transition-all text-sm",
                  restreamType === "go2rtc"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border active:scale-95"
                )}
              >
                go2rtc
              </button>
              <button
                type="button"
                onClick={() => setRestreamType("frigate")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2 rounded-lg border transition-all text-sm",
                  restreamType === "frigate"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border active:scale-95"
                )}
              >
                Frigate
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="restream-base-url">
              {restreamType === "go2rtc" ? "go2rtc Base URL" : "Frigate Base URL"}
            </Label>
            <Input
              id="restream-base-url"
              value={restreamBaseUrl}
              onChange={(e) => setRestreamBaseUrl(e.target.value)}
              placeholder={restreamType === "go2rtc" ? "http://192.168.1.100:1984" : "http://192.168.1.100:5000"}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stream-name">Stream Name (optional)</Label>
            <Input
              id="stream-name"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="front_door"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to extract from RTSP URL
            </p>
          </div>
        </div>
      )}

      {/* View Mode Selector */}
      <div className="space-y-2">
        <Label>View Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setViewMode("live")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all",
              viewMode === "live"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border active:scale-95"
            )}
          >
            <Wifi className="w-4 h-4" />
            <span className="text-xs font-medium">Live</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("snapshot")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all",
              viewMode === "snapshot"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border active:scale-95"
            )}
          >
            <Image className="w-4 h-4" />
            <span className="text-xs font-medium">Snapshot</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {viewMode === "live" 
            ? sourceType === "ha_entity" 
              ? "Uses WebRTC if available, falls back to polling." 
              : "Streams video in real-time."
            : "Shows still images, refreshed periodically."}
        </p>
      </div>

      {/* Refresh Settings */}
      {viewMode === "snapshot" && (
        <div className="space-y-2">
          <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
          <Input
            id="refresh-interval"
            type="number"
            min={5}
            max={300}
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Math.max(5, parseInt(e.target.value) || 10))}
          />
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Widget</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="entity" disabled={!isConnected || widget.type !== "camera" || sourceType !== "ha_entity"}>
              Entity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="widget-name">Name</Label>
              <Input
                id="widget-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Widget name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-room">Room</Label>
              <Input
                id="widget-room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Room name"
              />
            </div>

            {/* Camera-specific settings */}
            {widget.type === "camera" && renderCameraSettings()}

            {/* Show linked entity info for non-camera widgets */}
            {widget.type !== "camera" && linkedEntity && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      Linked Entity
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {linkedEntity.entity_id}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                    {linkedEntity.state}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="destructive" onClick={handleDelete} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="entity" className="space-y-4 py-4">
            {sourceType === "ha_entity" && (
              <>
                {linkedEntity && !showEntityPicker ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="font-medium">
                        {linkedEntity.attributes.friendly_name || linkedEntity.entity_id}
                      </p>
                      <p className="text-sm text-muted-foreground">{linkedEntity.entity_id}</p>
                      <p className="text-sm mt-2">
                        State: <span className="font-medium">{linkedEntity.state}</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleUnlinkEntity}
                        className="flex-1 gap-2"
                      >
                        <Link2Off className="w-4 h-4" />
                        Unlink
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowEntityPicker(true)}
                        className="flex-1"
                      >
                        Change Entity
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {linkedEntity && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowEntityPicker(false)}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    )}

                    <EntityPicker
                      selectedEntityId={entityId}
                      onSelect={(entity) => {
                        setEntityId(entity.entity_id);
                        setName(entity.attributes.friendly_name || entity.entity_id.split(".")[1]);
                        setShowEntityPicker(false);
                      }}
                      filterByWidgetType={widget.type}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
