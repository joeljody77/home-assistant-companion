import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { GridPosition, WidgetSize, getWidgetDimensions } from "./useGridLayout";

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
  position,
  size,
  occupiedCells,
  gridCols,
  gridRows,
  gridRef,
  onResize,
  isEditMode,
}: UseWidgetResizeProps) => {
  // ========== 1. useState ==========
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    edge: null,
    startPosition: null,
    startSize: null,
    previewPosition: null,
    previewCols: 0,
    previewRows: 0,
  });

  // ========== 2. useRef ==========
  const initialPointerRef = useRef<{ x: number; y: number } | null>(null);
  const resizeStateRef = useRef(resizeState);

  // ========== 3. useMemo (selfCells) ==========
  const selfCells = useMemo(() => {
    const { cols, rows } = getWidgetDimensions(size);
    const set = new Set<string>();
    for (let r = position.row; r < position.row + rows; r++) {
      for (let c = position.col; c < position.col + cols; c++) {
        set.add(`${c},${r}`);
      }
    }
    return set;
  }, [position.col, position.row, size]);

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
    },
    [isEditMode, position, size]
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
      if (!state.isResizing || !state.startPosition || !state.startSize) return;
      if (!initialPointerRef.current) return;

      const { cellWidth, cellHeight } = getCellDimensions();
      if (cellWidth === 0 || cellHeight === 0) return;

      const deltaX = e.clientX - initialPointerRef.current.x;
      const deltaY = e.clientY - initialPointerRef.current.y;

      const deltaCols = Math.round(deltaX / cellWidth);
      const deltaRows = Math.round(deltaY / cellHeight);

      const { cols: startCols, rows: startRows } = getWidgetDimensions(state.startSize);
      const edge = state.edge;

      let newCol = state.startPosition.col;
      let newRow = state.startPosition.row;
      let newCols = startCols;
      let newRows = startRows;

      // Calculate new dimensions based on which edge is being dragged
      switch (edge) {
        case "right":
          newCols = Math.max(1, Math.min(2, startCols + deltaCols));
          break;
        case "left": {
          const leftDelta = Math.max(
            -state.startPosition.col,
            Math.min(startCols - 1, -deltaCols)
          );
          newCol = state.startPosition.col - leftDelta;
          newCols = Math.max(1, Math.min(2, startCols + leftDelta));
          break;
        }
        case "bottom":
          newRows = Math.max(1, Math.min(2, startRows + deltaRows));
          break;
        case "top": {
          const topDelta = Math.max(
            -state.startPosition.row,
            Math.min(startRows - 1, -deltaRows)
          );
          newRow = state.startPosition.row - topDelta;
          newRows = Math.max(1, Math.min(2, startRows + topDelta));
          break;
        }
        case "bottom-right":
          newCols = Math.max(1, Math.min(2, startCols + deltaCols));
          newRows = Math.max(1, Math.min(2, startRows + deltaRows));
          break;
        case "bottom-left": {
          const blLeftDelta = Math.max(
            -state.startPosition.col,
            Math.min(startCols - 1, -deltaCols)
          );
          newCol = state.startPosition.col - blLeftDelta;
          newCols = Math.max(1, Math.min(2, startCols + blLeftDelta));
          newRows = Math.max(1, Math.min(2, startRows + deltaRows));
          break;
        }
        case "top-right": {
          const trTopDelta = Math.max(
            -state.startPosition.row,
            Math.min(startRows - 1, -deltaRows)
          );
          newRow = state.startPosition.row - trTopDelta;
          newRows = Math.max(1, Math.min(2, startRows + trTopDelta));
          newCols = Math.max(1, Math.min(2, startCols + deltaCols));
          break;
        }
        case "top-left": {
          const tlLeftDelta = Math.max(
            -state.startPosition.col,
            Math.min(startCols - 1, -deltaCols)
          );
          const tlTopDelta = Math.max(
            -state.startPosition.row,
            Math.min(startRows - 1, -deltaRows)
          );
          newCol = state.startPosition.col - tlLeftDelta;
          newRow = state.startPosition.row - tlTopDelta;
          newCols = Math.max(1, Math.min(2, startCols + tlLeftDelta));
          newRows = Math.max(1, Math.min(2, startRows + tlTopDelta));
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
        onResize(newSize, state.previewPosition);
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
  }, [resizeState.isResizing, getCellDimensions, canResizeTo, onResize]);

  return {
    resizeState,
    handleResizeStart,
  };
};
