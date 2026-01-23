import { useState, useCallback, useRef, useEffect } from "react";
import { GridPosition, WidgetSize, getWidgetDimensions, canPlaceWidget } from "./useGridLayout";

export type ResizeEdge = "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface ResizeState {
  isResizing: boolean;
  edge: ResizeEdge | null;
  startPosition: GridPosition | null;
  startSize: WidgetSize | null;
  previewPosition: GridPosition | null;
  previewCols: number;
  previewRows: number;
}

interface UseWidgetResizeProps {
  widgetId: string;
  position: GridPosition;
  size: WidgetSize;
  occupiedCells: Set<string>;
  gridCols: number;
  gridRows: number;
  gridRef: React.RefObject<HTMLDivElement>;
  onResize: (newSize: WidgetSize, newPosition: GridPosition) => void;
  isEditMode: boolean;
}

// Convert dimensions to a valid WidgetSize
const dimensionsToSize = (cols: number, rows: number): WidgetSize => {
  if (cols >= 2 && rows >= 2) return "2x2";
  if (cols >= 2) return "2x1";
  if (rows >= 2) return "1x2";
  return "1x1";
};

export const useWidgetResize = ({
  widgetId,
  position,
  size,
  occupiedCells,
  gridCols,
  gridRows,
  gridRef,
  onResize,
  isEditMode,
}: UseWidgetResizeProps) => {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    edge: null,
    startPosition: null,
    startSize: null,
    previewPosition: null,
    previewCols: 0,
    previewRows: 0,
  });

  const initialPointerRef = useRef<{ x: number; y: number } | null>(null);

  const getCellDimensions = useCallback(() => {
    if (!gridRef.current) return { cellWidth: 0, cellHeight: 0 };
    const rect = gridRef.current.getBoundingClientRect();
    return {
      cellWidth: rect.width / gridCols,
      cellHeight: rect.height / gridRows,
    };
  }, [gridRef, gridCols, gridRows]);

  const canResizeTo = useCallback((
    newPos: GridPosition,
    newCols: number,
    newRows: number
  ): boolean => {
    // Check bounds
    if (newPos.col < 0 || newPos.row < 0) return false;
    if (newPos.col + newCols > gridCols) return false;
    if (newPos.row + newRows > gridRows) return false;
    
    // Check for overlaps with other widgets
    for (let r = newPos.row; r < newPos.row + newRows; r++) {
      for (let c = newPos.col; c < newPos.col + newCols; c++) {
        const cellKey = `${c},${r}`;
        if (occupiedCells.has(cellKey)) {
          return false;
        }
      }
    }
    
    return true;
  }, [occupiedCells, gridCols, gridRows]);

  const handleResizeStart = useCallback((
    e: React.PointerEvent,
    edge: ResizeEdge
  ) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const { cols, rows } = getWidgetDimensions(size);
    
    initialPointerRef.current = { x: e.clientX, y: e.clientY };
    
    setResizeState({
      isResizing: true,
      edge,
      startPosition: position,
      startSize: size,
      previewPosition: position,
      previewCols: cols,
      previewRows: rows,
    });
    
    // Capture pointer for tracking outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isEditMode, position, size]);

  const handleResizeMove = useCallback((e: React.PointerEvent) => {
    if (!resizeState.isResizing || !resizeState.startPosition || !resizeState.startSize) return;
    if (!initialPointerRef.current) return;
    
    const { cellWidth, cellHeight } = getCellDimensions();
    if (cellWidth === 0 || cellHeight === 0) return;
    
    const deltaX = e.clientX - initialPointerRef.current.x;
    const deltaY = e.clientY - initialPointerRef.current.y;
    
    const deltaCols = Math.round(deltaX / cellWidth);
    const deltaRows = Math.round(deltaY / cellHeight);
    
    const { cols: startCols, rows: startRows } = getWidgetDimensions(resizeState.startSize);
    const edge = resizeState.edge;
    
    let newCol = resizeState.startPosition.col;
    let newRow = resizeState.startPosition.row;
    let newCols = startCols;
    let newRows = startRows;
    
    // Calculate new dimensions based on which edge is being dragged
    switch (edge) {
      case "right":
        newCols = Math.max(1, Math.min(2, startCols + deltaCols));
        break;
      case "left":
        const leftDelta = Math.max(-resizeState.startPosition.col, Math.min(startCols - 1, -deltaCols));
        newCol = resizeState.startPosition.col - leftDelta;
        newCols = Math.max(1, Math.min(2, startCols + leftDelta));
        break;
      case "bottom":
        newRows = Math.max(1, Math.min(2, startRows + deltaRows));
        break;
      case "top":
        const topDelta = Math.max(-resizeState.startPosition.row, Math.min(startRows - 1, -deltaRows));
        newRow = resizeState.startPosition.row - topDelta;
        newRows = Math.max(1, Math.min(2, startRows + topDelta));
        break;
      case "bottom-right":
        newCols = Math.max(1, Math.min(2, startCols + deltaCols));
        newRows = Math.max(1, Math.min(2, startRows + deltaRows));
        break;
      case "bottom-left":
        const blLeftDelta = Math.max(-resizeState.startPosition.col, Math.min(startCols - 1, -deltaCols));
        newCol = resizeState.startPosition.col - blLeftDelta;
        newCols = Math.max(1, Math.min(2, startCols + blLeftDelta));
        newRows = Math.max(1, Math.min(2, startRows + deltaRows));
        break;
      case "top-right":
        const trTopDelta = Math.max(-resizeState.startPosition.row, Math.min(startRows - 1, -deltaRows));
        newRow = resizeState.startPosition.row - trTopDelta;
        newRows = Math.max(1, Math.min(2, startRows + trTopDelta));
        newCols = Math.max(1, Math.min(2, startCols + deltaCols));
        break;
      case "top-left":
        const tlLeftDelta = Math.max(-resizeState.startPosition.col, Math.min(startCols - 1, -deltaCols));
        const tlTopDelta = Math.max(-resizeState.startPosition.row, Math.min(startRows - 1, -deltaRows));
        newCol = resizeState.startPosition.col - tlLeftDelta;
        newRow = resizeState.startPosition.row - tlTopDelta;
        newCols = Math.max(1, Math.min(2, startCols + tlLeftDelta));
        newRows = Math.max(1, Math.min(2, startRows + tlTopDelta));
        break;
    }
    
    // Validate the new dimensions don't overlap with other widgets
    const newPosition = { col: newCol, row: newRow };
    if (canResizeTo(newPosition, newCols, newRows)) {
      setResizeState(prev => ({
        ...prev,
        previewPosition: newPosition,
        previewCols: newCols,
        previewRows: newRows,
      }));
    }
  }, [resizeState, getCellDimensions, canResizeTo]);

  const handleResizeEnd = useCallback((e: React.PointerEvent) => {
    if (!resizeState.isResizing) return;
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    if (resizeState.previewPosition && resizeState.previewCols > 0 && resizeState.previewRows > 0) {
      const newSize = dimensionsToSize(resizeState.previewCols, resizeState.previewRows);
      onResize(newSize, resizeState.previewPosition);
    }
    
    setResizeState({
      isResizing: false,
      edge: null,
      startPosition: null,
      startSize: null,
      previewPosition: null,
      previewCols: 0,
      previewRows: 0,
    });
    
    initialPointerRef.current = null;
  }, [resizeState, onResize]);

  return {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
};
