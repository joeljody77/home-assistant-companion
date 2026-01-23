import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { GridPosition, WidgetSize, getWidgetDimensions } from "./useGridLayout";

export type ResizeEdge = "top" | "right" | "bottom" | "left" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface ResizeState {
  isResizing: boolean;
  edge: ResizeEdge | null;
  startPosition: GridPosition | null;
  startCols: number;
  startRows: number;
  previewPosition: GridPosition | null;
  previewCols: number;
  previewRows: number;
}

interface UseWidgetResizeProps {
  widgetId: string;
  position: GridPosition;
  size: WidgetSize;
  customCols?: number;
  customRows?: number;
  occupiedCells: Set<string>;
  gridCols: number;
  gridRows: number;
  gridRef: React.RefObject<HTMLDivElement>;
  onResize: (newSize: WidgetSize, newPosition: GridPosition, customCols: number, customRows: number) => void;
  isEditMode: boolean;
}

// Convert dimensions to a WidgetSize string (for backward compatibility)
const dimensionsToSize = (cols: number, rows: number): WidgetSize => {
  if (cols >= 2 && rows >= 2) return "2x2";
  if (cols >= 2) return "2x1";
  if (rows >= 2) return "1x2";
  return "1x1";
};

export const useWidgetResize = ({
  position,
  size,
  customCols,
  customRows,
  occupiedCells,
  gridCols,
  gridRows,
  gridRef,
  onResize,
  isEditMode,
}: UseWidgetResizeProps) => {
  // Get actual dimensions
  const { cols: currentCols, rows: currentRows } = getWidgetDimensions(size, customCols, customRows);

  // ========== 1. useState ==========
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    edge: null,
    startPosition: null,
    startCols: 0,
    startRows: 0,
    previewPosition: null,
    previewCols: 0,
    previewRows: 0,
  });

  // ========== 2. useRef ==========
  const initialPointerRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStateRef = useRef(resizeState);

  // ========== 3. useMemo (selfCells) ==========
  const selfCells = useMemo(() => {
    const set = new Set<string>();
    for (let r = position.row; r < position.row + currentRows; r++) {
      for (let c = position.col; c < position.col + currentCols; c++) {
        set.add(`${c},${r}`);
      }
    }
    return set;
  }, [position.col, position.row, currentCols, currentRows]);

  // ========== 4. useCallback (getCellDimensions) ==========
  const getCellDimensions = useCallback(() => {
    if (!gridRef.current) return { cellWidth: 0, cellHeight: 0 };
    const rect = gridRef.current.getBoundingClientRect();
    return {
      cellWidth: rect.width / gridCols,
      cellHeight: rect.height / gridRows,
    };
  }, [gridRef, gridCols, gridRows]);

  // ========== 5. useCallback (canResizeTo) ==========
  const canResizeTo = useCallback(
    (newPos: GridPosition, newCols: number, newRows: number): boolean => {
      // Check bounds
      if (newPos.col < 0 || newPos.row < 0) return false;
      if (newPos.col + newCols > gridCols) return false;
      if (newPos.row + newRows > gridRows) return false;

      // Check for overlaps with other widgets (excluding self)
      for (let r = newPos.row; r < newPos.row + newRows; r++) {
        for (let c = newPos.col; c < newPos.col + newCols; c++) {
          const cellKey = `${c},${r}`;
          if (occupiedCells.has(cellKey) && !selfCells.has(cellKey)) {
            return false;
          }
        }
      }

      return true;
    },
    [occupiedCells, selfCells, gridCols, gridRows]
  );

  // ========== 6. useCallback (handleResizeStart) ==========
  const handleResizeStart = useCallback(
    (e: React.PointerEvent, edge: ResizeEdge) => {
      if (!isEditMode) return;

      e.preventDefault();
      e.stopPropagation();

      // Capture pointer so events continue even when pointer leaves the handle
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // no-op
      }

      initialPointerRef.current = { x: e.clientX, y: e.clientY };

      setResizeState({
        isResizing: true,
        edge,
        startPosition: position,
        startCols: currentCols,
        startRows: currentRows,
        previewPosition: position,
        previewCols: currentCols,
        previewRows: currentRows,
      });
    },
    [isEditMode, position, currentCols, currentRows]
  );

  // ========== 7. useEffect (sync resizeStateRef) ==========
  useEffect(() => {
    resizeStateRef.current = resizeState;
  }, [resizeState]);

  // ========== 8. useEffect (document listeners) ==========
  useEffect(() => {
    if (!resizeState.isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const state = resizeStateRef.current;
      if (!state.isResizing || !state.startPosition) return;
      if (!initialPointerRef.current) return;

      const { cellWidth, cellHeight } = getCellDimensions();
      if (cellWidth === 0 || cellHeight === 0) return;

      const deltaX = e.clientX - initialPointerRef.current.x;
      const deltaY = e.clientY - initialPointerRef.current.y;

      const deltaCols = Math.round(deltaX / cellWidth);
      const deltaRows = Math.round(deltaY / cellHeight);

      const startCols = state.startCols;
      const startRows = state.startRows;
      const edge = state.edge;

      let newCol = state.startPosition.col;
      let newRow = state.startPosition.row;
      let newCols = startCols;
      let newRows = startRows;

      // Calculate new dimensions based on which edge is being dragged
      // For right/bottom: positive delta = grow
      // For left/top: positive delta = shrink (negative = grow)
      
      // Maximum bounds based on grid size
      const maxColsRight = gridCols - state.startPosition.col;
      const maxRowsBottom = gridRows - state.startPosition.row;

      switch (edge) {
        case "right":
          newCols = Math.max(1, Math.min(maxColsRight, startCols + deltaCols));
          break;
        case "left": {
          // Dragging left: negative deltaCols = grow left, positive = shrink
          const colChange = -deltaCols; // Invert: drag left (negative delta) should grow
          const maxGrow = state.startPosition.col; // Can't go past column 0
          const maxShrink = startCols - 1; // Must keep at least 1 column
          const clampedChange = Math.max(-maxShrink, Math.min(maxGrow, colChange));
          newCol = state.startPosition.col - clampedChange;
          newCols = startCols + clampedChange;
          break;
        }
        case "bottom":
          newRows = Math.max(1, Math.min(maxRowsBottom, startRows + deltaRows));
          break;
        case "top": {
          // Dragging top: negative deltaRows = grow up, positive = shrink
          const rowChange = -deltaRows;
          const maxGrow = state.startPosition.row;
          const maxShrink = startRows - 1;
          const clampedChange = Math.max(-maxShrink, Math.min(maxGrow, rowChange));
          newRow = state.startPosition.row - clampedChange;
          newRows = startRows + clampedChange;
          break;
        }
        case "bottom-right":
          newCols = Math.max(1, Math.min(maxColsRight, startCols + deltaCols));
          newRows = Math.max(1, Math.min(maxRowsBottom, startRows + deltaRows));
          break;
        case "bottom-left": {
          const colChange = -deltaCols;
          const maxGrow = state.startPosition.col;
          const maxShrink = startCols - 1;
          const clampedChange = Math.max(-maxShrink, Math.min(maxGrow, colChange));
          newCol = state.startPosition.col - clampedChange;
          newCols = startCols + clampedChange;
          newRows = Math.max(1, Math.min(maxRowsBottom, startRows + deltaRows));
          break;
        }
        case "top-right": {
          const rowChange = -deltaRows;
          const maxGrow = state.startPosition.row;
          const maxShrink = startRows - 1;
          const clampedChange = Math.max(-maxShrink, Math.min(maxGrow, rowChange));
          newRow = state.startPosition.row - clampedChange;
          newRows = startRows + clampedChange;
          newCols = Math.max(1, Math.min(maxColsRight, startCols + deltaCols));
          break;
        }
        case "top-left": {
          const colChange = -deltaCols;
          const maxColGrow = state.startPosition.col;
          const maxColShrink = startCols - 1;
          const clampedColChange = Math.max(-maxColShrink, Math.min(maxColGrow, colChange));
          newCol = state.startPosition.col - clampedColChange;
          newCols = startCols + clampedColChange;

          const rowChange = -deltaRows;
          const maxRowGrow = state.startPosition.row;
          const maxRowShrink = startRows - 1;
          const clampedRowChange = Math.max(-maxRowShrink, Math.min(maxRowGrow, rowChange));
          newRow = state.startPosition.row - clampedRowChange;
          newRows = startRows + clampedRowChange;
          break;
        }
      }

      // Validate the new dimensions don't overlap with other widgets
      const newPosition = { col: newCol, row: newRow };
      if (canResizeTo(newPosition, newCols, newRows)) {
        setResizeState((prev) => ({
          ...prev,
          previewPosition: newPosition,
          previewCols: newCols,
          previewRows: newRows,
        }));
      }
    };

    const handlePointerUp = () => {
      const state = resizeStateRef.current;

      if (state.previewPosition && state.previewCols > 0 && state.previewRows > 0) {
        const newSize = dimensionsToSize(state.previewCols, state.previewRows);
        onResize(newSize, state.previewPosition, state.previewCols, state.previewRows);
      }

      setResizeState({
        isResizing: false,
        edge: null,
        startPosition: null,
        startCols: 0,
        startRows: 0,
        previewPosition: null,
        previewCols: 0,
        previewRows: 0,
      });

      initialPointerRef.current = null;
    };

    // Use capture phase to intercept before dnd-kit
    document.addEventListener("pointermove", handlePointerMove, { capture: true });
    document.addEventListener("pointerup", handlePointerUp, { capture: true });
    document.addEventListener("pointercancel", handlePointerUp, { capture: true });

    return () => {
      document.removeEventListener("pointermove", handlePointerMove, { capture: true });
      document.removeEventListener("pointerup", handlePointerUp, { capture: true });
      document.removeEventListener("pointercancel", handlePointerUp, { capture: true });
    };
  }, [resizeState.isResizing, getCellDimensions, canResizeTo, onResize, gridCols, gridRows]);

  return {
    resizeState,
    handleResizeStart,
  };
};
