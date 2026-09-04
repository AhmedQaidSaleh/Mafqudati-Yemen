import { useState } from "react";
import { Eye, MapPin, Clock, Send, AlertCircle, CheckCircle2, User, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/client/api/client";
import { timeAgo } from "@/lib/format";
import type { ReportSighting } from "@/types/models";
import { useAuth } from "@/lib/auth";

interface SightingsSectionProps {
  reportId: string;
  initialSightings?: ReportSighting[];
  isOwner?: boolean;
}

export function SightingsSection({ reportId, initialSightings = [], isOwner }: SightingsSectionProps) {
  const { user } = useAuth();
  const [sightings, setSightings] = useState<ReportSighting[]>(initialSightings);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [locationText, setLocationText] = useState("");
  const [sightingTime, setSightingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [reporterName, setReporterName] = useState(user?.name || "");
  const [reporterPhone, setReporterPhone] = useState(user?.phone || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationText.trim()) {
      toast.error("يرجى تحديد مكان المشاهدة بدقة");
      return;
    }
    if (!notes.trim()) {
      toast.error("يرجى كتابة تفاصيل المشاهدة وأوصاف الشخص");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post<ReportSighting>(`/reports/${reportId}/sightings`, {
        location_text: locationText.trim(),
        sighting_time: sightingTime.trim() || "حديثاً",
        notes: notes.trim(),
        reporter_name: reporterName.trim() || (user?.name ?? "فاعل خير"),
        reporter_phone: reporterPhone.trim() || null,
      });

      setSightings((prev) => [response, ...prev]);
      setShowForm(false);
      setLocationText("");
      setSightingTime("");
      setNotes("");
      toast.success("جزاك الله خيراً! تم تسجيل إفادة المشاهدة وإشعار أسرة المفقود فوراً.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل تسجيل المشاهدة";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 rounded-3xl border-2 border-rose-200 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/50 via-background to-rose-50/20 dark:from-rose-950/20 dark:via-background dark:to-rose-950/10 p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm shrink-0">
            <Eye className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-rose-950 dark:text-rose-200">
                إفادات ومشاهدات المجتمع
              </h3>
              <span className="rounded-full bg-rose-200/80 dark:bg-rose-900/60 px-2.5 py-0.5 text-xs font-black text-rose-900 dark:text-rose-100">
                {sightings.length} إفادة
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              إذا لمحت هذا الشخص في أي حي أو سوق، سجل إفادتك لمساعدة أسرته
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition shadow-sm shrink-0 ${
            showForm
              ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
              : "bg-rose-600 hover:bg-rose-700 text-white"
          }`}
        >
          <Eye className="size-4" />
          {showForm ? "إلغاء النموذج" : "هل شاهدته؟ أبلغ هنا"}
        </button>
      </div>

      {/* Sighting Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-background p-5 sm:p-6 space-y-4 shadow-md animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
            <AlertCircle className="size-4" />
            <span>تسجيل إفادة مشاهدة جديدة (ستصل فوراً إلى ذوي المفقود):</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-extrabold text-foreground flex items-center gap-1">
                <MapPin className="size-3.5 text-rose-600" /> أين شاهدته بالضبط؟ *
              </label>
              <input
                type="text"
                required
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="مثال: صنعاء - شارع تعز بالقرب من جولة 45، أمام الصيدلية..."
                className="input text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-foreground flex items-center gap-1">
                <Clock className="size-3.5 text-rose-600" /> متى شاهدته؟
              </label>
              <input
                type="text"
                value={sightingTime}
                onChange={(e) => setSightingTime(e.target.value)}
                placeholder="مثال: اليوم الساعة 4 عصراً، أو أمس صباحاً..."
                className="input text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-foreground flex items-center gap-1">
                <Phone className="size-3.5 text-rose-600" /> رقم هاتفك للتواصل معك (اختياري)
              </label>
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="رقم هاتفك إن رغبت بالتواصل المباشر..."
                className="input text-xs sm:text-sm"
                dir="ltr"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-extrabold text-foreground">
                ماذا كان يرتدي أو ماذا لاحظت؟ تفاصيل المشاهدة *
              </label>
              <textarea
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: كان يمشي بمفرده بالقرب من المسجد، يرتدي قميصاً رمادياً ويبدو عليه التعب والإرهاق..."
                className="input text-xs sm:text-sm min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-[11px] text-muted-foreground">
              شهادتك أمانة قد تنقذ حياة وتجمع عائلة.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-black transition disabled:opacity-50 shadow-sm"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {submitting ? "جاري الإرسال..." : "إرسال الإفادة العاجلة"}
            </button>
          </div>
        </form>
      )}

      {/* Sightings List */}
      <div className="space-y-3">
        {sightings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rose-200 dark:border-rose-900 bg-background/60 p-6 text-center text-xs text-muted-foreground">
            لا توجد إفادات مشاهدة مسجلة حتى الآن. إذا رأيت هذا الشخص أو لديك أي معلومة مؤكدة، يرجى المبادرة بالتسجيل.
          </div>
        ) : (
          sightings.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-border bg-background p-4 space-y-2 shadow-xs transition hover:border-rose-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-[11px]">
                    <User className="size-3.5" />
                  </span>
                  <span className="font-extrabold text-foreground">
                    {s.reporter_name || "مواطن متعاون"}
                  </span>
                  {s.sighting_time && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground font-semibold">
                      توقيت: {s.sighting_time}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> {timeAgo(s.created_at)}
                </span>
              </div>

              <div className="flex items-start gap-1.5 text-xs font-bold text-rose-900 dark:text-rose-300">
                <MapPin className="size-3.5 shrink-0 mt-0.5 text-rose-600" />
                <span>المكان: {s.location_text}</span>
              </div>

              <p className="rounded-xl bg-secondary/50 p-3 text-xs text-foreground leading-relaxed">
                {s.notes}
              </p>

              {isOwner && s.reporter_phone && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200 dark:border-indigo-900/60">
                  <Phone className="size-3" />
                  <span>رقم الشاهد للتواصل (مرئي لك فقط):</span>
                  <a href={`tel:${s.reporter_phone}`} className="underline font-mono" dir="ltr">
                    {s.reporter_phone}
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
