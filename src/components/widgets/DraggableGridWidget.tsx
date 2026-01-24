// Widget component for draggable grid items
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { X, Pencil } from "lucide-react";
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
  onDelete?: () => void;
  onEdit?: () => void;
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
  onResize,
  onDelete,
  onEdit,
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.();
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
        <>
          <ResizeHandles onResizeStart={handleResizeStart} />
          {/* Edit button */}
          <button
            onClick={handleEdit}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          >
            <Pencil className="w-3 h-3 text-primary-foreground" />
          </button>
          {/* Delete button */}
          <button
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          >
            <X className="w-4 h-4 text-destructive-foreground" />
          </button>
        </>
      )}
      {/* Ensure children can actually stretch to the grid item's full size */}
      <div className={cn("h-full w-full min-h-0 min-w-0", isEditMode && "pointer-events-none")}>
        {children}
      </div>
    </div>
  );
};
