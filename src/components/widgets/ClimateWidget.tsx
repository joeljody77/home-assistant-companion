import { useState, useMemo, useRef, useCallback } from "react";
import { Minus, Plus, Power, Snowflake, Flame, Fan, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

interface ClimateWidgetProps {
  name: string;
  currentTemp: number;
  targetTemp?: number;
  humidity?: number;
  mode?: "heating" | "cooling" | "auto" | "off" | "fan_only" | "dry";
  entityId?: string;
  entity_id?: string;
}

// Arc configuration
const ARC_START_ANGLE = 135;
const ARC_END_ANGLE = 405;
const ARC_RANGE = ARC_END_ANGLE - ARC_START_ANGLE;
const MIN_TEMP = 16;
const MAX_TEMP = 30;

const tempToAngle = (temp: number): number => {
  const normalized = (temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);
  return ARC_START_ANGLE + normalized * ARC_RANGE;
};

const angleToTemp = (angle: number): number => {
  const normalized = (angle - ARC_START_ANGLE) / ARC_RANGE;
  const clamped = Math.max(0, Math.min(1, normalized));
  return MIN_TEMP + clamped * (MAX_TEMP - MIN_TEMP);
};

const angleToPosition = (angle: number, radius: number, cx: number, cy: number) => {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
};

const positionToAngle = (x: number, y: number, cx: number, cy: number): number => {
  const dx = x - cx;
  const dy = y - cy;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  return angle;
};

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

type ClimateMode = "off" | "cooling" | "heating" | "fan_only" | "dry" | "auto";

const MODE_CONFIG: { mode: ClimateMode; icon: typeof Power; label: string }[] = [
  { mode: "off", icon: Power, label: "Off" },
  { mode: "cooling", icon: Snowflake, label: "Cool" },
  { mode: "heating", icon: Flame, label: "Heat" },
  { mode: "fan_only", icon: Fan, label: "Fan" },
  { mode: "dry", icon: Droplets, label: "Dry" },
];

export const ClimateWidget = ({
  name,
  currentTemp: initialCurrentTemp,
  targetTemp: initialTarget = 22,
  humidity: initialHumidity = 45,
  mode: initialMode = "cooling",
  entityId,
  entity_id,
}: ClimateWidgetProps) => {
  const [localTargetTemp, setLocalTargetTemp] = useState(initialTarget);
  const [localMode, setLocalMode] = useState<ClimateMode>(initialMode);
  const { cols, rows, isCompact } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  const haCurrentTemp = entity?.attributes?.current_temperature as number | undefined;
  const haTargetTemp = entity?.attributes?.temperature as number | undefined;
  const haHumidity = entity?.attributes?.current_humidity as number | undefined;
  const haMode = entity?.state as ClimateMode | undefined;

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

  const svgSize = 200;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const strokeWidth = 14;
  const radius = (svgSize - strokeWidth * 2) / 2 - 10;
  
  const targetAngle = tempToAngle(targetTemp);
  const thumbPos = angleToPosition(targetAngle, radius, cx, cy);
  const backgroundArc = describeArc(cx, cy, radius, ARC_START_ANGLE, ARC_END_ANGLE);
  const activeArc = describeArc(cx, cy, radius, ARC_START_ANGLE, targetAngle);

  const setTemperature = useCallback(async (newTemp: number) => {
    const clampedTemp = Math.max(MIN_TEMP, Math.min(MAX_TEMP, newTemp));
    if (resolvedEntityId && isConnected) {
      await callService("climate", "set_temperature", resolvedEntityId, {
        temperature: clampedTemp
      });
    } else {
      setLocalTargetTemp(clampedTemp);
    }
  }, [resolvedEntityId, isConnected, callService]);

  const setMode = useCallback(async (newMode: ClimateMode) => {
    if (resolvedEntityId && isConnected) {
      await callService("climate", "set_hvac_mode", resolvedEntityId, {
        hvac_mode: newMode
      });
    } else {
      setLocalMode(newMode);
    }
  }, [resolvedEntityId, isConnected, callService]);

  const incrementTemp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await setTemperature(targetTemp + 0.5);
  };

  const decrementTemp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await setTemperature(targetTemp - 0.5);
  };

  const getPointerAngle = useCallback((clientX: number, clientY: number): number => {
    if (!svgRef.current) return targetAngle;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = svgSize / rect.width;
    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;
    return positionToAngle(x, y, cx, cy);
  }, [targetAngle, cx, cy, svgSize]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    
    let angle = getPointerAngle(e.clientX, e.clientY);
    if (angle < ARC_START_ANGLE && angle < 90) {
      angle += 360;
    }
    if (angle >= ARC_START_ANGLE && angle <= ARC_END_ANGLE) {
      const newTemp = angleToTemp(angle);
      const roundedTemp = Math.round(newTemp * 2) / 2;
      if (roundedTemp !== targetTemp) {
        setLocalTargetTemp(roundedTemp);
      }
    }
  }, [getPointerAngle, targetTemp]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    if (resolvedEntityId && isConnected) {
      await callService("climate", "set_temperature", resolvedEntityId, {
        temperature: localTargetTemp
      });
    }
  }, [resolvedEntityId, isConnected, callService, localTargetTemp]);

  // Amber/orange glow color like the reference image
  const glowColor = "hsl(35, 95%, 55%)";
  const activeColor = isActive ? glowColor : "hsl(var(--muted-foreground))";

  const getModeLabel = () => {
    switch (mode) {
      case "heating": return "Heating";
      case "cooling": return "Cooling";
      case "fan_only": return "Fan";
      case "dry": return "Dry";
      case "auto": return "Auto";
      default: return "Off";
    }
  };

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <div className="widget-card h-full flex flex-col items-center justify-center relative overflow-hidden">
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

  const arcScale = minDim >= 3 ? 0.85 : minDim >= 2 ? 0.65 : 0.5;
  const tempFontSize = minDim >= 3 ? "text-4xl" : minDim >= 2 ? "text-3xl" : "text-2xl";
  const showModeButtons = rows >= 2 && cols >= 2;
  const showPlusMinus = minDim >= 2;

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        background: `
          linear-gradient(145deg, 
            hsl(220 15% 18%) 0%, 
            hsl(220 15% 12%) 50%,
            hsl(220 15% 8%) 100%
          )
        `,
        borderRadius: '16px',
        boxShadow: `
          inset 0 1px 0 0 hsl(220 15% 25% / 0.4),
          inset 0 -1px 0 0 hsl(220 15% 5% / 0.6),
          0 8px 32px -4px hsl(0 0% 0% / 0.6),
          0 4px 16px -2px hsl(0 0% 0% / 0.4)
        `,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {name}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>
      </div>

      {/* Main dial area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-2" style={{ minHeight: 0 }}>
        <div
          className="relative"
          style={{
            width: `${svgSize * arcScale}px`,
            height: `${svgSize * arcScale}px`,
          }}
        >
          {/* Outer metallic bezel */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                linear-gradient(145deg, 
                  hsl(220 10% 28%) 0%,
                  hsl(220 10% 18%) 30%,
                  hsl(220 10% 12%) 70%,
                  hsl(220 10% 22%) 100%
                )
              `,
              boxShadow: `
                inset 0 2px 4px 0 hsl(220 10% 35% / 0.3),
                inset 0 -2px 4px 0 hsl(0 0% 0% / 0.4),
                0 4px 16px -2px hsl(0 0% 0% / 0.5)
              `,
            }}
          />

          {/* Inner recessed dial */}
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              top: '12%',
              left: '12%',
              right: '12%',
              bottom: '12%',
              background: `
                radial-gradient(ellipse at 30% 30%, 
                  hsl(220 15% 16%) 0%,
                  hsl(220 15% 10%) 60%,
                  hsl(220 15% 8%) 100%
                )
              `,
              boxShadow: `
                inset 0 4px 12px 0 hsl(0 0% 0% / 0.6),
                inset 0 -2px 8px 0 hsl(220 10% 20% / 0.2)
              `,
            }}
          >
            {/* Center content */}
            <div className="flex flex-col items-center justify-center">
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: activeColor }}
              >
                {getModeLabel()}
              </span>
              <div className="flex items-baseline mt-1">
                <span
                  className={cn("font-light", tempFontSize)}
                  style={{ color: activeColor }}
                >
                  {Math.round(targetTemp)}
                </span>
                <span
                  className="text-lg font-light ml-0.5"
                  style={{ color: activeColor }}
                >
                  °C
                </span>
              </div>
            </div>
          </div>

          {/* SVG Arc overlay */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ overflow: 'visible' }}
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(40, 100%, 60%)" />
                <stop offset="50%" stopColor="hsl(35, 95%, 55%)" />
                <stop offset="100%" stopColor="hsl(30, 90%, 50%)" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background arc (dark groove) */}
            <path
              d={backgroundArc}
              fill="none"
              stroke="hsl(220 10% 8%)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(inset 0 2px 4px hsl(0 0% 0% / 0.5))',
              }}
            />

            {/* Active arc with glow */}
            {isActive && (
              <>
                {/* Glow layer */}
                <path
                  d={activeArc}
                  fill="none"
                  stroke={glowColor}
                  strokeWidth={strokeWidth + 8}
                  strokeLinecap="round"
                  opacity={0.4}
                  style={{ filter: 'blur(8px)' }}
                />
                {/* Main arc */}
                <path
                  d={activeArc}
                  fill="none"
                  stroke="url(#arcGlow)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              </>
            )}

            {/* Thumb indicator (glowing dot) */}
            {isActive && (
              <>
                {/* Outer glow */}
                <circle
                  cx={thumbPos.x}
                  cy={thumbPos.y}
                  r={14}
                  fill={glowColor}
                  opacity={0.5}
                  style={{ filter: 'blur(6px)' }}
                />
                {/* Inner bright dot */}
                <circle
                  cx={thumbPos.x}
                  cy={thumbPos.y}
                  r={8}
                  fill="hsl(45, 100%, 75%)"
                  className="cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </>
            )}
          </svg>

          {/* Plus/Minus buttons inside the dial */}
          {showPlusMinus && (
            <div
              className="absolute flex items-center justify-center gap-6"
              style={{
                bottom: '18%',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <button
                onClick={decrementTemp}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: `
                    linear-gradient(145deg, 
                      hsl(220 10% 20%) 0%,
                      hsl(220 10% 14%) 100%
                    )
                  `,
                  boxShadow: `
                    inset 0 1px 2px 0 hsl(220 10% 28% / 0.3),
                    inset 0 -1px 2px 0 hsl(0 0% 0% / 0.3),
                    0 2px 6px -1px hsl(0 0% 0% / 0.4)
                  `,
                }}
              >
                <Minus className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={incrementTemp}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: `
                    linear-gradient(145deg, 
                      hsl(220 10% 20%) 0%,
                      hsl(220 10% 14%) 100%
                    )
                  `,
                  boxShadow: `
                    inset 0 1px 2px 0 hsl(220 10% 28% / 0.3),
                    inset 0 -1px 2px 0 hsl(0 0% 0% / 0.3),
                    0 2px 6px -1px hsl(0 0% 0% / 0.4)
                  `,
                }}
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mode toggle buttons */}
      {showModeButtons && (
        <div
          className="mx-3 mb-3 flex items-center justify-between rounded-lg p-1"
          style={{
            background: `
              linear-gradient(145deg, 
                hsl(220 10% 12%) 0%,
                hsl(220 10% 8%) 100%
              )
            `,
            boxShadow: `
              inset 0 1px 3px 0 hsl(0 0% 0% / 0.4),
              0 1px 0 0 hsl(220 10% 20% / 0.2)
            `,
          }}
        >
          {MODE_CONFIG.map(({ mode: m, icon: Icon, label }) => {
            const isSelected = mode === m;
            return (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  setMode(m);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center py-2.5 rounded-md transition-all",
                  isSelected ? "relative" : "hover:bg-white/5"
                )}
                style={
                  isSelected
                    ? {
                        background: `
                          linear-gradient(145deg, 
                            hsl(220 10% 18%) 0%,
                            hsl(220 10% 14%) 100%
                          )
                        `,
                        boxShadow: `
                          inset 0 1px 2px 0 hsl(220 10% 25% / 0.3),
                          0 2px 8px -2px hsl(0 0% 0% / 0.4),
                          0 0 12px 0 ${glowColor}40
                        `,
                      }
                    : undefined
                }
                title={label}
              >
                <Icon
                  className="w-4 h-4"
                  style={{
                    color: isSelected ? glowColor : 'hsl(var(--muted-foreground))',
                    filter: isSelected ? `drop-shadow(0 0 4px ${glowColor})` : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
