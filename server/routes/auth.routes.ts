import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
import { eq } from "drizzle-orm";
import { firebaseAuth } from "../auth/firebase";

const router = Router();

// Used to synchronize Firebase auth with our database
router.post("/sync", async (req, res) => {
  try {
    if (!firebaseAuth || !db) return res.status(500).json({ error: "Backend not configured" });

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    // Check if user exists
    let user = await db
      .select()
      .from(users)
      .where(eq(users.firebase_uid, decodedToken.uid))
      .limit(1);

    if (user.length === 0) {
      // Create user if not exists
      const email = decodedToken.email || req.body.email;
      const full_name = decodedToken.name || req.body.full_name || "مستخدم";
      const phone = req.body.phone || null;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const [newUser] = await db
        .insert(users)
        .values({
          firebase_uid: decodedToken.uid,
          email,
          full_name,
          phone,
        })
        .returning();

      user = [newUser];
    }

    res.json(user[0]);
  } catch (error) {
    console.error("Auth sync error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (user.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(user[0]);
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { full_name, phone, avatar_url } = req.body as {
      full_name?: string;
      phone?: string;
      avatar_url?: string;
    };
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, req.user.id));
    }
    const [updatedUser] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    res.json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.post("/fcm-token", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!db || !req.user) return res.status(500).json({ error: "Not configured" });
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    await db.update(users).set({ fcm_token: token }).where(eq(users.id, req.user.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Save FCM token error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

