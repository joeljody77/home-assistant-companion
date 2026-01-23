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
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

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
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <div className="widget-card h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-xl bg-secondary">
            <Icon className={cn("w-4 h-4", colorClass)} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <p className="text-2xl font-light text-foreground">
            {value}
            <span className="text-sm text-muted-foreground ml-1">{unit}</span>
          </p>
          <h3 className="font-medium text-foreground text-xs mt-1">{name}</h3>
          {room && (
            <p className="text-xs text-muted-foreground">{room}</p>
          )}
        </div>
      </div>
    );
  }

  // Wide 2x1 layout
  if (isWide && !isTall) {
    return (
      <div className="widget-card h-full flex items-center gap-4">
        <div className="p-3 rounded-xl bg-secondary">
          <Icon className={cn("w-6 h-6", colorClass)} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-sm">{name}</h3>
          {room && (
            <p className="text-xs text-muted-foreground">{room}</p>
          )}
        </div>

        <p className="text-3xl font-light text-foreground">
          {value}
          <span className="text-lg text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
    );
  }

  // Tall 1x2 layout
  if (isTall && !isWide) {
    return (
      <div className="widget-card h-full flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-xl bg-secondary mb-4">
          <Icon className={cn("w-8 h-8", colorClass)} />
        </div>
        
        <p className="text-4xl font-light text-foreground">
          {value}
          <span className="text-xl text-muted-foreground ml-1">{unit}</span>
        </p>
        <h3 className="font-medium text-foreground mt-3">{name}</h3>
        {room && (
          <p className="text-sm text-muted-foreground">{room}</p>
        )}
      </div>
    );
  }

  // Large 2x2 layout
  return (
    <div className="widget-card h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="p-4 rounded-xl bg-secondary">
          <Icon className={cn("w-8 h-8", colorClass)} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-6xl font-light text-foreground">
          {value}
          <span className="text-2xl text-muted-foreground ml-2">{unit}</span>
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-border">
        <h3 className="font-medium text-foreground text-lg">{name}</h3>
        {room && (
          <p className="text-sm text-muted-foreground">{room}</p>
        )}
      </div>
    </div>
  );
};
