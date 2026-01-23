import { useState } from "react";
import { Thermometer, Droplets, Wind, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

interface ClimateWidgetProps {
  name: string;
  currentTemp: number;
  targetTemp?: number;
  humidity?: number;
  mode?: "heating" | "cooling" | "auto" | "off";
}

export const ClimateWidget = ({
  name,
  currentTemp,
  targetTemp: initialTarget = 22,
  humidity = 45,
  mode: initialMode = "auto",
}: ClimateWidgetProps) => {
  const [targetTemp, setTargetTemp] = useState(initialTarget);
  const [mode, setMode] = useState(initialMode);
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  const isActive = mode !== "off";

  const incrementTemp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetTemp((prev) => Math.min(prev + 0.5, 30));
  };

  const decrementTemp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetTemp((prev) => Math.max(prev - 0.5, 16));
  };

  const getModeColor = () => {
    switch (mode) {
      case "heating":
        return "text-orange-400";
      case "cooling":
        return "text-accent";
      case "auto":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <div
        className={cn(
          "widget-card h-full flex flex-col",
          isActive && mode === "heating" && "border border-orange-500/20",
          isActive && mode === "cooling" && "border border-accent/20"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div
            className={cn(
              "p-2 rounded-xl transition-colors duration-300",
              isActive ? "bg-primary/20" : "bg-secondary"
            )}
          >
            <Thermometer className={cn("w-5 h-5", getModeColor())} />
          </div>
          <div
            className={cn(
              "status-indicator",
              isActive ? "status-online" : "status-offline"
            )}
          />
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <p className="text-2xl font-light text-foreground">{currentTemp}°</p>
          <p className="text-xs text-muted-foreground">{name}</p>
          <p className="text-xs text-muted-foreground capitalize">{mode}</p>
        </div>
      </div>
    );
  }

  // Wide 2x1 layout
  if (isWide && !isTall) {
    return (
      <div
        className={cn(
          "widget-card h-full flex flex-col",
          isActive && mode === "heating" && "border border-orange-500/20",
          isActive && mode === "cooling" && "border border-accent/20"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-xl transition-colors duration-300",
                isActive ? "bg-primary/20" : "bg-secondary"
              )}
            >
              <Thermometer className={cn("w-5 h-5", getModeColor())} />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{mode}</p>
            </div>
          </div>
          <div
            className={cn(
              "status-indicator",
              isActive ? "status-online" : "status-offline"
            )}
          />
        </div>

        <div className="flex items-center justify-between flex-1">
          <div>
            <p className="text-3xl font-light text-foreground">{currentTemp}°</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={decrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="text-center min-w-[50px]">
              <p className={cn("text-xl font-medium", getModeColor())}>{targetTemp}°</p>
              <p className="text-xs text-muted-foreground">Target</p>
            </div>
            <button
              onClick={incrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="w-4 h-4" />
            <span>{humidity}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Large 2x2 or Tall 1x2 layout with full controls
  return (
    <div
      className={cn(
        "widget-card h-full flex flex-col",
        isActive && mode === "heating" && "border border-orange-500/20",
        isActive && mode === "cooling" && "border border-accent/20"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-3 rounded-xl transition-colors duration-300",
              isActive ? "bg-primary/20" : "bg-secondary"
            )}
          >
            <Thermometer className={cn(getModeColor(), isLarge ? "w-7 h-7" : "w-6 h-6")} />
          </div>
          <div>
            <h3 className={cn("font-medium text-foreground", isLarge && "text-lg")}>{name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{mode}</p>
          </div>
        </div>
        <div
          className={cn(
            "status-indicator",
            isActive ? "status-online" : "status-offline"
          )}
        />
      </div>

      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center gap-6">
          <div>
            <p className={cn("font-light text-foreground", isLarge ? "text-5xl" : "text-4xl")}>
              {currentTemp}°
            </p>
            <p className="text-xs text-muted-foreground mt-1">Current</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={incrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="text-center">
              <p className={cn("font-medium", getModeColor(), isLarge ? "text-3xl" : "text-2xl")}>
                {targetTemp}°
              </p>
              <p className="text-xs text-muted-foreground">Target</p>
            </div>
            <button
              onClick={decrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="w-4 h-4" />
            <span>{humidity}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wind className="w-4 h-4" />
            <span>Auto</span>
          </div>
        </div>
      </div>

      <div className={cn("flex gap-2 mt-auto pt-4", isLarge && "gap-3")}>
        {(["off", "heating", "cooling", "auto"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors capitalize",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
};
