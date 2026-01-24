import { useState } from "react";
import { Lock, Unlock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

interface LockWidgetProps {
  name: string;
  room?: string;
  entityId?: string;
  /** Backwards-compatible prop name stored in widget config */
  entity_id?: string;
  initialState?: boolean;
}

export const LockWidget = ({
  name,
  room,
  entityId,
  entity_id,
  initialState = true,
}: LockWidgetProps) => {
  const [localIsLocked, setLocalIsLocked] = useState(initialState);
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  const resolvedEntityId = entityId ?? entity_id;

  // Get live state from Home Assistant
  const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
  const haIsLocked = entity?.state === "locked";

  // Use HA state if connected and entity exists, otherwise fall back to local state
  const isLocked = resolvedEntityId && isConnected && entity ? haIsLocked : localIsLocked;

  const toggleLock = async () => {
    if (resolvedEntityId && isConnected) {
      await callService("lock", isLocked ? "unlock" : "lock", resolvedEntityId);
    } else {
      setLocalIsLocked(!localIsLocked);
    }
  };

  // Calculate dynamic sizes based on actual dimensions
  const iconSize = Math.min(cols, rows) >= 3 ? "w-20 h-20" : isLarge ? "w-14 h-14" : isTall ? "w-10 h-10" : "w-5 h-5";
  const iconPadding = Math.min(cols, rows) >= 3 ? "p-8" : isLarge ? "p-6" : isTall ? "p-4" : "p-2.5";
  const titleSize = cols >= 3 || rows >= 3 ? "text-2xl" : isLarge ? "text-lg" : "text-sm";
  const subtitleSize = cols >= 3 || rows >= 3 ? "text-lg" : isLarge ? "text-sm" : "text-xs";

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <button
        onClick={toggleLock}
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

  // Wide layout (2+ cols, 1 row)
  if (isWide && !isTall) {
    return (
      <button
        onClick={toggleLock}
        className={cn(
          "widget-card text-left w-full h-full flex items-center gap-4",
          !isLocked && "ring-1 ring-warning/50"
        )}
      >
        <div
          className={cn(
            "p-3 rounded-xl transition-colors duration-300 shrink-0",
            isLocked ? "bg-success/20" : "bg-warning/20"
          )}
        >
          {isLocked ? (
            <Lock className="w-6 h-6 text-success" />
          ) : (
            <Unlock className="w-6 h-6 text-warning" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{name}</h3>
          {room && (
            <p className="text-xs text-muted-foreground truncate">{room}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <p
            className={cn(
              "text-sm font-medium",
              isLocked ? "text-success" : "text-warning"
            )}
          >
            {isLocked ? "Locked" : "Unlocked"}
          </p>
        </div>
      </button>
    );
  }

  // Tall or Large layout - scales with widget size
  return (
    <button
      onClick={toggleLock}
      className={cn(
        "widget-card text-left w-full h-full flex flex-col items-center justify-center gap-4",
        !isLocked && "ring-1 ring-warning/50"
      )}
    >
      <div
        className={cn(
          "rounded-2xl transition-colors duration-300",
          iconPadding,
          isLocked ? "bg-success/20" : "bg-warning/20"
        )}
      >
        {isLocked ? (
          <Lock className={cn("text-success", iconSize)} />
        ) : (
          <Unlock className={cn("text-warning", iconSize)} />
        )}
      </div>

      <div className="text-center">
        <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
        {room && (
          <p className={cn("text-muted-foreground mt-1", subtitleSize)}>{room}</p>
        )}
      </div>
      
      <div className={cn(
        "px-6 py-2 rounded-full font-medium transition-colors",
        cols >= 3 || rows >= 3 ? "text-lg px-8 py-3" : "text-sm",
        isLocked 
          ? "bg-success/20 text-success" 
          : "bg-warning/20 text-warning"
      )}>
        {isLocked ? "Locked" : "Unlocked"}
      </div>

      {(isLarge || cols >= 2 || rows >= 2) && (
        <div className={cn(
          "flex items-center gap-2 text-muted-foreground",
          cols >= 3 || rows >= 3 ? "text-base" : "text-xs"
        )}>
          <Shield className={cols >= 3 || rows >= 3 ? "w-5 h-5" : "w-4 h-4"} />
          <span>Tap to {isLocked ? "unlock" : "lock"}</span>
        </div>
      )}
    </button>
  );
};
