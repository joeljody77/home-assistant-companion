import { useState, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";

export interface WidgetConfig {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

const defaultWidgets: WidgetConfig[] = [
  { id: "weather-1", type: "weather", props: { location: "San Francisco", temperature: 18, condition: "cloudy", high: 22, low: 14, humidity: 65 } },
  { id: "climate-1", type: "climate", props: { name: "Thermostat", currentTemp: 21, targetTemp: 22, humidity: 45, mode: "auto" } },
  { id: "light-1", type: "light", props: { name: "Main Light", room: "Living Room", initialState: true, initialBrightness: 80 } },
  { id: "light-2", type: "light", props: { name: "Desk Lamp", room: "Office", initialState: false, initialBrightness: 60 } },
  { id: "light-3", type: "light", props: { name: "Ceiling Light", room: "Bedroom", initialState: true, initialBrightness: 40 } },
  { id: "light-4", type: "light", props: { name: "Kitchen Lights", room: "Kitchen", initialState: true, initialBrightness: 100 } },
  { id: "scene-1", type: "scene", props: { name: "Good Night", type: "night", deviceCount: 8 } },
  { id: "scene-2", type: "scene", props: { name: "Movie Time", type: "movie", deviceCount: 5 } },
  { id: "scene-3", type: "scene", props: { name: "Morning", type: "morning", deviceCount: 6 } },
  { id: "scene-4", type: "scene", props: { name: "Relax", type: "relax", deviceCount: 4 } },
  { id: "camera-1", type: "camera", props: { name: "Front Door", room: "Entrance", isOnline: true } },
  { id: "sensor-1", type: "sensor", props: { name: "Temperature", type: "temperature", value: 21.5, unit: "°C", room: "Living Room" } },
  { id: "sensor-2", type: "sensor", props: { name: "Humidity", type: "humidity", value: 45, unit: "%", room: "Living Room" } },
  { id: "sensor-3", type: "sensor", props: { name: "Power Usage", type: "power", value: 2.4, unit: "kW" } },
  { id: "sensor-4", type: "sensor", props: { name: "Light Level", type: "light", value: 340, unit: "lux", room: "Office" } },
  { id: "media-1", type: "media", props: { name: "Living Room Speaker", artist: "Daft Punk", track: "Get Lucky" } },
  { id: "switch-1", type: "switch", props: { name: "TV", type: "tv", room: "Living Room", initialState: true } },
  { id: "switch-2", type: "switch", props: { name: "Fan", type: "fan", room: "Bedroom", initialState: false } },
  { id: "lock-1", type: "lock", props: { name: "Front Door", room: "Entrance", initialState: true } },
  { id: "lock-2", type: "lock", props: { name: "Back Door", room: "Garden", initialState: true } },
  { id: "switch-3", type: "switch", props: { name: "Coffee Machine", type: "plug", room: "Kitchen", initialState: false } },
  { id: "switch-4", type: "switch", props: { name: "Speaker", type: "speaker", room: "Office", initialState: true } },
];

const STORAGE_KEY = "dashboard-widget-layout";

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

export const useWidgetLayout = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadLayout);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleDragEnd = useCallback((event: { active: { id: string }; over: { id: string } | null }) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveLayout(newItems);
        return newItems;
      });
    }
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    saveLayout(defaultWidgets);
  }, []);

  return {
    widgets,
    isEditMode,
    handleDragEnd,
    toggleEditMode,
    resetLayout,
  };
};
