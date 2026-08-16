import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as fbSignOut, type User } from "firebase/auth";
import { auth, requestFCMToken } from "@/lib/firebase";
import { setGmailAccessToken } from "@/lib/gmail";
import { api } from "@/client/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

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
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  rawUser: null,
  loading: true,
  signOut: async () => {},
});

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the application and initializes
 * the Firebase Auth listener, ensuring the user state is globally accessible
 * via React context throughout the app.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const qc = useQueryClient();
  const router = useRouter();

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

        // Sync with backend database silently
        try {
          await api.post("/auth/sync", {
            email: currentUser.email,
            full_name: currentUser.displayName || "مستخدم",
          });
          
          // Request and save FCM Token
          try {
            const fcmToken = await requestFCMToken();
            if (fcmToken) {
              await api.post("/auth/fcm-token", { token: fcmToken });
            }
          } catch (tokenErr) {
            console.error("Failed to sync FCM token:", tokenErr);
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
    <AuthContext.Provider value={{ user, rawUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
