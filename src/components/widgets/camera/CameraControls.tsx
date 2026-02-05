 import { useState, useCallback } from "react";
 import { 
   Volume2, VolumeX, Mic, MicOff, Circle, 
   RefreshCw, Maximize2, Settings, Pause, Play
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import { AudioConfig, RecordingConfig, RefreshInterval, REFRESH_INTERVALS } from "@/types/camera";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
   DropdownMenuSeparator,
   DropdownMenuLabel,
 } from "@/components/ui/dropdown-menu";
 
 interface CameraControlsProps {
   // Audio controls
   audioConfig?: AudioConfig;
   isMuted: boolean;
   onMuteToggle: () => void;
   isTalkbackActive?: boolean;
   onTalkbackToggle?: () => void;
   
   // Recording controls
   recordingConfig?: RecordingConfig;
   isRecording?: boolean;
   onRecordToggle?: () => void;
   
   // Refresh controls
   refreshInterval: RefreshInterval;
   onRefreshIntervalChange: (interval: RefreshInterval) => void;
   onManualRefresh: () => void;
   isRefreshing?: boolean;
   
   // View controls
   isPaused?: boolean;
   onPauseToggle?: () => void;
   onExpand?: () => void;
   
   className?: string;
   variant?: "overlay" | "bar";
 }
 
 export const CameraControls = ({
   audioConfig,
   isMuted,
   onMuteToggle,
   isTalkbackActive = false,
   onTalkbackToggle,
   recordingConfig,
   isRecording = false,
   onRecordToggle,
   refreshInterval,
   onRefreshIntervalChange,
   onManualRefresh,
   isRefreshing = false,
   isPaused = false,
   onPauseToggle,
   onExpand,
   className,
   variant = "overlay",
 }: CameraControlsProps) => {
   
   const getRefreshLabel = (interval: RefreshInterval) => {
     if (interval === 0) return "Manual";
     return `${interval}s`;
   };
 
   const buttonClass = variant === "overlay" 
     ? "p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
     : "h-8 w-8";
 
   return (
     <div className={cn("flex items-center gap-2", className)}>
       {/* Audio toggle */}
       {audioConfig?.enabled && (
         <Button
           size="icon"
           variant={variant === "overlay" ? "ghost" : "outline"}
           className={buttonClass}
           onClick={onMuteToggle}
           title={isMuted ? "Unmute" : "Mute"}
         >
           {isMuted ? (
             <VolumeX className="w-4 h-4" />
           ) : (
             <Volume2 className="w-4 h-4 text-primary" />
           )}
         </Button>
       )}
 
       {/* Talkback / Push-to-talk */}
       {audioConfig?.supportsTwoWay && onTalkbackToggle && (
         <Button
           size="icon"
           variant={isTalkbackActive ? "default" : (variant === "overlay" ? "ghost" : "outline")}
           className={buttonClass}
           onPointerDown={onTalkbackToggle}
           onPointerUp={onTalkbackToggle}
           onPointerLeave={() => isTalkbackActive && onTalkbackToggle?.()}
           title="Push to talk"
         >
           {isTalkbackActive ? (
             <Mic className="w-4 h-4" />
           ) : (
             <MicOff className="w-4 h-4" />
           )}
         </Button>
       )}
 
       {/* Recording */}
       {recordingConfig?.enabled && onRecordToggle && (
         <Button
           size="icon"
           variant={isRecording ? "destructive" : (variant === "overlay" ? "ghost" : "outline")}
           className={buttonClass}
           onClick={onRecordToggle}
           title={isRecording ? "Stop recording" : "Start recording"}
         >
           <Circle className={cn("w-4 h-4", isRecording && "fill-current animate-pulse")} />
         </Button>
       )}
 
       {/* Pause/Resume for Camera Wall */}
       {onPauseToggle && (
         <Button
           size="icon"
           variant={variant === "overlay" ? "ghost" : "outline"}
           className={buttonClass}
           onClick={onPauseToggle}
           title={isPaused ? "Resume" : "Pause"}
         >
           {isPaused ? (
             <Play className="w-4 h-4" />
           ) : (
             <Pause className="w-4 h-4" />
           )}
         </Button>
       )}
 
       {/* Refresh interval dropdown */}
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button
             size="icon"
             variant={variant === "overlay" ? "ghost" : "outline"}
             className={cn(buttonClass, isRefreshing && "animate-spin")}
             title={`Refresh: ${getRefreshLabel(refreshInterval)}`}
           >
             <RefreshCw className="w-4 h-4" />
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           <DropdownMenuLabel>Refresh Interval</DropdownMenuLabel>
           <DropdownMenuSeparator />
           {REFRESH_INTERVALS.map((interval) => (
             <DropdownMenuItem
               key={interval}
               onClick={() => interval === 0 ? onManualRefresh() : onRefreshIntervalChange(interval)}
               className={cn(refreshInterval === interval && "bg-accent")}
             >
               {getRefreshLabel(interval)}
             </DropdownMenuItem>
           ))}
           <DropdownMenuSeparator />
           <DropdownMenuItem onClick={onManualRefresh}>
             Refresh Now
           </DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>
 
       {/* Expand to fullscreen */}
       {onExpand && (
         <Button
           size="icon"
           variant={variant === "overlay" ? "ghost" : "outline"}
           className={buttonClass}
           onClick={onExpand}
           title="Fullscreen"
         >
           <Maximize2 className="w-4 h-4" />
         </Button>
       )}
     </div>
   );
 };