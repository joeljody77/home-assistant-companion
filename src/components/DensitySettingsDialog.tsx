import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { DensityPreset, DENSITY_PRESETS } from "@/hooks/useDensityConfig";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DensitySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetIndex: number;
  onPresetChange: (index: number) => void;
  currentPreset: DensityPreset;
}

export const DensitySettingsDialog = ({
  open,
  onOpenChange,
  presetIndex,
  onPresetChange,
  currentPreset,
}: DensitySettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            Density
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Grid Preview - Matches reference design */}
          <div className="flex justify-center px-4">
            <div
              className="grid gap-1 p-4 rounded-xl bg-muted/30 border border-border w-full"
              style={{
                gridTemplateColumns: `repeat(${currentPreset.columns}, 1fr)`,
                gridTemplateRows: `repeat(${currentPreset.rows}, 1fr)`,
                aspectRatio: `${currentPreset.columns}/${currentPreset.rows}`,
                maxHeight: "300px",
              }}
            >
              {Array.from({ length: currentPreset.columns * currentPreset.rows }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm bg-primary/25 border border-primary/15 min-w-[6px] min-h-[6px]"
                />
              ))}
            </div>
          </div>

          {/* Preset Label */}
          <div className="text-center">
            <span className="text-muted-foreground text-sm">
              {currentPreset.label} ({currentPreset.columns}x{currentPreset.rows})
            </span>
          </div>

          {/* Density Slider */}
          <div className="space-y-4 px-6">
            <div className="relative">
              {/* Tick marks container */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none px-0">
                {DENSITY_PRESETS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i === presetIndex ? "bg-primary" : "bg-muted-foreground/40"
                    )}
                  />
                ))}
              </div>
              <Slider
                value={[presetIndex]}
                min={0}
                max={DENSITY_PRESETS.length - 1}
                step={1}
                onValueChange={([value]) => onPresetChange(value)}
                className="relative z-10"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>less dense</span>
              <span>more dense</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
