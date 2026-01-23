import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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

  return (
    <div className="widget-card col-span-2">
      <div className="flex items-start gap-4">
        {/* Album Art Placeholder */}
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{track}</h3>
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{name}</p>

          {/* Progress */}
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

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button className="icon-button">
            <SkipBack className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "p-4 rounded-full transition-colors",
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

        <div className="flex items-center gap-2 w-28">
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
