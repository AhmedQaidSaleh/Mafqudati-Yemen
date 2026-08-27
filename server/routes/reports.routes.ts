import { Router } from "express";
import { db } from "../db";
import { reports, reportImages } from "../db/schema";
import { requireAuth, requireNotRestricted, AuthenticatedRequest } from "../middleware/auth.middleware";
import { eq, desc, asc, and, or, ilike, inArray, gte, lte, SQL } from "drizzle-orm";
import {
  notifyReportStatusChange,
  triggerAutoMatchingForReport,
} from "../services/notification.service";

const router = Router();

type ReportStatus = "active" | "resolved" | "closed";
type ReportType = "lost" | "found";

// Stats counts endpoint
router.get("/stats/counts", async (_req, res) => {
  try {
    if (!db) return res.json({ lost: 0, found: 0 });
    const allReports = await db.select({ type: reports.type }).from(reports);
    const lost = allReports.filter((r) => r.type === "lost").length;
    const found = allReports.filter((r) => r.type === "found").length;
    res.json({ lost, found });
  } catch (error) {
    console.error("Stats count error:", error);
    res.json({ lost: 0, found: 0 });
  }
});

// My reports endpoint
router.get("/my", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const data = await db.query.reports.findMany({
      where: eq(reports.user_id, req.user.id),
      with: {
        images: {
          columns: { url: true, sort_order: true },
        },
        category: {
          columns: { name_ar: true, slug: true },
        },
        governorate: {
          columns: { name_ar: true },
        },
        district: {
          columns: { name_ar: true },
        },
      },
      orderBy: (reports, { desc }) => desc(reports.created_at),
    });

    const mappedData = data.map((report) => {
      const { images, category, governorate, district, ...rest } = report;
      return {
        ...rest,
        report_images: images,
        categories: category,
        governorates: governorate,
        districts: district,
      };
    });
    res.json(mappedData);
  } catch (error) {
    console.error("My reports error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Search & list reports
router.get("/", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Database not configured" });
    const {
      status,
      type,
      category_id,
      governorate_id,
      district_id,
      user_id,
      dateFrom,
      dateTo,
      keyword,
      limit,
      sort,
    } = req.query;

    const conditions: SQL[] = [];
    if (status && typeof status === "string") {
      conditions.push(eq(reports.status, status as ReportStatus));
    } else {
      conditions.push(inArray(reports.status, ["active", "resolved", "closed"]));
    }

    if (type && typeof type === "string") {
      conditions.push(eq(reports.type, type as ReportType));
    }
    if (category_id && typeof category_id === "string") {
      conditions.push(eq(reports.category_id, parseInt(category_id, 10)));
    }
    if (governorate_id && typeof governorate_id === "string") {
      conditions.push(eq(reports.governorate_id, parseInt(governorate_id, 10)));
    }
    if (district_id && typeof district_id === "string") {
      conditions.push(eq(reports.district_id, parseInt(district_id, 10)));
    }
    if (user_id && typeof user_id === "string") {
      conditions.push(eq(reports.user_id, user_id));
    }

    if (dateFrom && typeof dateFrom === "string") {
      conditions.push(gte(reports.incident_date, new Date(dateFrom)));
    }
    if (dateTo && typeof dateTo === "string") {
      conditions.push(lte(reports.incident_date, new Date(dateTo)));
    }

    if (keyword && typeof keyword === "string") {
      const k = `%${keyword.trim()}%`;
      conditions.push(or(ilike(reports.title, k), ilike(reports.description, k))!);
    }

    const data = await db.query.reports.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        images: {
          columns: { url: true, sort_order: true },
        },
        category: {
          columns: { name_ar: true, slug: true },
        },
        governorate: {
          columns: { name_ar: true },
        },
        district: {
          columns: { name_ar: true },
        },
      },
      orderBy: sort === "oldest" ? asc(reports.created_at) : desc(reports.created_at),
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    const mappedData = data.map((report) => {
      const { images, category, governorate, district, ...rest } = report;
      return {
        ...rest,
        report_images: images,
        categories: category,
        governorates: governorate,
        districts: district,
      };
    });
    res.json(mappedData);
  } catch (error) {
    console.error("List reports error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Database not configured" });
    const { id } = req.params;
    const reportId = id as string;
    const report = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
      with: {
        images: true,
        category: true,
        governorate: true,
        district: true,
        author: {
          columns: {
            full_name: true,
            avatar_url: true,
            created_at: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!report) return res.status(404).json({ error: "Not found" });

    const { author, images, category, governorate, district, ...rest } = report;
    const result = {
      ...rest,
      report_images: images,
      categories: category,
      governorates: governorate,
      districts: district,
      profile: author
        ? {
            full_name: author.full_name,
            avatar_url: author.avatar_url,
            created_at: author.created_at,
            phone: author.phone,
            email: author.email,
            privacy_hide_contact: !author.phone && !author.email,
          }
        : null,
    };

    res.json(result);
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

type ReportImageData = {
  url: string;
  public_id?: string;
  sort_order?: number;
};

router.post("/", requireAuth, requireNotRestricted, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { images, ...reportData } = req.body as {
      images?: ReportImageData[];
      [key: string]: unknown;
    };

    const [newReport] = await db
      .insert(reports)
      .values({
        ...(reportData as unknown as typeof reports.$inferInsert),
        user_id: req.user.id,
        incident_date: reportData.incident_date
          ? new Date(reportData.incident_date as string)
          : null,
      })
      .returning();

    if (images && images.length > 0) {
      await db.insert(reportImages).values(
        images.map((img, i) => ({
          report_id: newReport.id,
          url: img.url,
          public_id: img.public_id || "placeholder",
          sort_order: img.sort_order ?? i,
        })),
      );
    }

    // Trigger AI & keyword matching notification in the background
    triggerAutoMatchingForReport(newReport.id).catch((matchErr) =>
      console.warn("triggerAutoMatchingForReport error:", matchErr)
    );

    res.status(201).json(newReport);
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;
    const { images, ...reportData } = req.body as {
      images?: ReportImageData[];
      [key: string]: unknown;
    };
    const reportId = id as string;
    const existing = await db
      .select({ user_id: reports.user_id, status: reports.status })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);
    if (existing.length === 0) return res.status(404).json({ error: "Not found" });
    if (existing[0].user_id !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (Object.keys(reportData).length > 0) {
      await db
        .update(reports)
        .set({
          ...(reportData as unknown as Partial<typeof reports.$inferInsert>),
          updated_at: new Date(),
        })
        .where(eq(reports.id, reportId));

      // If status changed, send notification
      if (
        reportData.status &&
        typeof reportData.status === "string" &&
        reportData.status !== existing[0].status
      ) {
        notifyReportStatusChange({
          reportId,
          newStatus: reportData.status as "active" | "resolved" | "closed",
          actorUserId: req.user.id,
        }).catch((err) => console.warn("notifyReportStatusChange error:", err));
      }
    }

    if (images !== undefined) {
      await db.delete(reportImages).where(eq(reportImages.report_id, reportId));
      if (images.length > 0) {
        await db.insert(reportImages).values(
          images.map((img, i) => ({
            report_id: reportId,
            url: img.url,
            public_id: img.public_id || "placeholder",
            sort_order: img.sort_order ?? i,
          })),
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Update report error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;
    const reportId = id as string;

    const existing = await db
      .select({ user_id: reports.user_id })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);
    if (existing.length === 0) return res.status(404).json({ error: "Not found" });
    if (existing[0].user_id !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(reports).where(eq(reports.id, reportId));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
