import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const offsetPurchasesTable = pgTable("offset_purchases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  projectName: text("project_name").notNull(),
  amountKg: real("amount_kg").notNull(),
  amountUsd: real("amount_usd").notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOffsetPurchaseSchema = createInsertSchema(offsetPurchasesTable).omit({
  id: true,
  purchasedAt: true,
});
export type InsertOffsetPurchase = z.infer<typeof insertOffsetPurchaseSchema>;
export type OffsetPurchase = typeof offsetPurchasesTable.$inferSelect;
