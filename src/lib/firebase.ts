import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, type Firestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import firebaseAppletConfig from "../../firebase-applet-config.json";

const projectId =
  firebaseAppletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "mafqudati-d3b18";

const firebaseConfig: FirebaseOptions = {
  apiKey:
    firebaseAppletConfig.apiKey ||
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyDummyKeyForDevEnvironment12345678",
  authDomain:
    firebaseAppletConfig.authDomain ||
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket:
    firebaseAppletConfig.storageBucket ||
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    `${projectId}.firebasestorage.app`,
  messagingSenderId:
    firebaseAppletConfig.messagingSenderId ||
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "814555977272",
  appId:
    firebaseAppletConfig.appId ||
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:814555977272:web:400a74ecd677047a2378cd",
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const messaging: Messaging | null = typeof window !== "undefined" && "serviceWorker" in navigator ? getMessaging(app) : null;
export const db: Firestore = firebaseAppletConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId)
  : getFirestore(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
googleProvider.addScope("https://www.googleapis.com/auth/gmail.send");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.compose");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.modify");

export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}


export async function requestFCMToken() {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY || undefined
      });
      return token;
    }
  } catch (error) {
    console.error("FCM Token error", error);
  }
  return null;
}
