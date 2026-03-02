import { pgTable, text, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password"),
  authMethod: text("auth_method").default("password"),
  role: text("role").default("driver"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const driverNotes = pgTable("driver_notes", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  driverId: varchar("driver_id"),
  driverName: text("driver_name"),
  postcode: text("postcode").notNull(),
  what3words: text("what3words").default(""),
  notes: text("notes").notNull(),
  fileName: text("file_name").default(""),
  fileContent: text("file_content").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  userId: varchar("user_id"),
  action: text("action").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDriverNoteSchema = createInsertSchema(driverNotes).extend({
  driverName: z.string().min(1, "Driver name is required"),
  postcode: z.string().min(1, "Postcode is required"),
  notes: z.string().min(1, "Notes are required"),
  what3words: z.string().optional().default(""),
  fileName: z.string().optional().default(""),
  fileContent: z.string().optional().default(""),
});

export type InsertDriverNote = z.infer<typeof insertDriverNoteSchema>;
export type DriverNote = typeof driverNotes.$inferSelect;
export type User = typeof users.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
