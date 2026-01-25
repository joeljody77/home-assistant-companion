import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityPicker } from "@/components/EntityPicker";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Thermometer,
  Gauge,
  Clapperboard,
  Power,
  Camera,
  Music2,
  Cloud,
  Lock,
  ArrowRight,
} from "lucide-react";
import { HAEntity, DOMAIN_TO_WIDGET_TYPE } from "@/hooks/useHomeAssistant";

interface WidgetTypeOption {
  type: string;
  label: string;
  icon: React.ElementType;
  defaultProps: Record<string, unknown>;
}

const widgetTypes: WidgetTypeOption[] = [
  {
    type: "light",
    label: "Light",
    icon: Lightbulb,
    defaultProps: { name: "New Light", room: "Room", initialState: false, initialBrightness: 50 },
  },
  {
    type: "climate",
    label: "Climate",
    icon: Thermometer,
    defaultProps: { name: "Thermostat", currentTemp: 21, targetTemp: 22, humidity: 45, mode: "auto" },
  },
  {
    type: "sensor",
    label: "Sensor",
    icon: Gauge,
    defaultProps: { name: "Sensor", type: "temperature", value: 21, unit: "°C", room: "Room" },
  },
  {
    type: "scene",
    label: "Scene",
    icon: Clapperboard,
    defaultProps: { name: "New Scene", type: "custom", deviceCount: 3 },
  },
  {
    type: "switch",
    label: "Switch",
    icon: Power,
    defaultProps: { name: "Switch", type: "plug", room: "Room", initialState: false },
  },
  {
    type: "camera",
    label: "Camera",
    icon: Camera,
    defaultProps: { 
      name: "Camera", 
      room: "Room", 
      sourceType: "ha_entity",
      viewMode: "live", 
      refreshInterval: 10, 
      liveFps: 5 
    },
  },
  {
    type: "media",
    label: "Media",
    icon: Music2,
    defaultProps: { name: "Speaker", artist: "Artist", track: "Track" },
  },
  {
    type: "weather",
    label: "Weather",
    icon: Cloud,
    defaultProps: { location: "City", temperature: 20, condition: "sunny", high: 25, low: 15, humidity: 50 },
  },
  {
    type: "lock",
    label: "Lock",
    icon: Lock,
    defaultProps: { name: "Lock", room: "Room", initialState: true },
  },
];

interface GridPosition {
  col: number;
  row: number;
}

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (type: string, props: Record<string, unknown>, position?: GridPosition) => void;
  selectedCell?: GridPosition | null;
}

export const AddWidgetDialog = ({
  open,
  onOpenChange,
  onAddWidget,
  selectedCell,
}: AddWidgetDialogProps) => {
  const { isConnected, getRecommendedWidgetType } = useHomeAssistantContext();
  const [tab, setTab] = useState<"entity" | "widget">("entity");
  const [selectedEntity, setSelectedEntity] = useState<HAEntity | null>(null);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null);

  const handleReset = () => {
    setSelectedEntity(null);
    setSelectedWidgetType(null);
    setTab("entity");
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      handleReset();
    }
    onOpenChange(value);
  };

  // Entity-first flow: Select entity, then pick widget type
  const handleEntitySelect = (entity: HAEntity) => {
    setSelectedEntity(entity);
    const recommended = getRecommendedWidgetType(entity.entity_id);
    if (recommended) {
      setSelectedWidgetType(recommended);
    }
  };

  // Create widget with entity linked
  const handleCreateFromEntity = () => {
    if (!selectedEntity || !selectedWidgetType) return;

    const widgetDef = widgetTypes.find(w => w.type === selectedWidgetType);
    if (!widgetDef) return;

    const props = {
      ...widgetDef.defaultProps,
      name: selectedEntity.attributes.friendly_name || selectedEntity.entity_id.split(".")[1],
      entity_id: selectedEntity.entity_id,
    };

    onAddWidget(selectedWidgetType, props, selectedCell || undefined);
    handleReset();
    onOpenChange(false);
  };

  // Widget-first flow: Select widget type, then optionally link entity
  const handleWidgetTypeSelect = (widget: WidgetTypeOption) => {
    if (isConnected && tab === "widget") {
      // Show entity picker for this widget type
      setSelectedWidgetType(widget.type);
    } else {
      // No HA connection - create widget without entity
      onAddWidget(widget.type, widget.defaultProps, selectedCell || undefined);
      handleReset();
      onOpenChange(false);
    }
  };

  // Create widget from widget-first flow (with or without entity)
  const handleCreateFromWidget = (entity?: HAEntity) => {
    if (!selectedWidgetType) return;

    const widgetDef = widgetTypes.find(w => w.type === selectedWidgetType);
    if (!widgetDef) return;

    const props = entity
      ? {
          ...widgetDef.defaultProps,
          name: entity.attributes.friendly_name || entity.entity_id.split(".")[1],
          entity_id: entity.entity_id,
        }
      : widgetDef.defaultProps;

    onAddWidget(selectedWidgetType, props, selectedCell || undefined);
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>

        {isConnected ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "entity" | "widget")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entity">Pick Entity</TabsTrigger>
              <TabsTrigger value="widget">Pick Widget</TabsTrigger>
            </TabsList>

            {/* Entity-first flow */}
            <TabsContent value="entity" className="space-y-4">
              {!selectedEntity ? (
                <EntityPicker
                  onSelect={handleEntitySelect}
                  showRecommendedWidget
                />
              ) : (
                <div className="space-y-4">
                  {/* Selected entity summary */}
                  <div className="p-3 rounded-lg bg-secondary">
                    <p className="font-medium">
                      {selectedEntity.attributes.friendly_name || selectedEntity.entity_id}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedEntity.entity_id}</p>
                  </div>

                  {/* Widget type picker for entity */}
                  <div>
                    <p className="text-sm font-medium mb-2">Choose widget type:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {widgetTypes.map((widget) => {
                        const Icon = widget.icon;
                        const recommended = getRecommendedWidgetType(selectedEntity.entity_id);
                        const isRecommended = widget.type === recommended;
                        const isSelected = widget.type === selectedWidgetType;
                        
                        return (
                          <button
                            key={widget.type}
                            onClick={() => setSelectedWidgetType(widget.type)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all duration-150",
                              "border",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : isRecommended
                                ? "bg-primary/10 border-primary/30"
                                : "bg-secondary border-transparent active:scale-95"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{widget.label}</span>
                            {isRecommended && !isSelected && (
                              <span className="text-[10px] text-primary">Recommended</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedEntity(null)} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleCreateFromEntity}
                      disabled={!selectedWidgetType}
                      className="flex-1 gap-2"
                    >
                      Create Widget
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Widget-first flow */}
            <TabsContent value="widget" className="space-y-4">
              {!selectedWidgetType ? (
                <div className="grid grid-cols-3 gap-3 py-2">
                  {widgetTypes.map((widget) => {
                    const Icon = widget.icon;
                    return (
                      <button
                        key={widget.type}
                        onClick={() => handleWidgetTypeSelect(widget)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150",
                          "bg-secondary border border-border",
                          "active:scale-95 active:bg-muted"
                        )}
                      >
                        <Icon className="w-6 h-6 text-primary" />
                        <span className="text-sm font-medium">{widget.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected widget type summary */}
                  <div className="p-3 rounded-lg bg-secondary flex items-center gap-3">
                    {(() => {
                      const widget = widgetTypes.find(w => w.type === selectedWidgetType);
                      const Icon = widget?.icon || Lightbulb;
                      return (
                        <>
                          <Icon className="w-5 h-5 text-primary" />
                          <span className="font-medium">{widget?.label} Widget</span>
                        </>
                      );
                    })()}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Select an entity to link, or skip to create without linking.
                  </p>

                  <EntityPicker
                    onSelect={(entity) => handleCreateFromWidget(entity)}
                    filterByWidgetType={selectedWidgetType}
                  />

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedWidgetType(null)} className="flex-1">
                      Back
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleCreateFromWidget()}
                      className="flex-1"
                    >
                      Skip (No Entity)
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // No HA connection - simple widget picker
          <div className="grid grid-cols-3 gap-3 py-4">
            {widgetTypes.map((widget) => {
              const Icon = widget.icon;
              return (
                <button
                  key={widget.type}
                  onClick={() => handleWidgetTypeSelect(widget)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150",
                    "bg-secondary border border-border",
                    "active:scale-95 active:bg-muted"
                  )}
                >
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">{widget.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
