import { Router } from "express";
import { db } from "../db";
import { users, reports, categories, notifications, reportImages } from "../db/schema";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth.middleware";
import { sql, eq, desc, isNotNull } from "drizzle-orm";
import { getMessaging } from "firebase-admin/messaging";
import { notifyReportStatusChange } from "../services/notification.service";

const router = Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

// Comprehensive dashboard summary endpoint
router.get("/dashboard-summary", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Database not configured" });

    // 1. Basic counts
    const userList = await db.select().from(users);
    const reportList = await db.select().from(reports).orderBy(desc(reports.created_at));

    const totalUsers = userList.length;
    const totalReports = reportList.length;
    const lostCount = reportList.filter((r) => r.type === "lost").length;
    const foundCount = reportList.filter((r) => r.type === "found").length;
    const resolvedCount = reportList.filter((r) => r.status === "resolved").length;
    const fcmSubscribersCount = userList.filter((u) => !!u.fcm_token).length;

    // Find persons category
    const personsCategory = await db
      .select()
      .from(categories)
      .where(or(eq(categories.slug, "missing-persons"), eq(categories.slug, "persons")))
      .limit(1);

    const personCategoryId = personsCategory[0]?.id ?? 9;

    // Filter missing persons reports
    const missingPersonsReports = reportList.filter(
      (r) =>
        r.category_id === personCategoryId ||
        r.category_id === 9 ||
        r.is_humanitarian === true ||
        r.title.includes("مفقود") ||
        r.title.includes("طفل") ||
        r.title.includes("شخص") ||
        r.title.includes("مسن")
    );

    // Fetch primary images for missing persons
    const missingPersonsWithImages = await Promise.all(
      missingPersonsReports.slice(0, 30).map(async (r) => {
        const imgs = await db
          .select()
          .from(reportImages)
          .where(eq(reportImages.report_id, r.id))
          .limit(1);

        const reporter = userList.find((u) => u.id === r.user_id);

        return {
          id: r.id,
          title: r.title,
          description: r.description,
          type: r.type,
          status: r.status,
          category_id: r.category_id,
          governorate_id: r.governorate_id,
          location_text: r.location_text,
          incident_date: r.incident_date?.toISOString(),
          primary_image: imgs[0]?.url,
          created_at: r.created_at.toISOString(),
          user_name: reporter?.full_name,
          user_email: reporter?.email,
          user_phone: reporter?.phone,
        };
      })
    );

    // Recent notifications
    const recentNotifications = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.created_at))
      .limit(30);

    const notificationsWithUsers = recentNotifications.map((n) => {
      const recipient = userList.find((u) => u.id === n.user_id);
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        created_at: n.created_at.toISOString(),
        user_name: recipient?.full_name,
        user_email: recipient?.email,
      };
    });

    res.json({
      stats: {
        users: totalUsers,
        verifiedUsers: totalUsers,
        reports: totalReports,
        lost: lostCount,
        found: foundCount,
        resolved: resolvedCount,
        missingPersons: missingPersonsReports.length,
        pendingVerifications: 0,
        fcmSubscribers: fcmSubscribersCount,
      },
      missingPersons: missingPersonsWithImages,
      pendingVerifications: [],
      recentNotifications: notificationsWithUsers,
      recentReports: reportList.slice(0, 10).map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        created_at: r.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

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

// Get all users
router.get("/users", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        phone: users.phone,
        role: users.role,
        is_restricted: users.is_restricted,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
      })
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(200);
    res.json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update user role
router.patch("/users/:id", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;
    const { role } = req.body as { role: "USER" | "ADMIN" };
    if (!role) return res.status(400).json({ error: "Role is required" });

    const [updated] = await db
      .update(users)
      .set({ role, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Restrict / Unrestrict user account
router.patch("/users/:id/restrict", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;
    const { is_restricted } = req.body as { is_restricted?: boolean };

    // Prevent restricting self
    if (req.user?.id === id) {
      return res.status(400).json({ error: "لا يمكنك تقييد حسابك الحالي" });
    }

    // Check target user
    const targetUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (targetUser.length === 0) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    const newRestrictedState =
      typeof is_restricted === "boolean" ? is_restricted : !targetUser[0].is_restricted;

    const [updated] = await db
      .update(users)
      .set({ is_restricted: newRestrictedState, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();

    res.json({
      success: true,
      user: updated,
      message: newRestrictedState ? "تم تقييد الحساب بنجاح" : "تم إلغاء تقييد الحساب بنجاح",
    });
  } catch (error) {
    console.error("Restrict user error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete user account permanently
router.delete("/users/:id", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;

    // Prevent self deletion
    if (req.user?.id === id) {
      return res.status(400).json({ error: "لا يمكنك حذف حسابك الحالي كمدير للنظام" });
    }

    const targetUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (targetUser.length === 0) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // Clean up user's notifications
    await db.delete(notifications).where(eq(notifications.user_id, id));

    // Clean up user's reports (and their images if needed)
    const userReports = await db.select({ id: reports.id }).from(reports).where(eq(reports.user_id, id));
    for (const r of userReports) {
      await db.delete(reportImages).where(eq(reportImages.report_id, r.id));
      await db.delete(reports).where(eq(reports.id, r.id));
    }

    // Clean up user record
    await db.delete(users).where(eq(users.id, id));

    res.json({ success: true, message: "تم حذف حساب المستخدم وكافة بياناته بنجاح" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update report status
router.patch("/reports/:id/status", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;
    const { status } = req.body as { status: "active" | "resolved" | "closed" };
    if (!status) return res.status(400).json({ error: "Status is required" });

    const [updated] = await db
      .update(reports)
      .set({ status, updated_at: new Date() })
      .where(eq(reports.id, id))
      .returning();

    if (updated) {
      notifyReportStatusChange({
        reportId: id,
        newStatus: status,
        actorUserId: req.user?.id,
      }).catch((err) => console.warn("notifyReportStatusChange in admin error:", err));
    }

    res.json(updated);
  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete report
router.delete("/reports/:id", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;
    await db.delete(reports).where(eq(reports.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Broadcast notification to all users
router.post("/broadcast-notification", async (req: AuthenticatedRequest, res) => {
  try {
    if (!db) return res.status(500).json({ error: "Not configured" });
    const { title, body } = req.body as { title: string; body: string };
    if (!title || !body) return res.status(400).json({ error: "Title and body required" });

    const allUsers = await db.select({ id: users.id, fcm_token: users.fcm_token }).from(users);

    const valuesToInsert = allUsers.map((u) => ({
      user_id: u.id,
      type: "ADMIN_BROADCAST",
      title,
      body,
    }));

    if (valuesToInsert.length > 0) {
      await db.insert(notifications).values(valuesToInsert);
    }

    // Send push notification to all users with active FCM tokens
    const tokens = allUsers
      .map((u) => u.fcm_token)
      .filter((t): t is string => typeof t === "string" && t.length > 0);

    let pushSentCount = 0;
    if (tokens.length > 0) {
      try {
        const response = await getMessaging().sendEachForMulticast({
          tokens,
          notification: {
            title: `📢 ${title}`,
            body,
          },
          data: {
            url: "/notifications",
          },
        });
        pushSentCount = response.successCount;
      } catch (pushErr) {
        console.warn("Broadcast FCM push warning:", pushErr);
      }
    }

    res.json({
      success: true,
      message: `تم إرسال التعميم إلى ${allUsers.length} مستخدم وإيصال ${pushSentCount} إشعار فوري للأجهزة بنجاح`,
      usersCount: allUsers.length,
      pushSentCount,
    });
  } catch (error) {
    console.error("Broadcast notification error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
