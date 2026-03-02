import { Button } from "@/components/ui/button";
import { ProJuiceLogo } from "@/components/ProJuiceLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeliveryEntryCard } from "@/components/DeliveryEntryCard";
import { DriverNotesForm } from "@/components/DriverNotesForm";
import { ArrowLeft } from "lucide-react";
import type { DeliveryResult } from "@shared/types";

interface DeliveryInstructionsProps {
  result: DeliveryResult;
  onBack: () => void;
}

export function DeliveryInstructions({ result, onBack }: DeliveryInstructionsProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ProJuiceLogo size="sm" />
            <span className="text-sm text-muted-foreground hidden sm:block">Driver Portal</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Delivery instructions for</p>
          <h1 className="text-2xl font-bold font-mono tracking-wider">{result.postcode}</h1>
        </div>

        <div className="space-y-3">
          {result.entries.map((entry, i) => (
            <DeliveryEntryCard key={i} entry={entry} />
          ))}
        </div>

        <DriverNotesForm postcode={result.postcode} />
      </main>
    </div>
  );
}
