import { useState } from "react";
import { Power, Plug, Fan, Tv, Speaker, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

type DeviceType = "switch" | "plug" | "fan" | "tv" | "speaker";

interface SwitchWidgetProps {
  name: string;
  type: DeviceType;
  room?: string;
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
  initialState = false,
}: SwitchWidgetProps) => {
  const [isOn, setIsOn] = useState(initialState);
  const Icon = deviceIcons[type];
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <button
        onClick={() => setIsOn(!isOn)}
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

  // Wide 2x1 layout
  if (isWide && !isTall) {
    return (
      <button
        onClick={() => setIsOn(!isOn)}
        className={cn(
          "widget-card text-left w-full h-full flex items-center gap-4",
          isOn && "widget-card-active"
        )}
      >
        <div
          className={cn(
            "p-3 rounded-xl transition-colors duration-300",
            isOn ? "bg-primary/20" : "bg-secondary"
          )}
        >
          <Icon
            className={cn(
              "w-6 h-6 transition-colors duration-300",
              isOn ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-foreground">{name}</h3>
          {room && (
            <p className="text-xs text-muted-foreground">{room}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p
            className={cn(
              "text-sm font-medium",
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

  // Tall 1x2 or Large 2x2 layout
  return (
    <button
      onClick={() => setIsOn(!isOn)}
      className={cn(
        "widget-card text-left w-full h-full flex flex-col items-center justify-center",
        isOn && "widget-card-active"
      )}
    >
      <div
        className={cn(
          "p-5 rounded-2xl transition-colors duration-300",
          isOn ? "bg-primary/20" : "bg-secondary"
        )}
      >
        <Icon
          className={cn(
            "transition-colors duration-300",
            isOn ? "text-primary" : "text-muted-foreground",
            isLarge ? "w-12 h-12" : "w-10 h-10"
          )}
        />
      </div>

      <h3 className={cn("font-medium text-foreground mt-4", isLarge && "text-lg")}>{name}</h3>
      {room && (
        <p className="text-sm text-muted-foreground">{room}</p>
      )}
      
      <div className={cn(
        "mt-4 px-6 py-2 rounded-full text-sm font-medium transition-colors",
        isOn 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-muted-foreground"
      )}>
        {isOn ? "On" : "Off"}
      </div>
    </button>
  );
};
