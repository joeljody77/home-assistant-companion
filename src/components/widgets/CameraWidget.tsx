import { Camera, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div className="widget-card col-span-2 row-span-2 p-0 overflow-hidden group">
      <div className="relative w-full h-full min-h-[200px] bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
        {/* Placeholder for camera feed */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Camera className="w-12 h-12 text-muted-foreground/30" />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Status */}
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

        {/* Expand button */}
        <button className="absolute top-4 right-4 p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4 text-foreground" />
        </button>

        {/* Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-medium text-foreground">{name}</h3>
          {room && (
            <p className="text-xs text-muted-foreground mt-1">{room}</p>
          )}
        </div>
      </div>
    </div>
  );
};
