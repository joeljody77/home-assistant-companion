import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHomeAssistantContext } from "@/contexts/HomeAssistantContext";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Unplug,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface HomeAssistantSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HomeAssistantSettingsDialog = ({
  open,
  onOpenChange,
}: HomeAssistantSettingsDialogProps) => {
  const {
    config,
    isConnected,
    isLoading,
    error,
    entities,
    testConnection,
    connect,
    disconnect,
    fetchEntities,
  } = useHomeAssistantContext();

  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved config when dialog opens
  useEffect(() => {
    if (open && config) {
      setUrl(config.url);
      setToken(config.token);
    }
  }, [open, config]);

  const handleTest = async () => {
    if (!url || !token) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    const result = await testConnection(url, token);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleConnect = async () => {
    if (!url || !token) return;
    
    setIsSaving(true);
    await connect(url, token);
    setIsSaving(false);
    
    if (!error) {
      onOpenChange(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setUrl("");
    setToken("");
    setTestResult(null);
  };

  const handleRefresh = async () => {
    await fetchEntities();
  };

  // Group entities by domain for stats
  const entityStats = entities.reduce((acc, entity) => {
    const domain = entity.entity_id.split(".")[0];
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Home Assistant Settings</DialogTitle>
          <DialogDescription>
            Connect to your Home Assistant instance to control your smart home devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isConnected ? (
            // Connected state
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Connected</p>
                  <p className="text-sm text-muted-foreground truncate">{config?.url}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh entities"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
              </div>

              {/* Entity stats */}
              <div className="space-y-2">
                <Label>Available Entities ({entities.length})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(entityStats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 9)
                    .map(([domain, count]) => (
                      <div
                        key={domain}
                        className="px-3 py-2 rounded-lg bg-secondary text-center"
                      >
                        <p className="text-xs text-muted-foreground capitalize">{domain}</p>
                        <p className="font-semibold">{count}</p>
                      </div>
                    ))}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="w-full gap-2"
              >
                <Unplug className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          ) : (
            // Connection form
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ha-url">Home Assistant URL</Label>
                <Input
                  id="ha-url"
                  placeholder="http://homeassistant.local:8123"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The URL you use to access your Home Assistant instance
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ha-token">Long-Lived Access Token</Label>
                <Input
                  id="ha-token"
                  type="password"
                  placeholder="eyJ0eXAiOiJKV1Qi..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Create one in Home Assistant:{" "}
                  <span className="font-mono text-xs">
                    Profile → Long-Lived Access Tokens
                  </span>
                </p>
              </div>

              {/* Test result */}
              {testResult && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    testResult.success
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}

              {/* Error from connection attempt */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={!url || !token || isTesting}
                  className="flex-1"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Test Connection
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={!url || !token || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Connect
                </Button>
              </div>

              <a
                href="https://www.home-assistant.io/docs/authentication/#your-account-profile"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                How to create an access token
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
