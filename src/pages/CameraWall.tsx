 import { useState, useCallback, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { ArrowLeft, Grid, Pause, Play, Settings2, Columns } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
 import { useCameraStream } from "@/hooks/useCameraStream";
 import { useHlsPlayer } from "@/hooks/useHlsPlayer";
 import { RefreshInterval, REFRESH_INTERVALS } from "@/types/camera";
 import { CameraExpandedDialog } from "@/components/widgets/CameraExpandedDialog";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
   DropdownMenuSeparator,
   DropdownMenuLabel,
 } from "@/components/ui/dropdown-menu";
 import { WidgetSizeProvider } from "@/contexts/WidgetSizeContext";
 
 interface CameraConfig {
   id: string;
   name: string;
   entityId?: string;
   streamUrl?: string;
   sourceType: "ha_entity" | "stream_url" | "rtsp";
 }
 
 type GridLayout = 1 | 2 | 4 | 6 | 9 | 16;
 
 const CameraTile = ({ 
   camera, 
   quality, 
   refreshInterval, 
   isPaused,
   onClick 
 }: { 
   camera: CameraConfig;
   quality: "low" | "high";
   refreshInterval: RefreshInterval;
   isPaused: boolean;
   onClick: () => void;
 }) => {
   const { config } = useHomeAssistantContext();
   const videoRef = { current: null as HTMLVideoElement | null };
   
   const cameraStream = useCameraStream({
     sourceType: camera.sourceType,
     entityId: camera.entityId,
     haConfig: config,
     streamUrl: camera.streamUrl,
     refreshInterval: isPaused ? 0 : refreshInterval,
     isPaused,
     quality,
   });
 
   return (
     <div 
       className="relative w-full h-full bg-secondary rounded-lg overflow-hidden cursor-pointer group"
       onClick={onClick}
     >
       {cameraStream.imageUrl ? (
         <img 
           src={cameraStream.imageUrl} 
           alt={camera.name}
           className="w-full h-full object-cover"
         />
       ) : cameraStream.streamUrl && cameraStream.streamType === "mjpeg" ? (
         <img 
           src={cameraStream.streamUrl} 
           alt={camera.name}
           className="w-full h-full object-cover"
         />
       ) : (
         <div className="w-full h-full flex items-center justify-center">
           <p className="text-muted-foreground text-sm">Loading...</p>
         </div>
       )}
       
       {/* Overlay */}
       <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
       
       {/* Camera name */}
       <div className="absolute bottom-2 left-2 right-2">
         <p className="text-foreground text-sm font-medium drop-shadow-lg truncate">{camera.name}</p>
       </div>
       
       {/* Paused indicator */}
       {isPaused && (
         <div className="absolute top-2 right-2">
           <Pause className="w-4 h-4 text-warning" />
         </div>
       )}
     </div>
   );
 };
 
 const CameraWall = () => {
   const navigate = useNavigate();
   const { entities, isConnected } = useHomeAssistantContext();
   
   const [gridLayout, setGridLayout] = useState<GridLayout>(4);
   const [quality, setQuality] = useState<"low" | "high">("low");
   const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(5);
   const [isPaused, setIsPaused] = useState(false);
   const [selectedCamera, setSelectedCamera] = useState<CameraConfig | null>(null);
   
   // Get all camera entities
   const cameraEntities = entities.filter(e => e.entity_id.startsWith("camera."));
   const cameras: CameraConfig[] = cameraEntities.map(e => ({
     id: e.entity_id,
     name: e.attributes.friendly_name || e.entity_id,
     entityId: e.entity_id,
     sourceType: "ha_entity" as const,
   }));
 
   const getGridCols = () => {
     switch (gridLayout) {
       case 1: return "grid-cols-1";
       case 2: return "grid-cols-2";
       case 4: return "grid-cols-2";
       case 6: return "grid-cols-3";
       case 9: return "grid-cols-3";
       case 16: return "grid-cols-4";
       default: return "grid-cols-2";
     }
   };
 
   const getGridRows = () => {
     switch (gridLayout) {
       case 1: return 1;
       case 2: return 1;
       case 4: return 2;
       case 6: return 2;
       case 9: return 3;
       case 16: return 4;
       default: return 2;
     }
   };
 
   // For CameraExpandedDialog compatibility
   const { config } = useHomeAssistantContext();
   const dummyHlsPlayer = { status: "idle" as const, error: null, retry: () => {} };
 
   return (
     <div className="h-screen w-screen bg-background flex flex-col">
       {/* Header */}
       <header className="flex items-center justify-between px-4 py-3 border-b border-border">
         <div className="flex items-center gap-3">
           <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <h1 className="text-lg font-semibold">Camera Wall</h1>
           <span className="text-muted-foreground text-sm">
             {cameras.length} camera{cameras.length !== 1 ? "s" : ""}
           </span>
         </div>
         
         <div className="flex items-center gap-2">
           {/* Pause/Play all */}
           <Button 
             variant={isPaused ? "default" : "outline"} 
             size="sm"
             onClick={() => setIsPaused(!isPaused)}
           >
             {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
             {isPaused ? "Resume" : "Pause All"}
           </Button>
           
           {/* Quality */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm">
                 <Settings2 className="w-4 h-4 mr-2" />
                 {quality === "high" ? "High" : "Low"} Quality
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent>
               <DropdownMenuItem onClick={() => setQuality("low")} className={cn(quality === "low" && "bg-accent")}>
                 Low Quality (faster)
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setQuality("high")} className={cn(quality === "high" && "bg-accent")}>
                 High Quality
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
           
           {/* Refresh interval */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm">
                 {refreshInterval === 0 ? "Manual" : `${refreshInterval}s`}
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent>
               <DropdownMenuLabel>Refresh Interval</DropdownMenuLabel>
               <DropdownMenuSeparator />
               {REFRESH_INTERVALS.map((interval) => (
                 <DropdownMenuItem
                   key={interval}
                   onClick={() => setRefreshInterval(interval)}
                   className={cn(refreshInterval === interval && "bg-accent")}
                 >
                   {interval === 0 ? "Manual" : `${interval}s`}
                 </DropdownMenuItem>
               ))}
             </DropdownMenuContent>
           </DropdownMenu>
           
           {/* Grid layout */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm">
                 <Grid className="w-4 h-4 mr-2" />
                 {gridLayout} View
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent>
               <DropdownMenuLabel>Grid Layout</DropdownMenuLabel>
               <DropdownMenuSeparator />
               {([1, 2, 4, 6, 9, 16] as GridLayout[]).map((layout) => (
                 <DropdownMenuItem
                   key={layout}
                   onClick={() => setGridLayout(layout)}
                   className={cn(gridLayout === layout && "bg-accent")}
                 >
                   {layout === 1 && "1 Camera"}
                   {layout === 2 && "2 Cameras (1×2)"}
                   {layout === 4 && "4 Cameras (2×2)"}
                   {layout === 6 && "6 Cameras (3×2)"}
                   {layout === 9 && "9 Cameras (3×3)"}
                   {layout === 16 && "16 Cameras (4×4)"}
                 </DropdownMenuItem>
               ))}
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </header>
       
       {/* Camera Grid */}
       <div className="flex-1 p-4 overflow-hidden">
         {!isConnected ? (
           <div className="h-full flex items-center justify-center">
             <p className="text-muted-foreground">Connect to Home Assistant to view cameras</p>
           </div>
         ) : cameras.length === 0 ? (
           <div className="h-full flex items-center justify-center">
             <p className="text-muted-foreground">No cameras found in Home Assistant</p>
           </div>
         ) : (
           <div 
             className={cn("grid gap-2 h-full", getGridCols())}
             style={{ 
               gridTemplateRows: `repeat(${getGridRows()}, 1fr)`,
             }}
           >
             {cameras.slice(0, gridLayout).map((camera) => (
               <CameraTile
                 key={camera.id}
                 camera={camera}
                 quality={quality}
                 refreshInterval={refreshInterval}
                 isPaused={isPaused}
                 onClick={() => setSelectedCamera(camera)}
               />
             ))}
           </div>
         )}
       </div>
       
       {/* Expanded camera dialog */}
       {selectedCamera && (
        <WidgetSizeProvider size="2x2">
           <CameraExpandedDialog
             isOpen={!!selectedCamera}
             onOpenChange={(open) => !open && setSelectedCamera(null)}
             name={selectedCamera.name}
             isOnline={true}
             sourceType={selectedCamera.sourceType}
             cameraStream={{
               status: "streaming",
               error: null,
               imageUrl: null,
               streamUrl: null,
               streamType: "snapshot",
               isLoading: false,
               refresh: () => {},
               setRefreshInterval: () => {},
             }}
            hlsPlayer={dummyHlsPlayer as any}
           />
         </WidgetSizeProvider>
       )}
     </div>
   );
 };
 
 export default CameraWall;