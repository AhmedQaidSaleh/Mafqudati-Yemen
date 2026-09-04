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
  Gift,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Printer,
  AlertTriangle,
  User,
  HeartHandshake,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { timeAgo, formatYER, initialOf } from "@/lib/format";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { GmailContactModal } from "@/components/gmail/GmailContactModal";
import { MissingPosterModal } from "@/components/reports/MissingPosterModal";
import { SightingsSection } from "@/components/reports/SightingsSection";
import { EditReportModal } from "@/components/reports/EditReportModal";

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
  const [showSecret, setShowSecret] = useState(false);
  const [gmailModalOpen, setGmailModalOpen] = useState(false);
  const [posterModalOpen, setPosterModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

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

  const isHumanitarian = Boolean(
    data.is_humanitarian ||
    data.category_id === 9 ||
    data.categories?.slug === "missing-persons" ||
    data.categories?.name_ar?.includes("مفقودين") ||
    data.categories?.name_ar?.includes("إنساني")
  );
  const isResolved = data.status === "resolved";

  return (
    <PageShell title="تفاصيل البلاغ" subtitle={`رقم البلاغ: #${data.id.slice(0, 8)}`}>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="card-soft rounded-3xl overflow-hidden">
            {/* Humanitarian Emergency Header */}
            {isHumanitarian && (
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3.5 w-3.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-300"></span>
                  </span>
                  <div>
                    <span className="text-[11px] font-black tracking-wider bg-black/20 px-2.5 py-0.5 rounded-md uppercase text-yellow-300">
                      نداء إنساني طارئ • AMBER ALERT
                    </span>
                    <h2 className="text-base sm:text-lg font-black mt-1">
                      {isResolved ? "تم العثور على المفقود بفضل الله وهو بأمان" : "إعلان وبلاغ بحث عاجل عن مفقود"}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPosterModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-red-700 hover:bg-slate-100 px-4 py-2.5 text-xs font-black transition shadow-sm"
                >
                  <Printer className="size-4" /> ملصق البحث (طباعة ومشاركة)
                </button>
              </div>
            )}

            <div className="aspect-video bg-secondary flex items-center justify-center text-primary relative">
              {img ? (
                <img
                  src={img}
                  alt={data.title}
                  className={`h-full w-full object-cover ${
                    isHumanitarian && isResolved ? "blur-sm" : ""
                  }`}
                />
              ) : (
                <Camera className="size-16" />
              )}
              <span
                className={`absolute top-4 start-4 rounded-full px-3 py-1 text-xs font-bold ${
                  isHumanitarian ? "bg-red-600 text-white shadow-md animate-pulse" : badge
                }`}
              >
                {isHumanitarian ? "نداء إنساني عاجل" : data.type === "lost" ? "مفقود" : "معثور"}
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

              {/* Humanitarian Emergency Specifications */}
              {isHumanitarian && (
                <div className="mt-6 rounded-2xl border-2 border-red-200 dark:border-red-900/80 bg-red-50/60 dark:bg-red-950/20 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2.5 text-red-700 dark:text-red-400">
                    <AlertTriangle className="size-5" />
                    <h3 className="text-sm font-black text-red-950 dark:text-red-200">
                      البيانات والمواصفات الإنسانية للشخص المفقود
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl bg-background p-3 border border-red-100 dark:border-red-900/50">
                      <span className="text-muted-foreground font-bold block mb-1">العمر التقديري:</span>
                      <strong className="text-sm font-extrabold text-foreground">
                        {data.age || "غير محدد"}
                      </strong>
                    </div>

                    <div className="rounded-xl bg-background p-3 border border-red-100 dark:border-red-900/50">
                      <span className="text-muted-foreground font-bold block mb-1">الجنس:</span>
                      <strong className="text-sm font-extrabold text-foreground">
                        {data.gender === "female" ? "أنثى" : data.gender === "male" ? "ذكر" : "غير محدد"}
                      </strong>
                    </div>

                    {data.clothes_description && (
                      <div className="sm:col-span-2 rounded-xl bg-background p-3 border border-red-100 dark:border-red-900/50">
                        <span className="text-muted-foreground font-bold block mb-1">
                          الملابس والمظهر وقت الاختفاء:
                        </span>
                        <p className="text-foreground font-semibold leading-relaxed">
                          {data.clothes_description}
                        </p>
                      </div>
                    )}

                    {data.health_condition && (
                      <div className="sm:col-span-2 rounded-xl bg-background p-3 border border-red-100 dark:border-red-900/50">
                        <span className="text-rose-600 dark:text-rose-400 font-bold block mb-1">
                          الحالة الصحية والنفسية (تنبيه طبي):
                        </span>
                        <p className="text-foreground font-semibold leading-relaxed">
                          {data.health_condition}
                        </p>
                      </div>
                    )}

                    {data.emergency_phone && !isResolved && (
                      <div className="sm:col-span-2 rounded-xl bg-red-600 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                        <div>
                          <span className="text-[11px] font-bold opacity-90 block">
                            هاتف الطوارئ المباشر للتواصل مع الأسرة:
                          </span>
                          <span className="text-lg font-black tracking-wider" dir="ltr">
                            {data.emergency_phone}
                          </span>
                        </div>
                        <a
                          href={`tel:${data.emergency_phone}`}
                          className="rounded-xl bg-white text-red-700 hover:bg-slate-100 px-5 py-2.5 text-xs font-black inline-flex items-center gap-2 transition shadow-xs"
                        >
                          <Phone className="size-4" /> اتصال فوري بالأسرة
                        </a>
                      </div>
                    )}

                    {isResolved && (
                      <div className="sm:col-span-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 p-3.5 text-emerald-900 dark:text-emerald-200 text-xs font-extrabold flex items-center gap-2">
                        <span>✅ تم العثور على المفقود بفضل الله وإعادته سالماً لأسرته. تم إخفاء بيانات الاتصال المباشرة حفاظاً على خصوصية العائلة.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.reward_amount && Number(data.reward_amount) > 0 ? (
                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex size-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
                      <Gift className="size-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        مكافأة مالية تحفيزية معلنة من صاحب البلاغ
                      </div>
                      <div className="text-xl font-extrabold text-amber-950 dark:text-amber-100">
                        {formatYER(Number(data.reward_amount))}
                      </div>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex rounded-full bg-amber-200 dark:bg-amber-900 px-3 py-1 text-xs font-extrabold text-amber-900 dark:text-amber-100">
                    عند الاستلام والتسليم
                  </span>
                </div>
              ) : null}
              <div className="mt-6">
                <h3 className="font-bold text-primary-dark">الوصف</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {data.description}
                </p>
              </div>

            {/* Secret Verification Mark Section (Plan 1) */}
            {data.secret_verification_mark ? (
              <div className="mt-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-background to-indigo-50/30 dark:from-indigo-950/30 dark:via-background dark:to-indigo-950/10 p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="inline-flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                        {data.type === "lost"
                          ? "العلامة المميزة السرية لإثبات الملكية"
                          : "سؤال الأمان السري للتحقق من المالك"}
                      </h4>
                      <span className="text-[10px] font-bold text-indigo-700/90 dark:text-indigo-400">
                        🔒 خاصة بك فقط — مخفية تماماً عن زوار المنصة
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSecret((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-background/90 px-3 py-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shrink-0"
                  >
                    {showSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span>{showSecret ? "إخفاء" : "إظهار"}</span>
                  </button>
                </div>

                <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-background/90 p-3 text-xs sm:text-sm font-semibold text-foreground">
                  {showSecret ? (
                    <span className="break-words font-mono text-indigo-950 dark:text-indigo-100">
                      {data.secret_verification_mark}
                    </span>
                  ) : (
                    <span className="tracking-widest text-muted-foreground font-mono">
                      ••••••••••••••••••••••••
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300 leading-relaxed font-medium">
                  💡 <strong>توجيه أمني:</strong> عندما يتواصل معك أي شخص يدعي العثور على الغرض أو يدعي ملكيته، اطلب منه ذكر تفاصيل هذه العلامة أولاً للتأكد قبل الاتفاق على التسليم في مكان عام.
                </p>
              </div>
            ) : !isOwner ? (
              <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 flex items-start gap-3">
                <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="font-bold text-foreground">إثبات الملكية الآمن:</strong> يحتفظ صاحب هذا البلاغ بعلامة مميزة سرية (أو سؤال أمان خاص) سيطلبه منك عند التواصل للتحقق من هوية المالك الحقيقي قبل تسليم الغرض.
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {(isOwner || user?.role === "ADMIN") && (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold inline-flex items-center gap-2 hover:bg-primary/90 shadow-sm transition"
                >
                  <Pencil className="size-4" /> تعديل البلاغ
                </button>
              )}
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

          {/* Sighting Community Timeline and Form (Removed and hidden when report is resolved) */}
          {isHumanitarian && !isResolved && (
            <SightingsSection
              reportId={data.id}
              initialSightings={data.sightings || []}
              isOwner={isOwner}
            />
          )}

          {isHumanitarian && isResolved && (
            <div className="mt-8 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-background to-emerald-50/30 dark:from-emerald-950/30 dark:via-background dark:to-emerald-950/20 p-6 sm:p-8 text-center space-y-3 shadow-xs">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="size-7" />
              </div>
              <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-100">
                تم العثور على المفقود بنجاح والحمد لله
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/90 dark:text-emerald-300 max-w-lg mx-auto leading-relaxed">
                بمجرد تحديث حالة البلاغ إلى «تم العثور عليه»، تم حذف وإيقاف بطاقة إفادات ومشاهدات المجتمع صوناً لخصوصية الشخص وأسرته. نتوجه بالشكر والتقدير لكل من تعاون وساند جهود البحث.
              </p>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          {(isOwner || user?.role === "ADMIN") && (
            <div className="card-soft rounded-3xl p-6 border-2 border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-primary uppercase tracking-wider">
                  إدارة البلاغ
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {user?.role === "ADMIN" && !isOwner ? "صلاحيات الإدارة" : "أنت صاحب البلاغ"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                يمكنك تحديث التفاصيل، إضافة صور جديدة، أو تغيير الحالة إلى «تم العثور عليه» لحجب الاتصال وصون الخصوصية.
              </p>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="w-full btn-gradient rounded-xl px-4 py-2.5 text-xs font-black inline-flex items-center justify-center gap-2 shadow-xs"
              >
                <Pencil className="size-4" /> تعديل بيانات وحالة البلاغ
              </button>
            </div>
          )}

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

      {isHumanitarian && (
        <MissingPosterModal
          report={data}
          isOpen={posterModalOpen}
          onClose={() => setPosterModalOpen(false)}
        />
      )}

      <EditReportModal
        report={data}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </PageShell>
  );
}
