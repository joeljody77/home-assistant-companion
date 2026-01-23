import { createContext, useContext } from "react";
import { WidgetSize } from "@/hooks/useWidgetLayout";

interface WidgetSizeContextValue {
  size: WidgetSize;
  isCompact: boolean;
  isWide: boolean;
  isTall: boolean;
  isLarge: boolean;
}

const WidgetSizeContext = createContext<WidgetSizeContextValue>({
  size: "1x1",
  isCompact: true,
  isWide: false,
  isTall: false,
  isLarge: false,
});

export const useWidgetSize = () => useContext(WidgetSizeContext);

interface WidgetSizeProviderProps {
  size: WidgetSize;
  children: React.ReactNode;
}

export const WidgetSizeProvider = ({ size, children }: WidgetSizeProviderProps) => {
  const value: WidgetSizeContextValue = {
    size,
    isCompact: size === "1x1",
    isWide: size === "2x1" || size === "2x2",
    isTall: size === "1x2" || size === "2x2",
    isLarge: size === "2x2",
  };

  return (
    <WidgetSizeContext.Provider value={value}>
      {children}
    </WidgetSizeContext.Provider>
  );
};
