import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const STORAGE_KEY = "calltrack_api_settings";

interface ApiSettings {
  telavox_api_key: string;
  telavox_base_url: string;
  pipedrive_api_token: string;
  pipedrive_base_url: string;
}

function loadSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { telavox_api_key: "", telavox_base_url: "https://api.telavox.se/v1", pipedrive_api_token: "", pipedrive_base_url: "" };
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [telavoxKey, setTelavoxKey] = useState("");
  const [telavoxUrl, setTelavoxUrl] = useState("https://api.telavox.se/v1");
  const [pipedriveToken, setPipedriveToken] = useState("");
  const [pipedriveUrl, setPipedriveUrl] = useState("");
  const [showTelavox, setShowTelavox] = useState(false);
  const [showPipedrive, setShowPipedrive] = useState(false);

  useEffect(() => {
    if (open) {
      const s = loadSettings();
      setTelavoxKey(s.telavox_api_key);
      setTelavoxUrl(s.telavox_base_url);
      setPipedriveToken(s.pipedrive_api_token);
      setPipedriveUrl(s.pipedrive_base_url);
    }
  }, [open]);

  const handleSave = () => {
    const settings: ApiSettings = {
      telavox_api_key: telavoxKey.trim(),
      telavox_base_url: telavoxUrl.trim(),
      pipedrive_api_token: pipedriveToken.trim(),
      pipedrive_base_url: pipedriveUrl.trim(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("API settings saved!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings className="h-3.5 w-3.5" /> Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Telavox</h3>
            <div className="space-y-2">
              <Label htmlFor="telavox-key" className="text-xs text-muted-foreground">API Key</Label>
              <div className="relative">
                <Input
                  id="telavox-key"
                  type={showTelavox ? "text" : "password"}
                  value={telavoxKey}
                  onChange={e => setTelavoxKey(e.target.value)}
                  placeholder="Enter Telavox API key..."
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowTelavox(!showTelavox)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showTelavox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telavox-url" className="text-xs text-muted-foreground">Base URL</Label>
              <Input
                id="telavox-url"
                value={telavoxUrl}
                onChange={e => setTelavoxUrl(e.target.value)}
                placeholder="https://api.telavox.se/v1"
                className="text-sm"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Pipedrive</h3>
            <div className="space-y-2">
              <Label htmlFor="pipedrive-token" className="text-xs text-muted-foreground">API Token</Label>
              <div className="relative">
                <Input
                  id="pipedrive-token"
                  type={showPipedrive ? "text" : "password"}
                  value={pipedriveToken}
                  onChange={e => setPipedriveToken(e.target.value)}
                  placeholder="Enter Pipedrive API token..."
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPipedrive(!showPipedrive)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPipedrive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipedrive-url" className="text-xs text-muted-foreground">Base URL</Label>
              <Input
                id="pipedrive-url"
                value={pipedriveUrl}
                onChange={e => setPipedriveUrl(e.target.value)}
                placeholder="https://your-company.pipedrive.com/api/v1"
                className="text-sm"
              />
            </div>
          </div>

          <Separator />

          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>

          <p className="text-xs text-muted-foreground">
            Your API tokens are stored in your browser's local storage and persist across sessions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
