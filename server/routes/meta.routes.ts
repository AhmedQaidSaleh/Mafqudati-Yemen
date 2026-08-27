import { Router } from "express";
import { db } from "../db";
import { governorates, districts, categories, users, reports } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { YEMEN_GOVERNORATES, YEMEN_DISTRICTS, DEFAULT_CATEGORIES } from "../data/yemen-geo";

const router = Router();

// Cache flag to avoid checking seed on every single request
let isSeeded = false;

async function ensureYemenGeoSeeded() {
  if (isSeeded || !db) return;
  try {
    const existingGovs = await db.select().from(governorates).limit(5);
    // If table is empty or does not have Amanat Al Asimah / Sana'a
    if (existingGovs.length === 0) {
      for (const gov of YEMEN_GOVERNORATES) {
        await db
          .insert(governorates)
          .values({
            id: gov.id,
            name_ar: gov.name_ar,
            name_en: gov.name_en,
          })
          .onConflictDoNothing();
      }

      for (const dist of YEMEN_DISTRICTS) {
        await db
          .insert(districts)
          .values({
            id: dist.id,
            governorate_id: dist.governorate_id,
            name_ar: dist.name_ar,
            name_en: dist.name_en,
          })
          .onConflictDoNothing();
      }
    }

    const existingCats = await db.select().from(categories).limit(5);
    if (existingCats.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await db
          .insert(categories)
          .values({
            id: cat.id,
            slug: cat.slug,
            name_ar: cat.name_ar,
            name_en: cat.name_en,
            icon: cat.icon,
          })
          .onConflictDoNothing();
      }
    }

    isSeeded = true;
  } catch (err) {
    console.warn("Auto-seeding Yemen geo data notice:", err);
  }
}

router.get("/governorates", async (_req, res) => {
  try {
    if (db) {
      await ensureYemenGeoSeeded();
      const data = await db.select().from(governorates).orderBy(governorates.id);
      if (data && data.length > 0) {
        return res.json(data);
      }
    }
    // Reliable fallback for Yemeni governorates
    res.json(YEMEN_GOVERNORATES);
  } catch (error) {
    console.error("Fetch governorates error:", error);
    res.json(YEMEN_GOVERNORATES);
  }
});

router.get("/districts", async (req, res) => {
  try {
    const { governorate_id } = req.query;
    const govIdNum = governorate_id ? parseInt(governorate_id as string, 10) : undefined;

    if (db) {
      await ensureYemenGeoSeeded();
      if (govIdNum) {
        const data = await db
          .select()
          .from(districts)
          .where(eq(districts.governorate_id, govIdNum));
        if (data && data.length > 0) {
          return res.json(data);
        }
      } else {
        const data = await db.select().from(districts);
        if (data && data.length > 0) {
          return res.json(data);
        }
      }
    }

    // Fallback for Yemeni districts
    if (govIdNum) {
      const filtered = YEMEN_DISTRICTS.filter((d) => d.governorate_id === govIdNum);
      return res.json(filtered);
    }
    res.json(YEMEN_DISTRICTS);
  } catch (error) {
    console.error("Fetch districts error:", error);
    if (req.query.governorate_id) {
      const govId = parseInt(req.query.governorate_id as string, 10);
      return res.json(YEMEN_DISTRICTS.filter((d) => d.governorate_id === govId));
    }
    res.json(YEMEN_DISTRICTS);
  }
});

router.get("/categories", async (_req, res) => {
  try {
    if (db) {
      await ensureYemenGeoSeeded();
      const data = await db.select({
        id: categories.id,
        slug: categories.slug,
        name_ar: categories.name_ar,
        name_en: categories.name_en,
        icon: categories.icon,
        report_count: sql<number>`cast(count(${reports.id}) as integer)`,
      })
      .from(categories)
      .leftJoin(reports, eq(categories.id, reports.category_id))
      .groupBy(categories.id)
      .orderBy(categories.id);
      
      if (data && data.length > 0) {
        return res.json(data);
      }
    }
    res.json(DEFAULT_CATEGORIES);
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.json(DEFAULT_CATEGORIES);
  }
});

router.get("/stats", async (_req, res) => {
  try {
    if (!db) throw new Error("DB not available");

    const usersCountResult = await db.select({ count: sql<number>`cast(count(${users.id}) as integer)` }).from(users);
    const usersCount = usersCountResult[0]?.count || 0;

    const lostCountResult = await db.select({ count: sql<number>`cast(count(${reports.id}) as integer)` }).from(reports).where(eq(reports.type, 'lost'));
    const lostCount = lostCountResult[0]?.count || 0;

    const foundCountResult = await db.select({ count: sql<number>`cast(count(${reports.id}) as integer)` }).from(reports).where(eq(reports.type, 'found'));
    const foundCount = foundCountResult[0]?.count || 0;

    const resolvedCountResult = await db.select({ count: sql<number>`cast(count(${reports.id}) as integer)` }).from(reports).where(eq(reports.status, 'resolved'));
    const resolvedCount = resolvedCountResult[0]?.count || 0;

    res.json({
      users: usersCount,
      lost: lostCount,
      found: foundCount,
      resolved: resolvedCount,
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
    // Fallback static
    res.json({
      users: 0,
      lost: 0,
      found: 0,
      resolved: 0,
    });
  }
});

export default router;
