import { Router } from "express";
import { db } from "../db";
import { reports, reportImages, reportSightings, notifications } from "../db/schema";
import { requireAuth, requireNotRestricted, optionalAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
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

// Active urgent humanitarian reports (for emergency banner and ticker)
router.get("/emergency/active", async (_req, res) => {
  try {
    if (!db) return res.json([]);
    const activeHumanitarian = await db.query.reports.findMany({
      where: and(
        eq(reports.status, "active"),
        or(
          eq(reports.is_humanitarian, true),
          eq(reports.category_id, 9)
        )
      ),
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
      orderBy: desc(reports.created_at),
      limit: 10,
    });

    const mapped = activeHumanitarian.map((report) => {
      const { images, category, governorate, district, secret_verification_mark: _h, ...rest } = report;
      return {
        ...rest,
        report_images: images,
        categories: category,
        governorates: governorate,
        districts: district,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error("Emergency active reports error:", error);
    res.json([]);
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
      is_humanitarian,
    } = req.query;

    const conditions: SQL[] = [];
    if (status && typeof status === "string") {
      conditions.push(eq(reports.status, status as ReportStatus));
    } else {
      conditions.push(inArray(reports.status, ["active", "resolved", "closed"]));
    }

    if (is_humanitarian === "true") {
      conditions.push(or(eq(reports.is_humanitarian, true), eq(reports.category_id, 9))!);
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
      const { images, category, governorate, district, secret_verification_mark: _hiddenSecret, ...rest } = report;
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

router.get("/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
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

    const isOwnerOrAdmin =
      req.user && (req.user.id === report.user_id || req.user.role === "ADMIN");

    const sightings = await db.query.reportSightings.findMany({
      where: eq(reportSightings.report_id, reportId),
      orderBy: desc(reportSightings.created_at),
    });

    const { author, images, category, governorate, district, secret_verification_mark, ...rest } = report;
    const result = {
      ...rest,
      secret_verification_mark: isOwnerOrAdmin ? secret_verification_mark : undefined,
      report_images: images,
      categories: category,
      governorates: governorate,
      districts: district,
      sightings: sightings || [],
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

    const isHumanitarian = Boolean(
      reportData.is_humanitarian ||
      Number(reportData.category_id) === 9
    );

    const [newReport] = await db
      .insert(reports)
      .values({
        ...(reportData as unknown as typeof reports.$inferInsert),
        user_id: req.user.id,
        reward_amount: reportData.reward_amount ? Number(reportData.reward_amount) : null,
        incident_date: reportData.incident_date
          ? new Date(reportData.incident_date as string)
          : null,
        age: reportData.age ? String(reportData.age) : null,
        gender: reportData.gender ? String(reportData.gender) : null,
        clothes_description: reportData.clothes_description ? String(reportData.clothes_description) : null,
        health_condition: reportData.health_condition ? String(reportData.health_condition) : null,
        emergency_phone: reportData.emergency_phone ? String(reportData.emergency_phone) : null,
        is_humanitarian: isHumanitarian,
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

// Sighting submission endpoint for humanitarian / missing reports
router.post("/:id/sightings", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Database not configured" });
    const { id } = req.params;
    const reportId = id as string;
    const { reporter_name, reporter_phone, sighting_time, location_text, latitude, longitude, notes } = req.body;

    if (!location_text || !notes) {
      return res.status(400).json({ error: "الموقع وتفاصيل المشاهدة مطلوبة" });
    }

    const report = await db.query.reports.findFirst({
      where: eq(reports.id, reportId),
    });
    if (!report) return res.status(404).json({ error: "البلاغ غير موجود" });

    if (report.status === "resolved") {
      return res.status(400).json({ error: "تم العثور على المفقود وإغلاق استقبال المشاهدات" });
    }

    const [sighting] = await db
      .insert(reportSightings)
      .values({
        report_id: reportId,
        user_id: req.user?.id || null,
        reporter_name: reporter_name || (req.user?.name || "مواطن متعاون"),
        reporter_phone: reporter_phone || null,
        sighting_time: sighting_time || "اليوم",
        location_text,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        notes,
      })
      .returning();

    // Send in-app notification to the report author
    try {
      await db.insert(notifications).values({
        user_id: report.user_id,
        type: "match",
        title: "🚨 إفادة مشاهدة جديدة بخصوص حالتك الإنسانية!",
        body: `أفاد مواطن بمشاهدة في "${location_text}": ${notes.slice(0, 100)}`,
      });
    } catch (notifErr) {
      console.warn("Failed to notify author of sighting:", notifErr);
    }

    res.status(201).json(sighting);
  } catch (error) {
    console.error("Create sighting error:", error);
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

        // When resolved, delete and purge all community sighting records
        if (reportData.status === "resolved") {
          await db.delete(reportSightings).where(eq(reportSightings.report_id, reportId));
        }
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
