import { useState } from "react";
import { LayoutDashboard, Plus, Trash2, Star, BarChart3, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);

  const handleSave = () => {
    if (newName.trim()) {
      onSaveView(newName.trim(), currentFilters);
      setNewName("");
      setShowInput(false);
    }
  };

  return (
    <aside className={cn(
      "bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col transition-all duration-300",
      collapsed ? "w-16 p-2" : "w-64 p-4"
    )}>
      {/* Header */}
      <div className={cn("flex items-center mb-8", collapsed ? "justify-center" : "justify-between px-2")}>
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-lg gradient-bar flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <h2 className="font-bold text-sidebar-foreground text-lg">CallTrack</h2>}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="mx-auto mb-6 text-sidebar-muted hover:text-sidebar-foreground transition-colors">
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {!collapsed && <p className="text-xs font-semibold tracking-wider text-sidebar-muted uppercase mb-3 px-2">Views</p>}

      <div className="space-y-1 flex-1">
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => onSelectView(view)}
            title={collapsed ? view.name : undefined}
            className={cn(
              "w-full text-left rounded-lg text-sm flex items-center justify-between group transition-all duration-150",
              collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5",
              activeViewId === view.id
                ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            {collapsed ? (
              <span className="flex items-center justify-center w-full">
                {view.isDefault ? <Star className="h-3.5 w-3.5 text-stat-orange" /> : <LayoutDashboard className="h-3.5 w-3.5" />}
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2 truncate">
                  {view.isDefault && <Star className="h-3 w-3 text-stat-orange" />}
                  {view.name}
                </span>
                {!view.isDefault && (
                  <Trash2
                    className="h-3 w-3 text-sidebar-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
                  />
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {!collapsed && (
        <div className="mt-4 pt-4 border-t border-sidebar-border">
          {showInput ? (
            <div className="space-y-2">
              <Input
                placeholder="View name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                autoFocus
                className="text-sm bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="flex-1">Save</Button>
                <Button size="sm" variant="outline" onClick={() => setShowInput(false)} className="border-sidebar-border text-sidebar-foreground">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setShowInput(true)}>
              <Plus className="h-4 w-4 mr-1" /> Save current view
            </Button>
          )}
        </div>
      )}

      {collapsed && (
        <div className="mt-4 pt-4 border-t border-sidebar-border flex justify-center">
          <button
            onClick={() => { setCollapsed(false); setShowInput(true); }}
            title="Save current view"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
