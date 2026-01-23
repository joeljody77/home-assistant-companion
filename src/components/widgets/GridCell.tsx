import { cn } from "@/lib/utils";

interface GridCellProps {
  col: number;
  row: number;
  isEditMode: boolean;
  isCellSelectionMode?: boolean;
  isOccupied?: boolean;
  isSelected?: boolean;
  onCellSelect?: (col: number, row: number) => void;
}

export const GridCell = ({ 
  col, 
  row, 
  isEditMode,
  isCellSelectionMode = false,
  isOccupied = false,
  isSelected = false,
  onCellSelect,
}: GridCellProps) => {
  if (!isEditMode) return null;

  const isAvailable = isCellSelectionMode && !isOccupied;
  const isClickable = isAvailable && !isSelected;

  const handleClick = () => {
    if (isClickable && onCellSelect) {
      onCellSelect(col, row);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "rounded-lg border-2 border-dashed transition-all duration-200",
        // Default edit mode style
        !isCellSelectionMode && "border-muted-foreground/20 pointer-events-none",
        // Cell selection mode - available cells
        isAvailable && !isSelected && "border-primary/50 bg-primary/10 cursor-pointer active:scale-95 active:bg-primary/20",
        // Cell selection mode - selected cell
        isSelected && "border-primary bg-primary/30 ring-2 ring-primary/50",
        // Cell selection mode - occupied cells
        isCellSelectionMode && isOccupied && "border-muted-foreground/10 bg-muted/20 pointer-events-none opacity-50"
      )}
      style={{
        gridColumn: col + 1,
        gridRow: row + 1,
      }}
    />
  );
};
