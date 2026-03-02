import { Button } from "@/components/ui/button";
import { ProJuiceLogo } from "@/components/ProJuiceLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DriverNotesForm } from "@/components/DriverNotesForm";
import { ArrowLeft, SearchX } from "lucide-react";

interface NoResultsViewProps {
  postcode: string;
  onBack: () => void;
}

export function NoResultsView({ postcode, onBack }: NoResultsViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ProJuiceLogo size="sm" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="text-center py-8 space-y-3">
          <SearchX className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">No results found</h2>
          <p className="text-muted-foreground">
            No delivery instructions found for postcode{" "}
            <span className="font-mono font-bold">{postcode}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            You can still submit notes for this delivery below.
          </p>
        </div>
        <DriverNotesForm postcode={postcode} />
      </main>
    </div>
  );
}
