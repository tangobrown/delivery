import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db.js";
import { driverNotes, auditLogs, insertDriverNoteSchema } from "@shared/schema";
import { sendDriverNoteEmail } from "../services/email.js";
import sharp from "sharp";
import crypto from "crypto";

const router = Router();

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"]);

function isImage(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  return IMAGE_EXTENSIONS.has(ext);
}

async function optimizeImage(base64Content: string): Promise<string> {
  const buffer = Buffer.from(
    base64Content.replace(/^data:[^;]+;base64,/, ""),
    "base64"
  );
  const optimized = await sharp(buffer)
    .rotate()
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 60, progressive: true })
    .withMetadata({ orientation: undefined })
    .toBuffer();
  return optimized.toString("base64");
}

router.post("/", requireAuth, async (req, res) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Driver note submission started`);

  // 30-second timeout
  const timeout = setTimeout(() => {
    console.error(`[${requestId}] Request timed out`);
    if (!res.headersSent) {
      res.status(504).json({ error: "Request timed out" });
    }
  }, 30000);

  try {
    const body = req.body as Record<string, unknown>;

    // Validate with Zod
    const parsed = insertDriverNoteSchema.safeParse(body);
    if (!parsed.success) {
      clearTimeout(timeout);
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }

    let { fileContent, fileName } = parsed.data;

    // Image optimization
    if (fileName && fileContent && isImage(fileName)) {
      try {
        console.log(`[${requestId}] Optimizing image: ${fileName}`);
        const rawBase64 = fileContent.replace(/^data:[^;]+;base64,/, "");
        const optimized = await optimizeImage(rawBase64);
        fileContent = optimized;
        // Change filename extension to .jpg after optimization
        fileName = fileName.replace(/\.[^.]+$/, ".jpg");
        console.log(`[${requestId}] Image optimized successfully`);
      } catch (err) {
        console.error(`[${requestId}] Image optimization failed, using original:`, err);
        // Fall back to original
      }
    }

    console.log(`[${requestId}] Saving to database`);
    const [saved] = await db
      .insert(driverNotes)
      .values({
        driverId: req.session.userId,
        driverName: parsed.data.driverName,
        postcode: parsed.data.postcode,
        what3words: parsed.data.what3words ?? "",
        notes: parsed.data.notes,
        fileName: fileName ?? "",
        fileContent: fileContent ?? "",
      })
      .returning();

    clearTimeout(timeout);
    console.log(`[${requestId}] Note saved with id: ${saved.id}`);

    // Audit log (fire-and-forget)
    db.insert(auditLogs)
      .values({
        userId: req.session.userId,
        action: "submit_notes",
        details: { postcode: saved.postcode, driverName: saved.driverName },
        ipAddress: req.ip,
      })
      .catch((err: unknown) => console.error(`[${requestId}] Audit log error:`, err));

    // Email notification (fire-and-forget)
    sendDriverNoteEmail(saved).catch(
      (err: unknown) => console.error(`[${requestId}] Email send error:`, err)
    );

    res.json(saved);
  } catch (err) {
    clearTimeout(timeout);
    console.error(`[${requestId}] Error saving note:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to save note" });
    }
  }
});

export default router;
