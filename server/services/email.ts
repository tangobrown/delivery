import { Resend } from "resend";
import type { DriverNote } from "@shared/schema";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDriverNoteEmail(note: DriverNote): Promise<void> {
  const w3wLink = note.what3words
    ? `<a href="https://what3words.com/${note.what3words}">${note.what3words}</a>`
    : "N/A";

  const timestamp = note.createdAt
    ? new Date(note.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })
    : new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  const htmlBody = `
    <h2>Delivery Notes Update</h2>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 8px; font-weight: bold;">Driver:</td><td style="padding: 8px;">${note.driverName ?? "Unknown"}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Postcode:</td><td style="padding: 8px;">${note.postcode}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">What3Words:</td><td style="padding: 8px;">${w3wLink}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td style="padding: 8px;">${timestamp}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Notes:</td><td style="padding: 8px; white-space: pre-wrap;">${note.notes}</td></tr>
    </table>
  `;

  const plainBody = `
Delivery Notes Update

Driver: ${note.driverName ?? "Unknown"}
Postcode: ${note.postcode}
What3Words: ${note.what3words || "N/A"}
Time: ${timestamp}
Notes: ${note.notes}
  `.trim();

  const attachments: Array<{ filename: string; content: string }> = [];
  if (note.fileContent && note.fileName) {
    const base64 = note.fileContent.replace(/^data:[^;]+;base64,/, "");
    attachments.push({
      filename: note.fileName,
      content: base64,
    });
  }

  await resend.emails.send({
    from: "ProJuice Delivery Portal <notifications@pro-juice.co.uk>",
    to: ["drivers@projuice.co.uk"],
    subject: "Delivery Notes Update From Driver",
    html: htmlBody,
    text: plainBody,
    attachments: attachments.length > 0 ? attachments : undefined,
  });
}
