import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export function VersionChecker() {
  const [showBanner, setShowBanner] = useState(false);
  const initialVersion = useRef<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version");
        if (!res.ok) return;
        const data = await res.json() as { version: string };

        if (initialVersion.current === null) {
          initialVersion.current = data.version;
          return;
        }

        if (data.version !== initialVersion.current) {
          setShowBanner(true);
        }
      } catch {
        // Ignore network errors
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    initialVersion.current = null; // Will re-capture on next poll
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg">
      <span className="text-sm">A new version is available.</span>
      <Button size="sm" onClick={() => window.location.reload()}>
        <RefreshCw className="mr-1 h-3 w-3" />
        Refresh Now
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDismiss}>
        <X className="h-3 w-3" />
        Later
      </Button>
    </div>
  );
}
