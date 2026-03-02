import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProJuiceLogo } from "@/components/ProJuiceLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeliveryEntryCard } from "@/components/DeliveryEntryCard";
import { DriverNotesForm } from "@/components/DriverNotesForm";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { generatePDF } from "@/lib/pdf";
import { LogOut, ArrowLeft, FileDown, Loader2 } from "lucide-react";
import type { DeliveryResult } from "@shared/types";

interface MultipleDeliveryResultsProps {
  results: DeliveryResult[];
  notFound: string[];
  onBack: () => void;
  onLogout: () => void;
}

export function MultipleDeliveryResults({ results, notFound, onBack, onLogout }: MultipleDeliveryResultsProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await generatePDF(results);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ProJuiceLogo size="sm" />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={generatingPdf || results.length === 0}>
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <FileDown className="h-4 w-4 mr-1" />
              )}
              PDF
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <h1 className="text-xl font-bold">Multiple Delivery Results</h1>
          <Badge variant="default">{results.length} found</Badge>
          {notFound.length > 0 && (
            <Badge variant="destructive">{notFound.length} not found</Badge>
          )}
        </div>

        {notFound.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive mb-1">Postcodes not found:</p>
            <div className="flex flex-wrap gap-1">
              {notFound.map((pc) => (
                <Badge key={pc} variant="outline" className="font-mono text-xs">{pc}</Badge>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {results.map((result) => (
              <AccordionItem key={result.postcode} value={result.postcode} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-mono font-bold text-lg">{result.postcode}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {result.entries.length} {result.entries.length === 1 ? "entry" : "entries"}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {result.entries.map((entry, i) => (
                      <DeliveryEntryCard key={i} entry={entry} />
                    ))}
                    <DriverNotesForm postcode={result.postcode} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
