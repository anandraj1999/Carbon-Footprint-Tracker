import { Router } from "express";
import { db, activitiesTable } from "@workspace/db";
import { and, gte, lt, sql } from "drizzle-orm";

const router = Router();

function getMonthRange(offset: number = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

// GET /dashboard/summary
router.get("/dashboard/summary", async (_req, res) => {
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(1);

  const [thisMonthRows, lastMonthRows] = await Promise.all([
    db
      .select()
      .from(activitiesTable)
      .where(
        and(
          gte(activitiesTable.date, thisMonth.start),
          lt(activitiesTable.date, thisMonth.end)
        )
      ),
    db
      .select()
      .from(activitiesTable)
      .where(
        and(
          gte(activitiesTable.date, lastMonth.start),
          lt(activitiesTable.date, lastMonth.end)
        )
      ),
  ]);

  const totalThisMonth = thisMonthRows.reduce((sum, r) => sum + r.co2Kg, 0);
  const totalLastMonth = lastMonthRows.reduce((sum, r) => sum + r.co2Kg, 0);

  const percentageChange =
    totalLastMonth === 0
      ? 0
      : ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;

  // Category breakdown
  const categoryMap: Record<string, { co2Kg: number; count: number }> = {};
  for (const row of thisMonthRows) {
    if (!categoryMap[row.category]) {
      categoryMap[row.category] = { co2Kg: 0, count: 0 };
    }
    categoryMap[row.category].co2Kg += row.co2Kg;
    categoryMap[row.category].count += 1;
  }

  const categoryBreakdown = Object.entries(categoryMap).map(
    ([category, { co2Kg, count }]) => ({
      category,
      co2Kg: Math.round(co2Kg * 100) / 100,
      percentage:
        totalThisMonth > 0
          ? Math.round((co2Kg / totalThisMonth) * 1000) / 10
          : 0,
      count,
    })
  );
  categoryBreakdown.sort((a, b) => b.co2Kg - a.co2Kg);

  // Streak: consecutive days with at least one activity (from today backwards)
  const allDates = await db
    .selectDistinct({ date: activitiesTable.date })
    .from(activitiesTable)
    .orderBy(sql`${activitiesTable.date} DESC`);

  const dateSet = new Set(allDates.map((r) => r.date));
  let streakDays = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (dateSet.has(ds)) {
      streakDays++;
    } else if (i > 0) {
      break;
    }
  }

  res.json({
    totalCo2KgThisMonth: Math.round(totalThisMonth * 100) / 100,
    totalCo2KgLastMonth: Math.round(totalLastMonth * 100) / 100,
    percentageChange: Math.round(percentageChange * 10) / 10,
    categoryBreakdown,
    activitiesThisMonth: thisMonthRows.length,
    streakDays,
  });
});

// GET /dashboard/trend
router.get("/dashboard/trend", async (_req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  const sinceStr = since.toISOString().split("T")[0];

  const rows = await db
    .select({
      date: activitiesTable.date,
      co2Sum: sql<number>`SUM(${activitiesTable.co2Kg})`,
    })
    .from(activitiesTable)
    .where(gte(activitiesTable.date, sinceStr))
    .groupBy(activitiesTable.date)
    .orderBy(activitiesTable.date);

  const trend = rows.map((r) => ({
    date: r.date,
    co2Kg: Math.round(Number(r.co2Sum) * 100) / 100,
  }));

  res.json(trend);
});

export default router;
