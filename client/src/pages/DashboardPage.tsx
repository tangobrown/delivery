import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProJuiceLogo } from "@/components/ProJuiceLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PostcodeLookup } from "@/components/PostcodeLookup";
import { DeliveryInstructions } from "@/components/DeliveryInstructions";
import { MultipleDeliveryResults } from "@/components/MultipleDeliveryResults";
import { NoResultsView } from "@/components/NoResultsView";
import type { DeliveryResult } from "@shared/types";

type ViewState =
  | { type: "search" }
  | { type: "single"; result: DeliveryResult }
  | { type: "notFound"; postcode: string }
  | { type: "multiple"; results: DeliveryResult[]; notFound: string[] };

export function DashboardPage() {
  const [view, setView] = useState<ViewState>({ type: "search" });

  if (view.type === "single") {
    return (
      <DeliveryInstructions
        result={view.result}
        onBack={() => setView({ type: "search" })}
      />
    );
  }

  if (view.type === "notFound") {
    return (
      <NoResultsView
        postcode={view.postcode}
        onBack={() => setView({ type: "search" })}
      />
    );
  }

  if (view.type === "multiple") {
    return (
      <MultipleDeliveryResults
        results={view.results}
        notFound={view.notFound}
        onBack={() => setView({ type: "search" })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <ProJuiceLogo size="sm" />
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Postcode Lookup</CardTitle>
            <p className="text-sm text-muted-foreground">
              Search for delivery instructions by postcode
            </p>
          </CardHeader>
          <CardContent>
            <PostcodeLookup
              onSingleResult={(result) => setView({ type: "single", result })}
              onSingleNotFound={(postcode) => setView({ type: "notFound", postcode })}
              onMultipleResults={(results, notFound) =>
                setView({ type: "multiple", results, notFound })
              }
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
