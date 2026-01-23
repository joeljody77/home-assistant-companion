import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetSize, getWidgetDimensions } from "@/hooks/useGridLayout";
import { GridPosition } from "@/hooks/useGridLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DraggableGridWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode?: boolean;
  size: WidgetSize;
  position: GridPosition;
  onResize?: (size: WidgetSize) => void;
}

const sizeOptions: { value: WidgetSize; label: string }[] = [
  { value: "1x1", label: "Small (1×1)" },
  { value: "2x1", label: "Wide (2×1)" },
  { value: "1x2", label: "Tall (1×2)" },
  { value: "2x2", label: "Large (2×2)" },
];

export const DraggableGridWidget = ({ 
  id, 
  children, 
  isEditMode = false, 
  size,
  position,
  onResize 
}: DraggableGridWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id,
    data: {
      type: "widget",
      size,
      position,
    },
    disabled: !isEditMode,
  });

  const { cols, rows } = getWidgetDimensions(size);

  const style = {
    transform: CSS.Transform.toString(transform),
    gridColumn: `${position.col + 1} / span ${cols}`,
    gridRow: `${position.row + 1} / span ${rows}`,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative h-full",
        isDragging && "opacity-50 scale-95",
        isEditMode && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-2xl"
      )}
    >
      {isEditMode && (
        <>
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Resize dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="absolute -top-2 -left-2 z-10 p-1.5 rounded-full bg-accent text-accent-foreground shadow-lg hover:scale-110 transition-transform">
                {size === "1x1" ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              {sizeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onResize?.(option.value)}
                  className={cn(
                    "cursor-pointer",
                    size === option.value && "bg-primary/10 text-primary"
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      {children}
    </div>
  );
};
