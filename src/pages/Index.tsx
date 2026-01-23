import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RoomTabs } from "@/components/layout/RoomTabs";
import { WidgetGrid } from "@/components/widgets/WidgetGrid";
import { useGridLayout } from "@/hooks/useGridLayout";
import { useDensityConfig } from "@/hooks/useDensityConfig";
import { DensitySettingsDialog } from "@/components/DensitySettingsDialog";
import { PageIndicator } from "@/components/PageIndicator";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw, Check, Grid3X3 } from "lucide-react";

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
    currentPage,
    setCurrentPage,
    totalPages,
    gridCols,
    gridRows,
  } = useGridLayout(currentPreset);

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
          <WidgetGrid
            widgets={pageWidgets}
            isEditMode={isEditMode}
            gridCols={gridCols}
            gridRows={gridRows}
            onMoveWidget={moveWidget}
            onResizeWidget={resizeWidget}
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
