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

// WebSocket message types
interface WSMessage {
  type: string;
  id?: number;
  ha_version?: string;
  message?: string;
  success?: boolean;
  result?: unknown;
  event?: {
    event_type: string;
    data: {
      entity_id: string;
      new_state: HAEntity | null;
      old_state: HAEntity | null;
    };
  };
}

export type WSStatus = "disconnected" | "connecting" | "authenticated";

// Pending command promise handlers
interface PendingCommand {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
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
const RECONNECT_DELAY = 5000;

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

const getWebSocketUrl = (httpUrl: string): string => {
  try {
    const url = new URL(httpUrl);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}/api/websocket`;
  } catch {
    return "";
  }
};

export const useHomeAssistant = () => {
  const [config, setConfig] = useState<HAConfig | null>(loadConfig);
  const [entities, setEntities] = useState<HAEntity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WSStatus>("disconnected");

  // WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const messageIdRef = useRef(1);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  const pendingCommandsRef = useRef<Map<number, PendingCommand>>(new Map());

  // Keep configRef in sync
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Cancel any pending reconnect
  const cancelReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Fetch all entities via REST API (for initial load)
  const fetchEntities = useCallback(
    async (silent = false): Promise<HAEntity[]> => {
      if (!config) return [];

      if (!silent) setIsLoading(true);

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
        return data;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Connection failed";
        if (!silent) setError(message);
        return [];
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [config]
  );

  // Handle state change events from WebSocket
  const handleStateChanged = useCallback((data: {
    entity_id: string;
    new_state: HAEntity | null;
    old_state: HAEntity | null;
  }) => {
    if (!data.new_state) {
      // Entity was removed
      setEntities(prev => prev.filter(e => e.entity_id !== data.entity_id));
      return;
    }

    setEntities(prev => {
      const index = prev.findIndex(e => e.entity_id === data.entity_id);
      if (index === -1) {
        // New entity
        return [...prev, data.new_state!];
      }
      // Update existing entity
      const updated = [...prev];
      updated[index] = data.new_state!;
      return updated;
    });
  }, []);

  // Subscribe to state changes after authentication
  const subscribeToStateChanges = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const subscriptionId = messageIdRef.current++;
    wsRef.current.send(JSON.stringify({
      id: subscriptionId,
      type: "subscribe_events",
      event_type: "state_changed"
    }));
    console.log("Subscribed to state_changed events");
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case "auth_required":
        // Send authentication
        if (wsRef.current && configRef.current) {
          wsRef.current.send(JSON.stringify({
            type: "auth",
            access_token: configRef.current.token
          }));
        }
        break;

      case "auth_ok":
        console.log("WebSocket authenticated with HA", message.ha_version);
        setWsStatus("authenticated");
        setIsConnected(true);
        setError(null);
        // Fetch initial states via REST (faster than get_states via WS)
        fetchEntities(true);
        // Subscribe to state changes
        subscribeToStateChanges();
        break;

      case "auth_invalid":
        console.error("WebSocket auth failed:", message.message);
        setError(message.message || "Invalid access token");
        setIsConnected(false);
        setWsStatus("disconnected");
        wsRef.current?.close();
        break;

      case "event":
        if (message.event?.event_type === "state_changed" && message.event.data) {
          handleStateChanged(message.event.data);
        }
        break;

      case "result":
        // Handle command results - resolve pending promises
        if (message.id !== undefined) {
          const pending = pendingCommandsRef.current.get(message.id);
          if (pending) {
            pendingCommandsRef.current.delete(message.id);
            if (message.success) {
              pending.resolve(message.result);
            } else {
              pending.reject(new Error(message.message || "Command failed"));
            }
          }
        }
        if (!message.success && !message.id) {
          console.warn("WebSocket command failed:", message);
        }
        break;
    }
  }, [fetchEntities, subscribeToStateChanges, handleStateChanged]);

  // Send a command and wait for response (for WebRTC signaling, etc.)
  const sendCommand = useCallback(async (command: object): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const id = messageIdRef.current++;
      pendingCommandsRef.current.set(id, { resolve, reject });

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        if (pendingCommandsRef.current.has(id)) {
          pendingCommandsRef.current.delete(id);
          reject(new Error("Command timeout"));
        }
      }, 10000);

      wsRef.current.send(JSON.stringify({ ...command, id }));

      // Clear timeout when resolved
      const originalResolve = resolve;
      pendingCommandsRef.current.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          originalResolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
    });
  }, []);

  // Connect via WebSocket
  const connectWebSocket = useCallback(() => {
    if (!configRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsUrl = getWebSocketUrl(configRef.current.url);
    if (!wsUrl) {
      setError("Invalid Home Assistant URL");
      return;
    }

    console.log("Connecting to WebSocket:", wsUrl);
    setWsStatus("connecting");
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected, awaiting auth challenge");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          handleWebSocketMessage(message);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        wsRef.current = null;
        setWsStatus("disconnected");
        setIsConnected(false);

        // Auto-reconnect if we have config and weren't intentionally disconnected
        if (configRef.current && event.code !== 1000) {
          console.log(`Scheduling reconnect in ${RECONNECT_DELAY}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectWebSocket();
          }, RECONNECT_DELAY);
        }
      };
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
      setError(e instanceof Error ? e.message : "WebSocket connection failed");
      setWsStatus("disconnected");
    }
  }, [handleWebSocketMessage]);

  // Test connection to Home Assistant (REST API)
  const testConnection = useCallback(async (url: string, token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanUrl = url.replace(/\/+$/, "");
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
    // WebSocket connection will be triggered by the config change effect
  }, []);

  // Disconnect and clear configuration
  const disconnect = useCallback(() => {
    cancelReconnect();

    // Close WebSocket with normal closure code
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }

    saveConfig(null);
    setConfig(null);
    setEntities([]);
    setIsConnected(false);
    setWsStatus("disconnected");
    setError(null);
  }, [cancelReconnect]);

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

  // Call a service on an entity (via REST API - more reliable for commands)
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

      // State will update automatically via WebSocket subscription
      return response.ok;
    } catch (e) {
      console.error("Service call failed:", e);
      return false;
    }
  }, [config]);

  // WebSocket lifecycle management
  useEffect(() => {
    cancelReconnect();

    if (!config) {
      // Close any existing connection
      if (wsRef.current) {
        wsRef.current.close(1000, "Config cleared");
        wsRef.current = null;
      }
      setIsConnected(false);
      setWsStatus("disconnected");
      return;
    }

    // Connect via WebSocket
    connectWebSocket();

    return () => {
      cancelReconnect();
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [config, connectWebSocket, cancelReconnect]);

  return {
    config,
    entities,
    isConnected,
    isLoading,
    error,
    wsStatus,
    wsRef,
    testConnection,
    connect,
    disconnect,
    fetchEntities,
    getEntity,
    getEntitiesByDomain,
    getEntitiesForWidgetType,
    getRecommendedWidgetType,
    callService,
    sendCommand,
  };
};
