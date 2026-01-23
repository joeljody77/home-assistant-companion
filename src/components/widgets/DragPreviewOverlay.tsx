import { WidgetSize, GridPosition, getWidgetDimensions, getOccupiedCells } from "@/hooks/useGridLayout";
import { cn } from "@/lib/utils";

interface DragPreviewOverlayProps {
  hoveredCell: GridPosition;
  widgetSize: WidgetSize;
  occupiedCells: Set<string>;
  gridCols: number;
  gridRows: number;
}

export const DragPreviewOverlay = ({
  hoveredCell,
  widgetSize,
  occupiedCells,
  gridCols,
  gridRows,
}: DragPreviewOverlayProps) => {
  const { cols, rows } = getWidgetDimensions(widgetSize);
  
  // Only show preview for multi-cell widgets
  const isMultiCell = cols > 1 || rows > 1;
  if (!isMultiCell) return null;
  
  // Check if placement is valid (within bounds and no collisions)
  const isWithinBounds = 
    hoveredCell.col + cols <= gridCols && 
    hoveredCell.row + rows <= gridRows;
  
  const previewCells = getOccupiedCells(hoveredCell, widgetSize);
  const hasCollision = previewCells.some(cell => occupiedCells.has(cell));
  
  const isValid = isWithinBounds && !hasCollision;

  return (
    <div
      className={cn(
        "rounded-lg border-2 transition-all duration-150 pointer-events-none z-10",
        isValid
          ? "bg-primary/20 border-primary"
          : "bg-destructive/20 border-destructive border-dashed"
      )}
      style={{
        gridColumn: `${hoveredCell.col + 1} / span ${cols}`,
        gridRow: `${hoveredCell.row + 1} / span ${rows}`,
      }}
    />
  );
};
