import { createContext, useContext, useMemo } from "react";
import { WidgetSize } from "@/hooks/useWidgetLayout";

interface WidgetSizeContextValue {
  size: WidgetSize;
  cols: number;
  rows: number;
  isCompact: boolean;
  isWide: boolean;
  isTall: boolean;
  isLarge: boolean;
}

const WidgetSizeContext = createContext<WidgetSizeContextValue>({
  size: "1x1",
  cols: 1,
  rows: 1,
  isCompact: true,
  isWide: false,
  isTall: false,
  isLarge: false,
});

export const useWidgetSize = () => useContext(WidgetSizeContext);

interface WidgetSizeProviderProps {
  size: WidgetSize;
  customCols?: number;
  customRows?: number;
  children: React.ReactNode;
}

export const WidgetSizeProvider = ({ size, customCols, customRows, children }: WidgetSizeProviderProps) => {
  const value = useMemo<WidgetSizeContextValue>(() => {
    // Use custom dimensions if provided, otherwise derive from size
    let cols = customCols ?? 1;
    let rows = customRows ?? 1;
    
    if (!customCols || !customRows) {
      switch (size) {
        case "2x1":
          cols = customCols ?? 2;
          rows = customRows ?? 1;
          break;
        case "1x2":
          cols = customCols ?? 1;
          rows = customRows ?? 2;
          break;
        case "2x2":
          cols = customCols ?? 2;
          rows = customRows ?? 2;
          break;
        default:
          cols = customCols ?? 1;
          rows = customRows ?? 1;
      }
    }

    return {
      size,
      cols,
      rows,
      isCompact: cols === 1 && rows === 1,
      isWide: cols >= 2,
      isTall: rows >= 2,
      isLarge: cols >= 2 && rows >= 2,
    };
  }, [size, customCols, customRows]);

  return (
    <WidgetSizeContext.Provider value={value}>
      {children}
    </WidgetSizeContext.Provider>
  );
};
