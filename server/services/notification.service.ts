import { db } from "../db";
import { notifications, users, reports, governorates, categories } from "../db/schema";
import { eq, and, ne, ilike, or } from "drizzle-orm";
import { getMessaging } from "firebase-admin/messaging";

export interface SendNotificationOptions {
  userId: string;
  type: "MESSAGE" | "MATCH" | "REPORT_STATUS" | "ADMIN_BROADCAST" | "SYSTEM_TEST" | string;
  title: string;
  body: string;
  url?: string;
  metadata?: Record<string, string>;
}

/**
 * Core notification dispatch function:
 * 1. Inserts record into database `notifications` table
 * 2. Sends FCM Web Push Notification if user has an active `fcm_token`
 */
export async function sendNotification(options: SendNotificationOptions) {
  try {
    if (!db) {
      console.warn("Database not initialized, cannot send notification");
      return null;
    }

    const { userId, type, title, body, url = "/notifications", metadata = {} } = options;

    // 1. Insert into database
    const [inserted] = await db
      .insert(notifications)
      .values({
        user_id: userId,
        type,
        title,
        body,
      })
      .returning();

    // 2. Lookup user's FCM token
    const [userRecord] = await db
      .select({ fcm_token: users.fcm_token })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord?.fcm_token) {
      try {
        await getMessaging().send({
          token: userRecord.fcm_token,
          notification: {
            title,
            body: body.length > 100 ? body.substring(0, 100) + "..." : body,
          },
          data: {
            url,
            notificationId: inserted.id,
            type,
            ...metadata,
          },
        });
      } catch (fcmErr) {
        console.warn(`Failed to deliver FCM push to user ${userId}:`, fcmErr);
      }
    }

    return inserted;
  } catch (error) {
    console.error("sendNotification error:", error);
    return null;
  }
}

/**
 * Triggered when a new chat message is sent
 */
export async function notifyNewMessage(params: {
  senderId: string;
  receiverId: string;
  reportId: string;
  body: string;
}) {
  try {
    if (!db) return;
    const { senderId, receiverId, reportId, body } = params;

    // Don't notify self
    if (senderId === receiverId) return;

    const [sender] = await db
      .select({ full_name: users.full_name })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    const [report] = await db
      .select({ title: reports.title })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    const senderName = sender?.full_name || "مستخدم في المنصة";
    const reportTitle = report?.title ? `بخصوص «${report.title}»` : "";

    const title = `📩 رسالة جديدة من ${senderName}`;
    const messageSnippet = body.length > 60 ? body.substring(0, 60) + "..." : body;
    const bodyText = reportTitle ? `${reportTitle}: "${messageSnippet}"` : messageSnippet;
    const chatUrl = `/chat/${reportId}/${senderId}`;

    await sendNotification({
      userId: receiverId,
      type: "MESSAGE",
      title,
      body: bodyText,
      url: chatUrl,
      metadata: {
        reportId,
        senderId,
      },
    });
  } catch (err) {
    console.error("notifyNewMessage error:", err);
  }
}

/**
 * Triggered when report status is updated (e.g. resolved, active, closed)
 */
export async function notifyReportStatusChange(params: {
  reportId: string;
  newStatus: "active" | "resolved" | "closed";
  actorUserId?: string;
}) {
  try {
    if (!db) return;
    const { reportId, newStatus, actorUserId } = params;

    const [report] = await db
      .select({
        id: reports.id,
        user_id: reports.user_id,
        title: reports.title,
        type: reports.type,
      })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) return;

    // Map status to Arabic
    let statusLabel = "تم تحديث حالة البلاغ";
    let bodyText = "";

    if (newStatus === "resolved") {
      statusLabel = "🎉 تم حل واسترداد البلاغ بنجاح";
      bodyText = `تم تمييز بلاغك «${report.title}» كـ (مسترد / تم العثور عليه). شكراً لمساهمتك في مجتمع مفقوداتي!`;
    } else if (newStatus === "closed") {
      statusLabel = "🔒 تم إغلاق البلاغ";
      bodyText = `تم إغلاق بلاغك «${report.title}». يمكنك دائماً مراجعته من قسم بلاغاتي.`;
    } else if (newStatus === "active") {
      statusLabel = "✅ بلاغك نشط ومتاح للجميع";
      bodyText = `تم تحديث بلاغك «${report.title}» وحالته الآن نشطة وجارٍ استقبال المطابقات.`;
    }

    await sendNotification({
      userId: report.user_id,
      type: "REPORT_STATUS",
      title: statusLabel,
      body: bodyText,
      url: `/report/${report.id}`,
      metadata: {
        reportId: report.id,
        newStatus,
      },
    });
  } catch (err) {
    console.error("notifyReportStatusChange error:", err);
  }
}

/**
 * Triggered to notify owner of a matching report
 */
export async function notifyAiMatch(params: {
  targetUserId: string;
  myReportTitle: string;
  matchedReportId: string;
  matchedReportTitle: string;
  matchedGovernorate?: string;
  score?: number;
}) {
  try {
    const { targetUserId, myReportTitle, matchedReportId, matchedReportTitle, matchedGovernorate, score } = params;

    const scoreText = score ? `بنسبة تطابق تقارب ${score}%` : "تطابق مرتفع";
    const locText = matchedGovernorate ? ` في ${matchedGovernorate}` : "";
    const title = `🎯 مطابقة ذكية جديدة لبلاغك!`;
    const body = `تم رصد عنصر جديد «${matchedReportTitle}»${locText} قد يطابق بلاغك «${myReportTitle}» (${scoreText}).`;

    await sendNotification({
      userId: targetUserId,
      type: "MATCH",
      title,
      body,
      url: `/report/${matchedReportId}`,
      metadata: {
        matchedReportId,
      },
    });
  } catch (err) {
    console.error("notifyAiMatch error:", err);
  }
}

/**
 * Automatically runs keyword & location matching when a new report is created,
 * alerting owners of relevant opposite reports (lost <-> found).
 */
export async function triggerAutoMatchingForReport(newReportId: string) {
  try {
    if (!db) return;

    const [newReport] = await db
      .select({
        id: reports.id,
        user_id: reports.user_id,
        title: reports.title,
        description: reports.description,
        type: reports.type,
        category_id: reports.category_id,
        governorate_id: reports.governorate_id,
      })
      .from(reports)
      .where(eq(reports.id, newReportId))
      .limit(1);

    if (!newReport || !newReport.user_id) return;

    // The opposite report type (if lost -> match with found, if found -> match with lost)
    const oppositeType = newReport.type === "lost" ? "found" : "lost";

    // Find candidate active reports
    const candidates = await db
      .select({
        id: reports.id,
        user_id: reports.user_id,
        title: reports.title,
        description: reports.description,
        category_id: reports.category_id,
        governorate_id: reports.governorate_id,
      })
      .from(reports)
      .where(
        and(
          eq(reports.type, oppositeType),
          eq(reports.status, "active"),
          ne(reports.user_id, newReport.user_id)
        )
      )
      .limit(20);

    const newTokens = `${newReport.title} ${newReport.description || ""}`
      .toLowerCase()
      .split(/[\s,،.\-_/]+/)
      .filter((t) => t.length >= 3);

    for (const candidate of candidates) {
      let score = 0;

      // Category match
      if (newReport.category_id && candidate.category_id && newReport.category_id === candidate.category_id) {
        score += 35;
      }

      // Governorate match
      if (newReport.governorate_id && candidate.governorate_id && newReport.governorate_id === candidate.governorate_id) {
        score += 25;
      }

      // Keyword token overlap
      const candidateText = `${candidate.title} ${candidate.description || ""}`.toLowerCase();
      let matchedTokens = 0;
      for (const token of newTokens) {
        if (candidateText.includes(token)) {
          matchedTokens++;
        }
      }

      if (matchedTokens > 0) {
        score += Math.min(40, matchedTokens * 15);
      }

      // If high enough confidence match (score >= 60)
      if (score >= 60) {
        // Notify candidate owner
        await notifyAiMatch({
          targetUserId: candidate.user_id,
          myReportTitle: candidate.title,
          matchedReportId: newReport.id,
          matchedReportTitle: newReport.title,
          score,
        });

        // Notify new report author too
        await notifyAiMatch({
          targetUserId: newReport.user_id,
          myReportTitle: newReport.title,
          matchedReportId: candidate.id,
          matchedReportTitle: candidate.title,
          score,
        });
      }
    }
  } catch (err) {
    console.error("triggerAutoMatchingForReport error:", err);
  }
}
