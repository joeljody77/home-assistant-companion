import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetSize, getWidgetDimensions, GridPosition } from "@/hooks/useGridLayout";
import { useWidgetResize } from "@/hooks/useWidgetResize";
import { ResizeHandles } from "./ResizeHandles";

interface DraggableGridWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode?: boolean;
  size: WidgetSize;
  position: GridPosition;
  occupiedCells: Set<string>;
  gridCols: number;
  gridRows: number;
  gridRef: React.RefObject<HTMLDivElement>;
  onResize?: (size: WidgetSize, newPosition: GridPosition) => void;
}

export const DraggableGridWidget = ({ 
  id, 
  children, 
  isEditMode = false, 
  size,
  position,
  occupiedCells,
  gridCols,
  gridRows,
  gridRef,
  onResize 
}: DraggableGridWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id,
    data: {
      type: "widget",
      size,
      position,
    },
    disabled: !isEditMode,
  });

  const { cols, rows } = getWidgetDimensions(size);

  const {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  } = useWidgetResize({
    widgetId: id,
    position,
    size,
    occupiedCells,
    gridCols,
    gridRows,
    gridRef,
    onResize: (newSize, newPosition) => onResize?.(newSize, newPosition),
    isEditMode,
  });

  // Use preview dimensions during resize, otherwise use actual dimensions
  const displayCols = resizeState.isResizing ? resizeState.previewCols : cols;
  const displayRows = resizeState.isResizing ? resizeState.previewRows : rows;
  const displayPosition = resizeState.isResizing && resizeState.previewPosition 
    ? resizeState.previewPosition 
    : position;

  const style = {
    transform: CSS.Transform.toString(transform),
    gridColumn: `${displayPosition.col + 1} / span ${displayCols}`,
    gridRow: `${displayPosition.row + 1} / span ${displayRows}`,
    zIndex: isDragging || resizeState.isResizing ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative h-full transition-all",
        isDragging && "opacity-50 scale-95",
        resizeState.isResizing && "ring-2 ring-primary shadow-lg",
        isEditMode && !resizeState.isResizing && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-2xl"
      )}
    >
      {isEditMode && (
        <>
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="absolute -top-2 -right-2 z-30 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Resize handles on edges and corners */}
          <ResizeHandles
            onResizeStart={handleResizeStart}
            onResizeMove={handleResizeMove}
            onResizeEnd={handleResizeEnd}
            isResizing={resizeState.isResizing}
          />
        </>
      )}
      {children}
    </div>
  );
};
