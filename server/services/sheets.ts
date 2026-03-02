import { google } from "googleapis";
import type { DeliveryEntry, DeliveryResult, PhoneEntry } from "@shared/types";

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Google Drive image URL conversion
function convertDriveUrl(url: string): string {
  if (!url) return url;
  let fileId: string | null = null;

  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) fileId = fileMatch[1];

  const openMatch = url.match(/[?&]id=([^&]+)/);
  if (!fileId && openMatch) fileId = openMatch[1];

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
  }
  return url;
}

// Phone normalization
function normalizePhone(phone: string): string {
  if (!phone) return "";
  let normalized = phone.replace(/\s+/g, "").replace(/[-().]/g, "");
  if (normalized.startsWith("+44")) {
    normalized = "0" + normalized.slice(3);
  } else if (normalized.startsWith("0044")) {
    normalized = "0" + normalized.slice(4);
  }
  return normalized;
}

function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length >= 10 && /^\d+$/.test(normalized);
}

// Normalize postcode for deduplication
function normalizePostcode(pc: string): string {
  return pc.trim().toUpperCase().replace(/\s+/g, "");
}

async function getAuthClient() {
  // Try Replit connector first
  const connHost = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const replIdentity = process.env.REPL_IDENTITY;

  if (connHost && replIdentity) {
    try {
      const resp = await fetch(`https://${connHost}/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: replIdentity }),
      });
      if (resp.ok) {
        const data = await resp.json() as { access_token: string };
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: data.access_token });
        return auth;
      }
    } catch {
      // Fall through to service account / API key
    }
  }

  // Fall back to service account or default credentials
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return auth;
}

async function getSheetData(
  sheets: ReturnType<typeof google.sheets>,
  range: string
): Promise<string[][]> {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return (resp.data.values as string[][] | null | undefined) ?? [];
}

interface RawEntry {
  postcode: string;
  companyName: string;
  phone?: string;
  instructions?: string;
  source: string;
  what3words?: string;
  image1?: string;
  image2?: string;
}

async function fetchAllRawEntries(): Promise<RawEntry[]> {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const [importData, libraryData] = await Promise.all([
    getSheetData(sheets, "Import!A:AV"),
    getSheetData(sheets, "Library!A:H"),
  ]);

  const entries: RawEntry[] = [];

  // Import tab (no header row)
  for (const row of importData) {
    const postcode = row[18] ?? "";
    const companyName = row[3] ?? "";
    const phone = row[19] ?? "";
    const instructions = row[43] ?? "";
    if (!postcode) continue;
    entries.push({
      postcode: postcode.trim(),
      companyName: companyName.trim(),
      phone: phone.trim(),
      instructions: instructions.trim(),
      source: "Order instructions",
    });
  }

  // Library tab (skip header row 0)
  for (let i = 1; i < libraryData.length; i++) {
    const row = libraryData[i];
    const postcode = row[0] ?? "";
    const companyName = row[2] ?? "";
    const what3words = row[4] ?? "";
    const deliveryNotes = row[5] ?? "";
    const image1 = row[6] ?? "";
    const image2 = row[7] ?? "";
    if (!postcode) continue;
    entries.push({
      postcode: postcode.trim(),
      companyName: companyName.trim(),
      what3words: what3words.trim(),
      instructions: deliveryNotes.trim(),
      image1: image1.trim(),
      image2: image2.trim(),
      source: "Instructions Library",
    });
  }

  return entries;
}

function mergeEntries(rawEntries: RawEntry[]): DeliveryEntry[] {
  const byCompany = new Map<string, DeliveryEntry>();

  for (const raw of rawEntries) {
    const key = raw.companyName.toLowerCase();
    if (!byCompany.has(key)) {
      byCompany.set(key, {
        companyName: raw.companyName || "(Unknown)",
        what3words: [],
        phones: [],
        instructions: [],
        images: [],
      });
    }
    const entry = byCompany.get(key)!;

    // What3Words
    if (raw.what3words) {
      const w3wNorm = raw.what3words.toLowerCase().trim();
      if (!entry.what3words.some((w) => w.toLowerCase() === w3wNorm)) {
        entry.what3words.push(raw.what3words.trim());
      }
    }

    // Phones
    if (raw.phone && isValidPhone(raw.phone)) {
      const canonical = normalizePhone(raw.phone);
      if (!entry.phones.some((p) => p.canonical === canonical)) {
        entry.phones.push({ display: raw.phone, canonical });
      }
    }

    // Instructions
    if (raw.instructions && raw.instructions !== "No instructions available") {
      entry.instructions.push({ text: raw.instructions, source: raw.source });
    }

    // Images
    if (raw.image1) {
      const url = convertDriveUrl(raw.image1);
      if (entry.images.length < 2 && !entry.images.includes(url)) {
        entry.images.push(url);
      }
    }
    if (raw.image2) {
      const url = convertDriveUrl(raw.image2);
      if (entry.images.length < 2 && !entry.images.includes(url)) {
        entry.images.push(url);
      }
    }
  }

  // Post-process: if no real instructions, add placeholder
  for (const entry of byCompany.values()) {
    if (entry.instructions.length === 0) {
      entry.instructions.push({
        text: "No instructions available",
        source: "System",
      });
    }
  }

  return Array.from(byCompany.values());
}

let allEntriesCache: RawEntry[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAllEntries(): Promise<RawEntry[]> {
  const now = Date.now();
  if (allEntriesCache && now - cacheTime < CACHE_TTL) {
    return allEntriesCache;
  }
  allEntriesCache = await fetchAllRawEntries();
  cacheTime = now;
  return allEntriesCache;
}

export async function lookupPostcode(postcode: string): Promise<DeliveryResult | null> {
  const normalized = normalizePostcode(postcode);
  const allEntries = await getAllEntries();
  const matching = allEntries.filter(
    (e) => normalizePostcode(e.postcode) === normalized
  );
  if (matching.length === 0) return null;
  return {
    postcode: matching[0].postcode,
    entries: mergeEntries(matching),
  };
}

export async function getAllPostcodes(): Promise<string[]> {
  const allEntries = await getAllEntries();
  const seen = new Map<string, string>();
  for (const e of allEntries) {
    const norm = normalizePostcode(e.postcode);
    if (!seen.has(norm)) {
      seen.set(norm, e.postcode);
    }
  }
  return Array.from(seen.values());
}

export async function lookupMultiplePostcodes(
  postcodes: string[]
): Promise<{ results: DeliveryResult[]; notFound: string[] }> {
  const allEntries = await getAllEntries();
  const results: DeliveryResult[] = [];
  const notFound: string[] = [];

  for (const pc of postcodes) {
    const normalized = normalizePostcode(pc);
    const matching = allEntries.filter(
      (e) => normalizePostcode(e.postcode) === normalized
    );
    if (matching.length === 0) {
      notFound.push(pc);
    } else {
      results.push({
        postcode: matching[0].postcode,
        entries: mergeEntries(matching),
      });
    }
  }

  return { results, notFound };
}
