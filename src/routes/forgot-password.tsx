import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { resetRequestSchema } from "@/lib/schemas";
import { PageShell } from "@/components/layout/PageShell";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "استعادة كلمة المرور | مفقوداتي" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetRequestSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success("تم إرسال رابط الاستعادة إلى بريدك");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("user-not-found")) {
        toast.error("البريد الإلكتروني غير مسجل");
      } else {
        toast.error("تعذّر إرسال الرابط");
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageShell
      title="استعادة كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين"
    >
      <form onSubmit={onSubmit} className="card-soft max-w-md mx-auto rounded-3xl p-8 space-y-4">
        {sent ? (
          <p className="text-center text-sm text-primary-dark font-semibold">
            تفقّد بريدك الإلكتروني للمتابعة وإعادة تعيين كلمة المرور
          </p>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-bold text-primary-dark">البريد الإلكتروني</span>
              <input
                dir="ltr"
                type="email"
                {...register("email")}
                className="input mt-2"
                placeholder="you@example.com"
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-destructive">{errors.email.message}</span>
              )}
            </label>
            <button
              disabled={loading}
              type="submit"
              className="btn-gradient w-full rounded-xl px-6 py-3 text-sm font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="size-4 animate-spin" />} إرسال الرابط
            </button>
          </>
        )}
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/auth" className="text-primary font-bold hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </form>
    </PageShell>
  );
}
