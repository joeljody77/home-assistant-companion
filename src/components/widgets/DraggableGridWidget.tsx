import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { WidgetSize, getWidgetDimensions, GridPosition } from "@/hooks/useGridLayout";
import { useWidgetResize } from "@/hooks/useWidgetResize";
import { ResizeHandles } from "./ResizeHandles";

interface DraggableGridWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode?: boolean;
  size: WidgetSize;
  customCols?: number;
  customRows?: number;
  position: GridPosition;
  occupiedCells: Set<string>;
  gridCols: number;
  gridRows: number;
  gridRef: React.RefObject<HTMLDivElement>;
  onResize?: (size: WidgetSize, newPosition: GridPosition, customCols: number, customRows: number) => void;
}

export const DraggableGridWidget = ({ 
  id, 
  children, 
  isEditMode = false, 
  size,
  customCols,
  customRows,
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

  const { cols, rows } = getWidgetDimensions(size, customCols, customRows);

  const {
    resizeState,
    handleResizeStart,
  } = useWidgetResize({
    widgetId: id,
    position,
    size,
    customCols,
    customRows,
    occupiedCells,
    gridCols,
    gridRows,
    gridRef,
    onResize: (newSize, newPosition, newCols, newRows) => onResize?.(newSize, newPosition, newCols, newRows),
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
        "relative h-full w-full min-h-0 min-w-0 transition-all",
        isDragging && "opacity-50 scale-95",
        resizeState.isResizing && "ring-2 ring-primary shadow-lg",
        isEditMode && !resizeState.isResizing && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-2xl",
        isEditMode && "cursor-grab active:cursor-grabbing"
      )}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
    >
      {isEditMode && (
        <ResizeHandles onResizeStart={handleResizeStart} />
      )}
      {/* Ensure children can actually stretch to the grid item's full size */}
      <div className={cn("h-full w-full min-h-0 min-w-0", isEditMode && "pointer-events-none")}>
        {children}
      </div>
    </div>
  );
};
