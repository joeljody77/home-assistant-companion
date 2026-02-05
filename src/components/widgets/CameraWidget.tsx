 import { useState, useEffect, useRef } from "react";
 import { Camera, Maximize2, Video, Image, RefreshCw, AlertTriangle, Link, Loader2 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { useWidgetSize } from "@/contexts/WidgetSizeContext";
 import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
 import { useHlsPlayer } from "@/hooks/useHlsPlayer";
 import { useCameraStream } from "@/hooks/useCameraStream";
 import { CameraExpandedDialog } from "./CameraExpandedDialog";
 import { 
   CameraSourceType, 
   RestreamType, 
   RefreshInterval,
   PTZConfig,
   AudioConfig,
   RecordingConfig,
 } from "@/types/camera";
 
 interface CameraWidgetProps {
   name: string;
   room?: string;
   sourceType?: CameraSourceType;
   entityId?: string;
   entity_id?: string;
   streamUrl?: string;
   snapshotUrl?: string;
   rtspUrl?: string;
   restreamType?: RestreamType;
   restreamBaseUrl?: string;
   streamName?: string;
   viewMode?: "snapshot" | "live" | "mjpeg";
   refreshInterval?: RefreshInterval;
   ptz?: PTZConfig;
   audio?: AudioConfig;
   recording?: RecordingConfig;
   quality?: "low" | "high";
   pauseWhenHidden?: boolean;
 }
 
 export const CameraWidget = ({
   name,
   room,
   sourceType = "ha_entity",
   entityId,
   entity_id,
   streamUrl,
   snapshotUrl,
   rtspUrl,
   restreamType = "go2rtc",
   restreamBaseUrl,
   streamName,
   refreshInterval = 10,
   ptz,
   audio,
   recording,
   quality = "high",
   pauseWhenHidden = true,
 }: CameraWidgetProps) => {
   const [isExpanded, setIsExpanded] = useState(false);
   const [isVisible, setIsVisible] = useState(true);
   const hlsVideoRef = useRef<HTMLVideoElement>(null);
   const widgetRef = useRef<HTMLDivElement>(null);
   
   const { cols, rows, isCompact, isWide, isTall, isLarge } = useWidgetSize();
   const { getEntity, isConnected, config } = useHomeAssistantContext();
 
   const resolvedEntityId = entityId ?? entity_id;
   const entity = resolvedEntityId ? getEntity(resolvedEntityId) : undefined;
   const isOnline = entity?.state !== "unavailable" && entity?.state !== "unknown";
 
   // Camera stream hook handles all fetching logic
   const cameraStream = useCameraStream({
     sourceType,
     entityId: resolvedEntityId,
     haConfig: config,
     streamUrl,
     snapshotUrl,
     rtspUrl,
     restreamType,
     restreamBaseUrl,
     streamName,
     refreshInterval,
     isPaused: pauseWhenHidden && !isVisible,
     quality,
   });
 
   // HLS player for HLS streams
   const hlsPlayer = useHlsPlayer({
     videoRef: hlsVideoRef,
     url: cameraStream.streamType === "hls" ? cameraStream.streamUrl || undefined : undefined,
     enabled: cameraStream.streamType === "hls" && isVisible,
     autoPlay: true,
     muted: true,
   });
 
   // Intersection observer for pause-when-hidden
   useEffect(() => {
     if (!pauseWhenHidden || !widgetRef.current) return;
     const observer = new IntersectionObserver(
       ([entry]) => setIsVisible(entry.isIntersecting),
       { threshold: 0.1 }
     );
     observer.observe(widgetRef.current);
     return () => observer.disconnect();
   }, [pauseWhenHidden]);
 
   const handleWidgetClick = () => {
     if (cameraStream.status !== "error" && cameraStream.status !== "no_config") {
       setIsExpanded(true);
     }
   };
 
   const handleRefresh = (e: React.MouseEvent) => {
     e.stopPropagation();
     cameraStream.refresh();
   };
 
   const minDim = Math.min(cols, rows);
   const iconSize = minDim >= 3 ? "w-20 h-20" : isLarge ? "w-16 h-16" : isTall ? "w-12 h-12" : isWide ? "w-10 h-10" : "w-8 h-8";
   const titleSize = minDim >= 3 ? "text-xl" : isLarge ? "text-lg" : "text-sm";
   const subtitleSize = minDim >= 3 ? "text-base" : isLarge ? "text-sm" : "text-xs";
   const padding = minDim >= 3 ? "p-4" : isLarge ? "p-3" : "p-2";
 
   const getModeLabel = () => {
     switch (cameraStream.streamType) {
       case "mjpeg": return "MJPEG";
       case "hls": return "HLS";
       default: return refreshInterval === 0 ? "Manual" : `${refreshInterval}s`;
     }
   };
 
   const getModeIcon = () => {
     if (cameraStream.streamType === "mjpeg" || cameraStream.streamType === "hls") {
       return <Video className="w-3 h-3 text-primary" />;
     }
     return <Image className="w-3 h-3 text-foreground/70" />;
   };
 
   const renderCameraFeed = () => {
     const containerClasses = "absolute inset-0";
 
     // No source configured
     if (sourceType === "ha_entity" && (!isConnected || !resolvedEntityId)) {
       return (
         <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
           <div className="text-center">
             <Camera className={cn("mx-auto mb-2 text-muted-foreground/50", iconSize)} />
             <p className="text-muted-foreground text-sm">No camera linked</p>
           </div>
         </div>
       );
     }
 
     if (sourceType === "stream_url" && !streamUrl) {
       return (
         <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
           <div className="text-center">
             <Link className={cn("mx-auto mb-2 text-muted-foreground/50", iconSize)} />
             <p className="text-muted-foreground text-sm">No stream URL</p>
           </div>
         </div>
       );
     }
 
     if (sourceType === "rtsp" && !rtspUrl) {
       return (
         <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
           <div className="text-center">
             <Video className={cn("mx-auto mb-2 text-muted-foreground/50", iconSize)} />
             <p className="text-muted-foreground text-sm">No RTSP URL</p>
           </div>
         </div>
       );
     }
 
     if (cameraStream.status === "no_config") {
       return (
         <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
           <div className="text-center px-4">
             <AlertTriangle className={cn("mx-auto mb-2 text-warning", iconSize)} />
             <p className="text-foreground text-sm font-medium">RTSP needs restream</p>
             <p className="text-muted-foreground text-xs mt-1">Configure go2rtc or Frigate</p>
           </div>
         </div>
       );
     }
 
     if (cameraStream.status === "error") {
       return (
         <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
           <div className="text-center">
             <Camera className={cn("mx-auto mb-2 text-destructive/50", iconSize)} />
             <p className="text-destructive text-sm">{cameraStream.error || "Failed to load"}</p>
             <button onClick={handleRefresh} className="mt-2 p-2 rounded-lg bg-background/50 hover:bg-background/80">
               <RefreshCw className="w-4 h-4 text-foreground" />
             </button>
           </div>
         </div>
       );
     }
 
     if (cameraStream.isLoading && !cameraStream.imageUrl) {
       return (
         <div className={cn(containerClasses, "flex items-center justify-center bg-secondary")}>
           <Loader2 className={cn("text-muted-foreground animate-spin", iconSize)} />
         </div>
       );
     }
 
     // MJPEG stream
     if (cameraStream.streamType === "mjpeg" && cameraStream.streamUrl) {
       return <img src={cameraStream.streamUrl} alt={name} className={cn(containerClasses, "object-cover")} />;
     }
 
     // HLS stream
     if (cameraStream.streamType === "hls" && cameraStream.streamUrl) {
       return (
         <div className={cn(containerClasses, "bg-secondary")}>
           <video ref={hlsVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
           {hlsPlayer.status === "loading" && (
             <div className="absolute inset-0 flex items-center justify-center bg-secondary/80">
               <Loader2 className="w-8 h-8 text-primary animate-spin" />
             </div>
           )}
         </div>
       );
     }
 
     // Snapshot
     if (cameraStream.imageUrl) {
       return <img src={cameraStream.imageUrl} alt={name} className={cn(containerClasses, "object-cover")} />;
     }
 
     return (
       <div className={cn(containerClasses, "flex items-center justify-center bg-secondary animate-pulse")}>
         <Camera className={cn("text-muted-foreground/30", iconSize)} />
       </div>
     );
   };
 
   const expandedDialog = (
     <CameraExpandedDialog
       isOpen={isExpanded}
       onOpenChange={setIsExpanded}
       name={name}
       room={room}
       isOnline={isOnline}
       sourceType={sourceType}
       cameraStream={cameraStream}
       hlsPlayer={hlsPlayer}
       ptz={ptz}
       audio={audio}
       recording={recording}
     />
   );
 
   // Compact layout
   if (isCompact) {
     return (
       <>
         <div ref={widgetRef} className="widget-card p-0 overflow-hidden group h-full cursor-pointer" onClick={handleWidgetClick}>
           <div className="relative w-full h-full min-h-[120px]">
             {renderCameraFeed()}
             <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
             <div className="absolute top-2 left-2 flex items-center gap-1">
               <div className={cn("status-indicator", isOnline ? "status-online" : "status-offline")} />
               {getModeIcon()}
             </div>
             <div className="absolute bottom-2 left-2 right-2">
               <h3 className="font-medium text-foreground text-xs truncate drop-shadow-md">{name}</h3>
             </div>
           </div>
         </div>
         {expandedDialog}
       </>
     );
   }
 
   // Wide layout
   if (isWide && !isTall) {
     return (
       <>
         <div ref={widgetRef} className="widget-card p-0 overflow-hidden group h-full cursor-pointer" onClick={handleWidgetClick}>
           <div className="relative w-full h-full min-h-[140px]">
             {renderCameraFeed()}
             <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
             <div className={cn("absolute top-3 left-3 flex items-center gap-2", minDim >= 3 && "top-4 left-4")}>
               <div className={cn("status-indicator", isOnline ? "status-online" : "status-offline")} />
               <span className={cn("text-foreground/80 drop-shadow-md", subtitleSize)}>{getModeLabel()}</span>
               {getModeIcon()}
             </div>
             <div className={cn("absolute top-3 right-3 flex items-center gap-2", minDim >= 3 && "top-4 right-4")}>
               <button onClick={handleRefresh} className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity", minDim >= 3 && "p-3")}>
                 <RefreshCw className={cn("text-foreground", cameraStream.isLoading && "animate-spin", minDim >= 3 ? "w-5 h-5" : "w-4 h-4")} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity", minDim >= 3 && "p-3")}>
                 <Maximize2 className={minDim >= 3 ? "w-5 h-5 text-foreground" : "w-4 h-4 text-foreground"} />
               </button>
             </div>
             <div className={cn("absolute bottom-3 left-3 right-3", minDim >= 3 && "bottom-4 left-4 right-4")}>
               <h3 className={cn("font-medium text-foreground drop-shadow-md", titleSize)}>{name}</h3>
               {room && <p className={cn("text-muted-foreground drop-shadow-md", subtitleSize)}>{room}</p>}
             </div>
           </div>
         </div>
         {expandedDialog}
       </>
     );
   }
 
   // Tall/Large layout
   return (
     <>
       <div ref={widgetRef} className="widget-card p-0 overflow-hidden group h-full cursor-pointer" onClick={handleWidgetClick}>
         <div className="relative w-full h-full min-h-[200px]">
           {renderCameraFeed()}
           <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
           <div className={cn("absolute flex items-center gap-2", padding, "top-0 left-0")}>
             <div className={cn("status-indicator", isOnline ? "status-online" : "status-offline")} />
             <span className={cn("text-foreground/80 drop-shadow-md", subtitleSize)}>{getModeLabel()}</span>
             {getModeIcon()}
           </div>
           <div className={cn("absolute flex items-center gap-2", padding, "top-0 right-0")}>
             <button onClick={handleRefresh} className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity", minDim >= 3 && "p-3")}>
               <RefreshCw className={cn("text-foreground", cameraStream.isLoading && "animate-spin", minDim >= 3 ? "w-5 h-5" : "w-4 h-4")} />
             </button>
             <button onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity", minDim >= 3 && "p-3")}>
               <Maximize2 className={minDim >= 3 ? "w-5 h-5 text-foreground" : "w-4 h-4 text-foreground"} />
             </button>
           </div>
           <div className={cn("absolute left-0 right-0 bottom-0", padding)}>
             <h3 className={cn("font-medium text-foreground drop-shadow-md", titleSize)}>{name}</h3>
             {room && <p className={cn("text-muted-foreground mt-1 drop-shadow-md", subtitleSize)}>{room}</p>}
           </div>
         </div>
       </div>
       {expandedDialog}
     </>
   );
 };