import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { WidgetGrid } from "@/components/widgets/WidgetGrid";
import { useGridLayout, GridPosition, WidgetConfig } from "@/hooks/useGridLayout";
import { useDensityConfig } from "@/hooks/useDensityConfig";
import { DensitySettingsDialog } from "@/components/DensitySettingsDialog";
import { AddWidgetDialog } from "@/components/AddWidgetDialog";
import { EditWidgetDialog } from "@/components/EditWidgetDialog";
import { HomeAssistantSettingsDialog } from "@/components/HomeAssistantSettingsDialog";
import { PageIndicator } from "@/components/PageIndicator";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [densityDialogOpen, setDensityDialogOpen] = useState(false);
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editWidgetDialogOpen, setEditWidgetDialogOpen] = useState(false);
  const [widgetToEdit, setWidgetToEdit] = useState<WidgetConfig | null>(null);
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
    updateWidgetProps,
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

  // Handle widget edit (long-press in edit mode)
  const handleEditWidget = useCallback((widget: WidgetConfig) => {
    setWidgetToEdit(widget);
    setEditWidgetDialogOpen(true);
  }, []);

  // Handle widget save from edit dialog
  const handleSaveWidget = useCallback((widgetId: string, props: Record<string, unknown>) => {
    updateWidgetProps(widgetId, props);
  }, [updateWidgetProps]);

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
        onOpenSettings={() => setSettingsDialogOpen(true)}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 md:ml-20">
        {/* Widget Grid - Fills entire viewport */}
        <div className="flex-1 p-3 md:p-4 overflow-hidden">
          <WidgetGrid
            widgets={pageWidgets}
            isEditMode={isEditMode}
            gridCols={gridCols}
            gridRows={gridRows}
            onMoveWidget={moveWidget}
            onResizeWidget={resizeWidget}
            onDeleteWidget={deleteWidget}
            onEditWidget={handleEditWidget}
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

      {/* Edit Widget Dialog */}
      <EditWidgetDialog
        open={editWidgetDialogOpen}
        onOpenChange={setEditWidgetDialogOpen}
        widget={widgetToEdit}
        onSave={handleSaveWidget}
        onDelete={deleteWidget}
      />

      {/* Home Assistant Settings Dialog */}
      <HomeAssistantSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </div>
  );
};

export default Index;
