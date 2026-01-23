import { useMemo, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { DraggableGridWidget } from "./DraggableGridWidget";
import { WidgetRenderer } from "./WidgetRenderer";
import { GridCell } from "./GridCell";
import { DragPreviewOverlay } from "./DragPreviewOverlay";
import { WidgetConfig, WidgetSize, GridPosition, getPageOccupiedCells } from "@/hooks/useGridLayout";

interface WidgetGridProps {
  widgets: WidgetConfig[];
  isEditMode: boolean;
  gridCols: number;
  gridRows: number;
  onMoveWidget: (widgetId: string, targetPosition: GridPosition) => void;
  onResizeWidget: (widgetId: string, newSize: WidgetSize, newPosition: GridPosition, customCols?: number, customRows?: number) => void;
  onDeleteWidget: (widgetId: string) => void;
  isCellSelectionMode?: boolean;
  occupiedCells?: Set<string>;
  selectedCell?: GridPosition | null;
  onCellSelect?: (col: number, row: number) => void;
}

export const WidgetGrid = ({
  widgets,
  isEditMode,
  gridCols,
  gridRows,
  onMoveWidget,
  onResizeWidget,
  onDeleteWidget,
  isCellSelectionMode = false,
  occupiedCells,
  selectedCell,
  onCellSelect,
}: WidgetGridProps) => {
  const [activeWidget, setActiveWidget] = useState<WidgetConfig | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridPosition | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate all grid cells for visual grid lines
  const gridCells = useMemo(() => {
    const cells: { col: number; row: number }[] = [];
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        cells.push({ col, row });
      }
    }
    return cells;
  }, [gridCols, gridRows]);

  const handleDragStart = (event: DragStartEvent) => {
    const widget = widgets.find(w => w.id === event.active.id);
    if (widget) {
      setActiveWidget(widget);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!gridRef.current || !activeWidget) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const pointer = event.activatorEvent as PointerEvent;
    
    // Calculate pointer position relative to grid
    const relativeX = pointer.clientX + event.delta.x - gridRect.left;
    const relativeY = pointer.clientY + event.delta.y - gridRect.top;
    
    // Calculate cell size
    const cellWidth = gridRect.width / gridCols;
    const cellHeight = gridRect.height / gridRows;
    
    // Determine which cell the pointer is over
    const col = Math.floor(relativeX / cellWidth);
    const row = Math.floor(relativeY / cellHeight);
    
    // Clamp to valid grid bounds
    const clampedCol = Math.max(0, Math.min(col, gridCols - 1));
    const clampedRow = Math.max(0, Math.min(row, gridRows - 1));
    
    setHoveredCell({ col: clampedCol, row: clampedRow });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    setActiveWidget(null);
    setHoveredCell(null);

    if (!hoveredCell) return;

    const widgetId = active.id as string;
    onMoveWidget(widgetId, hoveredCell);
  };

  // Get occupied cells excluding the active widget for collision detection
  const occupiedCellsForPreview = useMemo(() => {
    return getPageOccupiedCells(widgets, activeWidget?.id);
  }, [widgets, activeWidget?.id]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={gridRef}
        className="h-full grid gap-3 animate-fade-in relative"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}
      >
        {/* Grid cell drop targets (only in edit mode) */}
        {isEditMode && gridCells.map(({ col, row }) => {
          const cellKey = `${col},${row}`;
          const isOccupied = occupiedCells?.has(cellKey) ?? false;
          const isSelected = selectedCell?.col === col && selectedCell?.row === row;
          
          return (
            <GridCell
              key={`cell-${col}-${row}`}
              col={col}
              row={row}
              isEditMode={isEditMode}
              isCellSelectionMode={isCellSelectionMode}
              isOccupied={isOccupied}
              isSelected={isSelected}
              onCellSelect={onCellSelect}
            />
          );
        })}

        {/* Drag preview overlay showing where widget will land */}
        {activeWidget && hoveredCell && (
          <DragPreviewOverlay
            hoveredCell={hoveredCell}
            widgetSize={activeWidget.size}
            customCols={activeWidget.customCols}
            customRows={activeWidget.customRows}
            occupiedCells={occupiedCellsForPreview}
            gridCols={gridCols}
            gridRows={gridRows}
          />
        )}

        {/* Widgets */}
        {widgets.map((widget) => (
          widget.position && (
            <DraggableGridWidget
              key={widget.id}
              id={widget.id}
              isEditMode={isEditMode}
              size={widget.size}
              customCols={widget.customCols}
              customRows={widget.customRows}
              position={widget.position}
              occupiedCells={occupiedCellsForPreview}
              gridCols={gridCols}
              gridRows={gridRows}
              gridRef={gridRef as React.RefObject<HTMLDivElement>}
              onResize={(newSize, newPosition, cols, rows) => onResizeWidget(widget.id, newSize, newPosition, cols, rows)}
              onDelete={() => onDeleteWidget(widget.id)}
            >
              <WidgetRenderer widget={widget} />
            </DraggableGridWidget>
          )
        ))}
      </div>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeWidget && activeWidget.position && (
          <div className="opacity-80 scale-105">
            <WidgetRenderer widget={activeWidget} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
