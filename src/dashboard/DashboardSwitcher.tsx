import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Copy, Pencil, Trash2, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DashboardConfig } from "./types";

interface DashboardSwitcherProps {
  dashboards: DashboardConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DashboardSwitcher({
  dashboards, activeId, onSelect, onCreate, onRename, onDuplicate, onDelete,
}: DashboardSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const active = dashboards.find(d => d.id === activeId) ?? dashboards[0];

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
    setCreating(false);
    setOpen(false);
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    onRename(id, editName.trim());
    setEditingId(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[260px]">
          <Star className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate font-semibold">{active?.name}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-1.5 max-h-[60vh] overflow-y-auto">
          {dashboards.map(d => (
            <div key={d.id} className="group flex items-center gap-1">
              {editingId === d.id ? (
                <div className="flex-1 flex items-center gap-1 p-1">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRename(d.id)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={() => handleRename(d.id)}><Check className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { onSelect(d.id); setOpen(false); }}
                    className={cn(
                      "flex-1 flex items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted transition-colors",
                      d.id === activeId && "bg-muted",
                    )}
                  >
                    <Check className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", d.id === activeId ? "opacity-100 text-primary" : "opacity-0")} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{d.name}</p>
                      {d.description && <p className="text-[11px] text-muted-foreground truncate">{d.description}</p>}
                    </div>
                    {d.isPreset && <span className="text-[9px] uppercase tracking-wider text-muted-foreground shrink-0">Preset</span>}
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center pr-1">
                    {!d.isPreset && (
                      <button
                        onClick={() => { setEditingId(d.id); setEditName(d.name); }}
                        title="Rename"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      ><Pencil className="h-3 w-3" /></button>
                    )}
                    <button
                      onClick={() => { onDuplicate(d.id); setOpen(false); }}
                      title="Duplicate"
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    ><Copy className="h-3 w-3" /></button>
                    {!d.isPreset && (
                      <button
                        onClick={() => onDelete(d.id)}
                        title="Delete"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                      ><Trash2 className="h-3 w-3" /></button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t p-1.5">
          {creating ? (
            <div className="flex gap-1 p-1">
              <Input
                placeholder="Dashboard name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-muted text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> New dashboard
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
