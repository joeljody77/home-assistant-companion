import { useState } from "react";
import { Thermometer, Droplets, Wind, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

interface ClimateWidgetProps {
  name: string;
  currentTemp: number;
  targetTemp?: number;
  humidity?: number;
  mode?: "heating" | "cooling" | "auto" | "off";
  entityId?: string;
  /** Backwards-compatible prop name stored in widget config */
  entity_id?: string;
}

export const ClimateWidget = ({
  name,
  currentTemp: initialCurrentTemp,
  targetTemp: initialTarget = 22,
  humidity: initialHumidity = 45,
  mode: initialMode = "auto",
  entityId,
  entity_id,
}: ClimateWidgetProps) => {
  const [localTargetTemp, setLocalTargetTemp] = useState(initialTarget);
  const [localMode, setLocalMode] = useState(initialMode);
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;

  // Get live state from Home Assistant
  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  const haCurrentTemp = entity?.attributes?.current_temperature as number | undefined;
  const haTargetTemp = entity?.attributes?.temperature as number | undefined;
  const haHumidity = entity?.attributes?.current_humidity as number | undefined;
  const haMode = entity?.state as "heating" | "cooling" | "auto" | "off" | undefined;

  // Use HA state if connected and entity exists, otherwise fall back to props/local state
  const currentTemp = resolvedEntityId && isConnected && entity && haCurrentTemp !== undefined
    ? haCurrentTemp
    : initialCurrentTemp;
  const targetTemp = resolvedEntityId && isConnected && entity && haTargetTemp !== undefined
    ? haTargetTemp
    : localTargetTemp;
  const humidity = resolvedEntityId && isConnected && entity && haHumidity !== undefined
    ? haHumidity
    : initialHumidity;
  const mode = resolvedEntityId && isConnected && entity && haMode
    ? haMode
    : localMode;

  const isActive = mode !== "off";
  const minDim = Math.min(cols, rows);

  // Calculate dynamic sizes
  const iconSize = minDim >= 3 ? "w-10 h-10" : isLarge ? "w-7 h-7" : isWide || isTall ? "w-6 h-6" : "w-5 h-5";
  const iconPadding = minDim >= 3 ? "p-4" : isLarge ? "p-3" : "p-2";
  const tempSize = minDim >= 4 ? "text-7xl" : minDim >= 3 ? "text-6xl" : isLarge ? "text-5xl" : isTall ? "text-4xl" : isWide ? "text-3xl" : "text-2xl";
  const targetSize = minDim >= 3 ? "text-4xl" : isLarge ? "text-3xl" : isWide ? "text-xl" : "text-2xl";
  const titleSize = minDim >= 3 ? "text-xl" : isLarge ? "text-lg" : "text-sm";

  const incrementTemp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTemp = Math.min(targetTemp + 0.5, 30);
    if (resolvedEntityId && isConnected) {
      await callService("climate", "set_temperature", resolvedEntityId, {
        temperature: newTemp
      });
    } else {
      setLocalTargetTemp(newTemp);
    }
  };

  const decrementTemp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTemp = Math.max(targetTemp - 0.5, 16);
    if (resolvedEntityId && isConnected) {
      await callService("climate", "set_temperature", resolvedEntityId, {
        temperature: newTemp
      });
    } else {
      setLocalTargetTemp(newTemp);
    }
  };

  const handleModeChange = async (newMode: "heating" | "cooling" | "auto" | "off") => {
    if (resolvedEntityId && isConnected) {
      // Map our mode names to HA hvac_mode names
      const hvacMode = newMode === "heating" ? "heat" 
        : newMode === "cooling" ? "cool" 
        : newMode;
      await callService("climate", "set_hvac_mode", resolvedEntityId, {
        hvac_mode: hvacMode
      });
    } else {
      setLocalMode(newMode);
    }
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

  // Wide layout (not tall)
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
                "rounded-xl transition-colors duration-300",
                iconPadding,
                isActive ? "bg-primary/20" : "bg-secondary"
              )}
            >
              <Thermometer className={cn(iconSize, getModeColor())} />
            </div>
            <div>
              <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
              <p className={cn("text-muted-foreground capitalize", minDim >= 3 ? "text-base" : "text-xs")}>{mode}</p>
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
            <p className={cn("font-light text-foreground", tempSize)}>{currentTemp}°</p>
            <p className={cn("text-muted-foreground", minDim >= 3 ? "text-base" : "text-xs")}>Current</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={decrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronDown className={cn("text-muted-foreground", minDim >= 3 ? "w-6 h-6" : "w-4 h-4")} />
            </button>
            <div className="text-center min-w-[50px]">
              <p className={cn("font-medium", getModeColor(), targetSize)}>{targetTemp}°</p>
              <p className={cn("text-muted-foreground", minDim >= 3 ? "text-base" : "text-xs")}>Target</p>
            </div>
            <button
              onClick={incrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronUp className={cn("text-muted-foreground", minDim >= 3 ? "w-6 h-6" : "w-4 h-4")} />
            </button>
          </div>

          <div className={cn("flex items-center gap-2 text-muted-foreground", minDim >= 3 ? "text-lg" : "text-sm")}>
            <Droplets className={minDim >= 3 ? "w-5 h-5" : "w-4 h-4"} />
            <span>{humidity}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Large or Tall layout with full controls
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
              "rounded-xl transition-colors duration-300",
              iconPadding,
              isActive ? "bg-primary/20" : "bg-secondary"
            )}
          >
            <Thermometer className={cn(getModeColor(), iconSize)} />
          </div>
          <div>
            <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
            <p className={cn("text-muted-foreground capitalize", minDim >= 3 ? "text-base" : "text-sm")}>{mode}</p>
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
            <p className={cn("font-light text-foreground", tempSize)}>
              {currentTemp}°
            </p>
            <p className={cn("text-muted-foreground mt-1", minDim >= 3 ? "text-base" : "text-xs")}>Current</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={incrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronUp className={cn("text-muted-foreground", minDim >= 3 ? "w-7 h-7" : "w-5 h-5")} />
            </button>
            <div className="text-center">
              <p className={cn("font-medium", getModeColor(), targetSize)}>
                {targetTemp}°
              </p>
              <p className={cn("text-muted-foreground", minDim >= 3 ? "text-base" : "text-xs")}>Target</p>
            </div>
            <button
              onClick={decrementTemp}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronDown className={cn("text-muted-foreground", minDim >= 3 ? "w-7 h-7" : "w-5 h-5")} />
            </button>
          </div>
        </div>

        <div className={cn("flex flex-col gap-3", minDim >= 3 && "gap-4")}>
          <div className={cn("flex items-center gap-2 text-muted-foreground", minDim >= 3 ? "text-lg" : "text-sm")}>
            <Droplets className={minDim >= 3 ? "w-5 h-5" : "w-4 h-4"} />
            <span>{humidity}%</span>
          </div>
          <div className={cn("flex items-center gap-2 text-muted-foreground", minDim >= 3 ? "text-lg" : "text-sm")}>
            <Wind className={minDim >= 3 ? "w-5 h-5" : "w-4 h-4"} />
            <span>Auto</span>
          </div>
        </div>
      </div>

      <div className={cn("flex gap-2 mt-auto pt-4", minDim >= 3 && "gap-3 pt-6")}>
        {(["off", "heating", "cooling", "auto"] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg font-medium transition-colors capitalize",
              minDim >= 3 ? "text-base py-3" : "text-xs",
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
