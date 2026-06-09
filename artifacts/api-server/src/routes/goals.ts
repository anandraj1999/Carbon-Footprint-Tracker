import { Router } from "express";
import { db, goalsTable, activitiesTable } from "@workspace/db";
import { eq, gte, lt, and, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  CreateGoalBody,
  UpdateGoalBody,
  UpdateGoalParams,
  DeleteGoalParams,
} from "@workspace/api-zod";

const router = Router();

function getPeriodRange(period: string) {
  const now = new Date();
  if (period === "weekly") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }
  // monthly
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toISOString()
      .split("T")[0],
  };
}

async function getCurrentCo2(period: string): Promise<number> {
  const { start, end } = getPeriodRange(period);
  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${activitiesTable.co2Kg}), 0)` })
    .from(activitiesTable)
    .where(
      and(gte(activitiesTable.date, start), lt(activitiesTable.date, end))
    );
  return Math.round(Number(result?.total ?? 0) * 100) / 100;
}

function formatGoal(
  g: { id: number; title: string; targetCo2Kg: number; period: string; createdAt: Date },
  currentCo2Kg: number
) {
  return {
    id: g.id,
    title: g.title,
    targetCo2Kg: g.targetCo2Kg,
    period: g.period,
    currentCo2Kg,
    createdAt: g.createdAt.toISOString(),
  };
}

// GET /goals
router.get("/goals", async (_req, res) => {
  const rows = await db.select().from(goalsTable);
  const goals = await Promise.all(
    rows.map(async (g) => {
      const current = await getCurrentCo2(g.period);
      return formatGoal(g, current);
    })
  );
  res.json(goals);
});

// POST /goals
router.post("/goals", async (req, res) => {
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = parsed.data;

  const [row] = await db
    .insert(goalsTable)
    .values({
      title: data.title,
      targetCo2Kg: data.targetCo2Kg,
      period: data.period,
    })
    .returning();

  const current = await getCurrentCo2(row.period);
  res.status(201).json(formatGoal(row, current));
});

// PATCH /goals/:id
router.patch("/goals/:id", async (req, res) => {
  const params = UpdateGoalParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const bodyParsed = UpdateGoalBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const data = bodyParsed.data;

  const [updated] = await db
    .update(goalsTable)
    .set({
      title: data.title ?? existing.title,
      targetCo2Kg: data.targetCo2Kg ?? existing.targetCo2Kg,
      period: data.period ?? existing.period,
    })
    .where(eq(goalsTable.id, params.data.id))
    .returning();

  const current = await getCurrentCo2(updated.period);
  res.json(formatGoal(updated, current));
});

// DELETE /goals/:id
router.delete("/goals/:id", async (req, res) => {
  const params = DeleteGoalParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  await db.delete(goalsTable).where(eq(goalsTable.id, params.data.id));
  res.status(204).send();
});

export default router;
