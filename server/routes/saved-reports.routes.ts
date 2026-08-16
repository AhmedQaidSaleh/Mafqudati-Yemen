import { Router } from "express";
import { db } from "../db";
import { savedReports, reports } from "../db/schema";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const saved = await db.query.savedReports.findMany({
      where: eq(savedReports.user_id, req.user.id),
      with: {
        report: {
          with: {
            images: { columns: { url: true, sort_order: true } },
            category: { columns: { name_ar: true } },
            governorate: { columns: { name_ar: true } },
          },
        },
      },
      orderBy: (savedReports, { desc }) => desc(savedReports.created_at),
    });

    // Flatten to match frontend expectation (array of reports)
    res.json(saved.map((s) => s.report).filter(Boolean));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { report_id } = req.body;
    if (!report_id) return res.status(400).json({ error: "report_id required" });

    await db
      .insert(savedReports)
      .values({
        user_id: req.user.id,
        report_id,
      })
      .onConflictDoNothing({ target: [savedReports.user_id, savedReports.report_id] }); // Prevent duplicates

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:reportId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { reportId } = req.params;

    await db
      .delete(savedReports)
      .where(
        and(eq(savedReports.user_id, req.user.id), eq(savedReports.report_id, reportId as string)),
      );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
