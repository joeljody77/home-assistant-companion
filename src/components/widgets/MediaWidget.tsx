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
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  // Compact 1x1 layout - minimal controls
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

  // Tall 1x2 layout - vertical stack
  if (isTall && !isWide) {
    return (
      <div className="widget-card h-full flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 mb-4" />
        
        <h3 className="font-medium text-foreground truncate max-w-full">{track}</h3>
        <p className="text-sm text-muted-foreground truncate max-w-full">{artist}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">{name}</p>

        <div className="w-full mt-4">
          <Slider
            value={[progress]}
            onValueChange={(value) => setProgress(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button className="icon-button">
            <SkipBack className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "p-3 rounded-full transition-colors",
              isPlaying
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-muted"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          <button className="icon-button">
            <SkipForward className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full mt-auto pt-4">
          <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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

  // Wide 2x1 or Large 2x2 layout
  return (
    <div className="widget-card h-full flex flex-col">
      <div className="flex items-start gap-4">
        <div className={cn(
          "rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex-shrink-0",
          isLarge ? "w-24 h-24" : "w-20 h-20"
        )} />

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-medium text-foreground truncate", isLarge && "text-lg")}>{track}</h3>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{name}</p>

          <div className="mt-3">
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1:23</span>
              <span>3:45</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("flex items-center justify-between mt-auto pt-4", isLarge && "pt-6")}>
        <div className="flex items-center gap-2">
          <button className="icon-button">
            <SkipBack className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "rounded-full transition-colors",
              isPlaying
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-muted",
              isLarge ? "p-4" : "p-3"
            )}
          >
            {isPlaying ? (
              <Pause className={cn(isLarge ? "w-6 h-6" : "w-5 h-5")} />
            ) : (
              <Play className={cn("ml-0.5", isLarge ? "w-6 h-6" : "w-5 h-5")} />
            )}
          </button>
          <button className="icon-button">
            <SkipForward className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className={cn("flex items-center gap-2", isLarge ? "w-36" : "w-28")}>
          <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
