import { cn } from "@/lib/utils";
import { ResizeEdge } from "@/hooks/useWidgetResize";

interface ResizeHandlesProps {
  onResizeStart: (e: React.PointerEvent, edge: ResizeEdge) => void;
  onResizeMove: (e: React.PointerEvent) => void;
  onResizeEnd: (e: React.PointerEvent) => void;
  isResizing: boolean;
}

const handleBaseClass = "absolute bg-primary/50 hover:bg-primary transition-colors z-20 touch-none";

export const ResizeHandles = ({
  onResizeStart,
  onResizeMove,
  onResizeEnd,
}: ResizeHandlesProps) => {
  const createHandleProps = (edge: ResizeEdge) => ({
    onPointerDown: (e: React.PointerEvent) => onResizeStart(e, edge),
    onPointerMove: onResizeMove,
    onPointerUp: onResizeEnd,
    onPointerCancel: onResizeEnd,
  });

  return (
    <>
      {/* Edge handles */}
      {/* Top edge */}
      <div
        {...createHandleProps("top")}
        className={cn(
          handleBaseClass,
          "top-0 left-2 right-2 h-1.5 cursor-n-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Right edge */}
      <div
        {...createHandleProps("right")}
        className={cn(
          handleBaseClass,
          "right-0 top-2 bottom-2 w-1.5 cursor-e-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Bottom edge */}
      <div
        {...createHandleProps("bottom")}
        className={cn(
          handleBaseClass,
          "bottom-0 left-2 right-2 h-1.5 cursor-s-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Left edge */}
      <div
        {...createHandleProps("left")}
        className={cn(
          handleBaseClass,
          "left-0 top-2 bottom-2 w-1.5 cursor-w-resize rounded-full opacity-0 hover:opacity-100"
        )}
      />

      {/* Corner handles */}
      {/* Top-left corner */}
      <div
        {...createHandleProps("top-left")}
        className={cn(
          handleBaseClass,
          "top-0 left-0 w-3 h-3 cursor-nw-resize rounded-tl-xl opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Top-right corner */}
      <div
        {...createHandleProps("top-right")}
        className={cn(
          handleBaseClass,
          "top-0 right-0 w-3 h-3 cursor-ne-resize rounded-tr-xl opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Bottom-right corner */}
      <div
        {...createHandleProps("bottom-right")}
        className={cn(
          handleBaseClass,
          "bottom-0 right-0 w-3 h-3 cursor-se-resize rounded-br-xl opacity-0 hover:opacity-100"
        )}
      />
      
      {/* Bottom-left corner */}
      <div
        {...createHandleProps("bottom-left")}
        className={cn(
          handleBaseClass,
          "bottom-0 left-0 w-3 h-3 cursor-sw-resize rounded-bl-xl opacity-0 hover:opacity-100"
        )}
      />
    </>
  );
};
