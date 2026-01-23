import { Camera, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetSize } from "@/contexts/WidgetSizeContext";

interface CameraWidgetProps {
  name: string;
  room?: string;
  isOnline?: boolean;
}

export const CameraWidget = ({
  name,
  room,
  isOnline = true,
}: CameraWidgetProps) => {
  const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();

  const minDim = Math.min(cols, rows);
  
  // Calculate dynamic sizes
  const iconSize = minDim >= 3 ? "w-20 h-20" : isLarge ? "w-16 h-16" : isTall ? "w-12 h-12" : isWide ? "w-10 h-10" : "w-8 h-8";
  const titleSize = minDim >= 3 ? "text-xl" : isLarge ? "text-lg" : "text-sm";
  const subtitleSize = minDim >= 3 ? "text-base" : isLarge ? "text-sm" : "text-xs";
  const padding = minDim >= 3 ? "p-6" : isLarge ? "p-4" : "p-3";

  // Compact 1x1 layout
  if (isCompact) {
    return (
      <div className="widget-card p-0 overflow-hidden group h-full">
        <div className="relative w-full h-full min-h-[120px] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
          <Camera className="w-8 h-8 text-muted-foreground/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <div
              className={cn(
                "status-indicator",
                isOnline ? "status-online" : "status-offline"
              )}
            />
          </div>

          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="font-medium text-foreground text-xs truncate">{name}</h3>
          </div>
        </div>
      </div>
    );
  }

  // Wide layout (not tall)
  if (isWide && !isTall) {
    return (
      <div className="widget-card p-0 overflow-hidden group h-full">
        <div className="relative w-full h-full min-h-[140px] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
          <Camera className={cn("text-muted-foreground/30", iconSize)} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

          <div className={cn("absolute top-3 left-3 flex items-center gap-2", minDim >= 3 && "top-4 left-4")}>
            <div
              className={cn(
                "status-indicator",
                isOnline ? "status-online" : "status-offline"
              )}
            />
            <span className={cn("text-foreground/80", subtitleSize)}>
              {isOnline ? "Live" : "Offline"}
            </span>
          </div>

          <button className={cn("absolute top-3 right-3 p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity", minDim >= 3 && "top-4 right-4 p-3")}>
            <Maximize2 className={minDim >= 3 ? "w-6 h-6 text-foreground" : "w-4 h-4 text-foreground"} />
          </button>

          <div className={cn("absolute bottom-3 left-3 right-3", minDim >= 3 && "bottom-4 left-4 right-4")}>
            <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
            {room && (
              <p className={cn("text-muted-foreground", subtitleSize)}>{room}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tall or Large layout
  return (
    <div className="widget-card p-0 overflow-hidden group h-full">
      <div className="relative w-full h-full min-h-[200px] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
        <Camera className={cn("text-muted-foreground/30", iconSize)} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        <div className={cn("absolute flex items-center gap-2", padding, "top-0 left-0")}>
          <div
            className={cn(
              "status-indicator",
              isOnline ? "status-online" : "status-offline"
            )}
          />
          <span className={cn("text-foreground/80", subtitleSize)}>
            {isOnline ? "Live" : "Offline"}
          </span>
        </div>

        <button className={cn("absolute p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity", padding, "top-0 right-0", minDim >= 3 && "p-3")}>
          <Maximize2 className={minDim >= 3 ? "w-6 h-6 text-foreground" : "w-4 h-4 text-foreground"} />
        </button>

        <div className={cn("absolute left-0 right-0 bottom-0", padding)}>
          <h3 className={cn("font-medium text-foreground", titleSize)}>{name}</h3>
          {room && (
            <p className={cn("text-muted-foreground mt-1", subtitleSize)}>{room}</p>
          )}
        </div>
      </div>
    </div>
  );
};
