import { 
  Home, 
  Lightbulb, 
  Thermometer, 
  Shield, 
  Camera, 
  Music2,
  Settings,
  LayoutGrid,
  Grid3X3,
  Pencil,
  Check,
  RotateCcw,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  onOpenDensity?: () => void;
  onResetLayout?: () => void;
  onAddWidget?: () => void;
  onOpenSettings?: () => void;
}

const menuItems = [
  { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
  { id: "lights", icon: Lightbulb, label: "Lights" },
  { id: "climate", icon: Thermometer, label: "Climate" },
  { id: "security", icon: Shield, label: "Security" },
  { id: "cameras", icon: Camera, label: "Cameras" },
  { id: "media", icon: Music2, label: "Media" },
];

export const Sidebar = ({ 
  activeSection, 
  onSectionChange,
  isEditMode = false,
  onToggleEditMode,
  onOpenDensity,
  onResetLayout,
  onAddWidget,
  onOpenSettings,
}: SidebarProps) => {
  return (
    <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center gap-3 border-t border-sidebar-border bg-sidebar px-3 md:left-0 md:top-0 md:h-screen md:w-20 md:flex-col md:gap-0 md:border-r md:border-t-0 md:px-0 md:py-6">
      {/* Logo */}
      <div className="hidden md:mb-8 md:flex">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Home className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      <div className="flex w-full items-center gap-3 overflow-x-auto md:flex-1 md:flex-col md:gap-2 md:overflow-visible">
        {/* Navigation */}
        <nav className="flex flex-1 items-center gap-2 md:flex-col md:flex-none">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150",
                activeSection === item.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-sidebar-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground"
              )}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </nav>

        {/* Layout Controls */}
        <div className="flex items-center gap-2 md:flex-col md:gap-2 md:mb-4 md:mt-auto">
          {/* Density Button */}
          <button
            onClick={onOpenDensity}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground transition-all duration-150"
            title="Grid Density"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>

          {/* Add Widget Button - only in edit mode */}
          {isEditMode && (
            <button
              onClick={onAddWidget}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg active:scale-95 transition-all duration-150"
              title="Add Widget"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          {/* Reset Button - only in edit mode */}
          {isEditMode && (
            <button
              onClick={onResetLayout}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground transition-all duration-150"
              title="Reset Layout"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {/* Edit Mode Toggle */}
          <button
            onClick={onToggleEditMode}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150",
              isEditMode
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-sidebar-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground"
            )}
            title={isEditMode ? "Done Editing" : "Edit Layout"}
          >
            {isEditMode ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground transition-all duration-150"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
