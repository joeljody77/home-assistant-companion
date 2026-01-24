import { createContext, useContext, ReactNode, RefObject } from "react";
import { useHomeAssistant, HAEntity, HAConfig } from "@/hooks/useHomeAssistant";

interface HomeAssistantContextType {
  config: HAConfig | null;
  entities: HAEntity[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  wsRef: RefObject<WebSocket | null>;
  testConnection: (url: string, token: string) => Promise<{ success: boolean; message: string }>;
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => void;
  fetchEntities: () => Promise<HAEntity[]>;
  getEntity: (entityId: string) => HAEntity | undefined;
  getEntitiesByDomain: (domain: string) => HAEntity[];
  getEntitiesForWidgetType: (widgetType: string) => HAEntity[];
  getRecommendedWidgetType: (entityId: string) => string | null;
  callService: (domain: string, service: string, entityId: string, data?: Record<string, unknown>) => Promise<boolean>;
  sendCommand: (command: object) => Promise<unknown>;
}

const HomeAssistantContext = createContext<HomeAssistantContextType | null>(null);

export const HomeAssistantProvider = ({ children }: { children: ReactNode }) => {
  const homeAssistant = useHomeAssistant();

  return (
    <HomeAssistantContext.Provider value={homeAssistant}>
      {children}
    </HomeAssistantContext.Provider>
  );
};

export const useHomeAssistantContext = () => {
  const context = useContext(HomeAssistantContext);
  if (!context) {
    throw new Error("useHomeAssistantContext must be used within HomeAssistantProvider");
  }
  return context;
};
