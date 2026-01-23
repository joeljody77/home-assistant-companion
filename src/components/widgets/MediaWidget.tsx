import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

interface MediaWidgetProps {
  name: string;
  artist?: string;
  track?: string;
  albumArt?: string;
}

export const MediaWidget = ({
  name,
  artist = "Artist Name",
  track = "Track Title",
}: MediaWidgetProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(65);
  const [progress, setProgress] = useState(35);
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();

  const minDim = Math.min(cols, rows);
  
  // Calculate dynamic sizes
  const albumSize = minDim >= 3 ? "w-32 h-32" : isLarge ? "w-24 h-24" : isTall ? "w-20 h-20" : "w-12 h-12";
  const titleSize = minDim >= 3 ? "text-2xl" : isLarge ? "text-lg" : "text-sm";
  const subtitleSize = minDim >= 3 ? "text-lg" : isLarge ? "text-sm" : "text-xs";
  const playButtonSize = minDim >= 3 ? "p-5" : isLarge ? "p-4" : "p-3";
  const playIconSize = minDim >= 3 ? "w-8 h-8" : isLarge ? "w-6 h-6" : "w-5 h-5";
  const controlIconSize = minDim >= 3 ? "w-6 h-6" : "w-4 h-4";

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <div className="widget-card h-full flex flex-col">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 mb-2" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-xs truncate">{track}</h3>
          <p className="text-xs text-muted-foreground truncate">{artist}</p>
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={cn(
            "mt-2 p-2 rounded-full w-fit transition-colors",
            isPlaying
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground hover:bg-muted"
          )}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>
    );
  }

  // Tall layout (not wide)
  if (isTall && !isWide) {
    return (
      <div className="widget-card h-full flex flex-col items-center text-center">
        <div className={cn("rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 mb-4", albumSize)} />
        
        <h3 className={cn("font-medium text-foreground truncate max-w-full", titleSize)}>{track}</h3>
        <p className={cn("text-muted-foreground truncate max-w-full", subtitleSize)}>{artist}</p>
        <p className={cn("text-muted-foreground/70 mt-1", minDim >= 3 ? "text-base" : "text-xs")}>{name}</p>

        <div className="w-full mt-4">
          <Slider
            value={[progress]}
            onValueChange={(value) => setProgress(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className={cn("flex items-center gap-2 mt-4", minDim >= 3 && "gap-4 mt-6")}>
          <button className="icon-button">
            <SkipBack className={cn("text-foreground", controlIconSize)} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "rounded-full transition-colors",
              playButtonSize,
              isPlaying
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-muted"
            )}
          >
            {isPlaying ? (
              <Pause className={playIconSize} />
            ) : (
              <Play className={cn("ml-0.5", playIconSize)} />
            )}
          </button>
          <button className="icon-button">
            <SkipForward className={cn("text-foreground", controlIconSize)} />
          </button>
        </div>

        <div className={cn("flex items-center gap-2 w-full mt-auto pt-4", minDim >= 3 && "pt-6")}>
          <Volume2 className={cn("text-muted-foreground flex-shrink-0", controlIconSize)} />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // Wide or Large layout
  return (
    <div className="widget-card h-full flex flex-col min-w-0">
      <div className={cn("flex items-start gap-4 min-w-0", minDim >= 3 && "gap-6")}>
        <div className={cn(
          "rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex-shrink-0",
          albumSize
        )} />

        <div className="flex-1 min-w-0 overflow-hidden">
          <h3 className={cn("font-medium text-foreground truncate", titleSize)}>{track}</h3>
          <p className={cn("text-muted-foreground truncate", subtitleSize)}>{artist}</p>
          <p className={cn("text-muted-foreground/70 mt-1", minDim >= 3 ? "text-base" : "text-xs")}>{name}</p>

          <div className="mt-3">
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
            <div className={cn("flex justify-between text-muted-foreground mt-1", minDim >= 3 ? "text-base" : "text-xs")}>
              <span>1:23</span>
              <span>3:45</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("flex items-center justify-between mt-auto pt-4 min-w-0", minDim >= 3 && "pt-6")}>
        <div className={cn("flex items-center gap-2 flex-shrink-0", minDim >= 3 && "gap-4")}>
          <button className="icon-button">
            <SkipBack className={cn("text-foreground", controlIconSize)} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "rounded-full transition-colors",
              playButtonSize,
              isPlaying
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-muted"
            )}
          >
            {isPlaying ? (
              <Pause className={playIconSize} />
            ) : (
              <Play className={cn("ml-0.5", playIconSize)} />
            )}
          </button>
          <button className="icon-button">
            <SkipForward className={cn("text-foreground", controlIconSize)} />
          </button>
        </div>

        <div className={cn("flex items-center gap-2 min-w-0 flex-1 max-w-[30%]")}>
          <Volume2 className={cn("text-muted-foreground flex-shrink-0", controlIconSize)} />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
