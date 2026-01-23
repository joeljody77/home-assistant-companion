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
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  onOpenDensity?: () => void;
  onResetLayout?: () => void;
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
}: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-sidebar flex flex-col items-center py-6 border-r border-sidebar-border z-50">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Home className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
              activeSection === item.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </nav>

      {/* Layout Controls */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Density Button */}
        <button
          onClick={onOpenDensity}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          title="Grid Density"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>

        {/* Reset Button - only in edit mode */}
        {isEditMode && (
          <button
            onClick={onResetLayout}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
            title="Reset Layout"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}

        {/* Edit Mode Toggle */}
        <button
          onClick={onToggleEditMode}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
            isEditMode
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          title={isEditMode ? "Done Editing" : "Edit Layout"}
        >
          {isEditMode ? <Check className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
        </button>
      </div>

      {/* Settings */}
      <button
        className="w-12 h-12 rounded-xl flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    </aside>
  );
};
