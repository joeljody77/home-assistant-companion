import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RoomTabs } from "@/components/layout/RoomTabs";
import { WidgetGrid } from "@/components/widgets/WidgetGrid";
import { useGridLayout } from "@/hooks/useGridLayout";
import { useDensityConfig } from "@/hooks/useDensityConfig";
import { DensitySettingsDialog } from "@/components/DensitySettingsDialog";
import { PageIndicator } from "@/components/PageIndicator";

const rooms = ["All Rooms", "Living Room", "Bedroom", "Kitchen", "Bathroom", "Office"];

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeRoom, setActiveRoom] = useState("All Rooms");
  const [densityDialogOpen, setDensityDialogOpen] = useState(false);
  
  const { presetIndex, currentPreset, setDensity } = useDensityConfig();
  const { 
    pageWidgets, 
    isEditMode, 
    toggleEditMode, 
    resetLayout, 
    resizeWidget,
    moveWidget,
    deleteWidget,
    currentPage,
    setCurrentPage,
    totalPages,
    gridCols,
    gridRows,
  } = useGridLayout(currentPreset);

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onOpenDensity={() => setDensityDialogOpen(true)}
        onResetLayout={resetLayout}
      />
      
      <main className="ml-20 flex-1 flex flex-col overflow-hidden">
        {/* Room Tabs */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <RoomTabs
            rooms={rooms}
            activeRoom={activeRoom}
            onRoomChange={setActiveRoom}
          />
        </div>

        {/* Widget Grid - Fills remaining viewport height */}
        <div className="flex-1 px-6 pb-16 overflow-hidden">
          <WidgetGrid
            widgets={pageWidgets}
            isEditMode={isEditMode}
            gridCols={gridCols}
            gridRows={gridRows}
            onMoveWidget={moveWidget}
            onResizeWidget={resizeWidget}
            onDeleteWidget={deleteWidget}
          />
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
