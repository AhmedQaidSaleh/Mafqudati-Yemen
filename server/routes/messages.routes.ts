import { Router } from "express";
import { db } from "../db";
import { messages } from "../db/schema";
import { requireAuth, requireNotRestricted, AuthenticatedRequest } from "../middleware/auth.middleware";
import { eq, and, or, asc, desc } from "drizzle-orm";
import { notifyNewMessage } from "../services/notification.service";

const router = Router();

// Get all conversations for current user
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    
    // Fetch all messages involving the user
    const msgs = await db.query.messages.findMany({
      where: (messages, { or, eq }) =>
        or(eq(messages.sender_id, req.user!.id), eq(messages.receiver_id, req.user!.id)),
      orderBy: (messages, { desc }) => desc(messages.created_at),
      with: {
        report: { columns: { id: true, title: true } },
        sender: { columns: { id: true, full_name: true, avatar_url: true } },
        receiver: { columns: { id: true, full_name: true, avatar_url: true } }
      }
    });

    // Group into conversations
    const conversationsMap = new Map<string, any>();
    
    for (const msg of msgs) {
      const otherUser = msg.sender_id === req.user.id ? msg.receiver : msg.sender;
      // Unique conversation key: report_id + otherUser.id
      const key = `${msg.report_id}_${otherUser.id}`;
      
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          report_id: msg.report_id,
          report_title: msg.report?.title || "بلاغ محذوف",
          other_user: otherUser,
          last_message: msg,
          unread_count: (msg.receiver_id === req.user.id && !msg.read_at) ? 1 : 0
        });
      } else {
        if (msg.receiver_id === req.user.id && !msg.read_at) {
          conversationsMap.get(key).unread_count++;
        }
      }
    }

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get messages for a specific report
router.get("/:reportId/:otherUserId", requireAuth, async (req: AuthenticatedRequest, res) => {
    const { otherUserId } = req.params;
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { reportId } = req.params;
    
    const msgs = await db.query.messages.findMany({
      where: (messages, { eq, and, or }) =>
        and(
          eq(messages.report_id, reportId as string),
          or(
            and(eq(messages.sender_id, req.user!.id), eq(messages.receiver_id, otherUserId)),
            and(eq(messages.sender_id, otherUserId), eq(messages.receiver_id, req.user!.id))
          )
        ),
      orderBy: (messages, { asc }) => asc(messages.created_at),
      with: {
        sender: { columns: { id: true, full_name: true, avatar_url: true } },
        receiver: { columns: { id: true, full_name: true, avatar_url: true } }
      }
    });

    // Mark messages as read
    const unreadMsgs = msgs.filter(m => m.receiver_id === req.user!.id && m.sender_id === otherUserId && !m.read_at);
    if (unreadMsgs.length > 0) {
      await db.update(messages)
        .set({ read_at: new Date() })
        .where(
          and(
            eq(messages.report_id, reportId as string),
            eq(messages.receiver_id, req.user!.id),
            eq(messages.sender_id, otherUserId)
          )
        );
    }

    res.json(msgs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAuth, requireNotRestricted, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { report_id, receiver_id, body } = req.body;

    if (!report_id || !receiver_id || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [newMsg] = await db
      .insert(messages)
      .values({
        report_id,
        sender_id: req.user.id,
        receiver_id,
        body: body.trim(),
      })
      .returning();
      
    // Fetch with relations to return complete object
    const completeMsg = await db.query.messages.findFirst({
      where: eq(messages.id, newMsg.id),
      with: {
        sender: { columns: { id: true, full_name: true, avatar_url: true } },
        receiver: { columns: { id: true, full_name: true, avatar_url: true, fcm_token: true } },
      },
    });

    // Send in-app notification & push notification
    notifyNewMessage({
      senderId: req.user.id,
      receiverId: receiver_id,
      reportId: report_id,
      body: newMsg.body,
    }).catch((notifErr) => console.warn("notifyNewMessage error:", notifErr));

    res.status(201).json(completeMsg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
