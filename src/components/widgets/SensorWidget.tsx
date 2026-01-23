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
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();

  // Calculate dynamic sizes
  const minDim = Math.min(cols, rows);
  const iconSize = minDim >= 3 ? "w-12 h-12" : isLarge ? "w-8 h-8" : isTall ? "w-8 h-8" : isWide ? "w-6 h-6" : "w-4 h-4";
  const iconPadding = minDim >= 3 ? "p-5" : isLarge ? "p-4" : isTall ? "p-4" : isWide ? "p-3" : "p-2";
  const valueSize = minDim >= 4 ? "text-8xl" : minDim >= 3 ? "text-7xl" : isLarge ? "text-6xl" : isTall ? "text-4xl" : isWide ? "text-3xl" : "text-2xl";
  const unitSize = minDim >= 3 ? "text-3xl" : isLarge ? "text-2xl" : isTall ? "text-xl" : isWide ? "text-lg" : "text-sm";
  const titleSize = minDim >= 3 ? "text-xl" : isLarge ? "text-lg" : "text-xs";

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

  // Wide layout (not tall)
  if (isWide && !isTall) {
    return (
      <div className="widget-card h-full flex items-center gap-4">
        <div className={cn("rounded-xl bg-secondary", iconPadding)}>
          <Icon className={cn(iconSize, colorClass)} />
        </div>
        
        <div className="flex-1">
          <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
          {room && (
            <p className={cn("text-muted-foreground", minDim >= 3 ? "text-base" : "text-xs")}>{room}</p>
          )}
        </div>

        <p className={cn("font-light text-foreground", valueSize)}>
          {value}
          <span className={cn("text-muted-foreground ml-1", unitSize)}>{unit}</span>
        </p>
      </div>
    );
  }

  // Tall only layout (centered vertical)
  if (isTall && !isWide) {
    return (
      <div className="widget-card h-full flex flex-col items-center justify-center text-center">
        <div className={cn("rounded-xl bg-secondary mb-4", iconPadding)}>
          <Icon className={cn(iconSize, colorClass)} />
        </div>
        
        <p className={cn("font-light text-foreground", valueSize)}>
          {value}
          <span className={cn("text-muted-foreground ml-1", unitSize)}>{unit}</span>
        </p>
        <h3 className={cn("font-medium text-foreground mt-3", titleSize)}>{name}</h3>
        {room && (
          <p className={cn("text-muted-foreground", minDim >= 3 ? "text-base" : "text-sm")}>{room}</p>
        )}
      </div>
    );
  }

  // Large layout (both wide and tall)
  return (
    <div className="widget-card h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("rounded-xl bg-secondary", iconPadding)}>
          <Icon className={cn(iconSize, colorClass)} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className={cn("font-light text-foreground", valueSize)}>
          {value}
          <span className={cn("text-muted-foreground ml-2", unitSize)}>{unit}</span>
        </p>
      </div>

      <div className={cn("mt-auto pt-4 border-t border-border", minDim >= 3 && "pt-6")}>
        <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
        {room && (
          <p className={cn("text-muted-foreground", minDim >= 3 ? "text-base" : "text-sm")}>{room}</p>
        )}
      </div>
    </div>
  );
};
