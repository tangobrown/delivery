import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ImageLightbox } from "@/components/ImageLightbox";
import { Building2, MapPin, Phone } from "lucide-react";
import type { DeliveryEntry } from "@shared/types";

interface DeliveryEntryCardProps {
  entry: DeliveryEntry;
}

export function DeliveryEntryCard({ entry }: DeliveryEntryCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <h3 className="font-semibold text-base">{entry.companyName}</h3>
      </div>

      {entry.what3words.length > 0 && (
        <div className="flex flex-wrap gap-2 items-start">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-1">
            {entry.what3words.map((w3w, i) => (
              <a
                key={i}
                href={`https://what3words.com/${w3w}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline font-mono"
              >
                ///{w3w}
              </a>
            ))}
          </div>
        </div>
      )}

      {entry.phones.length > 0 && (
        <div className="flex flex-wrap gap-2 items-start">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex flex-wrap gap-2">
            {entry.phones.map((phone, i) => (
              <a
                key={i}
                href={`tel:${phone.canonical}`}
                className="text-sm text-primary hover:underline"
              >
                {phone.display}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entry.instructions.map((instr, i) => (
          <div key={i} className="space-y-1">
            <Badge variant={instr.source === "Order instructions" ? "default" : "secondary"} className="text-xs">
              {instr.source}
            </Badge>
            <p className="text-sm whitespace-pre-wrap pl-1">{instr.text}</p>
          </div>
        ))}
      </div>

      {entry.images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {entry.images.map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="rounded overflow-hidden border hover:opacity-80 transition-opacity"
              title="Click to enlarge"
            >
              <img
                src={img}
                alt={`Delivery image ${i + 1}`}
                className="w-8 h-8 object-cover aspect-square"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={entry.images}
          startIndex={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
