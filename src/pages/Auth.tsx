import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ACCESS_CODE = "WeLoveSE2026!";

export default function Auth() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (code === ACCESS_CODE) {
      sessionStorage.setItem("dashboard_access", "granted");
      navigate("/", { replace: true });
    } else {
      toast.error("Incorrect access code");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-xl gradient-bar flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Dashboard Access</CardTitle>
          <CardDescription>Enter the access code to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Access Code</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  type="password"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enter Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
