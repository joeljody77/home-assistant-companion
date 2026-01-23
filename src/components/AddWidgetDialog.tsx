import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";

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
    defaultProps: { name: "Camera", room: "Room", isOnline: true },
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

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWidget: (type: string, props: Record<string, unknown>) => void;
}

export const AddWidgetDialog = ({
  open,
  onOpenChange,
  onAddWidget,
}: AddWidgetDialogProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelect = (widget: WidgetTypeOption) => {
    onAddWidget(widget.type, widget.defaultProps);
    setSelectedType(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-4">
          {widgetTypes.map((widget) => {
            const Icon = widget.icon;
            return (
              <button
                key={widget.type}
                onClick={() => handleSelect(widget)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150",
                  "bg-secondary border border-border",
                  "active:scale-95 active:bg-muted",
                  selectedType === widget.type && "ring-2 ring-primary"
                )}
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">{widget.label}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
