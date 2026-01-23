import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface GridCellProps {
  col: number;
  row: number;
  isOccupied: boolean;
  isEditMode: boolean;
}

export const GridCell = ({ col, row, isOccupied, isEditMode }: GridCellProps) => {
  const cellId = `cell-${col}-${row}`;
  
  const { isOver, setNodeRef } = useDroppable({
    id: cellId,
    data: {
      type: "cell",
      col,
      row,
    },
    disabled: isOccupied || !isEditMode,
  });

  if (!isEditMode) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute inset-0 rounded-lg border-2 border-dashed transition-colors pointer-events-none",
        isOccupied 
          ? "border-transparent" 
          : "border-muted-foreground/20",
        isOver && !isOccupied && "border-primary bg-primary/10"
      )}
      style={{
        gridColumn: col + 1,
        gridRow: row + 1,
      }}
    />
  );
};
