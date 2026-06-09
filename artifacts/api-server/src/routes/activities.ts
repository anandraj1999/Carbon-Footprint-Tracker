import { Router } from "express";
import { db, activitiesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  CreateActivityBody,
  UpdateActivityBody,
  ListActivitiesQueryParams,
  GetActivityParams,
  DeleteActivityParams,
  UpdateActivityParams,
} from "@workspace/api-zod";
import { calculateCo2Kg } from "../lib/co2Calculator";

const router = Router();

// GET /activities
router.get("/activities", async (req, res) => {
  const parsed = ListActivitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { category, limit } = parsed.data;

  const rows = await db
    .select()
    .from(activitiesTable)
    .where(category ? eq(activitiesTable.category, category) : undefined)
    .orderBy(desc(activitiesTable.date), desc(activitiesTable.createdAt))
    .limit(limit ?? 200);

  const activities = rows.map((r) => ({
    id: r.id,
    category: r.category,
    activityType: r.activityType,
    amount: r.amount,
    unit: r.unit,
    co2Kg: r.co2Kg,
    date: r.date,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(activities);
});

// POST /activities
router.post("/activities", async (req, res) => {
  const parsed = CreateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;
  const co2Kg = calculateCo2Kg(data.category, data.activityType, data.amount);

  const [row] = await db
    .insert(activitiesTable)
    .values({
      category: data.category,
      activityType: data.activityType,
      amount: data.amount,
      unit: data.unit,
      co2Kg,
      date: data.date,
      notes: data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    id: row.id,
    category: row.category,
    activityType: row.activityType,
    amount: row.amount,
    unit: row.unit,
    co2Kg: row.co2Kg,
    date: row.date,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

// GET /activities/:id
router.get("/activities/:id", async (req, res) => {
  const params = GetActivityParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  res.json({
    id: row.id,
    category: row.category,
    activityType: row.activityType,
    amount: row.amount,
    unit: row.unit,
    co2Kg: row.co2Kg,
    date: row.date,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  });
});

// PATCH /activities/:id
router.patch("/activities/:id", async (req, res) => {
  const params = UpdateActivityParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  const bodyParsed = UpdateActivityBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = bodyParsed.data;

  const category = data.category ?? existing.category;
  const activityType = data.activityType ?? existing.activityType;
  const amount = data.amount ?? existing.amount;

  const co2Kg =
    data.category || data.activityType || data.amount !== undefined
      ? calculateCo2Kg(category, activityType, amount)
      : existing.co2Kg;

  const [updated] = await db
    .update(activitiesTable)
    .set({
      category,
      activityType,
      amount,
      unit: data.unit ?? existing.unit,
      co2Kg,
      date: data.date ?? existing.date,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    })
    .where(eq(activitiesTable.id, params.data.id))
    .returning();

  res.json({
    id: updated.id,
    category: updated.category,
    activityType: updated.activityType,
    amount: updated.amount,
    unit: updated.unit,
    co2Kg: updated.co2Kg,
    date: updated.date,
    notes: updated.notes ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

// DELETE /activities/:id
router.delete("/activities/:id", async (req, res) => {
  const params = DeleteActivityParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }

  await db.delete(activitiesTable).where(eq(activitiesTable.id, params.data.id));
  res.status(204).send();
});

export default router;
