import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Bell,
  Search,
  Camera,
  Calendar,
  Tag,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { api } from "@/client/api/client";
import { categoriesQuery, governoratesQuery, reportsQuery } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import type { Report, AiMatch } from "@/types/models";

type Type = "lost" | "found";

export function SmartAiSearch() {
  const { data: govs } = useSuspenseQuery(governoratesQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);

  const [type, setType] = useState<Type>("lost");
  const [description, setDescription] = useState("");
  const [governorateId, setGovernorateId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [matches, setMatches] = useState<AiMatch[] | null>(null);
  const [isScoring, setScoring] = useState(false);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Opposite type: if searching for lost items, actually match against found reports (and vice versa)
  const oppositeType: Type = type === "lost" ? "found" : "lost";

  const { data: candidates = [] } = useQuery(
    reportsQuery({
      type: oppositeType,
      governorate_id: governorateId ? Number(governorateId) : undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      limit: 50,
    }),
  );

  const scoredReports = useMemo(() => {
    if (!matches) return [];
    const byId = new Map(candidates.map((c) => [c.id, c]));
    return matches
      .map((m) => ({ match: m, report: byId.get(m.id) }))
      .filter((x): x is { match: AiMatch; report: Report } => !!x.report);
  }, [matches, candidates]);

  const highMatches = scoredReports.filter((s) => s.match.score >= 70).length;

  function onPickFile(file: File | null) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("الصورة يجب أن تكون بصيغة JPG أو PNG أو WEBP");
      return;
    }
    setError(null);
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (description.trim().length < 3) {
      setError("يرجى كتابة وصف واضح لما تبحث عنه");
      return;
    }
    setSubmitted(true);
    setScoring(true);
    setMatches(null);
    try {
      const govName = governorateId
        ? govs.find((g) => g.id === Number(governorateId))?.name_ar
        : undefined;
      const catName = categoryId
        ? cats.find((c) => c.id === Number(categoryId))?.name_ar
        : undefined;
      const payload = {
        description: description.trim(),
        type,
        governorate: govName,
        category: catName,
        candidates: candidates.slice(0, 40).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? null,
          category: r.categories?.name_ar ?? null,
          governorate: r.governorates?.name_ar ?? null,
        })),
      };

      const response = await api.post<{ matches: AiMatch[] }>("/ai/search-score", payload);
      setMatches(response.matches ?? []);
    } catch (err) {
      console.error("Smart AI Search Error:", err);
      const msg =
        err instanceof Error ? err.message : "تعذر إجراء البحث الذكي حالياً، يرجى المحاولة لاحقاً.";
      setError(msg);
      toast.error(msg);
    } finally {
      setScoring(false);
    }
  }

  async function enableWatch() {
    if (!auth.currentUser) {
      window.location.href = "/auth";
      return;
    }
    setWatching(true);
    toast.success("تم تفعيل المراقبة الذكية! سنرسل لك إشعاراً فور تطابق بلاغ جديد.");
  }

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-3xl border border-border bg-white/70 p-6 shadow-elevated backdrop-blur-xl sm:p-10"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col items-start gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" />
              مدعوم بالذكاء الاصطناعي
            </span>
            <h2 className="text-3xl font-extrabold text-primary-dark sm:text-4xl">البحث الذكي</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              صف ما تبحث عنه وسيقوم الذكاء الاصطناعي بتحليل الوصف والبحث عن أفضل النتائج.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8 grid gap-6">
            {/* Segmented type */}
            <div className="inline-flex self-start rounded-2xl border border-border bg-secondary/60 p-1">
              <button
                type="button"
                onClick={() => setType("lost")}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition ${type === "lost" ? "bg-rose-500 text-white shadow-md" : "text-primary-dark hover:bg-white/60"}`}
              >
                <span className="size-2 rounded-full bg-current" /> المفقودات
              </button>
              <button
                type="button"
                onClick={() => setType("found")}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition ${type === "found" ? "bg-emerald-500 text-white shadow-md" : "text-primary-dark hover:bg-white/60"}`}
              >
                <span className="size-2 rounded-full bg-current" /> المعثورات
              </button>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-bold text-primary-dark">
                الوصف بالذكاء الاصطناعي
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="مثال: فقدت حقيبة سوداء في صنعاء تحتوي على لابتوب."
                className="input min-h-[120px] resize-y leading-relaxed"
              />
            </div>

            {/* Governorate + Category */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-primary-dark">المحافظة</label>
                <select
                  value={governorateId}
                  onChange={(e) => setGovernorateId(e.target.value)}
                  className="input"
                >
                  <option value="">جميع المحافظات</option>
                  {govs.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name_ar}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-primary-dark">التصنيف</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input"
                >
                  <option value="">جميع التصنيفات</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ar}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image dropzone */}
            <div>
              <label className="mb-2 block text-sm font-bold text-primary-dark">
                صورة (اختياري)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  onPickFile(e.dataTransfer.files?.[0] ?? null);
                }}
                onClick={() => fileRef.current?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${isDragging ? "border-primary bg-primary/5" : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-primary/5"}`}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="mx-auto max-h-48 rounded-xl object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                      className="absolute -top-2 -left-2 rounded-full bg-white p-1.5 shadow-md"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <Upload className="size-6" />
                    </div>
                    <div className="text-sm font-bold text-primary-dark">
                      اسحب الصورة هنا أو اضغط للاختيار
                    </div>
                    <div className="text-xs text-muted-foreground">JPG، PNG، WEBP · حتى 10MB</div>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isScoring}
                className="btn-gradient inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold disabled:opacity-70"
              >
                {isScoring ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {isScoring ? "جاري التحليل..." : "ابحث بالذكاء الاصطناعي"}
              </button>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-6 py-3.5 text-sm font-bold hover:bg-secondary"
              >
                <Search className="size-4" /> بحث تقليدي
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      {submitted && (
        <div className="mt-8">
          {isScoring ? (
            <div className="card-soft flex items-center justify-center gap-3 rounded-3xl py-14 text-primary-dark">
              <Loader2 className="size-5 animate-spin" />
              <span className="font-bold">يقوم الذكاء الاصطناعي بتحليل البلاغات...</span>
            </div>
          ) : scoredReports.length > 0 ? (
            <>
              <div className="card-soft flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
                <div>
                  <div className="text-lg font-extrabold text-primary-dark">
                    تم العثور على {scoredReports.length} نتيجة
                  </div>
                  <div className="text-sm text-muted-foreground">
                    منها {highMatches} نتائج عالية التطابق
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-primary">
                  <Sparkles className="size-3.5" /> نتائج مرتبة حسب درجة التطابق
                </div>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {scoredReports.map(({ report, match }) => (
                  <MatchCard key={report.id} report={report} match={match} />
                ))}
              </div>
            </>
          ) : (
            <EmptyResults description={description} watching={watching} onWatch={enableWatch} />
          )}
        </div>
      )}
    </section>
  );
}

function MatchCard({ report, match }: { report: Report; match: AiMatch }) {
  const img = report.report_images
    ?.slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url;
  const tone =
    match.score >= 80 ? "bg-emerald-500" : match.score >= 60 ? "bg-primary" : "bg-amber-500";
  const typeBadge =
    report.type === "lost" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700";
  return (
    <div className="card-soft group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-elevated">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {img ? (
          <img
            src={img}
            alt={report.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary">
            <Camera className="size-12" />
          </div>
        )}
        <span
          className={`absolute top-3 start-3 rounded-full px-3 py-1 text-[11px] font-bold ${typeBadge}`}
        >
          {report.type === "lost" ? "مفقود" : "معثور"}
        </span>
        <div
          className={`absolute top-3 end-3 inline-flex items-center gap-1 rounded-full ${tone} px-3 py-1 text-[11px] font-extrabold text-white shadow-md`}
        >
          <Sparkles className="size-3" /> {match.score}%
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        {report.categories?.name_ar && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-primary">
            <Tag className="size-3" /> {report.categories.name_ar}
          </span>
        )}
        <h3 className="mt-2 text-sm font-extrabold text-primary-dark line-clamp-1">
          {report.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {report.governorates?.name_ar && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 text-primary" /> {report.governorates.name_ar}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3 text-primary" /> {timeAgo(report.created_at)}
          </span>
        </div>
        {match.reasons.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-xl bg-secondary/60 p-3 text-[11px] text-primary-dark">
            {match.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-primary" /> {r}
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/report/$id"
          params={{ id: report.id }}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary-dark"
        >
          عرض التفاصيل <ChevronLeft className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function EmptyResults({
  description,
  watching,
  onWatch,
}: {
  description: string;
  watching: boolean;
  onWatch: () => void;
}) {
  return (
    <div className="card-soft rounded-3xl p-10 text-center">
      <div className="mx-auto inline-flex size-16 items-center justify-center rounded-3xl bg-secondary text-primary">
        <ImageIcon className="size-7" />
      </div>
      <h3 className="mt-5 text-xl font-extrabold text-primary-dark">
        لم نعثر على نتائج مطابقة حالياً
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        سيقوم النظام بمراقبة البلاغات الجديدة وإشعارك عند العثور على تطابق مع وصفك.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/report/new"
          search={{ type: "lost" as const }}
          className="btn-gradient inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold"
        >
          <Plus className="size-4" /> إنشاء بلاغ
        </Link>
        <button
          onClick={onWatch}
          disabled={watching || description.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-6 py-3 text-sm font-bold text-primary-dark hover:bg-secondary disabled:opacity-60"
        >
          <Bell className="size-4" />{" "}
          {watching ? "المراقبة الذكية مفعّلة" : "تفعيل المراقبة الذكية"}
        </button>
      </div>
    </div>
  );
}
