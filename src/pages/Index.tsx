import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RoomTabs } from "@/components/layout/RoomTabs";
import { LightWidget } from "@/components/widgets/LightWidget";
import { ClimateWidget } from "@/components/widgets/ClimateWidget";
import { SensorWidget } from "@/components/widgets/SensorWidget";
import { SceneWidget } from "@/components/widgets/SceneWidget";
import { SwitchWidget } from "@/components/widgets/SwitchWidget";
import { CameraWidget } from "@/components/widgets/CameraWidget";
import { MediaWidget } from "@/components/widgets/MediaWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { LockWidget } from "@/components/widgets/LockWidget";

const rooms = ["All Rooms", "Living Room", "Bedroom", "Kitchen", "Bathroom", "Office"];

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeRoom, setActiveRoom] = useState("All Rooms");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="ml-20 p-6 animate-fade-in">
        <Header title="Dashboard" isConnected={true} />
        
        <div className="mb-6">
          <RoomTabs
            rooms={rooms}
            activeRoom={activeRoom}
            onRoomChange={setActiveRoom}
          />
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 auto-rows-min">
          {/* Weather */}
          <WeatherWidget
            location="San Francisco"
            temperature={18}
            condition="cloudy"
            high={22}
            low={14}
            humidity={65}
          />

          {/* Climate */}
          <ClimateWidget
            name="Thermostat"
            currentTemp={21}
            targetTemp={22}
            humidity={45}
            mode="auto"
          />

          {/* Lights */}
          <LightWidget name="Main Light" room="Living Room" initialState={true} initialBrightness={80} />
          <LightWidget name="Desk Lamp" room="Office" initialState={false} initialBrightness={60} />
          <LightWidget name="Ceiling Light" room="Bedroom" initialState={true} initialBrightness={40} />
          <LightWidget name="Kitchen Lights" room="Kitchen" initialState={true} initialBrightness={100} />

          {/* Scenes */}
          <SceneWidget name="Good Night" type="night" deviceCount={8} />
          <SceneWidget name="Movie Time" type="movie" deviceCount={5} />
          <SceneWidget name="Morning" type="morning" deviceCount={6} />
          <SceneWidget name="Relax" type="relax" deviceCount={4} />

          {/* Camera */}
          <CameraWidget name="Front Door" room="Entrance" isOnline={true} />

          {/* Sensors */}
          <SensorWidget name="Temperature" type="temperature" value={21.5} unit="°C" room="Living Room" />
          <SensorWidget name="Humidity" type="humidity" value={45} unit="%" room="Living Room" />
          <SensorWidget name="Power Usage" type="power" value={2.4} unit="kW" />
          <SensorWidget name="Light Level" type="light" value={340} unit="lux" room="Office" />

          {/* Media */}
          <MediaWidget
            name="Living Room Speaker"
            artist="Daft Punk"
            track="Get Lucky"
          />

          {/* Switches & Locks */}
          <SwitchWidget name="TV" type="tv" room="Living Room" initialState={true} />
          <SwitchWidget name="Fan" type="fan" room="Bedroom" initialState={false} />
          <LockWidget name="Front Door" room="Entrance" initialState={true} />
          <LockWidget name="Back Door" room="Garden" initialState={true} />
          <SwitchWidget name="Coffee Machine" type="plug" room="Kitchen" initialState={false} />
          <SwitchWidget name="Speaker" type="speaker" room="Office" initialState={true} />
        </div>
      </main>
    </div>
  );
};

export default Index;
