import { useState } from "react";
import { Lightbulb, LightbulbOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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

  const toggleLight = () => setIsOn(!isOn);

  return (
    <div
      className={cn(
        "widget-card cursor-pointer select-none",
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
            <Lightbulb className="w-6 h-6 text-primary" />
          ) : (
            <LightbulbOff className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div
          className={cn(
            "status-indicator",
            isOn ? "status-online" : "status-offline"
          )}
        />
      </div>

      <div className="space-y-1">
        <h3 className="font-medium text-foreground">{name}</h3>
        {room && (
          <p className="text-sm text-muted-foreground">{room}</p>
        )}
      </div>

      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
};
