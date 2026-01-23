import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  isEditMode?: boolean;
}

export const DraggableWidget = ({ id, children, isEditMode = false }: DraggableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50 opacity-80 scale-105",
        isEditMode && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background rounded-2xl"
      )}
    >
      {isEditMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -top-2 -right-2 z-10 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {children}
    </div>
  );
};
