import { useState, useCallback } from "react";
import { Minus, Plus, Power, Snowflake, Flame, Fan, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

interface ClimateWidgetProps {
  name: string;
  currentTemp: number;
  targetTemp?: number;
  humidity?: number;
  mode?: "heat" | "cool" | "auto" | "off" | "fan_only" | "dry";
  entityId?: string;
  entity_id?: string;
}

const MIN_TEMP = 16;
const MAX_TEMP = 30;

type ClimateMode = "off" | "cool" | "heat" | "fan_only" | "dry" | "auto";
type FanSpeed = "auto" | "high" | "medium" | "low";

const MODE_CONFIG: { mode: ClimateMode; icon: typeof Power; label: string }[] = [
  { mode: "off", icon: Power, label: "Off" },
  { mode: "cool", icon: Snowflake, label: "Cool" },
  { mode: "heat", icon: Flame, label: "Heat" },
  { mode: "fan_only", icon: Fan, label: "Fan" },
  { mode: "dry", icon: Droplets, label: "Dry" },
];

const FAN_SPEED_CONFIG: { speed: FanSpeed; label: string }[] = [
  { speed: "auto", label: "Auto" },
  { speed: "high", label: "High" },
  { speed: "medium", label: "Med" },
  { speed: "low", label: "Low" },
];

export const ClimateWidget = ({
  name,
  currentTemp: initialCurrentTemp,
  targetTemp: initialTarget = 22,
  humidity: initialHumidity = 45,
  mode: initialMode = "cool",
  entityId,
  entity_id,
}: ClimateWidgetProps) => {
  const [localTargetTemp, setLocalTargetTemp] = useState(initialTarget);
  const [localMode, setLocalMode] = useState<ClimateMode>(initialMode);
  const [localFanSpeed, setLocalFanSpeed] = useState<FanSpeed>("auto");
  const { cols, rows, isCompact } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;

  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  const haCurrentTemp = entity?.attributes?.current_temperature as number | undefined;
  const haTargetTemp = entity?.attributes?.temperature as number | undefined;
  const haHumidity = entity?.attributes?.current_humidity as number | undefined;
  const haMode = entity?.state as ClimateMode | undefined;
  const haFanMode = entity?.attributes?.fan_mode as FanSpeed | undefined;

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
  const fanSpeed = resolvedEntityId && isConnected && entity && haFanMode
    ? haFanMode
    : localFanSpeed;

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

  const setFanSpeed = useCallback(async (newSpeed: FanSpeed) => {
    if (resolvedEntityId && isConnected) {
      await callService("climate", "set_fan_mode", resolvedEntityId, {
        fan_mode: newSpeed
      });
    } else {
      setLocalFanSpeed(newSpeed);
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


  // Dashboard accent color for text/elements
  const accentColor = "hsl(32 95% 55%)"; // Orange accent matching dashboard theme
  const accentColorDim = "hsl(32 80% 45%)";

  // Mode-specific colors for glow effects only (returned as HSL parts so we can apply / alpha)
  const getModeGlowHsl = (): string => {
    switch (mode) {
      case "cool":
        return "200 95% 55%"; // Blue glow
      case "heat":
        return "25 95% 55%"; // Orange glow
      case "fan_only":
        return "145 85% 50%"; // Green glow
      case "dry":
        return "45 95% 55%"; // Yellow glow
      case "auto":
        return "280 85% 60%"; // Purple glow
      default:
        return "220 20% 50%"; // Gray glow for off
    }
  };

  const glowHsl = getModeGlowHsl();
  const glowColor = `hsl(${glowHsl})`;
  const glow = (alpha: number) => `hsl(${glowHsl} / ${alpha})`;

  const getModeLabel = () => {
    switch (mode) {
      case "heat": return "Heating";
      case "cool": return "Cooling";
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
        <p className="text-2xl font-light" style={{ color: isActive ? accentColor : 'hsl(var(--muted-foreground))' }}>
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
        <div className="flex-1 relative">
          {/* Ambient glow layer behind the display */}
          {isActive && (
            <div
              className="absolute -inset-2 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 50%, ${glow(0.32)} 0%, ${glow(0.16)} 40%, transparent 70%)`,
                filter: 'blur(12px)',
                borderRadius: '20px',
              }}
            />
          )}
          
          {/* Octagonal frame */}
          <div
            className="absolute inset-0"
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
                  ${glow(0.10)} 0%,
                  hsl(220 15% 8%) 70%,
                  hsl(220 15% 6%) 100%
                )
              `,
              borderRadius: '8px',
              clipPath: 'polygon(6% 0%, 94% 0%, 100% 6%, 100% 94%, 94% 100%, 6% 100%, 0% 94%, 0% 6%)',
              boxShadow: isActive ? `
                inset 0 0 40px 0 ${glow(0.14)},
                inset 0 0 80px 0 ${glow(0.08)}
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
                  boxShadow: `0 0 12px 2px ${glow(0.6)}, 0 0 24px 4px ${glow(0.3)}`,
                }}
              />
            )}

            {/* Scanline overlay for holographic effect */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 0% 100%) 2px, hsl(0 0% 100%) 3px)',
                borderRadius: '8px',
              }}
            />

            {/* Mode label */}
            <span
              className="text-sm tracking-widest uppercase mt-4"
              style={{ 
                fontFamily: 'monospace',
                fontWeight: 500,
                letterSpacing: '0.2em',
                color: isActive ? glowColor : 'hsl(var(--muted-foreground))',
                textShadow: isActive ? `
                  0 0 4px ${glow(0.9)},
                  0 0 8px ${glow(0.7)},
                  0 0 16px ${glow(0.5)},
                  0 0 32px ${glow(0.3)}
                ` : 'none',
              }}
            >
              {getModeLabel()}
            </span>

            {/* Temperature display - 7-segment holographic style */}
            <div className="flex items-start justify-center mt-1 relative">
              {/* Background ghost segments for depth */}
              <span
                className="absolute font-bold leading-none opacity-[0.08]"
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: showFullLayout ? '4rem' : '3rem',
                  color: 'hsl(var(--foreground))',
                  letterSpacing: '-0.05em',
                }}
              >
                88
              </span>
              
              {/* Main temperature digits */}
              <span
                className="font-bold leading-none relative"
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: showFullLayout ? '4rem' : '3rem',
                  letterSpacing: '-0.05em',
                  color: isActive ? glowColor : 'hsl(var(--muted-foreground))',
                  textShadow: isActive ? `
                    0 0 2px ${glow(1)},
                    0 0 4px ${glow(0.9)},
                    0 0 8px ${glow(0.8)},
                    0 0 16px ${glow(0.6)},
                    0 0 32px ${glow(0.4)},
                    0 0 48px ${glow(0.2)}
                  ` : 'none',
                  filter: isActive ? `drop-shadow(0 0 2px ${glow(0.8)})` : 'none',
                }}
              >
                {Math.round(targetTemp)}
              </span>
              
              {/* Degree symbol and unit */}
              <span
                className="font-bold mt-1 ml-0.5 relative"
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: showFullLayout ? '1.5rem' : '1.25rem',
                  color: isActive ? glowColor : 'hsl(var(--muted-foreground))',
                  textShadow: isActive ? `
                    0 0 2px ${glow(1)},
                    0 0 8px ${glow(0.7)},
                    0 0 16px ${glow(0.4)}
                  ` : 'none',
                }}
              >
                °C
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* Temperature +/- buttons */}
        {showSlider && (
          <div className="flex items-center justify-center gap-4 mt-3">
            {/* Minus button */}
            <button
              onClick={decrementTemp}
              className="flex items-center justify-center transition-all active:scale-90"
              style={{
                width: '56px',
                height: '56px',
                background: `linear-gradient(145deg, hsl(220 10% 20%) 0%, hsl(220 10% 12%) 100%)`,
                borderRadius: '12px',
                boxShadow: `
                  inset 0 1px 2px 0 hsl(220 10% 28% / 0.4),
                  inset 0 -2px 2px 0 hsl(0 0% 0% / 0.3),
                  0 4px 8px -2px hsl(0 0% 0% / 0.5)
                `,
              }}
            >
              <Minus className="w-6 h-6 text-muted-foreground" />
            </button>

            {/* Plus button */}
            <button
              onClick={incrementTemp}
              className="flex items-center justify-center transition-all active:scale-90"
              style={{
                width: '56px',
                height: '56px',
                background: `linear-gradient(145deg, hsl(220 10% 20%) 0%, hsl(220 10% 12%) 100%)`,
                borderRadius: '12px',
                boxShadow: `
                  inset 0 1px 2px 0 hsl(220 10% 28% / 0.4),
                  inset 0 -2px 2px 0 hsl(0 0% 0% / 0.3),
                  0 4px 8px -2px hsl(0 0% 0% / 0.5)
                `,
              }}
            >
              <Plus className="w-6 h-6 text-muted-foreground" />
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
                      background: `radial-gradient(circle at 50% 50%, ${glow(0.16)} 0%, transparent 70%)`,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-all",
                  )}
                  style={{
                    color: isSelected ? accentColor : 'hsl(var(--muted-foreground))',
                    filter: isSelected ? `drop-shadow(0 0 6px ${glow(0.6)}) drop-shadow(0 0 12px ${glow(0.3)})` : 'none',
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fan speed buttons (shown on larger widgets) */}
      {rows >= 3 && cols >= 2 && (
        <div className="mx-3 mb-3 flex items-center gap-2">
          {FAN_SPEED_CONFIG.map(({ speed, label }) => {
            const isSelected = fanSpeed === speed;
            return (
              <button
                key={speed}
                onClick={(e) => {
                  e.stopPropagation();
                  setFanSpeed(speed);
                }}
                className="flex-1 flex items-center justify-center py-2 transition-all relative active:scale-95"
                style={{
                  height: '36px',
                  borderRadius: '8px',
                  background: isSelected 
                    ? `linear-gradient(180deg, hsl(220 10% 18%) 0%, hsl(220 10% 12%) 100%)`
                    : `linear-gradient(180deg, hsl(220 10% 12%) 0%, hsl(220 10% 8%) 100%)`,
                  boxShadow: isSelected
                    ? `
                        inset 0 1px 2px 0 hsl(220 10% 28% / 0.4),
                        inset 0 -1px 1px 0 hsl(0 0% 0% / 0.3),
                        0 0 12px 2px ${glow(0.25)},
                        0 0 24px 4px ${glow(0.12)}
                      `
                    : `
                        inset 0 1px 2px 0 hsl(0 0% 0% / 0.3),
                        0 1px 0 0 hsl(220 10% 18% / 0.15)
                      `,
                }}
              >
                {/* Illumination glow behind text when selected */}
                {isSelected && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: '8px',
                      background: `radial-gradient(ellipse at 50% 50%, ${glow(0.2)} 0%, transparent 70%)`,
                    }}
                  />
                )}
                <span
                  className="text-xs font-medium relative z-10 transition-all"
                  style={{
                    color: isSelected ? accentColor : 'hsl(var(--muted-foreground))',
                    textShadow: isSelected ? `0 0 8px ${glow(0.6)}` : 'none',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
