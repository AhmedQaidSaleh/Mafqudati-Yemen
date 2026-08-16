import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { reportByIdQuery } from "@/lib/queries";
import { api } from "@/client/api/client";
import { useAuth } from "@/lib/auth";
import {
  MapPin,
  Calendar,
  Tag,
  Camera,
  MessageCircle,
  Loader2,
  Phone,
  Bookmark,
  Share2,
  Mail,
} from "lucide-react";
import { timeAgo, formatYER, initialOf } from "@/lib/format";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { GmailContactModal } from "@/components/gmail/GmailContactModal";

export const Route = createFileRoute("/report/$id")({
  head: () => ({ meta: [{ title: "تفاصيل البلاغ | مفقوداتي" }] }),
  component: ReportDetails,
});

function ReportDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data, isLoading } = useQuery(reportByIdQuery(id));
  const [qr, setQr] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      QRCode.toDataURL(`${window.location.origin}/report/${id}`, { width: 200, margin: 1 }).then(
        setQr,
      );
    }
  }, [id]);

  if (isLoading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  if (!data)
    return (
      <PageShell title="لم يتم العثور على البلاغ" subtitle="ربما تم حذفه أو أن الرابط غير صحيح" />
    );

  const images = (data.report_images ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const img = images[activeImg]?.url;
  const isOwner = user?.id === data.user_id;
  const showPhone =
    (data.contact_preference === "phone" || data.contact_preference === "both") &&
    data.profile?.phone &&
    !data.profile?.privacy_hide_contact;

  const send = async () => {
    if (!user) {
      toast.error("سجّل الدخول أولاً");
      return;
    }
    if (!msg.trim()) return;
    setSending(true);
    try {
      await api.post("/messages", {
        report_id: data.id,
        receiver_id: data.user_id,
        body: msg.trim(),
      });
      setMsg("");
      toast.success("تم إرسال الرسالة");
    } catch {
      toast.error("تعذّر إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  const save = async () => {
    if (!user) {
      toast.error("سجّل الدخول أولاً");
      return;
    }
    try {
      await api.post("/saved-reports", { report_id: data.id });
      toast.success("تم الحفظ في المفضلة");
    } catch {
      toast.error("تعذّر الحفظ");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/report/${data.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, url });
      } catch (err: unknown) {
        console.debug("Share dismissed or failed:", err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    }
  };

  const loc = [data.governorates?.name_ar, data.districts?.name_ar || data.city, data.neighborhood]
    .filter(Boolean)
    .join(" - ");
  const badge =
    data.type === "lost" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700";

  return (
    <PageShell title="تفاصيل البلاغ" subtitle={`رقم البلاغ: #${data.id.slice(0, 8)}`}>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] max-w-6xl mx-auto">
        <div className="card-soft rounded-3xl overflow-hidden">
          <div className="aspect-video bg-secondary flex items-center justify-center text-primary relative">
            {img ? (
              <img src={img} alt={data.title} className="h-full w-full object-cover" />
            ) : (
              <Camera className="size-16" />
            )}
            <span
              className={`absolute top-4 start-4 rounded-full px-3 py-1 text-xs font-bold ${badge}`}
            >
              {data.type === "lost" ? "مفقود" : "معثور"}
            </span>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {images.map((im: { url: string }, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`size-16 shrink-0 rounded-lg overflow-hidden border-2 ${i === activeImg ? "border-primary" : "border-transparent"}`}
                >
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="p-6 sm:p-8">
            {data.categories?.name_ar && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                <Tag className="size-3" /> {data.categories.name_ar}
              </span>
            )}
            <h2 className="mt-4 text-2xl font-extrabold text-primary-dark">{data.title}</h2>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {loc && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4 text-primary" /> {loc}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-4 text-primary" /> {timeAgo(data.created_at)}
              </span>
            </div>
            {data.reward_amount ? (
              <div className="mt-4 inline-block rounded-xl bg-amber-100 text-amber-800 px-4 py-2 text-sm font-bold">
                مكافأة: {formatYER(Number(data.reward_amount))}
              </div>
            ) : null}
            <div className="mt-6">
              <h3 className="font-bold text-primary-dark">الوصف</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {data.description}
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold inline-flex items-center gap-2 hover:bg-secondary"
              >
                <Bookmark className="size-4" /> حفظ
              </button>
              <button
                type="button"
                onClick={share}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold inline-flex items-center gap-2 hover:bg-secondary"
              >
                <Share2 className="size-4" /> مشاركة
              </button>
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="card-soft rounded-3xl p-6">
            <h3 className="font-extrabold text-primary-dark">معلومات المُبلِّغ</h3>
            <div className="mt-4 flex items-center gap-3">
              <div className="size-12 rounded-full bg-secondary text-primary flex items-center justify-center font-extrabold">
                {initialOf(data.profile?.full_name)}
              </div>
              <div>
                <div className="text-sm font-bold text-primary-dark">
                  {data.profile?.full_name ?? "مستخدم"}
                </div>
                <div className="text-xs text-muted-foreground">
                  عضو منذ{" "}
                  {data.profile?.created_at ? new Date(data.profile.created_at).getFullYear() : ""}
                </div>
              </div>
            </div>
            {showPhone && data.profile?.phone && (
              <a
                href={`tel:${data.profile.phone}`}
                className="mt-4 w-full rounded-xl border border-border px-4 py-3 text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-secondary"
              >
                <Phone className="size-4" /> {data.profile.phone}
              </a>
            )}
            {!isOwner && user && (
              <div className="mt-4 space-y-3">
                <Link
                  to="/chat/$reportId/$userId"
                  params={{ reportId: data.id, userId: data.user_id }}
                  className="btn-gradient w-full rounded-xl px-4 py-3 text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="size-4" /> مراسلة المُبلِّغ
                </Link>

                {data.profile?.email && (
                  <button
                    type="button"
                    onClick={() => setGmailModalOpen(true)}
                    className="w-full rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 px-4 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-rose-100/60 transition-colors"
                  >
                    <Mail className="size-4 text-rose-600" /> إرسال استفسار عبر Gmail
                  </button>
                )}
              </div>
            )}
            {!user && (
              <Link
                to="/auth"
                className="mt-4 btn-gradient w-full rounded-xl px-4 py-3 text-sm font-bold inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" /> سجّل الدخول للتواصل
              </Link>
            )}
          </div>
          {qr && (
            <div className="card-soft rounded-3xl p-6 text-center">
              <h3 className="font-extrabold text-primary-dark">رمز QR للبلاغ</h3>
              <img src={qr} alt="QR" className="mx-auto mt-3 rounded-lg border border-border" />
              <p className="mt-2 text-xs text-muted-foreground">امسح لمشاركة البلاغ</p>
            </div>
          )}
        </aside>
      </div>

      {data.profile?.email && (
        <GmailContactModal
          open={gmailModalOpen}
          onOpenChange={setGmailModalOpen}
          recipientEmail={data.profile.email}
          recipientName={data.profile.full_name || undefined}
          reportId={data.id}
          reportTitle={data.title}
          reportType={data.type as "lost" | "found"}
        />
      )}
    </PageShell>
  );
}
