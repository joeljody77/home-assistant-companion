import { useState } from "react";
import { Moon, Sun, Film, Coffee, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <button
      onClick={() => setIsActive(!isActive)}
      className={cn(
        "widget-card text-left w-full transition-all duration-300",
        isActive && "widget-card-active ring-1 ring-primary/50"
      )}
    >
      <div
        className={cn(
          "p-4 rounded-xl bg-gradient-to-br mb-3 w-fit transition-all duration-300",
          sceneGradients[type],
          isActive && "scale-110"
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6 transition-colors duration-300",
            isActive ? "text-primary" : "text-foreground/70"
          )}
        />
      </div>

      <h3 className="font-medium text-foreground">{name}</h3>
      <p className="text-xs text-muted-foreground mt-1">
        {deviceCount} devices
      </p>
    </button>
  );
};
