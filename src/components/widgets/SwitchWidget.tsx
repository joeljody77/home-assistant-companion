import { useState } from "react";
import { Power, Plug, Fan, Tv, Speaker, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

type DeviceType = "switch" | "plug" | "fan" | "tv" | "speaker";

interface SwitchWidgetProps {
  name: string;
  type: DeviceType;
  room?: string;
  entityId?: string;
  /** Backwards-compatible prop name stored in widget config */
  entity_id?: string;
  initialState?: boolean;
}

const deviceIcons: Record<DeviceType, LucideIcon> = {
  switch: Power,
  plug: Plug,
  fan: Fan,
  tv: Tv,
  speaker: Speaker,
};

export const SwitchWidget = ({
  name,
  type,
  room,
  entityId,
  entity_id,
  initialState = false,
}: SwitchWidgetProps) => {
  const [localIsOn, setLocalIsOn] = useState(initialState);
  const Icon = deviceIcons[type];
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;

  // Get live state from Home Assistant
  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  const haIsOn = entity?.state === "on";

  // Use HA state if connected and entity exists, otherwise fall back to local state
  const isOn = resolvedEntityId && isConnected && entity ? haIsOn : localIsOn;

  const toggleSwitch = async () => {
    if (resolvedEntityId && isConnected) {
      const domain = resolvedEntityId.split(".")[0]; // switch, fan, input_boolean, etc.
      await callService(domain, isOn ? "turn_off" : "turn_on", resolvedEntityId);
    } else {
      setLocalIsOn(!localIsOn);
    }
  };

  // Calculate dynamic sizes
  const minDim = Math.min(cols, rows);
  const iconSize = minDim >= 3 ? "w-16 h-16" : isLarge ? "w-12 h-12" : isTall ? "w-10 h-10" : isWide ? "w-6 h-6" : "w-5 h-5";
  const iconPadding = minDim >= 3 ? "p-7" : isLarge ? "p-5" : isTall ? "p-5" : isWide ? "p-3" : "p-2.5";
  const titleSize = minDim >= 3 ? "text-2xl" : isLarge ? "text-lg" : "text-sm";
  const subtitleSize = minDim >= 3 ? "text-lg" : isLarge ? "text-sm" : "text-xs";

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <button
        onClick={toggleSwitch}
        className={cn(
          "widget-card text-left w-full h-full flex flex-col",
          isOn && "widget-card-active"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-colors duration-300",
              isOn ? "bg-primary/20" : "bg-secondary"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-colors duration-300",
                isOn ? "text-primary" : "text-muted-foreground"
              )}
            />
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
          <p
            className={cn(
              "text-xs mt-1 font-medium",
              isOn ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isOn ? "On" : "Off"}
          </p>
        </div>
      </button>
    );
  }

  // Wide layout (not tall)
  if (isWide && !isTall) {
    return (
      <button
        onClick={toggleSwitch}
        className={cn(
          "widget-card text-left w-full h-full flex items-center gap-4",
          isOn && "widget-card-active"
        )}
      >
        <div
          className={cn(
            "rounded-xl transition-colors duration-300 shrink-0",
            iconPadding,
            isOn ? "bg-primary/20" : "bg-secondary"
          )}
        >
          <Icon
            className={cn(
              "transition-colors duration-300",
              iconSize,
              isOn ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
          {room && (
            <p className={cn("text-muted-foreground", subtitleSize)}>{room}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <p
            className={cn(
              "font-medium",
              minDim >= 3 ? "text-lg" : "text-sm",
              isOn ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isOn ? "On" : "Off"}
          </p>
          <div
            className={cn(
              "status-indicator",
              isOn ? "status-online" : "status-offline"
            )}
          />
        </div>
      </button>
    );
  }

  // Tall or Large layout - centered
  return (
    <button
      onClick={toggleSwitch}
      className={cn(
        "widget-card text-left w-full h-full flex flex-col items-center justify-center gap-4",
        isOn && "widget-card-active"
      )}
    >
      <div
        className={cn(
          "rounded-2xl transition-colors duration-300",
          iconPadding,
          isOn ? "bg-primary/20" : "bg-secondary"
        )}
      >
        <Icon
          className={cn(
            "transition-colors duration-300",
            iconSize,
            isOn ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>

      <div className="text-center">
        <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
        {room && (
          <p className={cn("text-muted-foreground mt-1", subtitleSize)}>{room}</p>
        )}
      </div>
      
      <div className={cn(
        "px-6 py-2 rounded-full font-medium transition-colors",
        minDim >= 3 ? "text-lg px-8 py-3" : "text-sm",
        isOn 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-muted-foreground"
      )}>
        {isOn ? "On" : "Off"}
      </div>
    </button>
  );
};
