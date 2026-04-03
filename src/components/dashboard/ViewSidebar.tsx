import { useState } from "react";
import { LayoutDashboard, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SavedView, DashboardFilters } from "@/data/dummyData";
import { cn } from "@/lib/utils";

interface ViewSidebarProps {
  views: SavedView[];
  activeViewId: string;
  onSelectView: (view: SavedView) => void;
  onSaveView: (name: string, filters: DashboardFilters) => void;
  onDeleteView: (id: string) => void;
  currentFilters: DashboardFilters;
}

export function ViewSidebar({ views, activeViewId, onSelectView, onSaveView, onDeleteView, currentFilters }: ViewSidebarProps) {
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleSave = () => {
    if (newName.trim()) {
      onSaveView(newName.trim(), currentFilters);
      setNewName("");
      setShowInput(false);
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Saved Views</h2>
      </div>

      <div className="space-y-1 flex-1">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => onSelectView(view)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group transition-colors",
              activeViewId === view.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground hover:bg-accent"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {view.isDefault && <Star className="h-3 w-3 text-stat-orange" />}
              {view.name}
            </span>
            {!view.isDefault && (
              <Trash2
                className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        {showInput ? (
          <div className="space-y-2">
            <Input
              placeholder="View name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1">Save</Button>
              <Button size="sm" variant="outline" onClick={() => setShowInput(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowInput(true)}>
            <Plus className="h-4 w-4 mr-1" /> Save current view
          </Button>
        )}
      </div>
    </aside>
  );
}
