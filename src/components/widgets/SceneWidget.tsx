import { useState } from "react";
import { Moon, Sun, Film, Coffee, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

type SceneType = "night" | "morning" | "movie" | "relax" | "party";

interface SceneWidgetProps {
  name: string;
  type: SceneType;
  deviceCount?: number;
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
}: SceneWidgetProps) => {
  const [isActive, setIsActive] = useState(false);
  const Icon = sceneIcons[type];
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <button
        onClick={() => setIsActive(!isActive)}
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

  // Wide 2x1 layout
  if (isWide && !isTall) {
    return (
      <button
        onClick={() => setIsActive(!isActive)}
        className={cn(
          "widget-card text-left w-full h-full flex items-center gap-4 transition-all duration-300",
          isActive && "widget-card-active ring-1 ring-primary/50"
        )}
      >
        <div
          className={cn(
            "p-4 rounded-xl bg-gradient-to-br transition-all duration-300",
            sceneGradients[type],
            isActive && "scale-110"
          )}
        >
          <Icon
            className={cn(
              "w-7 h-7 transition-colors duration-300",
              isActive ? "text-primary" : "text-foreground/70"
            )}
          />
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">
            {deviceCount} devices
          </p>
        </div>

        <div className={cn(
          "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-muted-foreground"
        )}>
          {isActive ? "Active" : "Tap to activate"}
        </div>
      </button>
    );
  }

  // Tall 1x2 or Large 2x2 layout
  return (
    <button
      onClick={() => setIsActive(!isActive)}
      className={cn(
        "widget-card text-left w-full h-full flex flex-col items-center justify-center transition-all duration-300",
        isActive && "widget-card-active ring-1 ring-primary/50"
      )}
    >
      <div
        className={cn(
          "p-6 rounded-2xl bg-gradient-to-br transition-all duration-300",
          sceneGradients[type],
          isActive && "scale-110"
        )}
      >
        <Icon
          className={cn(
            "transition-colors duration-300",
            isActive ? "text-primary" : "text-foreground/70",
            isLarge ? "w-12 h-12" : "w-10 h-10"
          )}
        />
      </div>

      <h3 className={cn("font-medium text-foreground mt-4", isLarge && "text-lg")}>{name}</h3>
      <p className="text-sm text-muted-foreground">
        {deviceCount} devices
      </p>

      <div className={cn(
        "mt-4 px-4 py-2 rounded-full text-sm font-medium transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-muted-foreground"
      )}>
        {isActive ? "Active" : "Tap to activate"}
      </div>
    </button>
  );
};
