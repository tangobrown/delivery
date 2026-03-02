import jsPDF from "jspdf";
import type { DeliveryResult } from "@shared/types";

export async function generatePDF(results: DeliveryResult[]): Promise<void> {
  const doc = new jsPDF();
  const margin = 15;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  const addText = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = size * 0.4;
    if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + 2;
  };

  const addSpace = (h = 4) => {
    y += h;
  };

  // Header
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ProJuice Delivery Portal", margin, 13);
  doc.setTextColor(0, 0, 0);
  y = 28;

  addText(`Generated: ${new Date().toLocaleString("en-GB")}`, 9);
  addSpace();

  for (const result of results) {
    // Postcode header
    doc.setFillColor(245, 245, 245);
    doc.rect(margin - 2, y - 4, maxWidth + 4, 10, "F");
    addText(result.postcode, 13, true);
    addSpace(2);

    for (const entry of result.entries) {
      addText(entry.companyName, 11, true);

      if (entry.what3words.length > 0) {
        addText(`What3Words: ${entry.what3words.join(", ")}`, 9);
      }
      if (entry.phones.length > 0) {
        addText(`Phone: ${entry.phones.map((p) => p.display).join(", ")}`, 9);
      }

      for (const instr of entry.instructions) {
        addText(`[${instr.source}]`, 8, true);
        addText(instr.text, 9);
        addSpace(1);
      }

      // Try to embed images
      for (let i = 0; i < entry.images.length; i++) {
        try {
          const imgData = await fetchImageAsDataUrl(entry.images[i]);
          if (imgData) {
            if (y + 40 > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.addImage(imgData, "JPEG", margin, y, 40, 40);
            y += 44;
          }
        } catch {
          // Skip images that fail to load
        }
      }

      addSpace(3);
    }
    addSpace(4);
  }

  doc.save(`projuice-delivery-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
