import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

async function getCurrentUser(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser();
    if (!user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } as never });
    }
    return {
      user: {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    };
  },
  component: () => <Outlet />,
});
