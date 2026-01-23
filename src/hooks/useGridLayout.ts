import { useState, useCallback, useMemo, useEffect } from "react";
import { DensityPreset, getWidgetCellCount } from "./useDensityConfig";

export type WidgetSize = "1x1" | "2x1" | "1x2" | "2x2";

export interface GridPosition {
  col: number;
  row: number;
}

export interface WidgetConfig {
  id: string;
  type: string;
  props: Record<string, unknown>;
  size: WidgetSize;
  position?: GridPosition; // Optional - will be auto-assigned if not set
  // Custom dimensions that override the size-based defaults (for arbitrary sizing)
  customCols?: number;
  customRows?: number;
}

const defaultWidgets: WidgetConfig[] = [
  { id: "weather-1", type: "weather", props: { location: "San Francisco", temperature: 18, condition: "cloudy", high: 22, low: 14, humidity: 65 }, size: "2x1" },
  { id: "climate-1", type: "climate", props: { name: "Thermostat", currentTemp: 21, targetTemp: 22, humidity: 45, mode: "auto" }, size: "2x1" },
  { id: "light-1", type: "light", props: { name: "Main Light", room: "Living Room", initialState: true, initialBrightness: 80 }, size: "1x1" },
  { id: "light-2", type: "light", props: { name: "Desk Lamp", room: "Office", initialState: false, initialBrightness: 60 }, size: "1x1" },
  { id: "light-3", type: "light", props: { name: "Ceiling Light", room: "Bedroom", initialState: true, initialBrightness: 40 }, size: "1x1" },
  { id: "light-4", type: "light", props: { name: "Kitchen Lights", room: "Kitchen", initialState: true, initialBrightness: 100 }, size: "1x1" },
  { id: "scene-1", type: "scene", props: { name: "Good Night", type: "night", deviceCount: 8 }, size: "1x1" },
  { id: "scene-2", type: "scene", props: { name: "Movie Time", type: "movie", deviceCount: 5 }, size: "1x1" },
  { id: "scene-3", type: "scene", props: { name: "Morning", type: "morning", deviceCount: 6 }, size: "1x1" },
  { id: "scene-4", type: "scene", props: { name: "Relax", type: "relax", deviceCount: 4 }, size: "1x1" },
  { id: "camera-1", type: "camera", props: { name: "Front Door", room: "Entrance", isOnline: true }, size: "2x2" },
  { id: "sensor-1", type: "sensor", props: { name: "Temperature", type: "temperature", value: 21.5, unit: "°C", room: "Living Room" }, size: "1x1" },
  { id: "sensor-2", type: "sensor", props: { name: "Humidity", type: "humidity", value: 45, unit: "%", room: "Living Room" }, size: "1x1" },
  { id: "sensor-3", type: "sensor", props: { name: "Power Usage", type: "power", value: 2.4, unit: "kW" }, size: "1x1" },
  { id: "sensor-4", type: "sensor", props: { name: "Light Level", type: "light", value: 340, unit: "lux", room: "Office" }, size: "1x1" },
  { id: "media-1", type: "media", props: { name: "Living Room Speaker", artist: "Daft Punk", track: "Get Lucky" }, size: "2x1" },
  { id: "switch-1", type: "switch", props: { name: "TV", type: "tv", room: "Living Room", initialState: true }, size: "1x1" },
  { id: "switch-2", type: "switch", props: { name: "Fan", type: "fan", room: "Bedroom", initialState: false }, size: "1x1" },
  { id: "lock-1", type: "lock", props: { name: "Front Door", room: "Entrance", initialState: true }, size: "1x1" },
  { id: "lock-2", type: "lock", props: { name: "Back Door", room: "Garden", initialState: true }, size: "1x1" },
  { id: "switch-3", type: "switch", props: { name: "Coffee Machine", type: "plug", room: "Kitchen", initialState: false }, size: "1x1" },
  { id: "switch-4", type: "switch", props: { name: "Speaker", type: "speaker", room: "Office", initialState: true }, size: "1x1" },
];

const STORAGE_KEY = "dashboard-grid-layout-v3";

const loadLayout = (): WidgetConfig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load layout:", e);
  }
  return defaultWidgets;
};

const saveLayout = (widgets: WidgetConfig[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch (e) {
    console.error("Failed to save layout:", e);
  }
};

// Get widget dimensions from size or custom dimensions
export const getWidgetDimensions = (size: WidgetSize, customCols?: number, customRows?: number): { cols: number; rows: number } => {
  // If custom dimensions are provided, use them
  if (customCols !== undefined && customRows !== undefined) {
    return { cols: customCols, rows: customRows };
  }
  
  // Fall back to size-based dimensions
  switch (size) {
    case "2x1":
      return { cols: 2, rows: 1 };
    case "1x2":
      return { cols: 1, rows: 2 };
    case "2x2":
      return { cols: 2, rows: 2 };
    default:
      return { cols: 1, rows: 1 };
  }
};

// Check if a widget can be placed at a position without overlapping
export const canPlaceWidget = (
  position: GridPosition,
  size: WidgetSize,
  occupiedCells: Set<string>,
  gridCols: number,
  gridRows: number,
  excludeWidgetId?: string,
  customCols?: number,
  customRows?: number
): boolean => {
  const { cols, rows } = getWidgetDimensions(size, customCols, customRows);
  
  // Check bounds
  if (position.col < 0 || position.row < 0) return false;
  if (position.col + cols > gridCols) return false;
  if (position.row + rows > gridRows) return false;
  
  // Check for overlaps
  for (let r = position.row; r < position.row + rows; r++) {
    for (let c = position.col; c < position.col + cols; c++) {
      const cellKey = `${c},${r}`;
      if (occupiedCells.has(cellKey)) {
        return false;
      }
    }
  }
  
  return true;
};

// Get all cells occupied by a widget
export const getOccupiedCells = (position: GridPosition, size: WidgetSize, customCols?: number, customRows?: number): string[] => {
  const { cols, rows } = getWidgetDimensions(size, customCols, customRows);
  const cells: string[] = [];
  
  for (let r = position.row; r < position.row + rows; r++) {
    for (let c = position.col; c < position.col + cols; c++) {
      cells.push(`${c},${r}`);
    }
  }
  
  return cells;
};

// Check if a widget's existing position is valid within the current grid
const isPositionValid = (
  position: GridPosition,
  size: WidgetSize,
  gridCols: number,
  gridRows: number,
  customCols?: number,
  customRows?: number
): boolean => {
  const { cols, rows } = getWidgetDimensions(size, customCols, customRows);
  return (
    position.col >= 0 &&
    position.row >= 0 &&
    position.col + cols <= gridCols &&
    position.row + rows <= gridRows
  );
};

// Auto-place widgets on a grid, respecting existing positions when valid
export const autoPlaceWidgets = (
  widgets: WidgetConfig[],
  gridCols: number,
  gridRows: number
): { pages: WidgetConfig[][]; totalPages: number } => {
  const pages: WidgetConfig[][] = [];
  let currentPage: WidgetConfig[] = [];
  let occupiedCells = new Set<string>();
  
  // Separate widgets with valid positions from those needing placement
  const widgetsWithValidPositions: WidgetConfig[] = [];
  const widgetsNeedingPlacement: WidgetConfig[] = [];
  
  for (const widget of widgets) {
    if (widget.position && isPositionValid(widget.position, widget.size, gridCols, gridRows, widget.customCols, widget.customRows)) {
      widgetsWithValidPositions.push(widget);
    } else {
      widgetsNeedingPlacement.push(widget);
    }
  }
  
  // Sort positioned widgets by their grid position (top-left to bottom-right)
  // This ensures deterministic conflict resolution regardless of array order
  widgetsWithValidPositions.sort((a, b) => {
    const aPos = a.position!;
    const bPos = b.position!;
    const aIndex = aPos.row * gridCols + aPos.col;
    const bIndex = bPos.row * gridCols + bPos.col;
    return aIndex - bIndex;
  });
  
  // First, place widgets that already have valid positions
  for (const widget of widgetsWithValidPositions) {
    const position = widget.position!;
    
    // Check if it fits on current page without overlap
    if (canPlaceWidget(position, widget.size, occupiedCells, gridCols, gridRows, undefined, widget.customCols, widget.customRows)) {
      currentPage.push({ ...widget, position });
      getOccupiedCells(position, widget.size, widget.customCols, widget.customRows).forEach(cell => occupiedCells.add(cell));
    } else {
      // Position conflicts - needs re-placement
      widgetsNeedingPlacement.push({ ...widget, position: undefined });
    }
  }
  
  // Then, auto-place widgets that need positions
  for (const widget of widgetsNeedingPlacement) {
    const { cols, rows } = getWidgetDimensions(widget.size, widget.customCols, widget.customRows);
    let placed = false;
    
    // Try to find a position on the current page
    for (let row = 0; row <= gridRows - rows && !placed; row++) {
      for (let col = 0; col <= gridCols - cols && !placed; col++) {
        const position = { col, row };
        if (canPlaceWidget(position, widget.size, occupiedCells, gridCols, gridRows, undefined, widget.customCols, widget.customRows)) {
          currentPage.push({ ...widget, position });
          getOccupiedCells(position, widget.size, widget.customCols, widget.customRows).forEach(cell => occupiedCells.add(cell));
          placed = true;
        }
      }
    }
    
    // If couldn't place on current page, start a new page
    if (!placed) {
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }
      currentPage = [];
      occupiedCells = new Set<string>();
      
      // Place at the beginning of the new page
      const position = { col: 0, row: 0 };
      currentPage.push({ ...widget, position });
      getOccupiedCells(position, widget.size, widget.customCols, widget.customRows).forEach(cell => occupiedCells.add(cell));
    }
  }
  
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  
  return {
    pages,
    totalPages: Math.max(1, pages.length),
  };
};

// Calculate which cells are occupied by widgets on a page (excluding a specific widget)
export const getPageOccupiedCells = (
  widgets: WidgetConfig[],
  excludeWidgetId?: string
): Set<string> => {
  const occupied = new Set<string>();
  
  for (const widget of widgets) {
    if (widget.id === excludeWidgetId) continue;
    if (!widget.position) continue;
    
    getOccupiedCells(widget.position, widget.size, widget.customCols, widget.customRows).forEach(cell => occupied.add(cell));
  }
  
  return occupied;
};

// Find nearest empty position from a target (pure function, not a hook)
const findNearestEmptyPosition = (
  targetPosition: GridPosition,
  size: WidgetSize,
  occupiedCellsSet: Set<string>,
  gridCols: number,
  gridRows: number,
  customCols?: number,
  customRows?: number
): GridPosition | null => {
  // Search in expanding rings around the target position
  for (let distance = 0; distance < Math.max(gridCols, gridRows); distance++) {
    for (let dy = -distance; dy <= distance; dy++) {
      for (let dx = -distance; dx <= distance; dx++) {
        // Only check cells at exactly this distance (perimeter of square)
        if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue;
        
        const testPos: GridPosition = {
          col: targetPosition.col + dx,
          row: targetPosition.row + dy,
        };
        
        if (canPlaceWidget(testPos, size, occupiedCellsSet, gridCols, gridRows, undefined, customCols, customRows)) {
          return testPos;
        }
      }
    }
  }
  
  return null;
};

export const useGridLayout = (density: DensityPreset) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadLayout);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate pages based on current density
  const { pages, totalPages } = useMemo(() => {
    return autoPlaceWidgets(widgets, density.columns, density.rows);
  }, [widgets, density.columns, density.rows]);

  // Get widgets for current page with positions
  const pageWidgets = useMemo(() => {
    return pages[currentPage] || [];
  }, [pages, currentPage]);

  // Get occupied cells for current page
  const occupiedCells = useMemo(() => {
    return getPageOccupiedCells(pageWidgets);
  }, [pageWidgets]);

  // Validate current page
  const validatedPage = useMemo(() => {
    const maxPage = Math.max(0, totalPages - 1);
    return currentPage > maxPage ? maxPage : currentPage;
  }, [totalPages, currentPage]);

  // Reset page when it becomes invalid
  // NOTE: must be an effect (not useMemo) to avoid state updates during render.
  useEffect(() => {
    if (validatedPage !== currentPage) {
      setCurrentPage(validatedPage);
    }
  }, [validatedPage, currentPage]);

  // Move widget to a new position (find nearest empty spot if occupied)
  const moveWidget = useCallback((
    widgetId: string,
    targetPosition: GridPosition
  ) => {
    setWidgets((currentWidgets) => {
      const widgetIndex = currentWidgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) return currentWidgets;
      
      const widget = currentWidgets[widgetIndex];
      const { cols, rows } = getWidgetDimensions(widget.size, widget.customCols, widget.customRows);
      
      // Get current page widgets excluding the dragged widget
      const currentPageWidgets = pages[currentPage] || [];
      const occupiedCellsSet = getPageOccupiedCells(currentPageWidgets, widgetId);
      
      // First, try the exact target position
      let finalPosition = targetPosition;
      
      // Check if target position is valid (within bounds)
      const isWithinBounds = 
        targetPosition.col >= 0 && 
        targetPosition.row >= 0 &&
        targetPosition.col + cols <= density.columns &&
        targetPosition.row + rows <= density.rows;
      
      if (!isWithinBounds) {
        // Clamp to valid bounds first
        finalPosition = {
          col: Math.max(0, Math.min(targetPosition.col, density.columns - cols)),
          row: Math.max(0, Math.min(targetPosition.row, density.rows - rows)),
        };
      }
      
      // Check if the position is available
      if (!canPlaceWidget(finalPosition, widget.size, occupiedCellsSet, density.columns, density.rows, undefined, widget.customCols, widget.customRows)) {
        // Find nearest empty spot
        const nearestPos = findNearestEmptyPosition(
          finalPosition,
          widget.size,
          occupiedCellsSet,
          density.columns,
          density.rows,
          widget.customCols,
          widget.customRows
        );
        
        if (nearestPos) {
          finalPosition = nearestPos;
        } else {
          // No valid position found, don't move
          return currentWidgets;
        }
      }
      
      // Move the widget to the final position (don't reorder array to keep positions stable)
      const newWidgets = currentWidgets.map(w => 
        w.id === widgetId ? { ...w, position: finalPosition } : w
      );
      
      saveLayout(newWidgets);
      return newWidgets;
    });
  }, [density.columns, density.rows, pages, currentPage]);

  const resizeWidget = useCallback((widgetId: string, newSize: WidgetSize, newPosition?: GridPosition, customCols?: number, customRows?: number) => {
    setWidgets((items) => {
      const newItems = items.map((item) =>
        item.id === widgetId 
          ? { 
              ...item, 
              size: newSize, 
              ...(newPosition && { position: newPosition }),
              customCols,
              customRows,
            } 
          : item
      );
      saveLayout(newItems);
      return newItems;
    });
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const deleteWidget = useCallback((widgetId: string) => {
    setWidgets((currentWidgets) => {
      const newWidgets = currentWidgets.filter(w => w.id !== widgetId);
      saveLayout(newWidgets);
      return newWidgets;
    });
  }, []);

  const addWidget = useCallback((type: string, props: Record<string, unknown>) => {
    setWidgets((currentWidgets) => {
      const newId = `${type}-${Date.now()}`;
      const newWidget: WidgetConfig = {
        id: newId,
        type,
        props,
        size: "1x1",
      };
      const newWidgets = [...currentWidgets, newWidget];
      saveLayout(newWidgets);
      return newWidgets;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    saveLayout(defaultWidgets);
  }, []);

  return {
    widgets,
    pageWidgets,
    isEditMode,
    toggleEditMode,
    resetLayout,
    resizeWidget,
    moveWidget,
    deleteWidget,
    addWidget,
    currentPage,
    setCurrentPage,
    totalPages,
    occupiedCells,
    gridCols: density.columns,
    gridRows: density.rows,
  };
};

// Helper to reorder widgets array based on their positions (top-left to bottom-right)
const reorderWidgetsByPosition = (
  widgets: WidgetConfig[],
  gridCols: number,
  gridRows: number
): WidgetConfig[] => {
  return [...widgets].sort((a, b) => {
    if (!a.position && !b.position) return 0;
    if (!a.position) return 1;
    if (!b.position) return -1;
    
    const aIndex = a.position.row * gridCols + a.position.col;
    const bIndex = b.position.row * gridCols + b.position.col;
    return aIndex - bIndex;
  });
};

export const getGridClasses = (size: WidgetSize): string => {
  switch (size) {
    case "2x1":
      return "col-span-2";
    case "1x2":
      return "row-span-2";
    case "2x2":
      return "col-span-2 row-span-2";
    default:
      return "";
  }
};
