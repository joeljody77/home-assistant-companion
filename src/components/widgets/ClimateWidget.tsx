import { useState, useMemo } from "react";
import { Minus, Plus, Droplets } from "lucide-react";
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

// Arc configuration
const ARC_START_ANGLE = 135; // degrees from top (left side)
const ARC_END_ANGLE = 405; // degrees from top (right side, wraps around)
const ARC_RANGE = ARC_END_ANGLE - ARC_START_ANGLE; // 270 degrees total
const MIN_TEMP = 16;
const MAX_TEMP = 30;

// Convert temperature to angle on the arc
const tempToAngle = (temp: number): number => {
  const normalized = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  return ARC_START_ANGLE + normalized * ARC_RANGE;
};

// Convert angle to position on circle
const angleToPosition = (angle: number, radius: number, cx: number, cy: number) => {
  const radians = (angle - 90) * (Math.PI / 180); // -90 to start from top
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

// Create SVG arc path
const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = angleToPosition(startAngle, radius, cx, cy);
  const end = angleToPosition(endAngle, radius, cx, cy);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

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

  const incrementTemp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTemp = Math.min(targetTemp + 0.5, MAX_TEMP);
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
    const newTemp = Math.max(targetTemp - 0.5, MIN_TEMP);
    if (resolvedEntityId && isConnected) {
      await callService("climate", "set_temperature", resolvedEntityId, {
        temperature: newTemp
      });
    } else {
      setLocalTargetTemp(newTemp);
    }
  };

  // Get mode color (HSL values from design system)
  const getModeColor = useMemo(() => {
    switch (mode) {
      case "heating":
        return "hsl(24, 95%, 55%)"; // orange
      case "cooling":
        return "hsl(199, 89%, 48%)"; // bright blue like reference
      case "auto":
        return "hsl(var(--primary))";
      default:
        return "hsl(var(--muted-foreground))";
    }
  }, [mode]);

  const getModeLabel = () => {
    switch (mode) {
      case "heating": return "Heating";
      case "cooling": return "Cooling";
      case "auto": return "Auto";
      default: return "Off";
    }
  };

  // SVG arc calculations
  const svgSize = 200;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const strokeWidth = 12;
  const radius = (svgSize - strokeWidth * 2) / 2 - 8;
  
  const targetAngle = tempToAngle(targetTemp);
  const thumbPos = angleToPosition(targetAngle, radius, cx, cy);

  // Background arc (full range)
  const backgroundArc = describeArc(cx, cy, radius, ARC_START_ANGLE, ARC_END_ANGLE);
  
  // Active arc (from start to current target)
  const activeArc = describeArc(cx, cy, radius, ARC_START_ANGLE, targetAngle);

  // Compact 1x1 layout - simplified version
  if (isCompact) {
    return (
      <div
        className={cn(
          "widget-card h-full flex flex-col items-center justify-center relative overflow-hidden"
        )}
      >
        <p className="text-xs text-muted-foreground mb-1 capitalize">{mode}</p>
        <p className="text-2xl font-light text-foreground">{Math.round(targetTemp)}°</p>
        <p className="text-xs text-muted-foreground mt-1 truncate max-w-full px-2">{name}</p>
        <div
          className={cn(
            "absolute top-2 right-2 status-indicator",
            isActive ? "status-online" : "status-offline"
          )}
        />
      </div>
    );
  }

  // Calculate sizing based on widget dimensions
  const arcScale = minDim >= 3 ? 1 : minDim >= 2 ? 0.7 : 0.5;
  const tempFontSize = minDim >= 3 ? "text-5xl" : minDim >= 2 ? "text-4xl" : "text-3xl";
  const modeFontSize = minDim >= 3 ? "text-lg" : "text-sm";
  const buttonSize = minDim >= 3 ? "w-12 h-12" : "w-10 h-10";
  const buttonIconSize = minDim >= 3 ? "w-6 h-6" : "w-5 h-5";

  return (
    <div
      className={cn(
        "widget-card h-full flex flex-col items-center justify-between py-4 relative overflow-hidden"
      )}
    >
      {/* Title */}
      <h3 className="text-sm font-medium text-muted-foreground truncate max-w-full px-4">
        {name}
      </h3>

      {/* Status indicator */}
      <div
        className={cn(
          "absolute top-3 right-3 status-indicator",
          isActive ? "status-online" : "status-offline"
        )}
      />

      {/* Circular Arc Dial */}
      <div 
        className="relative flex-1 flex items-center justify-center w-full"
        style={{ minHeight: 0 }}
      >
        <div 
          className="relative"
          style={{ 
            width: `${svgSize * arcScale}px`, 
            height: `${svgSize * arcScale}px` 
          }}
        >
          <svg
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            {/* Background arc */}
            <path
              d={backgroundArc}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Active arc */}
            {isActive && (
              <path
                d={activeArc}
                fill="none"
                stroke={getModeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 8px ${getModeColor})`,
                }}
              />
            )}
            
            {/* Thumb/handle */}
            <circle
              cx={thumbPos.x}
              cy={thumbPos.y}
              r={8}
              fill="hsl(var(--background))"
              stroke={isActive ? getModeColor : "hsl(var(--muted-foreground))"}
              strokeWidth={3}
              style={{
                filter: isActive ? `drop-shadow(0 0 4px ${getModeColor})` : undefined,
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span 
              className={cn("font-medium capitalize", modeFontSize)}
              style={{ color: getModeColor }}
            >
              {getModeLabel()}
            </span>
            <div className="flex items-baseline">
              <span className={cn("font-light text-foreground", tempFontSize)}>
                {Math.round(targetTemp)}
              </span>
              <span className={cn(
                "font-light text-foreground",
                minDim >= 3 ? "text-2xl" : "text-xl"
              )}>
                °C
              </span>
            </div>
            {humidity !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <Droplets className="w-3 h-3" />
                <span className="text-xs">{humidity}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plus/Minus buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={decrementTemp}
          className={cn(
            "rounded-full bg-secondary/80 flex items-center justify-center transition-all",
            "hover:bg-secondary active:scale-95",
            buttonSize
          )}
        >
          <Minus className={cn("text-muted-foreground", buttonIconSize)} />
        </button>
        <button
          onClick={incrementTemp}
          className={cn(
            "rounded-full bg-secondary/80 flex items-center justify-center transition-all",
            "hover:bg-secondary active:scale-95",
            buttonSize
          )}
        >
          <Plus className={cn("text-muted-foreground", buttonIconSize)} />
        </button>
      </div>
    </div>
  );
};
