import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@shared/schema";

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let db: DrizzleDB | null = null;

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
} else {
  console.warn("DATABASE_URL not set — database features (notes, audit log, pg sessions) are disabled.");
}

export { db };
