import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db.js";
import { auditLogs } from "@shared/schema";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password, rememberMe } = req.body as {
    username?: string;
    password?: string;
    rememberMe?: boolean;
  };

  const validUsername = process.env.LOGIN_USERNAME ?? "Driver";
  const validPassword = process.env.LOGIN_PASSWORD ?? "projuice";

  const submittedUser = (username ?? "").trim();
  const submittedPass = (password ?? "").trim();

  if (submittedUser.toLowerCase() !== validUsername.toLowerCase() || submittedPass !== validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Regenerate session to prevent session fixation
  req.session.regenerate((err) => {
    if (err) {
      console.error("Session regeneration error:", err);
      return res.status(500).json({ error: "Session error" });
    }

    req.session.userId = "driver-session";

    // Set cookie maxAge based on rememberMe
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Session save error:", saveErr);
        return res.status(500).json({ error: "Session error" });
      }

      // Audit log (fire-and-forget)
      db.insert(auditLogs)
        .values({
          action: "login",
          details: { username },
          ipAddress: req.ip,
        })
        .catch(console.error);

      res.json({ userId: "driver-session" });
    });
  });
});

router.get("/user", requireAuth, (req, res) => {
  res.json({ userId: req.session.userId });
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ error: "Logout error" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

export default router;
