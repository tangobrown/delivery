import { config } from "dotenv";
config();
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import postcodeRouter from "./routes/postcode.js";
import notesRouter from "./routes/notes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Trust Replit's reverse proxy
app.set("trust proxy", 1);

// Body parsing with 15MB limit
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Session store — use PostgreSQL if DATABASE_URL is set, otherwise in-memory
let sessionStore: session.Store | undefined;
if (process.env.DATABASE_URL) {
  const PgSession = connectPgSimple(session);
  sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "session",
    createTableIfMissing: true,
  });
} else {
  console.warn("No DATABASE_URL — using in-memory session store (sessions will not persist across restarts).");
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET ?? "fallback-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days default
    },
  })
);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/postcode", postcodeRouter);
app.use("/api/driver-notes", notesRouter);

// Version endpoint (no auth)
const serverVersion = Date.now().toString();
app.get("/api/version", (_req, res) => {
  res.json({ version: serverVersion });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../../dist/client");
  app.use(express.static(clientPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

// Global error handler — always return JSON, never HTML
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

const PORT = parseInt(process.env.PORT ?? "3000", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Extend session type
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}
