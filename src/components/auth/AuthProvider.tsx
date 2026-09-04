import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { auth, requestFCMToken, listenToForegroundMessages, registerServiceWorker } from "@/lib/firebase";
import { setGmailAccessToken } from "@/lib/gmail";
import { api } from "@/client/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { playNotificationSound } from "@/lib/sound";

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  rawUser: User | null;
  loading: boolean;
  pushPermissionStatus: NotificationPermission | "unsupported";
  requestPushPermission: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  rawUser: null,
  loading: true,
  pushPermissionStatus: "default",
  requestPushPermission: async () => false,
  signOut: async () => {},
});

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the application and initializes
 * the Firebase Auth listener, FCM push token syncing, and foreground
 * notification handling.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const qc = useQueryClient();
  const router = useRouter();

  // Register service worker on app startup
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker().catch((err) => console.warn("SW register init:", err));
    }
  }, []);

  const syncFCMToken = async () => {
    try {
      const fcmToken = await requestFCMToken();
      if (fcmToken) {
        await api.post("/notifications/token", { token: fcmToken });
        if (typeof window !== "undefined" && "Notification" in window) {
          setPushPermissionStatus(Notification.permission);
        }
        return true;
      }
    } catch (tokenErr) {
      console.error("Failed to sync FCM token:", tokenErr);
    }
    return false;
  };

  const requestPushPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("الإشعارات غير مدعومة في هذا المتصفح");
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPushPermissionStatus(res);
      if (res === "granted") {
        const ok = await syncFCMToken();
        if (ok) {
          toast.success("تم تفعيل الإشعارات بنجاح على هذا الجهاز! 🎉");
          return true;
        } else {
          toast.success("تم منح إذن الإشعارات بنجاح");
          return true;
        }
      } else if (res === "denied") {
        toast.error("تم رفض إذن الإشعارات من إعدادات المتصفح");
        return false;
      }
    } catch (e) {
      console.error("Request permission error:", e);
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setRawUser(currentUser);
      if (currentUser) {
        const authUser: AuthUser = {
          id: currentUser.uid,
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setUser(authUser);

        // Sync with backend database
        try {
          const syncRes = await api.post<{ id?: string }>("/auth/sync", {
            email: currentUser.email,
            full_name: currentUser.displayName || "مستخدم",
          });

          if (syncRes?.id) {
            setUser({
              ...authUser,
              id: syncRes.id,
            });
          }

          // If permission is already granted, sync FCM token in the background
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            syncFCMToken().catch(() => {});
          }
        } catch (e) {
          console.warn("Backend auth sync warning:", e);
        }

        router.invalidate();
        qc.invalidateQueries();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [qc, router]);

  // Foreground notification listener
  useEffect(() => {
    if (!user) return;

    const unsubscribeForeground = listenToForegroundMessages((payload) => {
      // Invalidate queries so unread counts and lists update in real-time
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      qc.invalidateQueries({ queryKey: ["messages"] });

      // Play soft chime audio & haptics
      playNotificationSound();

      // Show toast
      toast(payload.title || "إشعار جديد", {
        description: payload.body,
        icon: <Bell className="size-4 text-primary" />,
        action: payload.url
          ? {
              label: "عرض",
              onClick: () => {
                if (payload.url) {
                  router.navigate({ to: payload.url as never });
                }
              },
            }
          : undefined,
      });
    });

    return () => {
      if (typeof unsubscribeForeground === "function") {
        unsubscribeForeground();
      }
    };
  }, [user, qc, router]);

  const signOut = async () => {
    try {
      await qc.cancelQueries();
      qc.clear();
      setGmailAccessToken(null);
      await fbSignOut(auth);
      setUser(null);
      setRawUser(null);
      router.invalidate();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
        loading,
        pushPermissionStatus,
        requestPushPermission,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

