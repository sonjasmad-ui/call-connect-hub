import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetConfig, VisualizationType, DisplayFormat } from "./types";
import { getWidgetDefinition } from "./registry";

interface WidgetSettingsProps {
  widget: WidgetConfig | null;
  onClose: () => void;
  onSave: (next: WidgetConfig) => void;
  onDelete: (id: string) => void;
  onSetFeatured: (id: string) => void;
}

const VIZ_LABELS: Record<VisualizationType, string> = {
  kpi: "Number card",
  line: "Line chart",
  bar: "Bar chart",
  donut: "Donut chart",
  table: "Table",
  progress: "Progress bar",
};

const FORMAT_LABELS: Record<DisplayFormat, string> = {
  integer: "Whole number",
  decimal: "Decimal",
  percent: "Percentage",
  duration: "Duration",
  currency: "Currency",
};

export function WidgetSettings({ widget, onClose, onSave, onDelete, onSetFeatured }: WidgetSettingsProps) {
  const [draft, setDraft] = useState<WidgetConfig | null>(widget);

  useEffect(() => setDraft(widget), [widget]);

  if (!widget || !draft) return null;
  const def = getWidgetDefinition(widget.metric);

  // Format only matters for KPI / progress
  const showFormat = draft.visualization === "kpi" || draft.visualization === "progress";

  const update = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = () => {
    if (draft) onSave(draft);
    onClose();
  };

  return (
    <Sheet open={!!widget} onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Widget settings</SheetTitle>
          <p className="text-xs text-muted-foreground">{def.description}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 mt-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={draft.title} onChange={e => update("title", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subtitle (optional)</Label>
            <Input
              value={draft.subtitle ?? ""}
              onChange={e => update("subtitle", e.target.value || undefined)}
              placeholder="e.g. Last 30 days"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Visualization</Label>
            <div className="grid grid-cols-2 gap-2">
              {def.supportedVisualizations.map(v => (
                <button
                  key={v}
                  onClick={() => update("visualization", v)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm text-left transition-all",
                    draft.visualization === v
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-foreground/30 text-muted-foreground",
                  )}
                >
                  {VIZ_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {showFormat && (
            <div className="space-y-1.5">
              <Label className="text-xs">Display format</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["integer", "decimal", "percent", "duration"] as DisplayFormat[]).map(f => (
                  <button
                    key={f}
                    onClick={() => update("format", f)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm text-left",
                      draft.format === f
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/30",
                    )}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {draft.visualization === "progress" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Target value</Label>
              <Input
                type="number"
                value={(draft.options?.target as number | undefined) ?? ""}
                onChange={e => update("options", { ...(draft.options || {}), target: Number(e.target.value) || 0 })}
                placeholder="e.g. 30"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Featured widget</p>
              <p className="text-xs text-muted-foreground">Highlight this with brand emphasis. One per dashboard.</p>
            </div>
            <Switch
              checked={!!draft.featured}
              onCheckedChange={checked => {
                update("featured", checked);
                if (checked) onSetFeatured(draft.id);
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-4 border-t mt-4">
          <Button variant="ghost" size="sm" onClick={() => { onDelete(draft.id); onClose(); }} className="text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
