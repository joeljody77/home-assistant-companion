import { useState } from "react";
import { Power, Plug, Fan, Tv, Speaker, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <button
      onClick={() => setIsOn(!isOn)}
      className={cn(
        "widget-card text-left w-full",
        isOn && "widget-card-active"
      )}
    >
      <div className="flex items-start justify-between mb-4">
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
        <div
          className={cn(
            "status-indicator",
            isOn ? "status-online" : "status-offline"
          )}
        />
      </div>

      <h3 className="font-medium text-foreground">{name}</h3>
      {room && (
        <p className="text-xs text-muted-foreground mt-1">{room}</p>
      )}
      <p
        className={cn(
          "text-xs mt-2 font-medium",
          isOn ? "text-primary" : "text-muted-foreground"
        )}
      >
        {isOn ? "On" : "Off"}
      </p>
    </button>
  );
};
