import { useState } from "react";
import { Lock, Unlock, DoorOpen, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

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
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <button
        onClick={() => setIsLocked(!isLocked)}
        className={cn(
          "widget-card text-left w-full h-full flex flex-col",
          !isLocked && "ring-1 ring-warning/50"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-colors duration-300",
              isLocked ? "bg-success/20" : "bg-warning/20"
            )}
          >
            {isLocked ? (
              <Lock className="w-5 h-5 text-success" />
            ) : (
              <Unlock className="w-5 h-5 text-warning" />
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <h3 className="font-medium text-foreground text-sm">{name}</h3>
          {room && (
            <p className="text-xs text-muted-foreground">{room}</p>
          )}
          <p
            className={cn(
              "text-xs mt-1 font-medium",
              isLocked ? "text-success" : "text-warning"
            )}
          >
            {isLocked ? "Locked" : "Unlocked"}
          </p>
        </div>
      </button>
    );
  }

  // Wide 2x1 layout
  if (isWide && !isTall) {
    return (
      <button
        onClick={() => setIsLocked(!isLocked)}
        className={cn(
          "widget-card text-left w-full h-full flex items-center gap-4",
          !isLocked && "ring-1 ring-warning/50"
        )}
      >
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
              isLocked ? "text-success" : "text-warning"
            )}
          >
            {isLocked ? "Locked" : "Unlocked"}
          </p>
          <DoorOpen className="w-5 h-5 text-muted-foreground" />
        </div>
      </button>
    );
  }

  // Tall 1x2 or Large 2x2 layout
  return (
    <button
      onClick={() => setIsLocked(!isLocked)}
      className={cn(
        "widget-card text-left w-full h-full flex flex-col items-center justify-center",
        !isLocked && "ring-1 ring-warning/50"
      )}
    >
      <div
        className={cn(
          "p-6 rounded-2xl transition-colors duration-300",
          isLocked ? "bg-success/20" : "bg-warning/20"
        )}
      >
        {isLocked ? (
          <Lock className={cn("text-success", isLarge ? "w-14 h-14" : "w-10 h-10")} />
        ) : (
          <Unlock className={cn("text-warning", isLarge ? "w-14 h-14" : "w-10 h-10")} />
        )}
      </div>

      <h3 className={cn("font-medium text-foreground mt-4", isLarge && "text-lg")}>{name}</h3>
      {room && (
        <p className="text-sm text-muted-foreground">{room}</p>
      )}
      
      <div className={cn(
        "mt-4 px-6 py-2 rounded-full text-sm font-medium transition-colors",
        isLocked 
          ? "bg-success/20 text-success" 
          : "bg-warning/20 text-warning"
      )}>
        {isLocked ? "Locked" : "Unlocked"}
      </div>

      {isLarge && (
        <div className="flex items-center gap-2 mt-4 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-xs">Tap to {isLocked ? "unlock" : "lock"}</span>
        </div>
      )}
    </button>
  );
};
