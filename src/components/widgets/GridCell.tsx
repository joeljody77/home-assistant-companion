import { cn } from "@/lib/utils";

interface GridCellProps {
  col: number;
  row: number;
  isEditMode: boolean;
}

export const GridCell = ({ col, row, isEditMode }: GridCellProps) => {
  if (!isEditMode) return null;

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed border-muted-foreground/20 pointer-events-none"
      )}
      style={{
        gridColumn: col + 1,
        gridRow: row + 1,
      }}
    />
  );
};
