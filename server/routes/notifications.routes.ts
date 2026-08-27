import { Router } from "express";
import { db } from "../db";
import { notifications, users } from "../db/schema";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
import { eq, inArray, desc, and, isNull, sql } from "drizzle-orm";
import { getMessaging } from "firebase-admin/messaging";

const router = Router();

// 1. Get user notifications
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
    console.error("Fetch notifications error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. Get unread count
router.get("/unread-count", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.user_id, req.user.id), isNull(notifications.read_at)));

    res.json({ unreadCount: Number(result?.count || 0) });
  } catch (error) {
    console.error("Fetch unread count error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. Mark specific notifications as read
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
      .where(and(inArray(notifications.id, ids), eq(notifications.user_id, req.user.id)));

    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Mark all notifications as read
router.post("/read-all", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });

    await db
      .update(notifications)
      .set({ read_at: new Date() })
      .where(and(eq(notifications.user_id, req.user.id), isNull(notifications.read_at)));

    res.json({ success: true });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. Update FCM Device Token
router.post("/token", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    await db.update(users).set({ fcm_token: token }).where(eq(users.id, req.user.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Save FCM Token error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 6. Test Push Notification
router.post("/test-push", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });

    const [userRecord] = await db
      .select({ id: users.id, full_name: users.full_name, fcm_token: users.fcm_token })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    // Insert database notification
    const [insertedNotif] = await db
      .insert(notifications)
      .values({
        user_id: req.user.id,
        type: "SYSTEM_TEST",
        title: "🔔 إشعار تجريبي من منصة مفقوداتي",
        body: "تهانينا! تم تفعيل خدمة الإشعارات على جهازك بنجاح. ستصلك التنبيهات الفورية للبلاغات والرسائل.",
      })
      .returning();

    let fcmSuccess = false;
    let fcmErrorMsg: string | null = null;

    if (userRecord.fcm_token) {
      try {
        await getMessaging().send({
          token: userRecord.fcm_token,
          notification: {
            title: "🔔 إشعار تجريبي من منصة مفقوداتي",
            body: "تم تفعيل الإشعارات بنجاح على هذا الجهاز.",
          },
          data: {
            url: "/notifications",
            notificationId: insertedNotif.id,
          },
        });
        fcmSuccess = true;
      } catch (err: unknown) {
        fcmErrorMsg = err instanceof Error ? err.message : String(err);
        console.warn("FCM push delivery test warning:", err);
      }
    }

    res.json({
      success: true,
      hasFcmToken: !!userRecord.fcm_token,
      fcmPushSent: fcmSuccess,
      fcmError: fcmErrorMsg,
      notification: insertedNotif,
    });
  } catch (error) {
    console.error("Test push error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 7. Delete a specific notification
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { id } = req.params;

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.user_id, req.user.id)));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 8. Clear all read notifications
router.delete("/clear-read", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });

    await db
      .delete(notifications)
      .where(and(eq(notifications.user_id, req.user.id), sql`${notifications.read_at} IS NOT NULL`));

    res.json({ success: true });
  } catch (error) {
    console.error("Clear read notifications error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

