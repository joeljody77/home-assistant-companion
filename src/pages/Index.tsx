import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { WidgetGrid } from "@/components/widgets/WidgetGrid";
import { useGridLayout } from "@/hooks/useGridLayout";
import { useDensityConfig } from "@/hooks/useDensityConfig";
import { DensitySettingsDialog } from "@/components/DensitySettingsDialog";
import { AddWidgetDialog } from "@/components/AddWidgetDialog";
import { PageIndicator } from "@/components/PageIndicator";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [densityDialogOpen, setDensityDialogOpen] = useState(false);
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  
  const { presetIndex, currentPreset, setDensity } = useDensityConfig();
  const { 
    pageWidgets, 
    isEditMode, 
    toggleEditMode, 
    resetLayout, 
    resizeWidget,
    moveWidget,
    deleteWidget,
    addWidget,
    currentPage,
    setCurrentPage,
    totalPages,
    gridCols,
    gridRows,
  } = useGridLayout(currentPreset);

  return (
    <div className="h-screen bg-background overflow-hidden flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onOpenDensity={() => setDensityDialogOpen(true)}
        onResetLayout={resetLayout}
        onAddWidget={() => setAddWidgetDialogOpen(true)}
      />
      
      <main className="ml-20 flex-1 flex flex-col overflow-hidden">
        {/* Widget Grid - Fills entire viewport */}
        <div className="flex-1 p-4 overflow-hidden">
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

      {/* Add Widget Dialog */}
      <AddWidgetDialog
        open={addWidgetDialogOpen}
        onOpenChange={setAddWidgetDialogOpen}
        onAddWidget={addWidget}
      />
    </div>
  );
};

export default Index;
