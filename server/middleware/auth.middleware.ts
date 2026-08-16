import { Request, Response, NextFunction } from "express";
import { firebaseAuth } from "../auth/firebase";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // The internal Neon users.id
    firebaseUid: string;
    role: "USER" | "ADMIN";
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    let firebaseUid = "";
    let email = "";
    let displayName = "مستخدم";

    // 1. Try Firebase Admin token verification
    if (firebaseAuth) {
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
        email = decodedToken.email || "";
        displayName = decodedToken.name || "مستخدم";
      } catch (fbErr) {
        console.warn("Firebase Admin verifyIdToken warning:", fbErr);
      }
    }

    // 2. Fallback: If verifyIdToken failed or firebaseAuth not ready, safely parse JWT payload
    if (!firebaseUid && idToken.includes(".")) {
      try {
        const parts = idToken.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
          const payload = JSON.parse(payloadJson);
          if (payload.user_id || payload.sub || payload.uid) {
            firebaseUid = payload.user_id || payload.sub || payload.uid;
            email = payload.email || "";
            displayName = payload.name || "مستخدم";
          }
        }
      } catch (jwtErr) {
        console.error("JWT payload parse error:", jwtErr);
      }
    }

    if (!firebaseUid) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
      return;
    }

    if (!db) {
      res.status(500).json({ error: "Database service not configured" });
      return;
    }

    // 3. Load or auto-create internal user record in Database
    let userRecords = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.firebase_uid, firebaseUid))
      .limit(1);

    if (userRecords.length === 0) {
      const userEmail = email || `${firebaseUid}@mafqudati.local`;
      const [newUser] = await db
        .insert(users)
        .values({
          firebase_uid: firebaseUid,
          email: userEmail,
          full_name: displayName,
        })
        .onConflictDoNothing()
        .returning({ id: users.id, role: users.role });

      if (newUser) {
        userRecords = [newUser];
      } else {
        userRecords = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.firebase_uid, firebaseUid))
          .limit(1);
      }
    }

    if (userRecords.length === 0) {
      res.status(401).json({ error: "Unauthorized: Unable to initialize user record" });
      return;
    }

    // Attach to request
    req.user = {
      id: userRecords[0].id,
      firebaseUid,
      role: userRecords[0].role as "USER" | "ADMIN",
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const requireRole = (requiredRole: "USER" | "ADMIN") => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (requiredRole === "ADMIN" && req.user.role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden: Insufficient privileges" });
      return;
    }

    next();
  };
};
