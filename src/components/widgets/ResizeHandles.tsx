import { cn } from "@/lib/utils";
import { ResizeEdge } from "@/hooks/useWidgetResize";

interface ResizeHandlesProps {
  onResizeStart: (e: React.PointerEvent, edge: ResizeEdge) => void;
}

const handleBaseClass = "absolute bg-primary/50 hover:bg-primary transition-colors z-20 touch-none";

export const ResizeHandles = ({
  onResizeStart,
}: ResizeHandlesProps) => {
  return (
    <>
      {/* Edge handles */}
      {/* Top edge */}
      <div
        onPointerDown={(e) => onResizeStart(e, "top")}
        className={cn(
          handleBaseClass,
          "top-0 left-2 right-2 h-1.5 cursor-n-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Right edge */}
      <div
        onPointerDown={(e) => onResizeStart(e, "right")}
        className={cn(
          handleBaseClass,
          "right-0 top-2 bottom-2 w-1.5 cursor-e-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Bottom edge */}
      <div
        onPointerDown={(e) => onResizeStart(e, "bottom")}
        className={cn(
          handleBaseClass,
          "bottom-0 left-2 right-2 h-1.5 cursor-s-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Left edge */}
      <div
        onPointerDown={(e) => onResizeStart(e, "left")}
        className={cn(
          handleBaseClass,
          "left-0 top-2 bottom-2 w-1.5 cursor-w-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />

      {/* Corner handles */}
      {/* Top-left corner */}
      <div
        onPointerDown={(e) => onResizeStart(e, "top-left")}
        className={cn(
          handleBaseClass,
          "top-0 left-0 w-3 h-3 cursor-nw-resize rounded-tl-xl opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Top-right corner */}
      <div
        onPointerDown={(e) => onResizeStart(e, "top-right")}
        className={cn(
          handleBaseClass,
          "top-0 right-0 w-3 h-3 cursor-ne-resize rounded-tr-xl opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Bottom-right corner */}
      <div
        onPointerDown={(e) => onResizeStart(e, "bottom-right")}
        className={cn(
          handleBaseClass,
          "bottom-0 right-0 w-3 h-3 cursor-se-resize rounded-br-xl opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Bottom-left corner */}
      <div
        onPointerDown={(e) => onResizeStart(e, "bottom-left")}
        className={cn(
          handleBaseClass,
          "bottom-0 left-0 w-3 h-3 cursor-sw-resize rounded-bl-xl opacity-0 hover:opacity-100"
        )}
      />
    </>
  );
};
