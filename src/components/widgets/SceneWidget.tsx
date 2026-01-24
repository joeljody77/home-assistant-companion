import { useState } from "react";
import { Moon, Sun, Film, Coffee, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";

type SceneType = "night" | "morning" | "movie" | "relax" | "party";

interface SceneWidgetProps {
  name: string;
  type: SceneType;
  deviceCount?: number;
  entityId?: string;
}

const sceneIcons: Record<SceneType, LucideIcon> = {
  night: Moon,
  morning: Sun,
  movie: Film,
  relax: Coffee,
  party: Sparkles,
};

const sceneGradients: Record<SceneType, string> = {
  night: "from-indigo-500/20 to-purple-500/20",
  morning: "from-amber-500/20 to-orange-500/20",
  movie: "from-red-500/20 to-pink-500/20",
  relax: "from-teal-500/20 to-cyan-500/20",
  party: "from-pink-500/20 to-purple-500/20",
};

export const SceneWidget = ({
  name,
  type,
  deviceCount = 5,
  entityId,
}: SceneWidgetProps) => {
  const [localIsActive, setLocalIsActive] = useState(false);
  const Icon = sceneIcons[type];
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
  const { getEntity, callService, isConnected } = useHomeAssistantContext();

  // Get live state from Home Assistant (for scripts/automations that have on/off state)
  const entity = entityId ? getEntity(entityId) : undefined;
  const haIsActive = entity?.state === "on";

  // Use HA state if connected and entity exists, otherwise fall back to local state
  const isActive = entityId && isConnected && entity ? haIsActive : localIsActive;

  const activateScene = async () => {
    if (entityId && isConnected) {
      const domain = entityId.split(".")[0]; // scene, script, automation
      if (domain === "scene") {
        await callService("scene", "turn_on", entityId);
      } else if (domain === "script") {
        await callService("script", "turn_on", entityId);
      } else if (domain === "automation") {
        await callService("automation", "trigger", entityId);
      }
      // Scenes don't have a persistent "active" state, so we briefly show active
      setLocalIsActive(true);
      setTimeout(() => setLocalIsActive(false), 2000);
    } else {
      setLocalIsActive(!localIsActive);
    }
  };

  // Calculate dynamic sizes
  const minDim = Math.min(cols, rows);
  const iconSize = minDim >= 3 ? "w-16 h-16" : isLarge ? "w-12 h-12" : isTall ? "w-10 h-10" : isWide ? "w-7 h-7" : "w-5 h-5";
  const iconPadding = minDim >= 3 ? "p-8" : isLarge ? "p-6" : isTall ? "p-5" : isWide ? "p-4" : "p-3";
  const titleSize = minDim >= 3 ? "text-2xl" : isLarge ? "text-lg" : "text-sm";
  const subtitleSize = minDim >= 3 ? "text-lg" : isLarge ? "text-sm" : "text-xs";

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <button
        onClick={activateScene}
        className={cn(
          "widget-card text-left w-full h-full flex flex-col transition-all duration-300",
          isActive && "widget-card-active ring-1 ring-primary/50"
        )}
      >
        <div
          className={cn(
            "p-3 rounded-xl bg-gradient-to-br mb-auto w-fit transition-all duration-300",
            sceneGradients[type],
            isActive && "scale-110"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5 transition-colors duration-300",
              isActive ? "text-primary" : "text-foreground/70"
            )}
          />
        </div>

        <div className="mt-auto">
          <h3 className="font-medium text-foreground text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {deviceCount} devices
          </p>
        </div>
      </button>
    );
  }

  // Wide layout (not tall)
  if (isWide && !isTall) {
    return (
      <button
        onClick={activateScene}
        className={cn(
          "widget-card text-left w-full h-full flex items-center gap-4 transition-all duration-300",
          isActive && "widget-card-active ring-1 ring-primary/50"
        )}
      >
        <div
          className={cn(
            "rounded-xl bg-gradient-to-br transition-all duration-300 shrink-0",
            iconPadding,
            sceneGradients[type],
            isActive && "scale-110"
          )}
        >
          <Icon
            className={cn(
              "transition-colors duration-300",
              iconSize,
              isActive ? "text-primary" : "text-foreground/70"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
          <p className={cn("text-muted-foreground", subtitleSize)}>
            {deviceCount} devices
          </p>
        </div>

        <div className={cn(
          "px-3 py-1.5 rounded-full font-medium transition-colors shrink-0",
          minDim >= 3 ? "text-base px-5 py-2" : "text-xs",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-muted-foreground"
        )}>
          {isActive ? "Active" : "Tap to activate"}
        </div>
      </button>
    );
  }

  // Tall or Large layout - centered
  return (
    <button
      onClick={activateScene}
      className={cn(
        "widget-card text-left w-full h-full flex flex-col items-center justify-center gap-4 transition-all duration-300",
        isActive && "widget-card-active ring-1 ring-primary/50"
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br transition-all duration-300",
          iconPadding,
          sceneGradients[type],
          isActive && "scale-110"
        )}
      >
        <Icon
          className={cn(
            "transition-colors duration-300",
            iconSize,
            isActive ? "text-primary" : "text-foreground/70"
          )}
        />
      </div>

      <div className="text-center">
        <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
        <p className={cn("text-muted-foreground mt-1", subtitleSize)}>
          {deviceCount} devices
        </p>
      </div>

      <div className={cn(
        "px-4 py-2 rounded-full font-medium transition-colors",
        minDim >= 3 ? "text-lg px-6 py-3" : "text-sm",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-muted-foreground"
      )}>
        {isActive ? "Active" : "Tap to activate"}
      </div>
    </button>
  );
};
