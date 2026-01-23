import { useState } from "react";
import { Lock, Unlock, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockWidgetProps {
  name: string;
  room?: string;
  initialState?: boolean;
}

export const LockWidget = ({
  name,
  room,
  initialState = true,
}: LockWidgetProps) => {
  const [isLocked, setIsLocked] = useState(initialState);

  return (
    <button
      onClick={() => setIsLocked(!isLocked)}
      className={cn(
        "widget-card text-left w-full",
        !isLocked && "ring-1 ring-warning/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-xl transition-colors duration-300",
            isLocked ? "bg-success/20" : "bg-warning/20"
          )}
        >
          {isLocked ? (
            <Lock className="w-6 h-6 text-success" />
          ) : (
            <Unlock className="w-6 h-6 text-warning" />
          )}
        </div>
        <DoorOpen className="w-5 h-5 text-muted-foreground" />
      </div>

      <h3 className="font-medium text-foreground">{name}</h3>
      {room && (
        <p className="text-xs text-muted-foreground mt-1">{room}</p>
      )}
      <p
        className={cn(
          "text-xs mt-2 font-medium",
          isLocked ? "text-success" : "text-warning"
        )}
      >
        {isLocked ? "Locked" : "Unlocked"}
      </p>
    </button>
  );
};
