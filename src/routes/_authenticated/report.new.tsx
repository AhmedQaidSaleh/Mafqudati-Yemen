import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback, useMemo, type DragEvent, type ChangeEvent } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import {
  Sparkles,
  UploadCloud,
  X,
  ImageIcon,
  PackageSearch,
  HandHeart,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  MapPin,
  Calendar,
  Tag as TagIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/client/api/client";
import { categoriesQuery, governoratesQuery, districtsQuery } from "@/lib/queries";
import { uploadImage, validateImage } from "@/lib/upload";
import type { ExtractedReport } from "@/types/models";

type ReportType = "lost" | "found";

export const Route = createFileRoute("/_authenticated/report/new")({
  head: () => ({ meta: [{ title: "إنشاء بلاغ جديد | مفقوداتي" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    type: (search.type === "found" ? "found" : "lost") as ReportType,
  }),
  component: NewReport,
});

const ACCEPT = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGES = 6;
const MAX_SIZE = 10 * 1024 * 1024;

type LocalImage = { id: string; file: File; url: string };
type UploadedImage = { url: string; path: string };
type Step = "describe" | "review" | "preview" | "success";

type FormState = {
  title: string;
  category_id: number | null;
  color: string;
  governorate_id: number | null;
  district_id: number | null;
  location_text: string;
  incident_date: string;
  brand: string;
  keywords: string[];
  notes: string;
  contact_preference: "in_app" | "phone" | "both";
};

function initialForm(): FormState {
  return {
    title: "",
    category_id: null,
    color: "",
    governorate_id: null,
    district_id: null,
    location_text: "",
    incident_date: new Date().toISOString().slice(0, 10),
    brand: "",
    keywords: [],
    notes: "",
    contact_preference: "in_app",
  };
}

function NewReport() {
  const { type } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [keywordInput, setKeywordInput] = useState("");
  const [newReportId, setNewReportId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: governorates } = useSuspenseQuery(governoratesQuery);
  const { data: districts } = useSuspenseQuery(districtsQuery(form.governorate_id));

  const isLost = type === "lost";
  const TypeIcon = isLost ? PackageSearch : HandHeart;
  const typeLabel = isLost ? "أبلغ عن مفقود" : "أبلغ عن معثور";
  const typeTint = isLost
    ? "bg-rose-100 text-rose-700 border-rose-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    const next: LocalImage[] = [];
    for (const f of list) {
      if (!ACCEPT.includes(f.type)) {
        toast.error(`صيغة غير مدعومة: ${f.name}`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`الصورة أكبر من 10 ميجابايت: ${f.name}`);
        continue;
      }
      next.push({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) });
    }
    setImages((prev) => {
      const merged = [...prev, ...next];
      if (merged.length > MAX_IMAGES) {
        toast.error(`الحد الأقصى ${MAX_IMAGES} صور`);
        return merged.slice(0, MAX_IMAGES);
      }
      return merged;
    });
  }, []);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };
  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const applyExtracted = (ex: ExtractedReport) => {
    const cat = ex.category_slug ? categories.find((c) => c.slug === ex.category_slug) : null;
    const gov = ex.governorate_name
      ? governorates.find((g) => g.name_ar === ex.governorate_name)
      : null;
    setForm((f) => ({
      ...f,
      title: ex.title || f.title,
      category_id: cat?.id ?? f.category_id,
      color: ex.color ?? f.color,
      governorate_id: gov?.id ?? f.governorate_id,
      district_id: null,
      location_text: ex.location_text ?? f.location_text,
      incident_date:
        ex.incident_date && /^\d{4}-\d{2}-\d{2}$/.test(ex.incident_date)
          ? ex.incident_date
          : f.incident_date,
      brand: ex.brand ?? f.brand,
      keywords: ex.keywords?.length ? ex.keywords : f.keywords,
      notes: ex.notes ?? f.notes,
    }));
  };

  const analyze = async () => {
    if (description.trim().length < 10) {
      toast.error("اكتب وصفاً أطول (10 أحرف على الأقل)");
      return;
    }
    setAnalyzing(true);
    try {
      const response = await api.post<{ extracted: ExtractedReport; fallback?: boolean }>(
        "/ai/extract",
        {
          type,
          description: description.trim(),
          categories: categories.map((c) => ({ slug: c.slug, name_ar: c.name_ar })),
          governorates: governorates.map((g) => ({ name_ar: g.name_ar })),
        },
      );
      applyExtracted(response.extracted);
      setStep("review");
      if (response.fallback) {
        toast.info("تم استخراج المعلومات الأساسية، يمكنك مراجعتها وتعديلها الآن");
      } else {
        toast.success("تم استخراج المعلومات بالذكاء الاصطناعي بنجاح");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل التحليل";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const skipAi = () => {
    if (description.trim().length < 10) {
      toast.error("اكتب وصفاً أطول أولاً");
      return;
    }
    setStep("review");
  };

  // Quality score + recommendations
  const quality = useMemo(() => {
    const rec: string[] = [];
    let score = 0;
    if (form.title.trim().length >= 4) score += 10;
    else rec.push("أضف عنواناً واضحاً");
    if (description.trim().length >= 40) score += 15;
    else rec.push("أضف وصفاً أطول وأدق");
    if (form.category_id) score += 10;
    else rec.push("اختر التصنيف");
    if (form.governorate_id) score += 10;
    else rec.push("حدد المحافظة");
    if (form.district_id || form.location_text.trim()) score += 10;
    else rec.push("حدد الموقع");
    if (form.color.trim()) score += 10;
    else rec.push("حدد اللون");
    if (form.brand.trim()) score += 10;
    else rec.push("أضف علامة مميزة");
    if (form.keywords.length >= 3) score += 10;
    else rec.push("أضف كلمات مفتاحية");
    if (images.length >= 1) score += 15;
    else rec.push("أضف صورة");
    return { score: Math.min(100, score), recommendations: rec };
  }, [form, description, images.length]);

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (!k) return;
    if (form.keywords.includes(k)) return;
    setForm((f) => ({ ...f, keywords: [...f.keywords, k].slice(0, 10) }));
    setKeywordInput("");
  };
  const removeKeyword = (k: string) =>
    setForm((f) => ({ ...f, keywords: f.keywords.filter((x) => x !== k) }));

  const goPreview = () => {
    if (!form.title.trim() || form.title.trim().length < 4) {
      toast.error("العنوان قصير جداً");
      return;
    }
    if (!form.category_id) {
      toast.error("اختر التصنيف");
      return;
    }
    if (!form.governorate_id) {
      toast.error("اختر المحافظة");
      return;
    }
    if (!form.incident_date) {
      toast.error("حدد تاريخ الحادثة");
      return;
    }
    setStep("preview");
  };

  const publish = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول");
      return;
    }
    setPublishing(true);
    try {
      // 1) Upload images
      const uploaded: UploadedImage[] = [];
      for (const img of images) {
        const err = validateImage(img.file);
        if (err) {
          toast.error(err);
          continue;
        }
        const up = await uploadImage("report-images", user.id, img.file);
        uploaded.push(up);
      }
      // 2) Insert report with images via API
      const report = await api.post<{ id: string }>("/reports", {
        type,
        title: form.title.trim(),
        description: description.trim(),
        category_id: form.category_id,
        governorate_id: form.governorate_id,
        district_id: form.district_id,
        location_text: form.location_text.trim() || null,
        color: form.color.trim() || null,
        brand: form.brand.trim() || null,
        keywords: form.keywords,
        notes: form.notes.trim() || null,
        incident_date: form.incident_date,
        contact_preference: form.contact_preference,
        status: "active",
        images: uploaded.map((u, i) => ({
          url: u.url,
          public_id: u.path,
          sort_order: i,
        })),
      });

      setNewReportId(report.id);
      setStep("success");
      toast.success(
        type === "lost"
          ? "تم نشر بلاغ المفقود بنجاح! سيبدأ نظام المطابقة بالبحث فوراً."
          : "تم نشر بلاغ المعثور عليه بنجاح! جزاك الله خيراً على أمانتك."
      );
      // cleanup previews
      images.forEach((i) => URL.revokeObjectURL(i.url));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل في إرسال البلاغ إلى الخادم";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  // ---------- Render ----------
  if (step === "success" && newReportId) {
    return (
      <PageShell
        title="تم نشر البلاغ بنجاح"
        subtitle="سيبدأ الذكاء الاصطناعي بمطابقة بلاغك مع البلاغات الأخرى تلقائياً."
      >
        <div className="mx-auto max-w-lg text-center">
          <div className="card-soft rounded-3xl p-10">
            <div className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-12" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-primary-dark">تم نشر البلاغ بنجاح</h2>
            <p className="mt-2 text-sm text-muted-foreground">شكراً لمساهمتك في مساعدة الآخرين.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/report/$id"
                params={{ id: newReportId }}
                className="btn-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold"
              >
                <Eye className="size-4" /> عرض البلاغ
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-6 py-3 text-sm font-extrabold text-primary-dark hover:bg-secondary"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="إنشاء بلاغ جديد"
      subtitle="صف ما حدث وسيقوم الذكاء الاصطناعي بتحليل المعلومات تلقائياً."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Type indicator + steps */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${typeTint}`}
          >
            <TypeIcon className="size-4" />
            {typeLabel}
          </div>
          <StepIndicator step={step} />
        </div>

        {step === "describe" && (
          <>
            <section className="card-soft rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shrink-0">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-primary-dark">
                    وصف البلاغ بالذكاء الاصطناعي
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    اكتب ما حدث بلغتك الطبيعية وسنستخرج التفاصيل تلقائياً.
                  </p>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  maxLength={2000}
                  placeholder={"مثال:\nفقدت حقيبة سوداء في صنعاء وبداخلها لابتوب."}
                  className="w-full resize-none rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                  dir="rtl"
                />
                <div className="absolute bottom-3 left-4 text-[11px] font-medium text-muted-foreground">
                  {description.length} / 2000
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={analyze}
                  disabled={analyzing}
                  className="btn-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-extrabold disabled:opacity-60"
                >
                  {analyzing ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                  {analyzing ? "جاري التحليل..." : "تحليل الوصف بالذكاء الاصطناعي"}
                </button>
                <button
                  type="button"
                  onClick={skipAi}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-6 py-4 text-sm font-bold text-primary-dark hover:bg-secondary"
                >
                  تخطي والمتابعة يدوياً
                </button>
              </div>
            </section>

            <ImagesCard
              images={images}
              dragOver={dragOver}
              setDragOver={setDragOver}
              inputRef={inputRef}
              onDrop={onDrop}
              onSelect={onSelect}
              removeImage={removeImage}
              clearAll={() => {
                images.forEach((i) => URL.revokeObjectURL(i.url));
                setImages([]);
              }}
            />
          </>
        )}

        {step === "review" && (
          <>
            <QualityCard score={quality.score} recommendations={quality.recommendations} />

            <section className="card-soft rounded-3xl p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-extrabold text-primary-dark">تفاصيل البلاغ</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="اسم المفقود / العنوان">
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: حقيبة سوداء"
                  />
                </Field>
                <Field label="التصنيف">
                  <select
                    className="input"
                    value={form.category_id ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">— اختر —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="اللون">
                  <input
                    className="input"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="أسود، أحمر..."
                  />
                </Field>
                <Field label="العلامة التجارية">
                  <input
                    className="input"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Apple، Samsung..."
                  />
                </Field>
                <Field label="المحافظة">
                  <select
                    className="input"
                    value={form.governorate_id ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        governorate_id: e.target.value ? Number(e.target.value) : null,
                        district_id: null,
                      })
                    }
                  >
                    <option value="">— اختر —</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name_ar}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="المديرية">
                  <select
                    className="input"
                    value={form.district_id ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        district_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    disabled={!form.governorate_id}
                  >
                    <option value="">— اختر —</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name_ar}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="الموقع / الحي" className="sm:col-span-2">
                  <input
                    className="input"
                    value={form.location_text}
                    onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                    placeholder="اسم الشارع أو معلم قريب"
                  />
                </Field>
                <Field label="تاريخ الحادثة">
                  <input
                    type="date"
                    className="input"
                    value={form.incident_date}
                    onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                  />
                </Field>
                <Field label="طريقة التواصل">
                  <select
                    className="input"
                    value={form.contact_preference}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact_preference: e.target.value as FormState["contact_preference"],
                      })
                    }
                  >
                    <option value="in_app">داخل التطبيق فقط</option>
                    <option value="phone">مكالمة هاتفية</option>
                    <option value="both">كلاهما</option>
                  </select>
                </Field>
                <Field label="كلمات مفتاحية" className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2 rounded-xl border-2 border-border bg-background p-2">
                    {form.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                      >
                        {k}
                        <button
                          type="button"
                          onClick={() => removeKeyword(k)}
                          className="rounded-full hover:bg-primary/20"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      className="flex-1 min-w-32 bg-transparent px-2 py-1 text-sm outline-none"
                      placeholder="أضف كلمة واضغط Enter"
                    />
                  </div>
                </Field>
                <Field label="ملاحظات إضافية" className="sm:col-span-2">
                  <textarea
                    className="input min-h-24"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="أي تفاصيل إضافية تساعد في التعرف"
                  />
                </Field>
              </div>
            </section>

            <ImagesCard
              images={images}
              dragOver={dragOver}
              setDragOver={setDragOver}
              inputRef={inputRef}
              onDrop={onDrop}
              onSelect={onSelect}
              removeImage={removeImage}
              clearAll={() => {
                images.forEach((i) => URL.revokeObjectURL(i.url));
                setImages([]);
              }}
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("describe")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-6 py-3 text-sm font-bold text-primary-dark hover:bg-secondary"
              >
                <ArrowRight className="size-4" /> رجوع
              </button>
              <button
                type="button"
                onClick={goPreview}
                className="btn-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold"
              >
                معاينة البلاغ <ArrowLeft className="size-4" />
              </button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <PreviewCard
              type={type}
              title={form.title}
              description={description}
              category={categories.find((c) => c.id === form.category_id)?.name_ar ?? null}
              governorate={governorates.find((g) => g.id === form.governorate_id)?.name_ar ?? null}
              district={districts.find((d) => d.id === form.district_id)?.name_ar ?? null}
              location={form.location_text}
              incidentDate={form.incident_date}
              keywords={form.keywords}
              images={images}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("review")}
                disabled={publishing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-6 py-3 text-sm font-bold text-primary-dark hover:bg-secondary disabled:opacity-60"
              >
                <ArrowRight className="size-4" /> رجوع
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={publishing}
                className="btn-gradient inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold disabled:opacity-60"
              >
                {publishing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {publishing ? "جاري النشر..." : "نشر البلاغ"}
              </button>
            </div>
          </>
        )}

        <div className="text-center">
          <Link
            to="/report/new"
            search={{ type: isLost ? "found" : "lost" } as never}
            className="text-xs font-semibold text-primary hover:underline"
          >
            تغيير نوع البلاغ
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "describe", label: "الوصف" },
    { key: "review", label: "المراجعة" },
    { key: "preview", label: "المعاينة" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`inline-flex size-7 items-center justify-center rounded-full text-[11px] font-extrabold ${i <= idx ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs font-bold ${i <= idx ? "text-primary-dark" : "text-muted-foreground"}`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`h-px w-6 ${i < idx ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-primary-dark">{label}</span>
      {children}
    </label>
  );
}

function QualityCard({ score, recommendations }: { score: number; recommendations: string[] }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  const bar = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
  const label = score >= 80 ? "ممتاز" : score >= 50 ? "جيد" : "يحتاج تحسيناً";
  return (
    <section className="card-soft rounded-3xl p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-muted-foreground">جودة البلاغ</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold ${color}`}>{score}</span>
            <span className="text-sm font-bold text-muted-foreground">/ 100</span>
            <span className={`ms-2 text-xs font-extrabold ${color}`}>{label}</span>
          </div>
        </div>
        <div
          className={`inline-flex size-14 items-center justify-center rounded-2xl ${score >= 80 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
        >
          {score >= 80 ? <CheckCircle2 className="size-7" /> : <AlertCircle className="size-7" />}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full ${bar} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      {recommendations.length > 0 && (
        <div className="mt-5">
          <div className="text-xs font-extrabold text-primary-dark">توصيات لتحسين البلاغ:</div>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {recommendations.map((r) => (
              <li
                key={r}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-semibold text-primary-dark"
              >
                <AlertCircle className="size-3.5 text-amber-500" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ImagesCard({
  images,
  dragOver,
  setDragOver,
  inputRef,
  onDrop,
  onSelect,
  removeImage,
  clearAll,
}: {
  images: LocalImage[];
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  removeImage: (id: string) => void;
  clearAll: () => void;
}) {
  return (
    <section className="card-soft rounded-3xl p-6 sm:p-8 space-y-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary shrink-0">
          <ImageIcon className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-primary-dark">إضافة الصور</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            ارفق صوراً واضحة — حتى {MAX_IMAGES} صور، 10 ميجابايت لكل صورة.
          </p>
        </div>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition ${dragOver ? "border-primary bg-primary/5" : "border-border bg-secondary/40 hover:bg-secondary/60 hover:border-primary/40"}`}
      >
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
          <UploadCloud className="size-7" />
        </div>
        <div className="space-y-1">
          <div className="text-base font-extrabold text-primary-dark">اسحب وأفلت الصور هنا</div>
          <div className="text-sm text-muted-foreground">
            أو <span className="text-primary font-bold">اختر من جهازك</span>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">JPG • PNG • WEBP — حتى 10 ميجابايت</div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          className="hidden"
          onChange={onSelect}
        />
      </div>
      {images.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-primary-dark">
              الصور المرفقة ({images.length}/{MAX_IMAGES})
            </div>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-destructive hover:underline"
            >
              حذف الكل
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-border bg-secondary"
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="حذف الصورة"
                  className="absolute top-2 end-2 inline-flex size-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition hover:bg-black group-hover:opacity-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PreviewCard({
  type,
  title,
  description,
  category,
  governorate,
  district,
  location,
  incidentDate,
  keywords,
  images,
}: {
  type: ReportType;
  title: string;
  description: string;
  category: string | null;
  governorate: string | null;
  district: string | null;
  location: string;
  incidentDate: string;
  keywords: string[];
  images: LocalImage[];
}) {
  const loc = [governorate, district, location].filter(Boolean).join(" - ");
  return (
    <section className="card-soft overflow-hidden rounded-3xl">
      <div className="border-b border-border bg-secondary/50 px-6 py-3 text-xs font-extrabold text-primary-dark">
        معاينة البلاغ قبل النشر
      </div>
      {images.length > 0 && (
        <div className="grid gap-2 border-b border-border bg-secondary/30 p-4 sm:grid-cols-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className={`overflow-hidden rounded-2xl bg-secondary ${i === 0 ? "sm:col-span-3 aspect-[16/9]" : "aspect-square"}`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${type === "lost" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            {type === "lost" ? "مفقود" : "معثور"}
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold text-orange-700">
            🟠 جديد
          </span>
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              <TagIcon className="size-3" /> {category}
            </span>
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-primary-dark">{title || "بدون عنوان"}</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {loc && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-primary" /> {loc}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5 text-primary" /> {incidentDate}
          </span>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-primary-dark"
              >
                #{k}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
