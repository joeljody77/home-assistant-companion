 import { useRef, useEffect, useCallback, useState } from "react";
 import { RefreshCw, Volume2, VolumeX, Video, Image, Link, AlertTriangle, Loader2, Circle, Mic, MicOff } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
 import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
 import { Button } from "@/components/ui/button";
 import { useHlsPlayer, HlsStatus } from "@/hooks/useHlsPlayer";
 import { CameraSourceType, PTZConfig, AudioConfig, RecordingConfig, RefreshInterval, REFRESH_INTERVALS } from "@/types/camera";
 import { PTZControls, PTZCommand } from "./camera/PTZControls";
 import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
 import { StreamType } from "@/hooks/useCameraStream";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
   DropdownMenuSeparator,
   DropdownMenuLabel,
 } from "@/components/ui/dropdown-menu";
 
 interface CameraStreamState {
   status: string;
   error: string | null;
   imageUrl: string | null;
   streamUrl: string | null;
   streamType: StreamType;
   isLoading: boolean;
   refresh: () => void;
   setRefreshInterval: (interval: RefreshInterval) => void;
 }
 
 interface HlsPlayerState {
   status: HlsStatus;
   error: string | null;
   retry: () => void;
 }
 
 interface CameraExpandedDialogProps {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   name: string;
   room?: string;
   isOnline: boolean;
   sourceType: CameraSourceType;
   cameraStream: CameraStreamState;
   hlsPlayer: HlsPlayerState;
   ptz?: PTZConfig;
   audio?: AudioConfig;
   recording?: RecordingConfig;
 }
 
 export const CameraExpandedDialog = ({
   isOpen,
   onOpenChange,
   name,
   room,
   isOnline,
   sourceType,
   cameraStream,
   hlsPlayer,
   ptz,
   audio,
   recording,
 }: CameraExpandedDialogProps) => {
   const hlsVideoRef = useRef<HTMLVideoElement>(null);
   const [isMuted, setIsMuted] = useState(true);
   const [isTalkbackActive, setIsTalkbackActive] = useState(false);
   const [isRecording, setIsRecording] = useState(false);
   const [currentRefreshInterval, setCurrentRefreshInterval] = useState<RefreshInterval>(10);
   
   const { callService, sendCommand } = useHomeAssistantContext();
 
   // Local HLS player for the expanded dialog
   const localHlsPlayer = useHlsPlayer({
     videoRef: hlsVideoRef,
     url: isOpen && cameraStream.streamType === "hls" ? cameraStream.streamUrl || undefined : undefined,
     enabled: isOpen && cameraStream.streamType === "hls" && !!cameraStream.streamUrl,
     autoPlay: true,
     muted: isMuted,
   });
 
   // Update muted state on video element
   useEffect(() => {
     if (hlsVideoRef.current) {
       hlsVideoRef.current.muted = isMuted;
     }
   }, [isMuted]);
 
   const toggleAudio = useCallback((e: React.MouseEvent) => {
     e.stopPropagation();
     setIsMuted(prev => !prev);
   }, []);
 
   const handlePTZCommand = useCallback(async (command: PTZCommand) => {
     if (!ptz) return;
     
     // Map command to HA service
     let service: string | undefined;
     const data: Record<string, unknown> = {};
     
     switch (command.type) {
       case "pan_left": service = ptz.panLeftService; break;
       case "pan_right": service = ptz.panRightService; break;
       case "tilt_up": service = ptz.tiltUpService; break;
       case "tilt_down": service = ptz.tiltDownService; break;
       case "zoom_in": service = ptz.zoomInService; break;
       case "zoom_out": service = ptz.zoomOutService; break;
       case "home": service = "camera.ptz_home"; break;
       case "preset":
         const preset = ptz.presets?.find(p => p.id === command.presetId);
         service = preset?.service || "camera.goto_preset";
         data.preset = command.presetId;
         break;
     }
     
     if (service) {
       const [domain, serviceName] = service.split(".");
       await sendCommand({ type: "call_service", domain, service: serviceName, service_data: data });
     }
   }, [ptz, sendCommand]);
 
   const handleTalkbackToggle = useCallback(() => {
     if (!audio?.talkbackService) return;
     setIsTalkbackActive(prev => !prev);
     // In a real implementation, this would start/stop audio capture and send to HA
   }, [audio]);
 
   const handleRecordToggle = useCallback(async () => {
     if (!recording?.recordService) return;
     setIsRecording(prev => !prev);
     const [domain, service] = recording.recordService.split(".");
     await sendCommand({ type: "call_service", domain, service, service_data: {} });
   }, [recording, sendCommand]);
 
   const handleRefreshIntervalChange = useCallback((interval: RefreshInterval) => {
     setCurrentRefreshInterval(interval);
     cameraStream.setRefreshInterval(interval);
   }, [cameraStream]);
 
   const getModeLabel = () => {
     switch (cameraStream.streamType) {
       case "mjpeg": return "MJPEG Stream";
       case "hls": return "HLS Stream";
       default: return currentRefreshInterval === 0 ? "Manual Refresh" : `Snapshot (${currentRefreshInterval}s)`;
     }
   };
 
   const getModeIcon = () => {
     if (cameraStream.streamType === "mjpeg" || cameraStream.streamType === "hls") {
       return <Video className="w-4 h-4 text-primary" />;
     }
     return <Image className="w-4 h-4 text-foreground/70" />;
   };
 
   const renderContent = () => {
     // MJPEG stream
     if (cameraStream.streamType === "mjpeg" && cameraStream.streamUrl) {
       return <img src={cameraStream.streamUrl} alt={name} className="w-full h-full object-contain" />;
     }
 
     // HLS stream
     if (cameraStream.streamType === "hls" && cameraStream.streamUrl) {
       return (
         <div className="w-full h-full bg-black relative">
           <video
             ref={hlsVideoRef}
             autoPlay
             playsInline
             muted={isMuted}
             className="w-full h-full object-contain"
           />
           {localHlsPlayer.status === "loading" && (
             <div className="absolute inset-0 flex items-center justify-center bg-black">
               <Loader2 className="w-10 h-10 text-primary animate-spin" />
             </div>
           )}
           {localHlsPlayer.status === "error" && (
             <div className="absolute inset-0 flex items-center justify-center bg-black">
               <div className="text-center">
                 <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
                 <p className="text-destructive">{localHlsPlayer.error}</p>
                 <Button variant="secondary" className="mt-3" onClick={() => localHlsPlayer.retry()}>
                   <RefreshCw className="w-4 h-4 mr-2" /> Retry
                 </Button>
               </div>
             </div>
           )}
         </div>
       );
     }
 
     // Snapshot
     if (cameraStream.imageUrl) {
       return <img src={cameraStream.imageUrl} alt={name} className="w-full h-full object-contain" />;
     }
 
     // Loading
     if (cameraStream.isLoading) {
       return (
         <div className="w-full h-full bg-black flex items-center justify-center">
           <Loader2 className="w-10 h-10 text-primary animate-spin" />
         </div>
       );
     }
 
     return (
       <div className="w-full h-full bg-black flex items-center justify-center">
         <p className="text-muted-foreground">No stream available</p>
       </div>
     );
   };
 
   const showAudioToggle = audio?.enabled && (cameraStream.streamType === "hls" || cameraStream.streamType === "mjpeg");
   const showPTZ = ptz?.enabled;
   const showRecording = recording?.enabled;
   const showTalkback = audio?.supportsTwoWay;
 
   return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden">
         <VisuallyHidden>
           <DialogTitle>{name} Camera View</DialogTitle>
         </VisuallyHidden>
         <div className="relative w-full h-full bg-black flex">
           {/* Main video area */}
           <div className="flex-1 relative">
             {renderContent()}
             
             {/* Top overlay */}
             <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
               <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
                 <div className={cn("status-indicator", isOnline ? "status-online" : "status-offline")} />
                 <span className="text-foreground font-medium">{name}</span>
                 {room && <span className="text-muted-foreground">• {room}</span>}
                 <div className="flex items-center gap-1 text-muted-foreground text-sm">
                   {getModeIcon()}
                   <span>{getModeLabel()}</span>
                 </div>
               </div>
 
               {/* Controls */}
               <div className="flex items-center gap-2">
                 {/* Audio toggle */}
                 {showAudioToggle && (
                   <Button size="icon" variant="ghost" className="bg-background/80 backdrop-blur-sm" onClick={toggleAudio}>
                     {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-primary" />}
                   </Button>
                 )}
 
                 {/* Talkback */}
                 {showTalkback && (
                   <Button 
                     size="icon" 
                     variant={isTalkbackActive ? "default" : "ghost"} 
                     className="bg-background/80 backdrop-blur-sm"
                     onPointerDown={handleTalkbackToggle}
                     onPointerUp={handleTalkbackToggle}
                   >
                     {isTalkbackActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                   </Button>
                 )}
 
                 {/* Recording */}
                 {showRecording && (
                   <Button 
                     size="icon" 
                     variant={isRecording ? "destructive" : "ghost"} 
                     className="bg-background/80 backdrop-blur-sm"
                     onClick={handleRecordToggle}
                   >
                     <Circle className={cn("w-5 h-5", isRecording && "fill-current animate-pulse")} />
                   </Button>
                 )}
 
                 {/* Refresh interval dropdown */}
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost" className="bg-background/80 backdrop-blur-sm">
                       <RefreshCw className={cn("w-5 h-5", cameraStream.isLoading && "animate-spin")} />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Refresh Interval</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {REFRESH_INTERVALS.map((interval) => (
                       <DropdownMenuItem
                         key={interval}
                         onClick={() => handleRefreshIntervalChange(interval)}
                         className={cn(currentRefreshInterval === interval && "bg-accent")}
                       >
                         {interval === 0 ? "Manual" : `${interval}s`}
                       </DropdownMenuItem>
                     ))}
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => cameraStream.refresh()}>
                       Refresh Now
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </div>
             </div>
           </div>
 
           {/* PTZ controls panel (right side) */}
           {showPTZ && ptz && (
             <div className="w-[180px] bg-background/95 backdrop-blur-sm border-l border-border p-4 flex flex-col items-center justify-center">
               <p className="text-sm font-medium text-foreground mb-4">PTZ Control</p>
               <PTZControls
                 config={ptz}
                 onCommand={handlePTZCommand}
                 variant="dpad"
               />
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 };