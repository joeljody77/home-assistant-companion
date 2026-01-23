import { WidgetConfig } from "@/hooks/useWidgetLayout";
import { WidgetSizeProvider } from "@/contexts/WidgetSizeContext";
import { LightWidget } from "./LightWidget";
import { ClimateWidget } from "./ClimateWidget";
import { SensorWidget } from "./SensorWidget";
import { SceneWidget } from "./SceneWidget";
import { SwitchWidget } from "./SwitchWidget";
import { CameraWidget } from "./CameraWidget";
import { MediaWidget } from "./MediaWidget";
import { WeatherWidget } from "./WeatherWidget";
import { LockWidget } from "./LockWidget";

interface WidgetRendererProps {
  widget: WidgetConfig;
}

export const WidgetRenderer = ({ widget }: WidgetRendererProps) => {
  const { type, props, size } = widget;

  const renderWidget = () => {
    switch (type) {
      case "weather":
        return <WeatherWidget {...(props as unknown as React.ComponentProps<typeof WeatherWidget>)} />;
      case "climate":
        return <ClimateWidget {...(props as unknown as React.ComponentProps<typeof ClimateWidget>)} />;
      case "light":
        return <LightWidget {...(props as unknown as React.ComponentProps<typeof LightWidget>)} />;
      case "scene":
        return <SceneWidget {...(props as unknown as React.ComponentProps<typeof SceneWidget>)} />;
      case "sensor":
        return <SensorWidget {...(props as unknown as React.ComponentProps<typeof SensorWidget>)} />;
      case "camera":
        return <CameraWidget {...(props as unknown as React.ComponentProps<typeof CameraWidget>)} />;
      case "media":
        return <MediaWidget {...(props as unknown as React.ComponentProps<typeof MediaWidget>)} />;
      case "switch":
        return <SwitchWidget {...(props as unknown as React.ComponentProps<typeof SwitchWidget>)} />;
      case "lock":
        return <LockWidget {...(props as unknown as React.ComponentProps<typeof LockWidget>)} />;
      default:
        return null;
    }
  };

  return (
    <WidgetSizeProvider size={size}>
      {renderWidget()}
    </WidgetSizeProvider>
  );
};
