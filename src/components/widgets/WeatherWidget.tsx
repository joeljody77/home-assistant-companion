import { Cloud, Sun, CloudRain, CloudSnow, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="widget-card col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{location}</p>
          <p className="text-5xl font-light text-foreground mt-2">
            {temperature}°
          </p>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {condition}
          </p>
        </div>

        <Icon className={cn("w-16 h-16", colorClass)} />
      </div>

      {(high !== undefined || low !== undefined || humidity !== undefined) && (
        <div className="flex gap-4 mt-4 pt-4 border-t border-border">
          {high !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">High</p>
              <p className="text-sm font-medium text-foreground">{high}°</p>
            </div>
          )}
          {low !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Low</p>
              <p className="text-sm font-medium text-foreground">{low}°</p>
            </div>
          )}
          {humidity !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-sm font-medium text-foreground">{humidity}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
