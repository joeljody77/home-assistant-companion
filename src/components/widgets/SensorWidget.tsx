import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Zap, 
  Activity,
  type LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

type SensorType = "temperature" | "humidity" | "wind" | "light" | "power" | "motion";

interface SensorWidgetProps {
  name: string;
  type: SensorType;
  value: number;
  unit: string;
  trend?: "up" | "down" | "stable";
  room?: string;
}

const sensorIcons: Record<SensorType, LucideIcon> = {
  temperature: Thermometer,
  humidity: Droplets,
  wind: Wind,
  light: Sun,
  power: Zap,
  motion: Activity,
};

const sensorColors: Record<SensorType, string> = {
  temperature: "text-orange-400",
  humidity: "text-blue-400",
  wind: "text-cyan-400",
  light: "text-yellow-400",
  power: "text-green-400",
  motion: "text-purple-400",
};

export const SensorWidget = ({
  name,
  type,
  value,
  unit,
  room,
}: SensorWidgetProps) => {
  const Icon = sensorIcons[type];
  const colorClass = sensorColors[type];

  return (
    <div className="widget-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl bg-secondary")}>
          <Icon className={cn("w-5 h-5", colorClass)} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-3xl font-light text-foreground">
          {value}
          <span className="text-lg text-muted-foreground ml-1">{unit}</span>
        </p>
        <h3 className="font-medium text-foreground text-sm">{name}</h3>
        {room && (
          <p className="text-xs text-muted-foreground">{room}</p>
        )}
      </div>
    </div>
  );
};
