 import { useState, useCallback } from "react";
 import { 
   ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
   Plus, Minus, Home, Target 
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import { PTZConfig, PTZPreset } from "@/types/camera";
 
 interface PTZControlsProps {
   config: PTZConfig;
   entityId?: string;
   onCommand: (command: PTZCommand) => void;
   variant?: "joystick" | "dpad" | "compact";
   className?: string;
 }
 
 export type PTZCommand = 
   | { type: "pan_left" }
   | { type: "pan_right" }
   | { type: "tilt_up" }
   | { type: "tilt_down" }
   | { type: "zoom_in" }
   | { type: "zoom_out" }
   | { type: "home" }
   | { type: "preset"; presetId: string };
 
 export const PTZControls = ({
   config,
   entityId,
   onCommand,
   variant = "dpad",
   className,
 }: PTZControlsProps) => {
   const [activeDirection, setActiveDirection] = useState<string | null>(null);
 
   const handlePress = useCallback((command: PTZCommand, direction: string) => {
     setActiveDirection(direction);
     onCommand(command);
   }, [onCommand]);
 
   const handleRelease = useCallback(() => {
     setActiveDirection(null);
   }, []);
 
   if (!config.enabled) return null;
 
   if (variant === "compact") {
     return (
       <div className={cn("flex items-center gap-1", className)}>
         <Button
           size="icon"
           variant="ghost"
           className="h-8 w-8"
           onPointerDown={() => handlePress({ type: "zoom_out" }, "zoomOut")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <Minus className="h-4 w-4" />
         </Button>
         <Button
           size="icon"
           variant="ghost"
           className="h-8 w-8"
           onPointerDown={() => handlePress({ type: "zoom_in" }, "zoomIn")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <Plus className="h-4 w-4" />
         </Button>
       </div>
     );
   }
 
   return (
     <div className={cn("flex flex-col items-center gap-4", className)}>
       {/* D-Pad Controls */}
       <div className="relative w-[140px] h-[140px]">
         {/* Center home button */}
         <Button
           size="icon"
           variant="secondary"
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full z-10"
           onClick={() => onCommand({ type: "home" })}
         >
           <Home className="h-4 w-4" />
         </Button>
 
         {/* Up */}
         <Button
           size="icon"
           variant={activeDirection === "up" ? "default" : "outline"}
           className="absolute top-0 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full"
           onPointerDown={() => handlePress({ type: "tilt_up" }, "up")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <ChevronUp className="h-6 w-6" />
         </Button>
 
         {/* Down */}
         <Button
           size="icon"
           variant={activeDirection === "down" ? "default" : "outline"}
           className="absolute bottom-0 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full"
           onPointerDown={() => handlePress({ type: "tilt_down" }, "down")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <ChevronDown className="h-6 w-6" />
         </Button>
 
         {/* Left */}
         <Button
           size="icon"
           variant={activeDirection === "left" ? "default" : "outline"}
           className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full"
           onPointerDown={() => handlePress({ type: "pan_left" }, "left")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <ChevronLeft className="h-6 w-6" />
         </Button>
 
         {/* Right */}
         <Button
           size="icon"
           variant={activeDirection === "right" ? "default" : "outline"}
           className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full"
           onPointerDown={() => handlePress({ type: "pan_right" }, "right")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <ChevronRight className="h-6 w-6" />
         </Button>
       </div>
 
       {/* Zoom Controls */}
       <div className="flex items-center gap-2">
         <Button
           size="icon"
           variant="outline"
           className="h-10 w-10 rounded-full"
           onPointerDown={() => handlePress({ type: "zoom_out" }, "zoomOut")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <Minus className="h-5 w-5" />
         </Button>
         <span className="text-xs text-muted-foreground px-2">Zoom</span>
         <Button
           size="icon"
           variant="outline"
           className="h-10 w-10 rounded-full"
           onPointerDown={() => handlePress({ type: "zoom_in" }, "zoomIn")}
           onPointerUp={handleRelease}
           onPointerLeave={handleRelease}
         >
           <Plus className="h-5 w-5" />
         </Button>
       </div>
 
       {/* Presets */}
       {config.presets && config.presets.length > 0 && (
         <div className="flex flex-wrap gap-2 justify-center mt-2">
           {config.presets.map((preset) => (
             <Button
               key={preset.id}
               size="sm"
               variant="secondary"
               onClick={() => onCommand({ type: "preset", presetId: preset.id })}
               className="gap-1"
             >
               <Target className="h-3 w-3" />
               {preset.name}
             </Button>
           ))}
         </div>
       )}
     </div>
   );
 };