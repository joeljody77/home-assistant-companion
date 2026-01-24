import { useState, useMemo } from "react";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  Thermometer,
  Gauge,
  Power,
  Camera,
  Music2,
  Cloud,
  Lock,
  Clapperboard,
  HelpCircle,
  Search,
  Unplug,
} from "lucide-react";
import { HAEntity, DOMAIN_TO_WIDGET_TYPE } from "@/hooks/useHomeAssistant";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  light: Lightbulb,
  switch: Power,
  climate: Thermometer,
  sensor: Gauge,
  binary_sensor: Gauge,
  lock: Lock,
  camera: Camera,
  media_player: Music2,
  weather: Cloud,
  scene: Clapperboard,
  script: Clapperboard,
  automation: Clapperboard,
  fan: Power,
  input_boolean: Power,
};

interface EntityPickerProps {
  selectedEntityId?: string;
  onSelect: (entity: HAEntity) => void;
  filterByWidgetType?: string;
  showRecommendedWidget?: boolean;
}

export const EntityPicker = ({
  selectedEntityId,
  onSelect,
  filterByWidgetType,
  showRecommendedWidget = false,
}: EntityPickerProps) => {
  const { entities, isConnected, getEntitiesForWidgetType } = useHomeAssistantContext();
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Filter entities based on widget type or all entities
  const availableEntities = useMemo(() => {
    if (filterByWidgetType) {
      return getEntitiesForWidgetType(filterByWidgetType);
    }
    return entities;
  }, [entities, filterByWidgetType, getEntitiesForWidgetType]);

  // Get unique domains from available entities
  const domains = useMemo(() => {
    const domainSet = new Set(availableEntities.map(e => e.entity_id.split(".")[0]));
    return Array.from(domainSet).sort();
  }, [availableEntities]);

  // Filter entities by search and domain
  const filteredEntities = useMemo(() => {
    let filtered = availableEntities;

    if (selectedDomain) {
      filtered = filtered.filter(e => e.entity_id.startsWith(`${selectedDomain}.`));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.entity_id.toLowerCase().includes(searchLower) ||
        (e.attributes.friendly_name || "").toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => {
      const nameA = a.attributes.friendly_name || a.entity_id;
      const nameB = b.attributes.friendly_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });
  }, [availableEntities, selectedDomain, search]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Unplug className="w-8 h-8 mb-2" />
        <p className="text-sm">Not connected to Home Assistant</p>
        <p className="text-xs">Configure connection in Settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search entities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Domain filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedDomain(null)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
            !selectedDomain
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          )}
        >
          All ({availableEntities.length})
        </button>
        {domains.map(domain => {
          const count = availableEntities.filter(e => e.entity_id.startsWith(`${domain}.`)).length;
          const Icon = DOMAIN_ICONS[domain] || HelpCircle;
          return (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain === selectedDomain ? null : domain)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1",
                domain === selectedDomain
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              )}
            >
              <Icon className="w-3 h-3" />
              <span className="capitalize">{domain}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Entity list */}
      <ScrollArea className="h-64 rounded-lg border">
        <div className="p-2 space-y-1">
          {filteredEntities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No entities found
            </p>
          ) : (
            filteredEntities.map(entity => {
              const domain = entity.entity_id.split(".")[0];
              const Icon = DOMAIN_ICONS[domain] || HelpCircle;
              const isSelected = entity.entity_id === selectedEntityId;
              const recommendedWidget = DOMAIN_TO_WIDGET_TYPE[domain];

              return (
                <button
                  key={entity.entity_id}
                  onClick={() => onSelect(entity)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", !isSelected && "text-primary")} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entity.attributes.friendly_name || entity.entity_id}
                    </p>
                    <p className={cn(
                      "text-xs truncate",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {entity.entity_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isSelected ? "bg-primary-foreground/20" : "bg-secondary"
                    )}>
                      {entity.state}
                    </span>
                    {showRecommendedWidget && recommendedWidget && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full capitalize",
                        isSelected ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                      )}>
                        {recommendedWidget}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
