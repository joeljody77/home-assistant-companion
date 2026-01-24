import { useState, useEffect, useCallback, useRef } from "react";

// Types for Home Assistant entities
export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    icon?: string;
    unit_of_measurement?: string;
    device_class?: string;
    supported_features?: number;
    [key: string]: unknown;
  };
  last_changed: string;
  last_updated: string;
}

export interface HAConfig {
  url: string;
  token: string;
}

// Entity domain to widget type mapping
export const DOMAIN_TO_WIDGET_TYPE: Record<string, string> = {
  light: "light",
  switch: "switch",
  climate: "climate",
  sensor: "sensor",
  binary_sensor: "sensor",
  lock: "lock",
  camera: "camera",
  media_player: "media",
  weather: "weather",
  scene: "scene",
  script: "scene",
  automation: "scene",
};

// Widget type to compatible domains
export const WIDGET_TYPE_TO_DOMAINS: Record<string, string[]> = {
  light: ["light"],
  switch: ["switch", "input_boolean", "fan"],
  climate: ["climate"],
  sensor: ["sensor", "binary_sensor"],
  lock: ["lock"],
  camera: ["camera"],
  media: ["media_player"],
  weather: ["weather"],
  scene: ["scene", "script", "automation"],
};

const STORAGE_KEY = "home-assistant-config";
const POLL_INTERVAL = 5000; // 5 seconds

const loadConfig = (): HAConfig | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load HA config:", e);
  }
  return null;
};

const saveConfig = (config: HAConfig | null) => {
  try {
    if (config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save HA config:", e);
  }
};

export const useHomeAssistant = () => {
  const [config, setConfig] = useState<HAConfig | null>(loadConfig);
  const [entities, setEntities] = useState<HAEntity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep polling interval stable and cleaned up
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Fetch all entities from Home Assistant
  const fetchEntities = useCallback(
    async (silent = false): Promise<HAEntity[]> => {
      if (!config) return [];

      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${config.url}/api/states`, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: HAEntity[] = await response.json();
        setEntities(data);
        setIsConnected(true);
        return data;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Connection failed";
        setError(message);
        setIsConnected(false);
        return [];
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [config]
  );

  // Test connection to Home Assistant
  const testConnection = useCallback(async (url: string, token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanUrl = url.replace(/\/+$/, ""); // Remove trailing slashes
      const response = await fetch(`${cleanUrl}/api/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Connected to ${data.location_name || "Home Assistant"}`,
        };
      } else if (response.status === 401) {
        return { success: false, message: "Invalid access token" };
      } else {
        return { success: false, message: `Server error: ${response.status}` };
      }
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "Connection failed",
      };
    }
  }, []);

  // Save configuration and connect
  const connect = useCallback(async (url: string, token: string) => {
    const cleanUrl = url.replace(/\/+$/, "");
    const newConfig: HAConfig = { url: cleanUrl, token };
    
    saveConfig(newConfig);
    setConfig(newConfig);

    // Initial fetch happens via effect when config changes
  }, []);

  // Disconnect and clear configuration
  const disconnect = useCallback(() => {
    stopPolling();
    saveConfig(null);
    setConfig(null);
    setEntities([]);
    setIsConnected(false);
    setError(null);
  }, [stopPolling]);

  // Get entity by ID
  const getEntity = useCallback((entityId: string): HAEntity | undefined => {
    return entities.find(e => e.entity_id === entityId);
  }, [entities]);

  // Get entities by domain
  const getEntitiesByDomain = useCallback((domain: string): HAEntity[] => {
    return entities.filter(e => e.entity_id.startsWith(`${domain}.`));
  }, [entities]);

  // Get entities compatible with a widget type
  const getEntitiesForWidgetType = useCallback((widgetType: string): HAEntity[] => {
    const domains = WIDGET_TYPE_TO_DOMAINS[widgetType] || [];
    return entities.filter(e => {
      const domain = e.entity_id.split(".")[0];
      return domains.includes(domain);
    });
  }, [entities]);

  // Get recommended widget type for an entity
  const getRecommendedWidgetType = useCallback((entityId: string): string | null => {
    const domain = entityId.split(".")[0];
    return DOMAIN_TO_WIDGET_TYPE[domain] || null;
  }, []);

  // Call a service on an entity
  const callService = useCallback(async (
    domain: string,
    service: string,
    entityId: string,
    data?: Record<string, unknown>
  ): Promise<boolean> => {
    if (!config) return false;

    try {
      const response = await fetch(`${config.url}/api/services/${domain}/${service}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_id: entityId,
          ...data,
        }),
      });

      if (response.ok) {
        // Immediately refresh after service call (silent)
        setTimeout(() => {
          fetchEntities(true);
        }, 500);
      }

      return response.ok;
    } catch (e) {
      console.error("Service call failed:", e);
      return false;
    }
  }, [config, fetchEntities]);

  // Auto-connect + polling lifecycle
  useEffect(() => {
    stopPolling();

    if (!config) {
      setIsConnected(false);
      return;
    }

    // Initial load
    fetchEntities(false);

    // Poll silently
    pollIntervalRef.current = setInterval(() => {
      fetchEntities(true);
    }, POLL_INTERVAL);

    return () => {
      stopPolling();
    };
  }, [config, fetchEntities, stopPolling]);

  return {
    config,
    entities,
    isConnected,
    isLoading,
    error,
    testConnection,
    connect,
    disconnect,
    fetchEntities,
    getEntity,
    getEntitiesByDomain,
    getEntitiesForWidgetType,
    getRecommendedWidgetType,
    callService,
  };
};
