import { Bell, Search, User, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  isConnected?: boolean;
}

export const Header = ({ title, isConnected = true }: HeaderProps) => {
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentDate} • {currentTime}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl",
            isConnected ? "bg-success/10" : "bg-destructive/10"
          )}
        >
          {isConnected ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-destructive" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              isConnected ? "text-success" : "text-destructive"
            )}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Search */}
        <button className="icon-button">
          <Search className="w-5 h-5 text-foreground" />
        </button>

        {/* Notifications */}
        <button className="icon-button relative">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
        </button>

        {/* Profile */}
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center">
          <User className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </header>
  );
};
