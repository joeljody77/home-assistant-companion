import { useState, useMemo } from "react";
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
import { useWidgetLayout, calculatePageWidgets } from "@/hooks/useWidgetLayout";
import { useDensityConfig } from "@/hooks/useDensityConfig";
import { DensitySettingsDialog } from "@/components/DensitySettingsDialog";
import { PageIndicator } from "@/components/PageIndicator";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw, Check, Grid3X3 } from "lucide-react";

const rooms = ["All Rooms", "Living Room", "Bedroom", "Kitchen", "Bathroom", "Office"];

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeRoom, setActiveRoom] = useState("All Rooms");
  const [currentPage, setCurrentPage] = useState(0);
  const [densityDialogOpen, setDensityDialogOpen] = useState(false);
  
  const { widgets, isEditMode, handleDragEnd, toggleEditMode, resetLayout, resizeWidget } = useWidgetLayout();
  const { presetIndex, currentPreset, setDensity } = useDensityConfig();

  // Calculate which widgets fit on the current page
  const { pageWidgets, totalPages } = useMemo(() => {
    return calculatePageWidgets(widgets, currentPreset, currentPage);
  }, [widgets, currentPreset, currentPage]);

  // Ensure current page is valid when widgets or density changes
  const validatedPage = useMemo(() => {
    const maxPage = Math.max(0, totalPages - 1);
    return currentPage > maxPage ? maxPage : currentPage;
  }, [totalPages, currentPage]);
  
  // Reset page when it becomes invalid
  useMemo(() => {
    if (validatedPage !== currentPage) {
      setCurrentPage(validatedPage);
    }
  }, [validatedPage, currentPage]);

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

  // Use the density preset columns and rows directly for the grid
  const displayColumns = currentPreset.columns;
  const displayRows = currentPreset.rows;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="ml-20 flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <Header title="Dashboard" isConnected={true} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDensityDialogOpen(true)}
                className="gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Density
              </Button>
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
          
          <RoomTabs
            rooms={rooms}
            activeRoom={activeRoom}
            onRoomChange={setActiveRoom}
          />
        </div>

        {/* Widget Grid - Fills remaining viewport height */}
        <div className="flex-1 px-6 pb-16 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={pageWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div 
                className="h-full grid gap-3 animate-fade-in"
                style={{
                  gridTemplateColumns: `repeat(${displayColumns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${displayRows}, minmax(0, 1fr))`,
                }}
              >
                {pageWidgets.map((widget) => (
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
        </div>

        {/* Page Indicator */}
        <PageIndicator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>

      {/* Density Settings Dialog */}
      <DensitySettingsDialog
        open={densityDialogOpen}
        onOpenChange={setDensityDialogOpen}
        presetIndex={presetIndex}
        onPresetChange={setDensity}
        currentPreset={currentPreset}
      />
    </div>
  );
};

export default Index;
