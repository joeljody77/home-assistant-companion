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
import { Link2, Link2Off, Trash2 } from "lucide-react";
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

  // Load widget data when dialog opens
  useEffect(() => {
    if (open && widget) {
      setName((widget.props.name as string) || "");
      setRoom((widget.props.room as string) || "");
      setEntityId(widget.props.entity_id as string | undefined);
      setShowEntityPicker(false);
    }
  }, [open, widget]);

  if (!widget) return null;

  const linkedEntity = entityId ? getEntity(entityId) : undefined;

  const handleSave = () => {
    onSave(widget.id, {
      ...widget.props,
      name,
      room,
      entity_id: entityId,
    });
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
