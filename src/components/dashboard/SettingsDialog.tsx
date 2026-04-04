import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getApiConfig, saveApiConfig, checkHealth } from "@/lib/api";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [telavoxKey, setTelavoxKey] = useState("");
  const [telavoxUrl, setTelavoxUrl] = useState("");
  const [pipedriveToken, setPipedriveToken] = useState("");
  const [pipedriveUrl, setPipedriveUrl] = useState("");
  const [showTelavox, setShowTelavox] = useState(false);
  const [showPipedrive, setShowPipedrive] = useState(false);
  const [status, setStatus] = useState<{ telavox: boolean; pipedrive: boolean } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      const config = getApiConfig();
      setTelavoxKey(config.telavoxApiKey);
      setTelavoxUrl(config.telavoxBaseUrl);
      setPipedriveToken(config.pipedriveApiToken);
      setPipedriveUrl(config.pipedriveBaseUrl);
    }
  }, [open]);

  const handleSave = () => {
    saveApiConfig({
      telavoxApiKey: telavoxKey.trim(),
      telavoxBaseUrl: telavoxUrl.trim(),
      pipedriveApiToken: pipedriveToken.trim(),
      pipedriveBaseUrl: pipedriveUrl.trim(),
    });
    toast.success("API settings saved!");
  };

  const handleTest = async () => {
    handleSave();
    setTesting(true);
    const health = await checkHealth();
    if (health) {
      setStatus({
        telavox: health.integrations.telavox === "connected",
        pipedrive: health.integrations.pipedrive === "connected",
      });
    } else {
      setStatus(null);
      toast.error("Could not reach the backend server. Make sure it's running.");
    }
    setTesting(false);
  };

  const StatusIcon = ({ connected }: { connected: boolean }) =>
    connected ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />;

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
          {/* Telavox */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Telavox</h3>
              {status && <StatusIcon connected={status.telavox} />}
            </div>
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

          {/* Pipedrive */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Pipedrive</h3>
              {status && <StatusIcon connected={status.pipedrive} />}
            </div>
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

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">Save</Button>
            <Button variant="outline" onClick={handleTest} disabled={testing} className="flex-1">
              {testing ? "Testing..." : "Save & Test"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Tokens are stored in your browser's local storage. The backend server must be running for connections to work.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
