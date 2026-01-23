import { Cloud, Sun, CloudRain, CloudSnow, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

type WeatherType = "sunny" | "cloudy" | "rainy" | "snowy" | "windy";

interface WeatherWidgetProps {
  location?: string;
  temperature: number;
  condition: WeatherType;
  high?: number;
  low?: number;
  humidity?: number;
}

const weatherIcons: Record<WeatherType, React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
};

const weatherColors: Record<WeatherType, string> = {
  sunny: "text-yellow-400",
  cloudy: "text-gray-400",
  rainy: "text-blue-400",
  snowy: "text-cyan-300",
  windy: "text-teal-400",
};

export const WeatherWidget = ({
  location = "Home",
  temperature,
  condition,
  high,
  low,
  humidity,
}: WeatherWidgetProps) => {
  const Icon = weatherIcons[condition];
  const colorClass = weatherColors[condition];
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();

  const minDim = Math.min(cols, rows);
  
  // Calculate dynamic sizes
  const iconSize = minDim >= 4 ? "w-32 h-32" : minDim >= 3 ? "w-24 h-24" : isLarge ? "w-20 h-20" : isTall ? "w-16 h-16" : isWide ? "w-16 h-16" : "w-8 h-8";
  const tempSize = minDim >= 4 ? "text-8xl" : minDim >= 3 ? "text-7xl" : isLarge ? "text-6xl" : isTall ? "text-5xl" : isWide ? "text-5xl" : "text-3xl";
  const detailSize = minDim >= 3 ? "text-xl" : isLarge ? "text-lg" : "text-sm";
  const labelSize = minDim >= 3 ? "text-base" : "text-xs";

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <div className="widget-card h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn("w-8 h-8", colorClass)} />
          <p className="text-3xl font-light text-foreground">{temperature}°</p>
        </div>
        <p className="text-xs text-muted-foreground capitalize">{condition}</p>
        <p className="text-xs text-muted-foreground mt-auto">{location}</p>
      </div>
    );
  }

  // Tall layout (not wide)
  if (isTall && !isWide) {
    return (
      <div className="widget-card h-full flex flex-col">
        <p className={cn("text-muted-foreground", minDim >= 3 ? "text-lg" : "text-sm")}>{location}</p>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Icon className={cn("mb-4", iconSize, colorClass)} />
          <p className={cn("font-light text-foreground", tempSize)}>{temperature}°</p>
          <p className={cn("text-muted-foreground capitalize mt-2", minDim >= 3 ? "text-lg" : "text-sm")}>{condition}</p>
        </div>
        {(high !== undefined || low !== undefined || humidity !== undefined) && (
          <div className={cn("flex justify-center gap-4 pt-4 border-t border-border", minDim >= 3 && "gap-6 pt-6")}>
            {high !== undefined && (
              <div className="text-center">
                <p className={cn("text-muted-foreground", labelSize)}>High</p>
                <p className={cn("font-medium text-foreground", detailSize)}>{high}°</p>
              </div>
            )}
            {low !== undefined && (
              <div className="text-center">
                <p className={cn("text-muted-foreground", labelSize)}>Low</p>
                <p className={cn("font-medium text-foreground", detailSize)}>{low}°</p>
              </div>
            )}
            {humidity !== undefined && (
              <div className="text-center">
                <p className={cn("text-muted-foreground", labelSize)}>Humidity</p>
                <p className={cn("font-medium text-foreground", detailSize)}>{humidity}%</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Wide or Large layout
  return (
    <div className="widget-card h-full flex flex-col">
      <div className="flex items-start justify-between flex-1">
        <div>
          <p className={cn("text-muted-foreground", minDim >= 3 ? "text-lg" : "text-sm")}>{location}</p>
          <p className={cn("font-light text-foreground mt-2", tempSize)}>
            {temperature}°
          </p>
          <p className={cn("text-muted-foreground capitalize mt-1", minDim >= 3 ? "text-lg" : "text-sm")}>
            {condition}
          </p>
        </div>

        <Icon className={cn(colorClass, iconSize)} />
      </div>

      {(high !== undefined || low !== undefined || humidity !== undefined) && (
        <div className={cn("flex gap-4 pt-4 border-t border-border", minDim >= 3 && "gap-8 pt-6")}>
          {high !== undefined && (
            <div>
              <p className={cn("text-muted-foreground", labelSize)}>High</p>
              <p className={cn("font-medium text-foreground", detailSize)}>{high}°</p>
            </div>
          )}
          {low !== undefined && (
            <div>
              <p className={cn("text-muted-foreground", labelSize)}>Low</p>
              <p className={cn("font-medium text-foreground", detailSize)}>{low}°</p>
            </div>
          )}
          {humidity !== undefined && (
            <div>
              <p className={cn("text-muted-foreground", labelSize)}>Humidity</p>
              <p className={cn("font-medium text-foreground", detailSize)}>{humidity}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
