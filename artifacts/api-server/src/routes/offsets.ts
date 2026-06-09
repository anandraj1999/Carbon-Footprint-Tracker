import { Router } from "express";
import { db, offsetPurchasesTable, activitiesTable } from "@workspace/db";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import { PurchaseOffsetBody } from "@workspace/api-zod";

const router = Router();

// Static catalog of verified offset projects
const OFFSET_PROJECTS = [
  {
    id: 1,
    name: "Amazon Rainforest Conservation",
    type: "reforestation",
    location: "Para, Brazil",
    description:
      "Protects 180,000 hectares of threatened rainforest in the Amazon basin, preventing logging and supporting indigenous communities who depend on the forest for their livelihoods.",
    pricePerTonneCo2: 14.5,
    availableTonnes: 12400,
    certifier: "Verra VCS",
    imageSlug: "amazon",
    impactCategory: "nature",
  },
  {
    id: 2,
    name: "Kenyan Wind Farm",
    type: "renewable_energy",
    location: "Turkana, Kenya",
    description:
      "Africa's largest wind farm displaces coal-generated electricity across the East African grid, providing clean power to 750,000 homes while creating jobs in one of Kenya's most arid regions.",
    pricePerTonneCo2: 11.0,
    availableTonnes: 34000,
    certifier: "Gold Standard",
    imageSlug: "wind",
    impactCategory: "energy",
  },
  {
    id: 3,
    name: "Landfill Methane Capture — California",
    type: "methane_capture",
    location: "San Bernardino, USA",
    description:
      "Captures methane from municipal waste before it reaches the atmosphere, converting it to electricity. Methane is 80x more potent than CO₂ over 20 years, making this one of the highest-impact project types.",
    pricePerTonneCo2: 9.0,
    availableTonnes: 8200,
    certifier: "Verra VCS",
    imageSlug: "methane",
    impactCategory: "energy",
  },
  {
    id: 4,
    name: "Seagrass Meadow Restoration",
    type: "ocean",
    location: "Adriatic Sea, Croatia",
    description:
      "Restores degraded seagrass beds, which sequester carbon up to 35x faster than tropical rainforests per hectare. Seagrass also supports fish nurseries and filters coastal water.",
    pricePerTonneCo2: 18.0,
    availableTonnes: 3600,
    certifier: "Plan Vivo",
    imageSlug: "seagrass",
    impactCategory: "nature",
  },
  {
    id: 5,
    name: "Efficient Cookstoves — Uganda",
    type: "cookstoves",
    location: "Northern Uganda",
    description:
      "Distributes efficient biomass cookstoves that reduce wood consumption by 50%, cutting indoor smoke pollution that kills 3.8 million people annually and reducing deforestation pressure.",
    pricePerTonneCo2: 7.5,
    availableTonnes: 19000,
    certifier: "Gold Standard",
    imageSlug: "cookstoves",
    impactCategory: "community",
  },
  {
    id: 6,
    name: "Borneo Mangrove Protection",
    type: "reforestation",
    location: "Kalimantan, Indonesia",
    description:
      "Defends 45,000 hectares of coastal mangroves that store carbon-rich \"blue carbon\" in their roots and soils. Mangroves also shield coastlines from storm surge and support exceptional marine biodiversity.",
    pricePerTonneCo2: 16.0,
    availableTonnes: 7800,
    certifier: "Plan Vivo",
    imageSlug: "mangrove",
    impactCategory: "nature",
  },
  {
    id: 7,
    name: "Community Solar — Bangladesh",
    type: "renewable_energy",
    location: "Dhaka Division, Bangladesh",
    description:
      "Installs solar home systems in off-grid rural communities, replacing kerosene lamps and diesel generators. Each system powers lighting, phone charging, and a fan for a family that previously had no electricity.",
    pricePerTonneCo2: 12.5,
    availableTonnes: 15600,
    certifier: "Gold Standard",
    imageSlug: "solar",
    impactCategory: "community",
  },
  {
    id: 8,
    name: "Scottish Peatland Rewilding",
    type: "reforestation",
    location: "Highlands, Scotland",
    description:
      "Restores degraded blanket peat bogs, which are the UK's largest terrestrial carbon store. Damaged peat releases CO₂; restored peat locks it away for millennia while supporting rare species like golden plover.",
    pricePerTonneCo2: 22.0,
    availableTonnes: 4100,
    certifier: "Gold Standard",
    imageSlug: "peatland",
    impactCategory: "nature",
  },
];

// GET /offsets/projects
router.get("/offsets/projects", (_req, res) => {
  res.json(OFFSET_PROJECTS);
});

// GET /offsets/purchases
router.get("/offsets/purchases", async (_req, res) => {
  const purchases = await db
    .select()
    .from(offsetPurchasesTable)
    .orderBy(sql`${offsetPurchasesTable.purchasedAt} DESC`);

  const totalOffsetKg = purchases.reduce((sum, p) => sum + p.amountKg, 0);
  const totalSpentUsd = purchases.reduce((sum, p) => sum + p.amountUsd, 0);

  const [emissionsResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${activitiesTable.co2Kg}), 0)` })
    .from(activitiesTable);

  const totalEmissionsKg = Number(emissionsResult?.total ?? 0);
  const netEmissionsKg = Math.max(0, totalEmissionsKg - totalOffsetKg);

  res.json({
    totalOffsetKg: Math.round(totalOffsetKg * 100) / 100,
    totalSpentUsd: Math.round(totalSpentUsd * 100) / 100,
    netEmissionsKg: Math.round(netEmissionsKg * 100) / 100,
    totalEmissionsKg: Math.round(totalEmissionsKg * 100) / 100,
    purchases: purchases.map((p) => ({
      id: p.id,
      projectId: p.projectId,
      projectName: p.projectName,
      amountKg: p.amountKg,
      amountUsd: p.amountUsd,
      purchasedAt: p.purchasedAt.toISOString(),
    })),
  });
});

// POST /offsets/purchases
router.post("/offsets/purchases", async (req, res) => {
  const parsed = PurchaseOffsetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { projectId, amountKg } = parsed.data;
  const project = OFFSET_PROJECTS.find((p) => p.id === projectId);
  if (!project) {
    res.status(404).json({ error: "Offset project not found" });
    return;
  }

  if (amountKg <= 0) {
    res.status(400).json({ error: "Amount must be greater than zero" });
    return;
  }

  const amountTonnes = amountKg / 1000;
  const amountUsd = Math.round(amountTonnes * project.pricePerTonneCo2 * 100) / 100;

  const [row] = await db
    .insert(offsetPurchasesTable)
    .values({
      projectId,
      projectName: project.name,
      amountKg,
      amountUsd,
    })
    .returning();

  res.status(201).json({
    id: row.id,
    projectId: row.projectId,
    projectName: row.projectName,
    amountKg: row.amountKg,
    amountUsd: row.amountUsd,
    purchasedAt: row.purchasedAt.toISOString(),
  });
});

export default router;
