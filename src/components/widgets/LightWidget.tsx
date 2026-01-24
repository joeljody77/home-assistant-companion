import { useState, useMemo } from "react";
import { Lightbulb, LightbulbOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

interface LightWidgetProps {
  name: string;
  room?: string;
  entityId?: string;
  /** Backwards-compatible prop name stored in widget config */
  entity_id?: string;
  initialState?: boolean;
  initialBrightness?: number;
}

// Convert color temperature (mireds) to RGB
const colorTempToRgb = (mireds: number): [number, number, number] => {
  // Convert mireds to Kelvin
  const kelvin = 1000000 / mireds;
  const temp = kelvin / 100;
  
  let r: number, g: number, b: number;
  
  if (temp <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
    b = temp <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    b = 255;
  }
  
  return [Math.round(r), Math.round(g), Math.round(b)];
};

// Get light color from HA entity attributes
const getLightColor = (attributes: Record<string, unknown> | undefined): string | null => {
  if (!attributes) return null;
  
  // Check for RGB color
  if (attributes.rgb_color && Array.isArray(attributes.rgb_color)) {
    const [r, g, b] = attributes.rgb_color as [number, number, number];
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Check for HS color (convert to RGB)
  if (attributes.hs_color && Array.isArray(attributes.hs_color)) {
    const [h, s] = attributes.hs_color as [number, number];
    return `hsl(${h}, ${s}%, 50%)`;
  }
  
  // Check for color temperature
  if (attributes.color_temp !== undefined && typeof attributes.color_temp === 'number') {
    const [r, g, b] = colorTempToRgb(attributes.color_temp);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  return null;
};

export const LightWidget = ({
  name,
  room,
  entityId,
  entity_id,
  initialState = false,
  initialBrightness = 80,
}: LightWidgetProps) => {
  const [localIsOn, setLocalIsOn] = useState(initialState);
  const [localBrightness, setLocalBrightness] = useState(initialBrightness);
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;

  // Get live state from Home Assistant
  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  const haIsOn = entity?.state === "on";
  const haBrightness = entity?.attributes?.brightness
    ? Math.round((entity.attributes.brightness as number) / 255 * 100)
    : initialBrightness;

  // Use HA state if connected and entity exists, otherwise fall back to local state
  const isOn = resolvedEntityId && isConnected && entity ? haIsOn : localIsOn;
  const brightness = resolvedEntityId && isConnected && entity ? haBrightness : localBrightness;

  // Get light color from HA attributes
  const lightColor = useMemo(() => {
    if (!isOn) return null;
    if (resolvedEntityId && isConnected && entity) {
      return getLightColor(entity.attributes as Record<string, unknown>);
    }
    return null;
  }, [isOn, resolvedEntityId, isConnected, entity]);

  // Calculate icon opacity based on brightness (minimum 0.4 for visibility)
  const iconOpacity = isOn ? Math.max(0.4, brightness / 100) : 1;

  const toggleLight = async () => {
    if (resolvedEntityId && isConnected) {
      await callService("light", isOn ? "turn_off" : "turn_on", resolvedEntityId);
    } else {
      setLocalIsOn(!localIsOn);
    }
  };

  const handleBrightnessChange = async (value: number[]) => {
    const newBrightness = value[0];
    if (resolvedEntityId && isConnected) {
      // Convert 0-100 to 0-255 for HA
      await callService("light", "turn_on", resolvedEntityId, {
        brightness: Math.round(newBrightness / 100 * 255)
      });
    } else {
      setLocalBrightness(newBrightness);
      if (!localIsOn && newBrightness > 0) setLocalIsOn(true);
    }
  };

  const handlePresetClick = async (e: React.MouseEvent, preset: number) => {
    e.stopPropagation();
    if (resolvedEntityId && isConnected) {
      await callService("light", "turn_on", resolvedEntityId, {
        brightness: Math.round(preset / 100 * 255)
      });
    } else {
      setLocalBrightness(preset);
      if (!localIsOn) setLocalIsOn(true);
    }
  };

  // Icon style with color and brightness
  const iconStyle = useMemo(() => {
    if (!isOn) return undefined;
    return {
      color: lightColor || undefined,
      opacity: iconOpacity,
      filter: lightColor ? `drop-shadow(0 0 8px ${lightColor})` : undefined,
    };
  }, [isOn, lightColor, iconOpacity]);

  // Calculate dynamic sizes
  const minDim = Math.min(cols, rows);
  const maxDim = Math.max(cols, rows);
  const iconSize = minDim >= 3 ? "w-12 h-12" : isLarge ? "w-8 h-8" : isWide || isTall ? "w-6 h-6" : "w-5 h-5";
  const iconPadding = minDim >= 3 ? "p-5" : isLarge ? "p-4" : "p-2.5";
  const titleSize = minDim >= 3 ? "text-2xl" : isLarge ? "text-lg" : "text-sm";

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <div
        className={cn(
          "widget-card cursor-pointer select-none h-full flex flex-col",
          isOn && "widget-card-active"
        )}
        onClick={toggleLight}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-colors duration-300",
              isOn ? "bg-primary/20" : "bg-secondary"
            )}
          >
          {isOn ? (
            <Lightbulb 
              className={cn("w-5 h-5", !lightColor && "text-primary")} 
              style={iconStyle}
            />
          ) : (
            <LightbulbOff className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div
          className={cn(
            "status-indicator",
            isOn ? "status-online" : "status-offline"
            )}
          />
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <h3 className="font-medium text-foreground text-sm">{name}</h3>
          {room && (
            <p className="text-xs text-muted-foreground">{room}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {isOn ? `${brightness}%` : "Off"}
          </p>
        </div>
      </div>
    );
  }

  // Wide or Large layout with slider - scales dynamically
  return (
    <div
      className={cn(
        "widget-card cursor-pointer select-none h-full flex flex-col min-w-0",
        isOn && "widget-card-active"
      )}
      onClick={toggleLight}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "rounded-xl transition-colors duration-300",
            iconPadding,
            isOn ? "bg-primary/20" : "bg-secondary"
          )}
        >
        {isOn ? (
            <Lightbulb 
              className={cn(iconSize, !lightColor && "text-primary")} 
              style={iconStyle}
            />
          ) : (
            <LightbulbOff className={cn("text-muted-foreground", iconSize)} />
          )}
        </div>
        <div
          className={cn(
            "status-indicator",
            isOn ? "status-online" : "status-offline"
          )}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="space-y-1 min-w-0">
          <h3 className={cn("font-medium text-foreground truncate", titleSize)}>{name}</h3>
          {room && (
            <p className={cn("text-muted-foreground truncate", minDim >= 3 ? "text-lg" : "text-sm")}>{room}</p>
          )}
        </div>

        <div className={cn("mt-auto min-w-0", minDim >= 3 ? "pt-8" : isTall ? "pt-6" : "pt-4")} onClick={(e) => e.stopPropagation()}>
          <div className={cn("flex items-center justify-between text-muted-foreground mb-2", minDim >= 3 ? "text-lg" : "text-xs")}>
            <span>Brightness</span>
            <span>{isOn ? `${brightness}%` : "Off"}</span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={handleBrightnessChange}
            max={100}
            step={1}
            disabled={!isOn}
            className="w-full"
          />
          {(isLarge || minDim >= 2) && (
            <div className={cn("grid gap-2 mt-4", cols >= 3 ? "grid-cols-5" : "grid-cols-4")}>
              {[25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={(e) => handlePresetClick(e, preset)}
                  className={cn(
                    "py-2 rounded-lg font-medium transition-colors",
                    minDim >= 3 ? "text-base py-3" : "text-xs",
                    brightness === preset && isOn
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  )}
                >
                  {preset}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
