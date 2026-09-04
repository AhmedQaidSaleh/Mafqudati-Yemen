import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  inMemoryPersistence,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { setGmailAccessToken } from "@/lib/gmail";
import { GoogleAuthProvider } from "firebase/auth";
import { api } from "@/client/api/client";
import { signInSchema, signUpSchema } from "@/lib/schemas";
import logo from "@/assets/logo.png";
import { Eye, EyeOff, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "الدخول أو التسجيل | مفقوداتي" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");

  const redirectPath = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";

  const goAfter = () => {
    navigate({ to: redirectPath, replace: true });
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-12">
      <div className="card-soft w-full rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="مفقوداتي" className="h-16 w-16 object-contain" />
          <h1 className="mt-4 text-2xl font-extrabold text-primary-dark">
            {mode === "signin" ? "مرحباً بعودتك" : "أنشئ حسابك"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "سجّل الدخول لمتابعة بلاغاتك" : "انضم إلى مجتمع مفقوداتي"}
          </p>
        </div>

        <GoogleButton onDone={goAfter} />

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          أو
          <span className="h-px flex-1 bg-border" />
        </div>

        {mode === "signin" ? <SignInForm onDone={goAfter} /> : <SignUpForm onDone={goAfter} />}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              ليس لديك حساب؟{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-bold text-primary hover:underline"
              >
                أنشئ حساباً
              </button>
            </>
          ) : (
            <>
              لديك حساب بالفعل؟{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-bold text-primary hover:underline"
              >
                سجّل الدخول
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function GoogleButton({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";

  const copyDomain = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      toast.success("تم نسخ النطاق إلى الحافظة");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const go = async () => {
    setLoading(true);
    setUnauthorizedDomain(null);
    setErrorMessage(null);
    try {
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (firstErr: unknown) {
        const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
        if (msg.includes("Database is closing") || msg.includes("closing/hidden")) {
          console.warn("Database is closing/hidden encountered, switching to memory persistence and retrying...");
          await setPersistence(auth, inMemoryPersistence).catch(() => {});
          result = await signInWithPopup(auth, googleProvider);
        } else {
          throw firstErr;
        }
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGmailAccessToken(credential.accessToken);
      }
      if (result.user) {
        await api.post("/auth/sync", {
          email: result.user.email,
          full_name: result.user.displayName || "مستخدم",
        });
      }
      toast.success("تم تسجيل الدخول بنجاح");
      onDone();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "";
      const errCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : "";

      const isUserCancellation =
        errCode === "auth/popup-closed-by-user" ||
        errCode === "auth/cancelled-popup-request" ||
        errMsg.includes("popup-closed-by-user") ||
        errMsg.includes("cancelled-popup-request");

      const isUnauthorizedDomain =
        errCode === "auth/unauthorized-domain" || errMsg.includes("auth/unauthorized-domain");

      const isPopupBlocked =
        errCode === "auth/popup-blocked" || errMsg.includes("popup-blocked");

      const isDbClosing =
        errMsg.includes("Database is closing") || errMsg.includes("closing/hidden");

      if (isUserCancellation) {
        // User closed the popup intentionally
      } else if (isUnauthorizedDomain) {
        console.warn("Google sign in domain unauthorized:", currentHost);
        setUnauthorizedDomain(currentHost);
        toast.error("نطاق التطبيق بحاجة للإضافة في Firebase Console");
      } else if (isPopupBlocked) {
        setErrorMessage("المتصفح قام بحظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة (Pop-ups) لهذا الموقع ثم المحاولة مجدداً.");
        toast.error("تم حظر النافذة المنبثقة");
      } else if (isDbClosing) {
        setErrorMessage("تعذر الاتصال بذاكرة التخزين المحلية للمتصفح مؤقتاً. تم تحديث الإعدادات، يرجى النقر على زر المتابعة مجدداً أو تسجيل الدخول بالبريد وكلمة المرور.");
        toast.error("تعذّر الوصول لذاكرة التخزين، يرجى إعادة المحاولة");
      } else {
        console.error("Google sign in error:", error);
        setErrorMessage(
          errMsg || "تعذر إكمال تسجيل الدخول عبر Google. يمكنك استخدام البريد وكلمة المرور أدناه مباشرة."
        );
        toast.error("تعذّر تسجيل الدخول بجوجل");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold hover:bg-secondary disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
        المتابعة باستخدام Google
      </button>

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-right text-xs leading-relaxed text-destructive">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertCircle className="size-4 shrink-0" />
            <span>تنبيه في تسجيل الدخول</span>
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      {unauthorizedDomain && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-right text-xs leading-relaxed text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2 font-bold mb-1.5">
            <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <span>تنبيه: نطاق التطبيق غير مضاف في Firebase Auth</span>
          </div>
          <p className="mb-2 text-amber-800 dark:text-amber-300">
            للسماح بتسجيل الدخول عبر Google، يجب إضافة هذا النطاق إلى قائمة النطاقات المصرح بها
            (Authorized Domains):
          </p>
          <div
            className="flex items-center justify-between gap-2 rounded-xl bg-background/80 border border-amber-200 dark:border-amber-900 px-3 py-2 font-mono text-[11px] text-foreground"
            dir="ltr"
          >
            <span className="truncate">{unauthorizedDomain}</span>
            <button
              type="button"
              onClick={copyDomain}
              className="inline-flex items-center gap-1 text-primary hover:underline font-sans font-bold text-xs shrink-0"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            الخطوات: افتح Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains
            وألصق النطاق أعلاه. أو يمكنك <strong>استخدام البريد وكلمة المرور بالأسفل مباشرة</strong> دون أي إعدادات إضافية.
          </p>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signInSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, values.email, values.password);
      if (cred.user) {
        await api.post("/auth/sync", {
          email: cred.user.email,
          full_name: cred.user.displayName || "مستخدم",
        });
      }
      toast.success("تم تسجيل الدخول");
      onDone();
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      const msg = error instanceof Error ? error.message : "";
      if (
        msg.includes("user-not-found") ||
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        toast.error("بيانات الدخول غير صحيحة");
      } else if (msg.includes("too-many-requests")) {
        toast.error("تم حظر المحاولات مؤقتاً لكثرة الطلبات. يرجى المحاولة لاحقاً.");
      } else {
        toast.error("تعذّر تسجيل الدخول");
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="البريد الإلكتروني" error={errors.email?.message as string | undefined}>
        <input
          type="email"
          dir="ltr"
          {...register("email")}
          className="input"
          placeholder="you@example.com"
        />
      </Field>
      <Field label="كلمة المرور" error={errors.password?.message as string | undefined}>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            {...register("password")}
            className="input pl-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <div className="flex items-center justify-between text-xs">
        <span />
        <Link to="/forgot-password" className="font-bold text-primary hover:underline">
          نسيت كلمة المرور؟
        </Link>
      </div>
      <button
        disabled={loading}
        type="submit"
        className="btn-gradient w-full rounded-xl px-6 py-3 text-sm font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="size-4 animate-spin" />} تسجيل الدخول
      </button>
    </form>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signUpSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      if (cred.user) {
        await updateProfile(cred.user, {
          displayName: values.full_name,
        });
        await api.post("/auth/sync", {
          email: values.email,
          full_name: values.full_name,
          phone: values.phone || null,
        });
      }
      toast.success("تم إنشاء الحساب بنجاح");
      onDone();
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("email-already-in-use")) {
        toast.error("البريد مسجل مسبقاً");
      } else if (msg.includes("weak-password")) {
        toast.error("كلمة المرور ضعيفة للغاية");
      } else {
        toast.error("تعذّر إنشاء الحساب");
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="الاسم الكامل" error={errors.full_name?.message as string | undefined}>
        <input {...register("full_name")} className="input" placeholder="مثال: محمد أحمد" />
      </Field>
      <Field label="البريد الإلكتروني" error={errors.email?.message as string | undefined}>
        <input
          type="email"
          dir="ltr"
          {...register("email")}
          className="input"
          placeholder="you@example.com"
        />
      </Field>
      <Field label="رقم الجوال (اختياري)" error={errors.phone?.message as string | undefined}>
        <input dir="ltr" {...register("phone")} className="input" placeholder="+9677XXXXXXXX" />
      </Field>
      <Field label="كلمة المرور" error={errors.password?.message as string | undefined}>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            {...register("password")}
            className="input pl-10"
            placeholder="8 أحرف على الأقل"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <button
        disabled={loading}
        type="submit"
        className="btn-gradient w-full rounded-xl px-6 py-3 text-sm font-extrabold disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="size-4 animate-spin" />} إنشاء الحساب
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-primary-dark">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
