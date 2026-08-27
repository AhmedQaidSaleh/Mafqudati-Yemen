import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { profileQuery, myReportsQuery, savedReportsQuery } from "@/lib/queries";
import { ReportGrid, EmptyState } from "@/components/reports/ReportCard";
import { useAuth } from "@/lib/auth";
import { api } from "@/client/api/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { uploadImage, validateImage } from "@/lib/upload";
import { profileSchema } from "@/lib/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, Mail, ShieldCheck, Bell } from "lucide-react";
import { initialOf } from "@/lib/format";
import { GmailInboxHub } from "@/components/gmail/GmailInboxHub";
import { NotificationPreferencesTab } from "@/components/profile/NotificationPreferencesTab";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "الملف الشخصي | مفقوداتي" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"info" | "reports" | "saved" | "notifications" | "gmail">("info");
  const { data: profile } = useQuery(profileQuery(user?.id));
  const { data: myReports = [] } = useQuery(myReportsQuery(user?.id));
  const { data: saved = [] } = useQuery(savedReportsQuery(user?.id));
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    const err = validateImage(f);
    if (err) {
      toast.error(err);
      return;
    }
    setUploading(true);
    try {
      const up = await uploadImage("avatars", user.id, f);
      await api.patch("/auth/profile", { avatar_url: up.url });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("تم تحديث الصورة");
    } catch {
      toast.error("فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell title="الملف الشخصي" subtitle="إدارة بياناتك وبلاغاتك">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="card-soft rounded-3xl p-6 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <div className="size-20 rounded-full bg-secondary text-primary flex items-center justify-center text-3xl font-extrabold">
                  {initialOf(profile?.full_name ?? user?.email)}
                </div>
              )}
              <label className="absolute -bottom-1 -end-1 rounded-full bg-primary text-white p-1.5 cursor-pointer">
                {uploading ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Upload className="size-3" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
            </div>
            <div className="mt-3 font-extrabold text-primary-dark">
              {profile?.full_name ?? "مستخدم مفقوداتي"}
            </div>
            <div className="text-xs text-muted-foreground">{profile?.governorate ?? "اليمن"}</div>
          </div>
          <nav className="mt-6 space-y-1 text-sm font-bold">
            {[
              { id: "info", t: "البيانات الشخصية", icon: null },
              { id: "reports", t: `بلاغاتي (${myReports.length})`, icon: null },
              { id: "saved", t: `المحفوظة (${saved.length})`, icon: null },
              { id: "notifications", t: "إعدادات وتفضيلات الإشعارات", icon: Bell },
              { id: "gmail", t: "بريد Gmail", icon: Mail },
            ].map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id as never)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-right ${tab === x.id ? "bg-secondary text-primary font-extrabold" : "hover:bg-secondary text-foreground"}`}
              >
                <span>{x.t}</span>
                {x.icon && <x.icon className={`size-4 ${x.id === "notifications" ? "text-primary" : "text-rose-500"}`} />}
              </button>
            ))}

            {(profile?.role === "ADMIN" ||
              user?.email?.toLowerCase() === "qayda079@gmail.com" ||
              user?.email?.toLowerCase() === "admin@mafqudati.ye" ||
              user?.email?.toLowerCase().startsWith("admin@")) && (
              <div className="pt-3 border-t border-border mt-3">
                <Link
                  to="/admin"
                  className="w-full flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-right font-black text-primary hover:bg-primary/20 transition-colors"
                >
                  <span>لوحة الإدارة والأمان</span>
                  <ShieldCheck className="size-4 text-primary" />
                </Link>
              </div>
            )}
          </nav>
        </aside>
        <div className="card-soft rounded-3xl p-6 sm:p-10">
          {tab === "info" && <InfoTab profile={profile} />}
          {tab === "reports" &&
            (myReports.length ? (
              <ReportGrid reports={myReports as never} />
            ) : (
              <EmptyState title="لا توجد بلاغات" subtitle="أنشئ بلاغك الأول من زر أضف بلاغ" />
            ))}
          {tab === "saved" &&
            (saved.length ? (
              <ReportGrid reports={saved as never} />
            ) : (
              <EmptyState
                title="لا شيء محفوظ"
                subtitle="احفظ البلاغات التي تهمك للرجوع إليها لاحقاً"
              />
            ))}
          {tab === "notifications" && <NotificationPreferencesTab />}
          {tab === "gmail" && <GmailInboxHub />}
          {tab === "info" && (
            <div className="mt-6">
              <Link to="/reset-password" className="text-sm text-primary font-bold hover:underline">
                تغيير كلمة المرور
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function InfoTab({
  profile,
}: {
  profile:
    | {
        full_name?: string | null;
        phone?: string | null;
        governorate?: string | null;
        district?: string | null;
        city?: string | null;
        neighborhood?: string | null;
      }
    | null
    | undefined;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(profileSchema) });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reset({
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      governorate: profile?.governorate ?? "",
      district: profile?.district ?? "",
      city: profile?.city ?? "",
      neighborhood: profile?.neighborhood ?? "",
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      await api.patch("/auth/profile", values);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("تم حفظ البيانات بنجاح");
    } catch {
      toast.error("فشل حفظ البيانات");
    } finally {
      setSaving(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-xl font-extrabold text-primary-dark">البيانات الشخصية</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { k: "full_name" as const, l: "الاسم الكامل" },
          { k: "phone" as const, l: "رقم الجوال" },
          { k: "governorate" as const, l: "المحافظة" },
          { k: "district" as const, l: "المديرية" },
          { k: "city" as const, l: "المدينة" },
          { k: "neighborhood" as const, l: "الحي" },
        ].map((f) => (
          <label key={f.k} className="block">
            <span className="text-sm font-bold text-primary-dark">{f.l}</span>
            <input {...register(f.k)} className="input mt-2" />
            {errors[f.k]?.message && (
              <span className="text-xs text-destructive">{String(errors[f.k]?.message)}</span>
            )}
          </label>
        ))}
      </div>
      <button
        disabled={saving}
        type="submit"
        className="btn-gradient rounded-xl px-6 py-3 text-sm font-extrabold disabled:opacity-60 inline-flex items-center gap-2"
      >
        {saving && <Loader2 className="size-4 animate-spin" />} حفظ التغييرات
      </button>
    </form>
  );
}
