import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [telavoxKey, setTelavoxKey] = useState("");
  const [telavoxUrl, setTelavoxUrl] = useState("https://api.telavox.se/v1");
  const [pipedriveToken, setPipedriveToken] = useState("");
  const [pipedriveUrl, setPipedriveUrl] = useState("");
  const [showTelavox, setShowTelavox] = useState(false);
  const [showPipedrive, setShowPipedrive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      supabase
        .from("api_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setTelavoxKey(data.telavox_api_key);
            setTelavoxUrl(data.telavox_base_url);
            setPipedriveToken(data.pipedrive_api_token);
            setPipedriveUrl(data.pipedrive_base_url);
          }
          setLoading(false);
        });
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const settings = {
      user_id: user.id,
      telavox_api_key: telavoxKey.trim(),
      telavox_base_url: telavoxUrl.trim(),
      pipedrive_api_token: pipedriveToken.trim(),
      pipedrive_base_url: pipedriveUrl.trim(),
    };

    const { error } = await supabase
      .from("api_settings")
      .upsert(settings, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("API settings saved securely!");
    }
    setSaving(false);
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

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Telavox */}
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

            {/* Pipedrive */}
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

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>

            <p className="text-xs text-muted-foreground">
              Your API tokens are stored securely in the database and linked to your account. They persist across sessions and devices.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
