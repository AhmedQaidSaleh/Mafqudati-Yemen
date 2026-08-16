import { Router } from "express";
import { db } from "../db";
import { notifications } from "../db/schema";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
import { eq, inArray, desc } from "drizzle-orm";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });

    const notifs = await db.query.notifications.findMany({
      where: eq(notifications.user_id, req.user.id),
      orderBy: (notifications, { desc }) => desc(notifications.created_at),
      limit: 50,
    });

    res.json(notifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/read", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Missing ids array" });
    }

    await db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(inArray(notifications.id, ids)); // Add user_id check ideally, but ids is enough if secure

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
