import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { WidgetGrid } from "@/components/widgets/WidgetGrid";
import { useGridLayout, GridPosition } from "@/hooks/useGridLayout";
import { useDensityConfig } from "@/hooks/useDensityConfig";
import { DensitySettingsDialog } from "@/components/DensitySettingsDialog";
import { AddWidgetDialog } from "@/components/AddWidgetDialog";
import { PageIndicator } from "@/components/PageIndicator";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [densityDialogOpen, setDensityDialogOpen] = useState(false);
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [isCellSelectionMode, setIsCellSelectionMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridPosition | null>(null);
  
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
    occupiedCells,
  } = useGridLayout(currentPreset);

  // Handle add widget button press - enter cell selection mode
  const handleAddWidgetStart = useCallback(() => {
    setIsCellSelectionMode(true);
    setSelectedCell(null);
  }, []);

  // Handle cell selection
  const handleCellSelect = useCallback((col: number, row: number) => {
    setSelectedCell({ col, row });
    setAddWidgetDialogOpen(true);
  }, []);

  // Handle dialog close - reset selection mode
  const handleDialogOpenChange = useCallback((open: boolean) => {
    setAddWidgetDialogOpen(open);
    if (!open) {
      setIsCellSelectionMode(false);
      setSelectedCell(null);
    }
  }, []);

  // Handle widget addition with position
  const handleAddWidget = useCallback((type: string, props: Record<string, unknown>, position?: GridPosition) => {
    addWidget(type, props, position);
    setIsCellSelectionMode(false);
    setSelectedCell(null);
  }, [addWidget]);

  return (
    <div className="h-screen bg-background overflow-hidden flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onOpenDensity={() => setDensityDialogOpen(true)}
        onResetLayout={resetLayout}
        onAddWidget={handleAddWidgetStart}
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
            isCellSelectionMode={isCellSelectionMode}
            occupiedCells={occupiedCells}
            selectedCell={selectedCell}
            onCellSelect={handleCellSelect}
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
        onOpenChange={handleDialogOpenChange}
        onAddWidget={handleAddWidget}
        selectedCell={selectedCell}
      />
    </div>
  );
};

export default Index;
