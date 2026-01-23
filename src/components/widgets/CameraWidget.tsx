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
  const { isCompact, isWide, isTall, isLarge } = useWidgetSize();

  // Compact 1x1 layout - just a preview thumbnail
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

  // Wide 2x1 layout
  if (isWide && !isTall) {
    return (
      <div className="widget-card p-0 overflow-hidden group h-full">
        <div className="relative w-full h-full min-h-[140px] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
          <Camera className="w-10 h-10 text-muted-foreground/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div
              className={cn(
                "status-indicator",
                isOnline ? "status-online" : "status-offline"
              )}
            />
            <span className="text-xs text-foreground/80">
              {isOnline ? "Live" : "Offline"}
            </span>
          </div>

          <button className="absolute top-3 right-3 p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-4 h-4 text-foreground" />
          </button>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-medium text-foreground">{name}</h3>
            {room && (
              <p className="text-xs text-muted-foreground">{room}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tall 1x2 or Large 2x2 layout
  return (
    <div className="widget-card p-0 overflow-hidden group h-full">
      <div className="relative w-full h-full min-h-[200px] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
        <Camera className={cn("text-muted-foreground/30", isLarge ? "w-16 h-16" : "w-12 h-12")} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div
            className={cn(
              "status-indicator",
              isOnline ? "status-online" : "status-offline"
            )}
          />
          <span className="text-xs text-foreground/80">
            {isOnline ? "Live" : "Offline"}
          </span>
        </div>

        <button className="absolute top-4 right-4 p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4 text-foreground" />
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className={cn("font-medium text-foreground", isLarge && "text-lg")}>{name}</h3>
          {room && (
            <p className={cn("text-muted-foreground mt-1", isLarge ? "text-sm" : "text-xs")}>{room}</p>
          )}
        </div>
      </div>
    </div>
  );
};
