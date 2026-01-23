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
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

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

  // Tall 1x2 layout
  if (isTall && !isWide) {
    return (
      <div className="widget-card h-full flex flex-col">
        <p className="text-sm text-muted-foreground">{location}</p>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Icon className={cn("w-16 h-16 mb-4", colorClass)} />
          <p className="text-5xl font-light text-foreground">{temperature}°</p>
          <p className="text-sm text-muted-foreground capitalize mt-2">{condition}</p>
        </div>
        {(high !== undefined || low !== undefined || humidity !== undefined) && (
          <div className="flex justify-center gap-4 pt-4 border-t border-border">
            {high !== undefined && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-sm font-medium text-foreground">{high}°</p>
              </div>
            )}
            {low !== undefined && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-sm font-medium text-foreground">{low}°</p>
              </div>
            )}
            {humidity !== undefined && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-sm font-medium text-foreground">{humidity}%</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Wide 2x1 or Large 2x2 layout
  return (
    <div className="widget-card h-full flex flex-col">
      <div className="flex items-start justify-between flex-1">
        <div>
          <p className="text-sm text-muted-foreground">{location}</p>
          <p className={cn("font-light text-foreground mt-2", isLarge ? "text-6xl" : "text-5xl")}>
            {temperature}°
          </p>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {condition}
          </p>
        </div>

        <Icon className={cn(colorClass, isLarge ? "w-20 h-20" : "w-16 h-16")} />
      </div>

      {(high !== undefined || low !== undefined || humidity !== undefined) && (
        <div className={cn("flex gap-4 pt-4 border-t border-border", isLarge && "gap-6 pt-6")}>
          {high !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">High</p>
              <p className={cn("font-medium text-foreground", isLarge ? "text-lg" : "text-sm")}>{high}°</p>
            </div>
          )}
          {low !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Low</p>
              <p className={cn("font-medium text-foreground", isLarge ? "text-lg" : "text-sm")}>{low}°</p>
            </div>
          )}
          {humidity !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className={cn("font-medium text-foreground", isLarge ? "text-lg" : "text-sm")}>{humidity}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
