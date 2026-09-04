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
  AlertTriangle,
  Eye,
  MapPin,
  Calendar,
  Tag as TagIcon,
  Gift,
  ShieldCheck,
  Lock,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { formatYER } from "@/lib/format";
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
  incident_time: string;
  brand: string;
  keywords: string[];
  notes: string;
  secret_verification_mark: string;
  reward_amount: number | null;
  contact_preference: "in_app" | "phone" | "both";
  is_humanitarian: boolean;
  human_category: "child" | "elderly" | "youth" | "";
  age: string;
  gender: string;
  clothes_description: string;
  speech_manner: string;
  health_status_quick: string;
  health_condition: string;
  special_instructions: string;
  emergency_phone: string;
  alt_emergency_phone: string;
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
    secret_verification_mark: "",
    reward_amount: null,
    contact_preference: "in_app",
    is_humanitarian: false,
    human_category: "",
    age: "",
    gender: "",
    clothes_description: "",
    speech_manner: "",
    health_status_quick: "",
    health_condition: "",
    special_instructions: "",
    emergency_phone: "",
    alt_emergency_phone: "",
    incident_time: "",
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
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [newReportId, setNewReportId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: governorates } = useSuspenseQuery(governoratesQuery);
  const { data: districts } = useSuspenseQuery(districtsQuery(form.governorate_id));

  const selectedCategory = categories.find((c) => c.id === form.category_id);
  const isHumanitarian = Boolean(
    form.is_humanitarian ||
    form.category_id === 9 ||
    selectedCategory?.slug === "missing-persons" ||
    selectedCategory?.name_ar?.includes("مفقودين") ||
    selectedCategory?.name_ar?.includes("إنساني")
  );

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
    else rec.push("أضف علامة تجارية أو طراز");
    if (form.secret_verification_mark.trim()) score += 10;
    else rec.push(type === "lost" ? "أضف علامة سرية لحماية ملكيتك" : "أضف سؤال أمان للتحقق من المالك");
    if (form.keywords.length >= 3) score += 10;
    else rec.push("أضف كلمات مفتاحية");
    if (images.length >= 1) score += 15;
    else rec.push("أضف صورة");
    return { score: Math.min(100, score), recommendations: rec };
  }, [form, description, images.length, type]);

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
        secret_verification_mark: form.secret_verification_mark.trim() || null,
        reward_amount: isLost && form.reward_amount ? Number(form.reward_amount) : null,
        incident_date: form.incident_date,
        contact_preference: form.contact_preference,
        status: "active",
        is_humanitarian: isHumanitarian,
        age: isHumanitarian ? form.age.trim() || null : null,
        gender: isHumanitarian ? form.gender.trim() || null : null,
        clothes_description: isHumanitarian ? form.clothes_description.trim() || null : null,
        health_condition: isHumanitarian ? 
          [form.health_status_quick, form.health_condition].filter(Boolean).join(" - ") || null : null,
        emergency_phone: isHumanitarian ? 
          [form.emergency_phone.trim(), form.alt_emergency_phone.trim()].filter(Boolean).join(" / ") || null : null,
        notes: isHumanitarian ? 
          [`الفئة: ${form.human_category}`, 
           `التخاطب: ${form.speech_manner}`, 
           `تعليمات خاصة: ${form.special_instructions}`,
           `وقت الاختفاء: ${form.incident_time}`].filter(s => !s.endsWith("undefined") && !s.endsWith(":") && s.trim().length > 10).join("\n") 
          : (form.notes.trim() || null),
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

            {form.secret_verification_mark ? (
              <div className="mt-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 p-5 text-start space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                  <ShieldCheck className="size-5 text-indigo-600 dark:text-indigo-400" />
                  <span>خطوتك التالية للتسليم والاستلام الآمن:</span>
                </div>
                <ul className="text-xs text-indigo-900/85 dark:text-indigo-300 space-y-1.5 list-disc list-inside leading-relaxed font-medium">
                  <li>
                    عندما يتواصل معك أي شخص، اطلب منه ذكر تفاصيل <strong>العلامة المميزة السرية</strong> أولاً للتأكد من صدقه.
                  </li>
                  <li>
                    علامتك السرية محفوظة في تفاصيل بلاغك بحسابك فقط، ولن يراها أي زائر للمنصة.
                  </li>
                  <li>
                    احرص على ألا يتم التسليم أو الاستلام إلا في <strong>مكان عام ومضاء</strong> ومعروف.
                  </li>
                </ul>
              </div>
            ) : null}

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
            {/* Humanitarian Fast Switcher */}
            <div
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  is_humanitarian: true,
                  category_id: 9,
                }));
                toast.info("تم تفعيل نمط البلاغات الإنسانية الطارئة للمفقودين");
              }}
              className={`cursor-pointer rounded-2xl border-2 p-4 transition flex items-center justify-between gap-3 ${
                isHumanitarian
                  ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200 shadow-sm"
                  : "border-red-200 dark:border-red-900/40 bg-gradient-to-r from-red-50/60 to-amber-50/40 dark:from-red-950/20 dark:to-amber-950/10 hover:border-red-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                </span>
                <div>
                  <div className="text-xs font-black text-red-950 dark:text-red-100 flex items-center gap-1.5">
                    <span>هل تبلّغ عن شخص أو طفل أو مسن مفقود؟</span>
                    <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      نداء إنساني طارئ
                    </span>
                  </div>
                  <div className="text-[11px] text-red-900/80 dark:text-red-300 mt-0.5">
                    اضغط هنا لتفعيل ميزات ملصق البحث المجتمعي، ومحددات العمر، وتنبيهات الخريطة العاجلة.
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-xs font-black text-red-700 dark:text-red-400 bg-white dark:bg-card border border-red-200 dark:border-red-900/60 px-3 py-1.5 rounded-xl shadow-xs">
                {isHumanitarian ? "✓ نمط طارئ مفعّل" : "تفعيل النمط"}
              </div>
            </div>

            {!isHumanitarian ? (
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
            ) : (
              <section className="card-soft rounded-3xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 p-6 sm:p-8 space-y-8">
                {/* 1. Identity & Biometrics */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><AlertCircle className="size-4"/></span>
                    بطاقة الهوية والبيانات الحيوية
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="الاسم الكامل أو اللقب المعروف به *">
                      <input
                        className="input"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="اسم المفقود..."
                      />
                    </Field>
                    <Field label="العمر التقريبي بالسنوات *">
                      <input
                        type="number"
                        className="input"
                        value={form.age}
                        onChange={(e) => setForm({ ...form, age: e.target.value })}
                        placeholder="مثال: 12"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black text-foreground">الفئة والجنس *</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "child_m", label: "طفل", cat: "child", gender: "male" },
                          { id: "child_f", label: "طفلة", cat: "child", gender: "female" },
                          { id: "youth_m", label: "شاب", cat: "youth", gender: "male" },
                          { id: "youth_f", label: "شابة", cat: "youth", gender: "female" },
                          { id: "elderly_m", label: "مسن", cat: "elderly", gender: "male" },
                          { id: "elderly_f", label: "مسنة", cat: "elderly", gender: "female" },
                        ].map((btn) => {
                          const isActive = form.human_category === btn.cat && form.gender === btn.gender;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => setForm({ ...form, human_category: btn.cat as any, gender: btn.gender })}
                              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                                isActive
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-border bg-background text-muted-foreground hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Appearance & Speech */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><Eye className="size-4"/></span>
                    بطاقة المظهر وقت الاختفاء
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="الملابس التي كان يرتديها وقت الخروج *">
                        <textarea
                          rows={2}
                          className="input"
                          value={form.clothes_description}
                          onChange={(e) => setForm({ ...form, clothes_description: e.target.value })}
                          placeholder="لون الثوب، الشال، الحذاء..."
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black text-foreground">اللغة وطريقة التخاطب</label>
                      <div className="flex flex-wrap gap-2">
                        {["ينطق بطلاقة", "تلعثم / ثقل باللسان", "لا يتكلم / أبكم", "لغة إشارة", "غير معروف"].map((manner) => (
                          <button
                            key={manner}
                            type="button"
                            onClick={() => setForm({ ...form, speech_manner: manner })}
                            className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${
                              form.speech_manner === manner
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {manner}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Medical & Psychological Alert */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><HandHeart className="size-4"/></span>
                    البطاقة الطبية والحالة الصحية
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black text-foreground">الحالة الصحية (خيارات سريعة)</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {["سليم صحياً", "زهايمر / فقدان ذاكرة", "طيف توحد", "سكري / يحتاج علاج", "اضطراب نفسي"].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setForm({ ...form, health_status_quick: h })}
                            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                              form.health_status_quick === h
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-border bg-background text-muted-foreground hover:bg-rose-50"
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                      <Field label="تفاصيل طبية أخرى (إن وجدت)">
                        <input
                          className="input"
                          value={form.health_condition}
                          onChange={(e) => setForm({ ...form, health_condition: e.target.value })}
                          placeholder="أي تفاصيل مهمة..."
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="تعليمات خاصة عند العثور عليه">
                        <textarea
                          rows={2}
                          className="input"
                          value={form.special_instructions}
                          onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                          placeholder="كيفية تهدئته، التعامل معه، أو ما يجب تجنبه..."
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* 4. Time, Location & Emergency */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><MapPin className="size-4"/></span>
                    زمان ومكان الفقدان وأرقام الطوارئ
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="المحافظة *">
                      <select
                        className="input"
                        value={form.governorate_id ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, governorate_id: e.target.value ? Number(e.target.value) : null })
                        }
                      >
                        <option value="">— اختر المحافظة —</option>
                        {governorates.map((g) => (
                          <option key={g.id} value={g.id}>{g.name_ar}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="المديرية *">
                      <select
                        className="input"
                        value={form.district_id ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, district_id: e.target.value ? Number(e.target.value) : null })
                        }
                      >
                        <option value="">— اختر المديرية —</option>
                        {districts?.map((d) => (
                          <option key={d.id} value={d.id}>{d.name_ar}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="اسم الشارع / الحي / أقرب معلم بدقة *">
                        <input
                          className="input"
                          value={form.location_text}
                          onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                          placeholder="مثال: جولة كذا، بجوار مستشفى كذا..."
                        />
                      </Field>
                    </div>
                    <Field label="تاريخ الاختفاء *">
                      <input
                        type="date"
                        className="input"
                        value={form.incident_date}
                        onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                      />
                    </Field>
                    <Field label="ساعة الاختفاء (تقريبية)">
                      <input
                        type="time"
                        className="input"
                        value={form.incident_time}
                        onChange={(e) => setForm({ ...form, incident_time: e.target.value })}
                      />
                    </Field>
                    <Field label="رقم هاتف الطوارئ الأساسي *">
                      <input
                        type="tel"
                        dir="ltr"
                        className="input font-mono"
                        value={form.emergency_phone}
                        onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                        placeholder="770000000"
                      />
                    </Field>
                    <Field label="رقم هاتف بديل">
                      <input
                        type="tel"
                        dir="ltr"
                        className="input font-mono"
                        value={form.alt_emergency_phone}
                        onChange={(e) => setForm({ ...form, alt_emergency_phone: e.target.value })}
                        placeholder="710000000"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Skip describing and go straight to review for Humanitarian
                      setStep("review");
                    }}
                    className="btn-primary inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-extrabold"
                  >
                    متابعة <ArrowLeft className="size-4" />
                  </button>
                </div>
              </section>
            )}

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

              {/* Secret Verification Mark Section (Plan 1) */}
              {!isHumanitarian && (
              <div className="mt-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/70 bg-gradient-to-br from-indigo-50/70 via-background to-indigo-50/30 dark:from-indigo-950/30 dark:via-background dark:to-indigo-950/10 p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shrink-0 shadow-sm">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                          {isLost
                            ? "العلامة المميزة السرية (لإثبات ملكيتك)"
                            : "سؤال الأمان السري (للتحقق من هوية المالك)"}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/80 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-800 dark:text-indigo-300">
                          <Lock className="size-3" /> سرية لن تظهر للعامة
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-indigo-900/80 dark:text-indigo-300 leading-relaxed max-w-2xl">
                        {isLost
                          ? "اكتب هنا تفصيلاً دقيقاً في غرضك المفقود لا تذكره في الوصف العام ولا بالصور. سيبقى هذا التفصيل محفوظاً في حسابك فقط، لتطلبه لاحقاً ممن يدعي أنه وجده للتأكد من صدقه قبل التسليم."
                          : "اكتب هنا سؤالاً أو تفصيلاً دقيقاً ستسأل عنه المتصل للتأكد أنه صاحبه الحقيقي (مثل: ما لون البطانة الداخلية، أو علامة خفية لا تظهر بالصور). هذه المعلومة سرية لحمايتك من مدعي الملكية بالباطل."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSecretInput((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-background/80 px-2.5 py-1 text-xs font-bold text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shrink-0"
                    title={showSecretInput ? "إخفاء النص" : "إظهار النص"}
                  >
                    {showSecretInput ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span className="hidden sm:inline">{showSecretInput ? "إخفاء" : "إظهار"}</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={form.secret_verification_mark}
                      onChange={(e) =>
                        setForm({ ...form, secret_verification_mark: e.target.value })
                      }
                      placeholder={
                        isLost
                          ? "مثال: خدش دقيق خلف الكاميرا، كرت أو ورقة معينة في الجيب السري، أو صورة شاشة القفل..."
                          : "مثال: سأسأله عن لون البطانة الداخلية للمحفظة، أو اسم البطاقة البنكية بداخلها..."
                      }
                      className={`w-full resize-none rounded-2xl border-2 border-indigo-200/90 dark:border-indigo-800/80 bg-background p-3.5 pe-11 text-xs sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-medium ${
                        !showSecretInput && form.secret_verification_mark
                          ? "font-mono tracking-wider"
                          : ""
                      }`}
                      dir="rtl"
                    />
                    <div className="absolute top-3 end-3 text-indigo-400 pointer-events-none">
                      <KeyRound className="size-4" />
                    </div>
                  </div>

                  {/* Suggestions pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-900/70 dark:text-indigo-400 ms-1">
                      أفكار مقترحة:
                    </span>
                    {(isLost
                      ? [
                          "خدش أو علامة خفية",
                          "كرت أو ورقة بالجيب الداخلي",
                          "صورة شاشة القفل",
                          "رقم أو نقش مميز",
                          "لون البطانة الداخلية",
                        ]
                      : [
                          "ما لون البطانة الداخلية؟",
                          "ما نوع البطاقة بداخلها؟",
                          "ما هي الميدالية المرفقة؟",
                          "اذكر تفصيلاً غير ظاهر بالصورة",
                        ]
                    ).map((tip) => (
                      <button
                        key={tip}
                        type="button"
                        onClick={() => {
                          const cur = form.secret_verification_mark.trim();
                          setForm({
                            ...form,
                            secret_verification_mark: cur ? `${cur} - ${tip}` : tip,
                          });
                        }}
                        className="rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-background/90 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 px-2.5 py-1 text-[11px] font-bold text-indigo-900 dark:text-indigo-300 transition"
                      >
                        + {tip}
                      </button>
                    ))}
                    {form.secret_verification_mark ? (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, secret_verification_mark: "" })}
                        className="rounded-xl px-2 py-1 text-[11px] font-bold text-destructive hover:bg-destructive/10 transition"
                      >
                        مسح
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              )}

              {isLost && (
                <div className="mt-6 rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-sm">
                      <Gift className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-300">
                          مكافأة مالية تحفيزية (اختياري)
                        </h3>
                        <span className="rounded-full bg-amber-200 dark:bg-amber-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                          يزيد فرصة العثور
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-400 leading-relaxed">
                        تحديد مكافأة مالية لمن يعثر على غرضك ويسلمه إليك. تظهر كشارة مميزة على بطاقة البلاغ لجذب اهتمام الباحثين.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                        مبلغ المكافأة (بالريال اليمني)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={form.reward_amount ?? ""}
                          onChange={(e) => {
                            const val = e.target.value ? Math.max(0, Number(e.target.value)) : null;
                            setForm({ ...form, reward_amount: val });
                          }}
                          placeholder="مثال: 20000"
                          className="input pe-14 font-mono font-bold text-primary-dark"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                          ر.ي
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                        مبالغ سريعة مقترحة:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setForm({ ...form, reward_amount: amt })}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              form.reward_amount === amt
                                ? "bg-amber-500 text-white shadow-sm"
                                : "bg-background/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {amt >= 1000 ? `${amt / 1000} ألف` : amt}
                          </button>
                        ))}
                        {form.reward_amount ? (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, reward_amount: null })}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/10 transition"
                          >
                            إلغاء
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {form.reward_amount ? (
                    <div className="flex items-center gap-2 pt-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <span>المكافأة المحددة:</span>
                      <span className="rounded-md bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 font-extrabold text-amber-900 dark:text-amber-100">
                        {formatYER(form.reward_amount)}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
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
              secretVerificationMark={form.secret_verification_mark}
              rewardAmount={form.reward_amount}
              images={images}
              isHumanitarian={isHumanitarian}
              age={form.age}
              gender={form.gender}
              clothesDescription={form.clothes_description}
              healthCondition={form.health_condition}
              emergencyPhone={form.emergency_phone}
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
  incidentTime,
  keywords,
  secretVerificationMark,
  rewardAmount,
  images,
  isHumanitarian,
  humanCategory,
  age,
  gender,
  clothesDescription,
  speechManner,
  healthCondition,
  specialInstructions,
  emergencyPhone,
  altEmergencyPhone,
}: {
  type: ReportType;
  title: string;
  description: string;
  category: string | null;
  governorate: string | null;
  district: string | null;
  location: string;
  incidentDate: string;
  incidentTime?: string;
  keywords: string[];
  secretVerificationMark?: string;
  rewardAmount?: number | null;
  images: LocalImage[];
  isHumanitarian?: boolean;
  humanCategory?: string;
  age?: string;
  gender?: string;
  clothesDescription?: string;
  speechManner?: string;
  healthCondition?: string;
  specialInstructions?: string;
  emergencyPhone?: string;
  altEmergencyPhone?: string;
}) {
  const loc = [governorate, district, location].filter(Boolean).join(" - ");
  if (isHumanitarian) {
    return (
      <div className="mx-auto max-w-2xl bg-white text-black border-4 border-red-600 rounded-3xl overflow-hidden shadow-2xl font-sans relative">
        {/* Header */}
        <div className="bg-red-600 text-white text-center py-4 px-6 relative">
          <div className="absolute top-4 right-6 animate-pulse">
            <AlertTriangle className="size-10" />
          </div>
          <div className="absolute top-4 left-6 animate-pulse">
            <AlertTriangle className="size-10" />
          </div>
          <h1 className="text-4xl font-black mb-1">نداء إنساني عاجل</h1>
          <h2 className="text-xl font-bold tracking-widest uppercase">MISSING PERSON</h2>
        </div>
        
        {/* Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {images.length > 0 ? (
              <img src={images[0].url} className="w-full md:w-1/2 rounded-2xl object-cover aspect-square border-4 border-gray-100 shadow-md" />
            ) : (
              <div className="w-full md:w-1/2 aspect-square bg-gray-100 rounded-2xl border-4 border-gray-200 flex items-center justify-center text-gray-400">
                <ImageIcon className="size-20 opacity-20" />
              </div>
            )}
            
            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <h3 className="text-3xl font-black text-red-700 leading-tight mb-2">{title || "الاسم غير معروف"}</h3>
                <div className="inline-flex gap-2">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-bold">
                    {humanCategory === "child" ? "طفل" : humanCategory === "elderly" ? "مسن" : "شاب/ـة"}
                  </span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-bold">
                    {gender === "female" ? "أنثى" : gender === "male" ? "ذكر" : ""}
                  </span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-bold">
                    العمر: {age || "غير محدد"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex gap-2 border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 w-24 shrink-0">الملابس:</span>
                  <span className="font-bold">{clothesDescription || "غير محدد"}</span>
                </div>
                {speechManner && (
                  <div className="flex gap-2 border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-500 w-24 shrink-0">التخاطب:</span>
                    <span className="font-bold">{speechManner}</span>
                  </div>
                )}
                {healthCondition && (
                  <div className="flex gap-2 border-b border-gray-100 pb-2">
                    <span className="font-bold text-rose-600 w-24 shrink-0">حالة صحية:</span>
                    <span className="font-bold text-rose-700">{healthCondition}</span>
                  </div>
                )}
                <div className="flex gap-2 border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 w-24 shrink-0">موقع الفقدان:</span>
                  <span className="font-bold">{loc}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-500 w-24 shrink-0">تاريخ الاختفاء:</span>
                  <span className="font-bold">{incidentDate} {incidentTime}</span>
                </div>
              </div>
            </div>
          </div>
          
          {specialInstructions && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-200">
              <h4 className="font-black text-rose-900 mb-1 flex items-center gap-2">
                <AlertCircle className="size-4" /> تعليمات هامة عند العثور عليه
              </h4>
              <p className="font-bold text-sm leading-relaxed">{specialInstructions}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-900 text-white p-6 text-center space-y-2">
          <p className="text-gray-400 font-bold text-sm mb-2">للإدلاء بأي معلومات، يرجى الاتصال فوراً:</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-3xl font-black font-mono tracking-widest" dir="ltr">
            <span className="bg-red-600 px-6 py-2 rounded-xl">{emergencyPhone || "---"}</span>
            {altEmergencyPhone && (
              <span className="bg-gray-800 px-6 py-2 rounded-xl">{altEmergencyPhone}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="card-soft overflow-hidden rounded-3xl">
      {isHumanitarian && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-3.5 px-6 flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-300"></span>
            </span>
            <span>نداء إنساني طارئ • AMBER ALERT (مفقود بشري)</span>
          </div>
          <span className="bg-black/20 px-2.5 py-0.5 rounded-full text-[11px]">أولوية قصوى</span>
        </div>
      )}
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
          {isHumanitarian ? (
            <span className="rounded-full bg-red-600 text-white px-3 py-1 text-[11px] font-black animate-pulse shadow-xs">
              🚨 نداء إنساني عاجل
            </span>
          ) : (
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold ${type === "lost" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
            >
              {type === "lost" ? "مفقود" : "معثور"}
            </span>
          )}
          <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold text-orange-700">
            🟠 جديد
          </span>
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              <TagIcon className="size-3" /> {category}
            </span>
          )}
          {type === "lost" && rewardAmount && rewardAmount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-3 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
              <Gift className="size-3.5" /> مكافأة: {formatYER(rewardAmount)}
            </span>
          ) : null}
        </div>
        <h2 className="text-2xl font-extrabold text-primary-dark">{title || "بدون عنوان"}</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {description}
        </p>

        {/* Humanitarian specs in preview */}
        {isHumanitarian && (
          <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-red-950 dark:text-red-200">
              <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
              <span>مواصفات الشخص المفقود:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-background p-2.5 border border-red-100 dark:border-red-900/40">
                <span className="text-muted-foreground block text-[11px] mb-0.5">العمر:</span>
                <strong className="text-foreground">{age || "غير محدد"}</strong>
              </div>
              <div className="rounded-xl bg-background p-2.5 border border-red-100 dark:border-red-900/40">
                <span className="text-muted-foreground block text-[11px] mb-0.5">الجنس:</span>
                <strong className="text-foreground">
                  {gender === "female" ? "أنثى" : gender === "male" ? "ذكر" : "غير محدد"}
                </strong>
              </div>
              {clothesDescription && (
                <div className="col-span-2 rounded-xl bg-background p-2.5 border border-red-100 dark:border-red-900/40">
                  <span className="text-muted-foreground block text-[11px] mb-0.5">الملابس:</span>
                  <p className="text-foreground font-medium">{clothesDescription}</p>
                </div>
              )}
              {healthCondition && (
                <div className="col-span-2 rounded-xl bg-background p-2.5 border border-red-100 dark:border-red-900/40">
                  <span className="text-rose-600 block text-[11px] mb-0.5 font-bold">الحالة الصحية:</span>
                  <p className="text-foreground font-medium">{healthCondition}</p>
                </div>
              )}
              {emergencyPhone && (
                <div className="col-span-2 rounded-xl bg-red-600 text-white p-2.5 flex items-center justify-between text-xs">
                  <span className="text-[11px]">هاتف طوارئ العائلة:</span>
                  <strong className="font-mono font-black" dir="ltr">{emergencyPhone}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {secretVerificationMark ? (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/30 p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                <Lock className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {type === "lost"
                    ? "العلامة السرية لإثبات ملكيتك:"
                    : "سؤال الأمان السري للتأكد من المالك:"}
                </span>
              </div>
              <span className="rounded-full bg-indigo-200/80 dark:bg-indigo-900/60 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:text-indigo-200">
                خاص بك فقط 🔒
              </span>
            </div>
            <p className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-background/80 p-2.5 text-xs font-semibold text-foreground">
              {secretVerificationMark}
            </p>
            <p className="text-[10px] text-muted-foreground">
              هذه المعلومة ستبقى سرية في حسابك فقط ولن يراها زوار المنصة.
            </p>
          </div>
        ) : null}

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
