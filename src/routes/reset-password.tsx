import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updatePassword, confirmPasswordReset, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { resetPasswordSchema } from "@/lib/schemas";
import { PageShell } from "@/components/layout/PageShell";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  oobCode: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "تعيين كلمة مرور جديدة | مفقوداتي" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: ResetPage,
});

function ResetPage() {
  const search = useSearch({ from: "/reset-password" });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (search.oobCode) {
      setReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setReady(true);
      } else {
        setReady(false);
      }
    });
    return () => unsubscribe();
  }, [search.oobCode]);

  const onSubmit = handleSubmit(async ({ password }) => {
    setLoading(true);
    try {
      if (search.oobCode) {
        await confirmPasswordReset(auth, search.oobCode, password);
      } else if (auth.currentUser) {
        await updatePassword(auth.currentUser, password);
      } else {
        toast.error("انتهت صلاحية الجلسة أو الرابط");
        return;
      }
      toast.success("تم تحديث كلمة المرور بنجاح");
      navigate({ to: "/profile" });
    } catch (error: unknown) {
      console.error("Update password error:", error);
      toast.error("تعذّر تحديث كلمة المرور");
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageShell title="تعيين كلمة مرور جديدة" subtitle="أدخل كلمة المرور الجديدة">
      <form onSubmit={onSubmit} className="card-soft max-w-md mx-auto rounded-3xl p-8 space-y-4">
        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">
            جارٍ التحقق من صلاحية الجلسة أو الرابط...
          </p>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-bold text-primary-dark">كلمة المرور الجديدة</span>
              <input
                type="password"
                {...register("password")}
                className="input mt-2"
                placeholder="8 أحرف على الأقل"
              />
              {errors.password && (
                <span className="mt-1 block text-xs text-destructive">
                  {errors.password.message}
                </span>
              )}
            </label>
            <button
              disabled={loading}
              type="submit"
              className="btn-gradient w-full rounded-xl px-6 py-3 text-sm font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />} تحديث كلمة المرور
            </button>
          </>
        )}
      </form>
    </PageShell>
  );
}
