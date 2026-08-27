const fs = require('fs');
let code = fs.readFileSync('server/middleware/auth.middleware.ts', 'utf8');

const target = `    // 1. Try Firebase Admin token verification
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
    }`;

const replacement = `    // 1. Firebase Admin token verification
    if (!firebaseAuth) {
      res.status(500).json({ error: "Backend Auth not configured" });
      return;
    }
    
    try {
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      firebaseUid = decodedToken.uid;
      email = decodedToken.email || "";
      displayName = decodedToken.name || "مستخدم";
    } catch (fbErr) {
      console.warn("Firebase Admin verifyIdToken warning:", fbErr);
      res.status(401).json({ error: "Unauthorized: Invalid token signature" });
      return;
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('server/middleware/auth.middleware.ts', code);
