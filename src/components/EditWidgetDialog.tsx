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
import { Link2, Link2Off, Trash2, Video, Image, Wifi } from "lucide-react";
import { WidgetConfig } from "@/hooks/useGridLayout";

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
  const { isConnected, getEntity } = useHomeAssistantContext();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [entityId, setEntityId] = useState<string | undefined>(undefined);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  // Camera-specific settings
  const [viewMode, setViewMode] = useState<"snapshot" | "live" | "webrtc">("webrtc");
  const [refreshInterval, setRefreshInterval] = useState(10);
  const [liveFps, setLiveFps] = useState(5);

  // Load widget data when dialog opens
  useEffect(() => {
    if (open && widget) {
      setName((widget.props.name as string) || "");
      setRoom((widget.props.room as string) || "");
      setEntityId(widget.props.entity_id as string | undefined);
      setShowEntityPicker(false);
      // Camera settings
      if (widget.type === "camera") {
        setViewMode((widget.props.viewMode as "snapshot" | "live" | "webrtc") || "webrtc");
        setRefreshInterval((widget.props.refreshInterval as number) || 10);
        setLiveFps((widget.props.liveFps as number) || 5);
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
      entity_id: entityId,
    };
    
    // Add camera-specific props
    if (widget.type === "camera") {
      updatedProps.viewMode = viewMode;
      updatedProps.refreshInterval = refreshInterval;
      updatedProps.liveFps = liveFps;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Widget</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="entity" disabled={!isConnected}>
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
            {widget.type === "camera" && (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label>View Mode</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode("webrtc")}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-all",
                        viewMode === "webrtc"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border active:scale-95"
                      )}
                    >
                      <Wifi className="w-4 h-4" />
                      <span className="text-xs font-medium">WebRTC</span>
                    </button>
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
                      <Video className="w-4 h-4" />
                      <span className="text-xs font-medium">Polling</span>
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
                    {viewMode === "webrtc" 
                      ? "Low-latency stream via WebRTC (requires go2rtc)." 
                      : viewMode === "live"
                      ? "Fast-refreshing snapshots for live viewing."
                      : "Shows still images. Tap to view fullscreen."}
                  </p>
                </div>

                {viewMode === "snapshot" ? (
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
                ) : viewMode === "live" ? (
                  <div className="space-y-2">
                    <Label htmlFor="live-fps">Frame Rate (FPS)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="live-fps"
                        type="number"
                        min={1}
                        max={10}
                        value={liveFps}
                        onChange={(e) => setLiveFps(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {liveFps} frame{liveFps !== 1 ? "s" : ""}/sec
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Higher FPS = smoother but uses more bandwidth
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Show linked entity info */}
            {linkedEntity && (
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
