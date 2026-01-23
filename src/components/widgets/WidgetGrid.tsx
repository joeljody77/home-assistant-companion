import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
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
import { WidgetConfig, WidgetSize, GridPosition, getPageOccupiedCells } from "@/hooks/useGridLayout";

interface WidgetGridProps {
  widgets: WidgetConfig[];
  isEditMode: boolean;
  gridCols: number;
  gridRows: number;
  onMoveWidget: (widgetId: string, targetPosition: GridPosition) => void;
  onResizeWidget: (widgetId: string, newSize: WidgetSize) => void;
}

export const WidgetGrid = ({
  widgets,
  isEditMode,
  gridCols,
  gridRows,
  onMoveWidget,
  onResizeWidget,
}: WidgetGridProps) => {
  const [activeWidget, setActiveWidget] = useState<WidgetConfig | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate all grid cells for drop targets
  const gridCells = useMemo(() => {
    const cells: { col: number; row: number; isOccupied: boolean }[] = [];
    const occupiedCells = getPageOccupiedCells(widgets, activeWidget?.id);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const cellKey = `${col},${row}`;
        cells.push({
          col,
          row,
          isOccupied: occupiedCells.has(cellKey),
        });
      }
    }
    return cells;
  }, [widgets, gridCols, gridRows, activeWidget?.id]);

  const handleDragStart = (event: DragStartEvent) => {
    const widget = widgets.find(w => w.id === event.active.id);
    if (widget) {
      setActiveWidget(widget);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWidget(null);

    if (!over) return;

    const widgetId = active.id as string;
    const overData = over.data.current;

    if (overData?.type === "cell") {
      // Dropped on a cell
      const targetPosition: GridPosition = {
        col: overData.col,
        row: overData.row,
      };
      onMoveWidget(widgetId, targetPosition);
    } else if (overData?.type === "widget") {
      // Dropped on another widget - swap positions
      const targetWidget = widgets.find(w => w.id === over.id);
      if (targetWidget?.position) {
        onMoveWidget(widgetId, targetWidget.position);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="h-full grid gap-3 animate-fade-in relative"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        }}
      >
        {/* Grid cell drop targets (only in edit mode) */}
        {isEditMode && gridCells.map(({ col, row, isOccupied }) => (
          <GridCell
            key={`cell-${col}-${row}`}
            col={col}
            row={row}
            isOccupied={isOccupied}
            isEditMode={isEditMode}
          />
        ))}

        {/* Widgets */}
        {widgets.map((widget) => (
          widget.position && (
            <DraggableGridWidget
              key={widget.id}
              id={widget.id}
              isEditMode={isEditMode}
              size={widget.size}
              position={widget.position}
              onResize={(newSize) => onResizeWidget(widget.id, newSize)}
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
