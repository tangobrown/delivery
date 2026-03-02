import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  lookupPostcode,
  lookupMultiplePostcodes,
  getAllPostcodes,
} from "../services/sheets.js";
import { db } from "../db.js";
import { auditLogs } from "@shared/schema";

const router = Router();

router.post("/lookup", requireAuth, async (req, res) => {
  const { postcode } = req.body as { postcode?: string };
  if (!postcode) {
    return res.status(400).json({ error: "Postcode is required" });
  }

  try {
    const result = await lookupPostcode(postcode);

    // Audit log (fire-and-forget)
    if (db) {
      db.insert(auditLogs)
        .values({
          userId: req.session.userId,
          action: "postcode_lookup",
          details: { postcode },
          ipAddress: req.ip,
        })
        .catch(console.error);
    }

    if (!result) {
      return res.status(404).json({ error: "Postcode not found" });
    }
    res.json({ result });
  } catch (err) {
    console.error("Postcode lookup error:", err);
    res.status(500).json({ error: "Failed to lookup postcode" });
  }
});

router.post("/lookup-multiple", requireAuth, async (req, res) => {
  const { postcodes } = req.body as { postcodes?: string[] };
  if (!postcodes || !Array.isArray(postcodes) || postcodes.length === 0) {
    return res.status(400).json({ error: "Postcodes array is required" });
  }

  try {
    const data = await lookupMultiplePostcodes(postcodes);
    res.json(data);
  } catch (err) {
    console.error("Multiple postcode lookup error:", err);
    res.status(500).json({ error: "Failed to lookup postcodes" });
  }
});

router.get("/all", requireAuth, async (_req, res) => {
  try {
    const postcodes = await getAllPostcodes();
    res.json({ postcodes });
  } catch (err) {
    console.error("Get all postcodes error:", err);
    res.status(500).json({ error: "Failed to get postcodes" });
  }
});

export default router;
