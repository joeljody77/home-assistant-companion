import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RoomTabs } from "@/components/layout/RoomTabs";
import { DraggableWidget } from "@/components/widgets/DraggableWidget";
import { WidgetRenderer } from "@/components/widgets/WidgetRenderer";
import { useWidgetLayout } from "@/hooks/useWidgetLayout";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw, Check } from "lucide-react";

const rooms = ["All Rooms", "Living Room", "Bedroom", "Kitchen", "Bathroom", "Office"];

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeRoom, setActiveRoom] = useState("All Rooms");
  const { widgets, isEditMode, handleDragEnd, toggleEditMode, resetLayout, resizeWidget } = useWidgetLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    handleDragEnd({
      active: { id: event.active.id as string },
      over: event.over ? { id: event.over.id as string } : null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="ml-20 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <Header title="Dashboard" isConnected={true} />
          <div className="flex items-center gap-2">
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={toggleEditMode}
              className="gap-2"
            >
              {isEditMode ? (
                <>
                  <Check className="w-4 h-4" />
                  Done
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4" />
                  Edit Layout
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <RoomTabs
            rooms={rooms}
            activeRoom={activeRoom}
            onRoomChange={setActiveRoom}
          />
        </div>

        {/* Widget Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 auto-rows-[minmax(140px,auto)]">
              {widgets.map((widget) => (
                <DraggableWidget 
                  key={widget.id} 
                  id={widget.id} 
                  isEditMode={isEditMode}
                  size={widget.size}
                  onResize={(newSize) => resizeWidget(widget.id, newSize)}
                >
                  <WidgetRenderer widget={widget} />
                </DraggableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>
    </div>
  );
};

export default Index;
