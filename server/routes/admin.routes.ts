import { Router } from "express";
import { db } from "../db";
import { users, reports } from "../db/schema";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth.middleware";
import { sql } from "drizzle-orm";

const router = Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get("/stats", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const reportCount = await db.select({ count: sql<number>`count(*)` }).from(reports);

    res.json({
      users: userCount[0].count,
      reports: reportCount[0].count,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/users", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const allUsers = await db.select().from(users).limit(100);
    res.json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
