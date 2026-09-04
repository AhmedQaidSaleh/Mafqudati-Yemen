import { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import type { Report } from "@/types/models";

interface MissingPosterModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
}

export function MissingPosterModal({ report, isOpen, onClose }: MissingPosterModalProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const reportUrl = `${window.location.origin}/report/${report.id}`;
      QRCode.toDataURL(reportUrl, { width: 180, margin: 1 })
        .then(setQrUrl)
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [isOpen, report.id]);

  if (!isOpen) return null;

  const primaryImage = report.report_images?.[0]?.url;
  const locationString = [
    report.governorates?.name_ar,
    report.districts?.name_ar || report.city,
    report.location_text,
  ]
    .filter(Boolean)
    .join(" - ");

  const emergencyPhone = report.emergency_phone || report.profile?.phone || "يرجى التواصل عبر المنصة";

  const handlePrint = () => {
    window.print();
  };

  const isResolved = report.status === "resolved";

  const copyWhatsAppText = async () => {
    const reportUrl = `${window.location.origin}/report/${report.id}`;
    const text = isResolved
      ? `✅ *بشرى سارة • تم العثور على المفقود بنجاح* ✅
━━━━━━━━━━━━━━━━━━━━
🎉 نود إحاطتكم علماً بأنه قد تم بحمد الله وتوفيقه العثور على:
⚠️ *الاسم:* ${report.title}
📍 *المنطقة:* ${locationString || "الجمهورية اليمنية"}
━━━━━━━━━━━━━━━━━━━━
نرجو التكرم بوقف وتجميد التعميم والمشاركة، ونتقدم بخالص الشكر والتقدير لكل من ساهم بنشر البلاغ أو تقديم إفادة. كتب الله أجركم جميعاً!`
      : `🚨 *نداء إنساني عاجل • إعلان بحث عن مفقود* 🚨
━━━━━━━━━━━━━━━━━━━━
⚠️ *الاسم:* ${report.title}
👤 *العمر / الجنس:* ${report.age || "غير محدد"} • ${report.gender === "female" ? "أنثى" : report.gender === "male" ? "ذكر" : "غير محدد"}
📍 *مكان وتاريخ الاختفاء:* ${locationString || "الجمهورية اليمنية"} • ${report.incident_date || "مؤخراً"}
👕 *مواصفات الملابس:* ${report.clothes_description || "غير محدد"}
🩺 *الحالة الصحية:* ${report.health_condition || "سليم"}
━━━━━━━━━━━━━━━━━━━━
📞 *للتواصل والإبلاغ العاجل مع الأسرة:* ${emergencyPhone}
🌐 *رابط البلاغ المباشر وتحديثات المشاهدات:*
${reportUrl}

ساهم معنا بنشر هذا البلاغ في المجموعات، قد تكون سبباً في لمّ شمل أسرة ملهوفة. جزى الله الجميع خيراً.`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("تم نسخ نص البلاغ للواتساب بنجاح! يمكنك لصقه في المجموعات.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("تعذر نسخ النص");
    }
  };

  const shareNative = async () => {
    const reportUrl = `${window.location.origin}/report/${report.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `نداء إنساني عاجل: ${report.title}`,
          text: `نداء إنساني للبحث عن المفقود: ${report.title} في ${locationString}. ساعدنا في العثور عليه.`,
          url: reportUrl,
        });
      } catch {
        // user aborted
      }
    } else {
      copyWhatsAppText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-background border-2 border-border shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <h3 className="text-base font-extrabold text-foreground">
              ملصق البحث والنداء الإنساني (جاهز للطباعة والمشاركة)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Printable Poster Container */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
          <div
            ref={posterRef}
            id="printable-missing-poster"
            className={`rounded-2xl border-4 ${isResolved ? "border-emerald-600" : "border-red-600"} bg-white text-slate-900 p-6 sm:p-8 shadow-md space-y-6`}
          >
            {/* Poster Header */}
            <div className={`border-b-4 ${isResolved ? "border-emerald-600" : "border-red-600"} pb-4 text-center space-y-2`}>
              {isResolved ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-1 text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  <CheckCircle2 className="size-4" /> تم العثور على المفقود • شكراً لتعاونكم
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-1 text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  <AlertTriangle className="size-4" /> نداء إنساني عاجل • يرجى التعميم
                </div>
              )}
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isResolved ? "text-emerald-700" : "text-red-600"}`}>
                {isResolved ? "تم العثور على المفقود بنجاح" : "إعـــلان بـحـث عـن مـفـقـود"}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-600">
                الجمهورية اليمنية • شبكة الإبلاغ الإنساني عبر منصة مفقوداتي
              </p>
            </div>

            {/* Main Details Grid */}
            <div className="grid gap-6 sm:grid-cols-2 items-center">
              {/* Image Section */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative aspect-[3/4] w-full max-w-[240px] overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-100 shadow-inner">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={report.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-slate-400">
                      <HeartHandshake className="size-16 mb-2 text-red-400" />
                      <span className="text-xs font-bold text-slate-500">لا تتوفر صورة فوتوغرافية</span>
                    </div>
                  )}
                </div>
                <span className="mt-2 text-[11px] font-extrabold text-slate-500">
                  صورة المفقود وقت الإبلاغ
                </span>
              </div>

              {/* Data attributes list */}
              <div className="space-y-3.5 text-sm">
                <div className="rounded-xl bg-red-50 p-3 border border-red-200">
                  <span className="text-xs font-bold text-red-700 block">اسم الشخص المفقود:</span>
                  <strong className="text-lg font-black text-red-950">{report.title}</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-100 p-2.5">
                    <span className="text-slate-500 font-bold block">العمر:</span>
                    <strong className="text-slate-900 text-sm font-extrabold">
                      {report.age || "غير محدد"}
                    </strong>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-2.5">
                    <span className="text-slate-500 font-bold block">الجنس:</span>
                    <strong className="text-slate-900 text-sm font-extrabold">
                      {report.gender === "female" ? "أنثى" : report.gender === "male" ? "ذكر" : "غير محدد"}
                    </strong>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-100 p-2.5 text-xs">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <MapPin className="size-3 text-red-600" /> آخر مكان شوهد فيه:
                  </span>
                  <strong className="text-slate-900 block mt-1">{locationString || "الجمهورية اليمنية"}</strong>
                </div>

                <div className="rounded-lg bg-slate-100 p-2.5 text-xs">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <Calendar className="size-3 text-red-600" /> تاريخ الفقدان:
                  </span>
                  <strong className="text-slate-900 block mt-1">{report.incident_date || "مؤخراً"}</strong>
                </div>
              </div>
            </div>

            {/* Additional Critical Info */}
            <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
              {report.clothes_description && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3">
                  <strong className="text-amber-900 font-extrabold block mb-1">
                    👕 الملابس والمظهر وقت الاختفاء:
                  </strong>
                  <p className="text-slate-800">{report.clothes_description}</p>
                </div>
              )}

              {report.health_condition && (
                <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-3">
                  <strong className="text-rose-900 font-extrabold block mb-1">
                    🩺 الحالة الصحية / النفسية:
                  </strong>
                  <p className="text-slate-800">{report.health_condition}</p>
                </div>
              )}

              {report.description && (
                <div className="p-2">
                  <strong className="text-slate-700 font-bold block mb-1">تفاصيل إضافية:</strong>
                  <p className="text-slate-600 leading-relaxed text-[11px] line-clamp-3">
                    {report.description}
                  </p>
                </div>
              )}
            </div>

            {/* Emergency Contact & QR Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-4 border-red-600 pt-4 bg-slate-50 p-4 rounded-xl">
              <div className="space-y-1 text-center sm:text-start">
                <span className="text-xs font-black text-red-600 block">
                  📞 في حال التعرف عليه أو مشاهدته يرجى الاتصال فوراً:
                </span>
                <a
                  href={`tel:${emergencyPhone}`}
                  className="text-xl sm:text-2xl font-black text-slate-950 tracking-wider hover:underline inline-flex items-center gap-2"
                  dir="ltr"
                >
                  <Phone className="size-5 text-red-600 fill-red-600" />
                  {emergencyPhone}
                </a>
                <p className="text-[10px] text-slate-500">
                  أو إبلاغ أقرب قسم شرطة، كما يمكنك تسجيل مشاهدة مباشرة عبر مسح الرمز.
                </p>
              </div>

              {qrUrl && (
                <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-300 shadow-sm shrink-0">
                  <img src={qrUrl} alt="QR Code" className="size-24 object-contain" />
                  <span className="text-[9px] font-bold text-slate-600 mt-1">
                    امسح للتحديث والمشاهدة
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-bold hover:opacity-90 transition shadow-sm"
            >
              <Printer className="size-4" /> طباعة الملصق (A4 / PDF)
            </button>
            <button
              type="button"
              onClick={copyWhatsAppText}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "تم النسخ!" : "نسخ نص البلاغ للواتساب"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shareNative}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary transition"
            >
              <Share2 className="size-4" /> مشاركة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
