import { useState } from "react";
import { Lightbulb, LightbulbOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

interface LightWidgetProps {
  name: string;
  room?: string;
  entityId?: string;
  initialState?: boolean;
  initialBrightness?: number;
}

export const LightWidget = ({
  name,
  room,
  entityId,
  initialState = false,
  initialBrightness = 80,
}: LightWidgetProps) => {
  const [localIsOn, setLocalIsOn] = useState(initialState);
  const [localBrightness, setLocalBrightness] = useState(initialBrightness);
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  // Get live state from Home Assistant
  const entity = entityId ? getEntity(entityId) : undefined;
  const haIsOn = entity?.state === "on";
  const haBrightness = entity?.attributes?.brightness
    ? Math.round((entity.attributes.brightness as number) / 255 * 100)
    : initialBrightness;

  // Use HA state if connected and entity exists, otherwise fall back to local state
  const isOn = entityId && isConnected && entity ? haIsOn : localIsOn;
  const brightness = entityId && isConnected && entity ? haBrightness : localBrightness;

  const toggleLight = async () => {
    if (entityId && isConnected) {
      await callService("light", isOn ? "turn_off" : "turn_on", entityId);
    } else {
      setLocalIsOn(!localIsOn);
    }
  };

  const handleBrightnessChange = async (value: number[]) => {
    const newBrightness = value[0];
    if (entityId && isConnected) {
      // Convert 0-100 to 0-255 for HA
      await callService("light", "turn_on", entityId, {
        brightness: Math.round(newBrightness / 100 * 255)
      });
    } else {
      setLocalBrightness(newBrightness);
      if (!localIsOn && newBrightness > 0) setLocalIsOn(true);
    }
  };

  const handlePresetClick = async (e: React.MouseEvent, preset: number) => {
    e.stopPropagation();
    if (entityId && isConnected) {
      await callService("light", "turn_on", entityId, {
        brightness: Math.round(preset / 100 * 255)
      });
    } else {
      setLocalBrightness(preset);
      if (!localIsOn) setLocalIsOn(true);
    }
  };

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
              <Lightbulb className="w-5 h-5 text-primary" />
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
            <Lightbulb className={cn("text-primary", iconSize)} />
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
