import { useState } from "react";
import { Lightbulb, LightbulbOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

interface LightWidgetProps {
  name: string;
  room?: string;
  initialState?: boolean;
  initialBrightness?: number;
}

export const LightWidget = ({
  name,
  room,
  initialState = false,
  initialBrightness = 80,
}: LightWidgetProps) => {
  const [isOn, setIsOn] = useState(initialState);
  const [brightness, setBrightness] = useState(initialBrightness);
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  const toggleLight = () => setIsOn(!isOn);

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

  // Wide 2x1 or Large 2x2 layout with slider
  return (
    <div
      className={cn(
        "widget-card cursor-pointer select-none h-full flex flex-col",
        isOn && "widget-card-active"
      )}
      onClick={toggleLight}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-xl transition-colors duration-300",
            isOn ? "bg-primary/20" : "bg-secondary"
          )}
        >
          {isOn ? (
            <Lightbulb className={cn("text-primary", isLarge ? "w-8 h-8" : "w-6 h-6")} />
          ) : (
            <LightbulbOff className={cn("text-muted-foreground", isLarge ? "w-8 h-8" : "w-6 h-6")} />
          )}
        </div>
        <div
          className={cn(
            "status-indicator",
            isOn ? "status-online" : "status-offline"
          )}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="space-y-1">
          <h3 className={cn("font-medium text-foreground", isLarge && "text-lg")}>{name}</h3>
          {room && (
            <p className="text-sm text-muted-foreground">{room}</p>
          )}
        </div>

        <div className={cn("mt-auto pt-4", isTall && "pt-6")} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Brightness</span>
            <span>{isOn ? `${brightness}%` : "Off"}</span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(value) => {
              setBrightness(value[0]);
              if (!isOn && value[0] > 0) setIsOn(true);
            }}
            max={100}
            step={1}
            disabled={!isOn}
            className="w-full"
          />
          {isLarge && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[25, 50, 75, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBrightness(preset);
                    if (!isOn) setIsOn(true);
                  }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-medium transition-colors",
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
