import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../config/env";
import firebaseAppletConfig from "../../firebase-applet-config.json";

export const initFirebaseAdmin = () => {
  if (getApps().length > 0) return; // Already initialized

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    try {
      let rawKey = env.FIREBASE_PRIVATE_KEY.trim();
      if (
        (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
        (rawKey.startsWith("'") && rawKey.endsWith("'"))
      ) {
        rawKey = rawKey.slice(1, -1);
      }
      const privateKey = rawKey.replace(/\\n/g, "\n");
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      console.log("🔥 Firebase Admin Initialized with Certificate");
      return;
    } catch (error) {
      console.error("Failed to initialize Firebase Admin with certificate:", error);
    }
  }

  const projectId = env.FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "mafqudati-d3b18";
  if (projectId) {
    try {
      initializeApp({
        projectId,
      });
      console.log("🔥 Firebase Admin Initialized with Project ID:", projectId);
    } catch (error) {
      console.error("Failed to initialize Firebase Admin with projectId:", error);
    }
  } else {
    console.warn("⚠️ Firebase Admin credentials missing. Auth middleware will block requests.");
  }
};

initFirebaseAdmin();

export const firebaseAuth = getApps().length > 0 ? getAuth() : null;
