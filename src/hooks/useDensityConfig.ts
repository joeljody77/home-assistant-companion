import { useState, useCallback, useEffect, useMemo } from "react";

export interface DensityPreset {
  label: string;
  columns: number;
  rows: number;
}

// Density presets from less dense to more dense
// Columns and rows represent the actual grid layout units
export const DENSITY_PRESETS: DensityPreset[] = [
  { label: "Compact", columns: 4, rows: 3 },
  { label: "Standard - 3", columns: 5, rows: 3 },
  { label: "Standard - 2", columns: 6, rows: 4 },
  { label: "Standard - 1", columns: 7, rows: 4 },
  { label: "Standard", columns: 8, rows: 5 },
  { label: "Standard + 1", columns: 10, rows: 5 },
  { label: "Standard + 2", columns: 12, rows: 6 },
  { label: "Standard + 3", columns: 14, rows: 7 },
  { label: "Dense", columns: 16, rows: 8 },
];

const DENSITY_STORAGE_KEY = "dashboard-density-config";

interface DensityConfig {
  presetIndex: number;
}

const loadDensityConfig = (): DensityConfig => {
  try {
    const saved = localStorage.getItem(DENSITY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load density config:", e);
  }
  return { presetIndex: 4 }; // Default to "Standard"
};

const saveDensityConfig = (config: DensityConfig) => {
  try {
    localStorage.setItem(DENSITY_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save density config:", e);
  }
};

export const useDensityConfig = () => {
  const [presetIndex, setPresetIndex] = useState(() => loadDensityConfig().presetIndex);

  const currentPreset = useMemo(() => DENSITY_PRESETS[presetIndex], [presetIndex]);

  const setDensity = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(DENSITY_PRESETS.length - 1, index));
    setPresetIndex(clampedIndex);
    saveDensityConfig({ presetIndex: clampedIndex });
  }, []);

  // Calculate total grid cells available
  const totalCells = useMemo(() => {
    return currentPreset.columns * currentPreset.rows;
  }, [currentPreset]);

  return {
    presetIndex,
    currentPreset,
    setDensity,
    totalCells,
    presets: DENSITY_PRESETS,
  };
};

// Helper to calculate how many 1x1 cells a widget occupies
export const getWidgetCellCount = (size: string): number => {
  switch (size) {
    case "2x1":
      return 2;
    case "1x2":
      return 2;
    case "2x2":
      return 4;
    default:
      return 1;
  }
};
