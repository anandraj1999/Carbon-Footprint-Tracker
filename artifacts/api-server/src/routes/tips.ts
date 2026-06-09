import { Router } from "express";
import { db, activitiesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

const ALL_TIPS = [
  // Transportation
  {
    id: 1,
    category: "transportation",
    title: "Switch to public transit",
    description:
      "Taking the bus or train instead of driving can cut your transport emissions by up to 75%. Even one car-free day per week adds up significantly over a year.",
    potentialSavingKg: 120,
    difficulty: "medium",
  },
  {
    id: 2,
    category: "transportation",
    title: "Combine errands into one trip",
    description:
      "Cold starts are the most polluting part of driving. Grouping multiple errands into a single trip can reduce your fuel use by 25%.",
    potentialSavingKg: 40,
    difficulty: "easy",
  },
  {
    id: 3,
    category: "transportation",
    title: "Consider an electric vehicle",
    description:
      "EVs produce 3–4x less CO₂ over their lifetime than gasoline cars. Even on a coal-heavy grid, an EV typically wins on emissions.",
    potentialSavingKg: 500,
    difficulty: "hard",
  },
  {
    id: 4,
    category: "transportation",
    title: "Offset unavoidable flights",
    description:
      "If you must fly, choose direct routes (takeoff and landing emit the most), sit in economy, and purchase verified carbon offsets.",
    potentialSavingKg: 200,
    difficulty: "easy",
  },
  // Food
  {
    id: 5,
    category: "food",
    title: "Reduce beef consumption",
    description:
      "Beef produces 27 kg CO₂ per kg — roughly 10x chicken. Replacing two beef meals per week with chicken or legumes can save 200+ kg CO₂ per year.",
    potentialSavingKg: 210,
    difficulty: "medium",
  },
  {
    id: 6,
    category: "food",
    title: "Try one plant-based day per week",
    description:
      "A fully plant-based diet saves roughly 1.5 tonnes of CO₂ per year. Starting with one meatless day per week is an accessible first step.",
    potentialSavingKg: 180,
    difficulty: "easy",
  },
  {
    id: 7,
    category: "food",
    title: "Cut food waste in half",
    description:
      "About 30% of food is wasted, accounting for ~8% of global emissions. Meal planning, proper storage, and using leftovers can cut your food waste significantly.",
    potentialSavingKg: 90,
    difficulty: "easy",
  },
  // Energy
  {
    id: 8,
    category: "energy",
    title: "Switch to a green energy tariff",
    description:
      "Choosing a renewable electricity plan can eliminate most of your home energy emissions. Many providers offer 100% renewable options at competitive prices.",
    potentialSavingKg: 400,
    difficulty: "easy",
  },
  {
    id: 9,
    category: "energy",
    title: "Lower your thermostat by 2°C",
    description:
      "Reducing heating by just 2°C can cut your heating bill and emissions by around 10%. A programmable thermostat makes this effortless.",
    potentialSavingKg: 150,
    difficulty: "easy",
  },
  {
    id: 10,
    category: "energy",
    title: "Improve home insulation",
    description:
      "Proper insulation and draught-proofing can reduce heating needs by 20–30%. This is a one-time investment that pays back within 3–5 years.",
    potentialSavingKg: 300,
    difficulty: "hard",
  },
  // Shopping
  {
    id: 11,
    category: "shopping",
    title: "Buy second-hand clothing",
    description:
      "The fashion industry accounts for 10% of global emissions. Buying second-hand extends garment life and cuts per-item emissions by up to 80%.",
    potentialSavingKg: 80,
    difficulty: "easy",
  },
  {
    id: 12,
    category: "shopping",
    title: "Repair instead of replace",
    description:
      "Repairing electronics, appliances, and clothing instead of buying new avoids the manufacturing emissions of new products — often the largest part of their carbon footprint.",
    potentialSavingKg: 120,
    difficulty: "medium",
  },
];

// GET /tips
router.get("/tips", async (_req, res) => {
  // Find the user's top emission category over all time
  const categoryTotals = await db
    .select({
      category: activitiesTable.category,
      total: sql<number>`SUM(${activitiesTable.co2Kg})`,
    })
    .from(activitiesTable)
    .groupBy(activitiesTable.category)
    .orderBy(desc(sql`SUM(${activitiesTable.co2Kg})`));

  const topCategories = categoryTotals.map((r) => r.category);

  // Sort tips: top emission categories first, then by potential saving
  const sorted = [...ALL_TIPS].sort((a, b) => {
    const aIdx = topCategories.indexOf(a.category);
    const bIdx = topCategories.indexOf(b.category);
    const aRank = aIdx === -1 ? 999 : aIdx;
    const bRank = bIdx === -1 ? 999 : bIdx;
    if (aRank !== bRank) return aRank - bRank;
    return b.potentialSavingKg - a.potentialSavingKg;
  });

  res.json(sorted);
});

export default router;
