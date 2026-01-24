import { useState, useCallback, useRef } from "react";
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

const MIN_TEMP = 16;
const MAX_TEMP = 30;

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
  const sliderRef = useRef<HTMLDivElement>(null);
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
    await setTemperature(targetTemp + 1);
  };

  const decrementTemp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await setTemperature(targetTemp - 1);
  };

  // Calculate slider position (0 to 1)
  const sliderProgress = (targetTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);

  const handleSliderPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const progress = Math.max(0, Math.min(1, x / rect.width));
      const newTemp = Math.round(MIN_TEMP + progress * (MAX_TEMP - MIN_TEMP));
      setLocalTargetTemp(newTemp);
    }
  }, []);

  const handleSliderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.stopPropagation();
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    const newTemp = Math.round(MIN_TEMP + progress * (MAX_TEMP - MIN_TEMP));
    if (newTemp !== localTargetTemp) {
      setLocalTargetTemp(newTemp);
    }
  }, [localTargetTemp]);

  const handleSliderPointerUp = useCallback(async (e: React.PointerEvent) => {
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

  // Amber/gold glow color
  const glowColor = "hsl(40, 95%, 55%)";
  const glowColorDim = "hsl(40, 80%, 45%)";

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
      <div 
        className="h-full flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, hsl(220 8% 18%) 0%, hsl(220 8% 10%) 100%)`,
          borderRadius: '12px',
        }}
      >
        <p className="text-xs text-muted-foreground mb-1 capitalize">{mode}</p>
        <p className="text-2xl font-light" style={{ color: isActive ? glowColor : 'hsl(var(--muted-foreground))' }}>
          {Math.round(targetTemp)}°
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate max-w-full px-2">{name}</p>
      </div>
    );
  }

  const showFullLayout = rows >= 2 && cols >= 2;
  const showSlider = cols >= 2;

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden select-none"
      style={{
        background: `
          linear-gradient(145deg, 
            hsl(220 10% 20%) 0%, 
            hsl(220 10% 14%) 30%,
            hsl(220 10% 10%) 100%
          )
        `,
        borderRadius: '16px',
        boxShadow: `
          inset 0 1px 0 0 hsl(220 10% 28% / 0.4),
          inset 0 -1px 0 0 hsl(0 0% 0% / 0.5),
          0 8px 32px -4px hsl(0 0% 0% / 0.7)
        `,
      }}
    >
      {/* Header with AC label */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          {name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">AC</span>
          <div className="flex flex-col gap-0.5">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </div>

      {/* Main display area - octagonal frame */}
      <div className="flex-1 flex flex-col px-3 pb-2" style={{ minHeight: 0 }}>
        <div
          className="flex-1 relative"
          style={{
            background: `
              linear-gradient(145deg, 
                hsl(220 12% 22%) 0%,
                hsl(220 12% 16%) 30%,
                hsl(220 12% 12%) 100%
              )
            `,
            borderRadius: '12px',
            clipPath: 'polygon(8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%, 0% 8%)',
            boxShadow: `
              inset 0 2px 4px 0 hsl(220 10% 30% / 0.3),
              inset 0 -2px 4px 0 hsl(0 0% 0% / 0.4)
            `,
          }}
        >
          {/* Inner display screen */}
          <div
            className="absolute flex flex-col items-center justify-center"
            style={{
              top: '8%',
              left: '8%',
              right: '8%',
              bottom: '8%',
              background: `
                radial-gradient(ellipse at 50% 30%, 
                  hsl(35 40% 12% / ${isActive ? 0.8 : 0}) 0%,
                  hsl(220 15% 8%) 70%,
                  hsl(220 15% 6%) 100%
                )
              `,
              borderRadius: '8px',
              clipPath: 'polygon(6% 0%, 94% 0%, 100% 6%, 100% 94%, 94% 100%, 6% 100%, 0% 94%, 0% 6%)',
              boxShadow: isActive ? `
                inset 0 0 40px 0 hsl(35 60% 40% / 0.15),
                inset 0 0 80px 0 hsl(35 60% 30% / 0.1)
              ` : `
                inset 0 4px 12px 0 hsl(0 0% 0% / 0.5)
              `,
            }}
          >
            {/* Top glowing bar */}
            {isActive && (
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: '12%',
                  width: '60%',
                  height: '3px',
                  background: `linear-gradient(90deg, transparent 0%, ${glowColor} 20%, ${glowColor} 80%, transparent 100%)`,
                  borderRadius: '2px',
                  boxShadow: `0 0 12px 2px ${glowColor}80, 0 0 24px 4px ${glowColor}40`,
                }}
              />
            )}

            {/* Mode label */}
            <span
              className="text-sm font-medium tracking-wide mt-4"
              style={{ 
                color: isActive ? glowColor : 'hsl(var(--muted-foreground))',
                textShadow: isActive ? `0 0 12px ${glowColor}80` : 'none',
              }}
            >
              {getModeLabel()}
            </span>

            {/* Temperature display */}
            <div className="flex items-start justify-center mt-1">
              <span
                className="font-light leading-none"
                style={{ 
                  fontSize: showFullLayout ? '3.5rem' : '2.5rem',
                  color: isActive ? glowColor : 'hsl(var(--muted-foreground))',
                  textShadow: isActive ? `0 0 20px ${glowColor}60, 0 0 40px ${glowColor}30` : 'none',
                }}
              >
                {Math.round(targetTemp)}
              </span>
              <span
                className="font-light mt-1"
                style={{ 
                  fontSize: showFullLayout ? '1.25rem' : '1rem',
                  color: isActive ? glowColorDim : 'hsl(var(--muted-foreground))',
                }}
              >
                °C
              </span>
            </div>
          </div>
        </div>

        {/* Temperature slider bar with +/- buttons */}
        {showSlider && (
          <div className="flex items-center gap-2 mt-2">
            {/* Minus button */}
            <button
              onClick={decrementTemp}
              className="flex items-center justify-center transition-all active:scale-95"
              style={{
                width: '36px',
                height: '28px',
                background: `linear-gradient(145deg, hsl(220 10% 18%) 0%, hsl(220 10% 12%) 100%)`,
                borderRadius: '6px',
                boxShadow: `
                  inset 0 1px 1px 0 hsl(220 10% 26% / 0.3),
                  inset 0 -1px 1px 0 hsl(0 0% 0% / 0.3),
                  0 2px 4px -1px hsl(0 0% 0% / 0.4)
                `,
              }}
            >
              <Minus className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Slider track */}
            <div
              ref={sliderRef}
              className="flex-1 relative cursor-pointer touch-none"
              style={{
                height: '20px',
                background: `linear-gradient(180deg, hsl(220 10% 8%) 0%, hsl(220 10% 12%) 100%)`,
                borderRadius: '10px',
                boxShadow: `
                  inset 0 2px 4px 0 hsl(0 0% 0% / 0.5),
                  0 1px 0 0 hsl(220 10% 20% / 0.2)
                `,
              }}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerUp}
              onPointerCancel={handleSliderPointerUp}
            >
              {/* Active fill */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-1"
                style={{
                  width: `calc(${sliderProgress * 100}% - 8px)`,
                  height: '10px',
                  background: isActive 
                    ? `linear-gradient(90deg, ${glowColorDim} 0%, ${glowColor} 100%)`
                    : 'hsl(220 10% 25%)',
                  borderRadius: '5px',
                  boxShadow: isActive ? `0 0 8px 1px ${glowColor}60` : 'none',
                  transition: isDragging.current ? 'none' : 'width 0.15s ease-out',
                }}
              />

              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  left: `calc(${sliderProgress * 100}% - 10px)`,
                  width: '20px',
                  height: '20px',
                  background: isActive
                    ? `radial-gradient(circle at 40% 40%, hsl(45 100% 75%) 0%, ${glowColor} 100%)`
                    : 'hsl(220 10% 30%)',
                  borderRadius: '50%',
                  boxShadow: isActive 
                    ? `0 0 12px 3px ${glowColor}80, 0 2px 4px 0 hsl(0 0% 0% / 0.3)`
                    : '0 2px 4px 0 hsl(0 0% 0% / 0.3)',
                  transition: isDragging.current ? 'none' : 'left 0.15s ease-out',
                }}
              />
            </div>

            {/* Plus button */}
            <button
              onClick={incrementTemp}
              className="flex items-center justify-center transition-all active:scale-95"
              style={{
                width: '36px',
                height: '28px',
                background: `linear-gradient(145deg, hsl(220 10% 18%) 0%, hsl(220 10% 12%) 100%)`,
                borderRadius: '6px',
                boxShadow: `
                  inset 0 1px 1px 0 hsl(220 10% 26% / 0.3),
                  inset 0 -1px 1px 0 hsl(0 0% 0% / 0.3),
                  0 2px 4px -1px hsl(0 0% 0% / 0.4)
                `,
              }}
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Mode toggle buttons */}
      {showFullLayout && (
        <div
          className="mx-3 mb-3 flex items-center rounded-lg overflow-hidden"
          style={{
            background: `linear-gradient(180deg, hsl(220 10% 10%) 0%, hsl(220 10% 8%) 100%)`,
            boxShadow: `
              inset 0 1px 2px 0 hsl(0 0% 0% / 0.4),
              0 1px 0 0 hsl(220 10% 18% / 0.2)
            `,
          }}
        >
          {MODE_CONFIG.map(({ mode: m, icon: Icon, label }, index) => {
            const isSelected = mode === m;
            return (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  setMode(m);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center py-3 transition-all relative",
                  index > 0 && "border-l border-white/5"
                )}
                style={{
                  background: isSelected 
                    ? `linear-gradient(180deg, hsl(220 10% 14%) 0%, hsl(220 10% 10%) 100%)`
                    : 'transparent',
                }}
                title={label}
              >
                {/* Illumination glow behind icon when selected */}
                {isSelected && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${glowColor}25 0%, transparent 70%)`,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-all",
                  )}
                  style={{
                    color: isSelected ? glowColor : 'hsl(var(--muted-foreground))',
                    filter: isSelected ? `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 12px ${glowColor}80)` : 'none',
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Auto dropdown bar (shown on larger widgets) */}
      {rows >= 3 && cols >= 2 && (
        <div
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: `linear-gradient(180deg, hsl(220 10% 12%) 0%, hsl(220 10% 8%) 100%)`,
            boxShadow: `
              inset 0 1px 2px 0 hsl(0 0% 0% / 0.3),
              0 1px 0 0 hsl(220 10% 18% / 0.15)
            `,
          }}
        >
          <Fan className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground flex-1">Auto</span>
          <svg 
            className="w-3 h-3 text-muted-foreground" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  );
};
