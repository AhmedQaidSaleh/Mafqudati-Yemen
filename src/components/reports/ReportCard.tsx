import { Link } from "@tanstack/react-router";
import { MapPin, Calendar, Camera, Tag, ChevronLeft, Share2, Gift, Pencil } from "lucide-react";
import { timeAgo, formatYER } from "@/lib/format";
import { toast } from "sonner";

type Report = {
  id: string;
  type: "lost" | "found";
  title: string;
  city?: string | null;
  neighborhood?: string | null;
  status?: string;
  created_at: string;
  reward_amount?: number | string | null;
  report_images?: { url: string; sort_order: number }[] | null;
  categories?: { name_ar: string; slug?: string } | null;
  governorates?: { name_ar: string } | null;
  districts?: { name_ar: string } | null;
  is_humanitarian?: boolean;
  category_id?: number | null;
  age?: string | null;
  gender?: string | null;
};

export const STATUS_LABELS: Record<string, { label: string; className: string; icon: string }> = {
  new: { label: "جديد", className: "bg-orange-100 text-orange-700", icon: "🟠" },
  open: { label: "نشط", className: "bg-primary/10 text-primary", icon: "🟠" },
  searching: { label: "قيد البحث", className: "bg-amber-100 text-amber-700", icon: "🔍" },
  contacted: { label: "تم التواصل", className: "bg-sky-100 text-sky-700", icon: "💬" },
  verified: { label: "تم التحقق", className: "bg-indigo-100 text-indigo-700", icon: "🤝" },
  received: { label: "تم الاستلام", className: "bg-teal-100 text-teal-700", icon: "📦" },
  resolved: { label: "تم العثور عليه", className: "bg-emerald-100 text-emerald-700", icon: "✅" },
  closed: { label: "مغلق", className: "bg-slate-200 text-slate-700", icon: "❌" },
};

export function ReportCard({
  report,
  onEdit,
}: {
  report: Report;
  onEdit?: (report: Report) => void;
}) {
  const img = report.report_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const loc = [report.governorates?.name_ar, report.districts?.name_ar || report.city]
    .filter(Boolean)
    .join(" - ");
  const typeBadge =
    report.type === "lost" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700";
  const statusInfo = STATUS_LABELS[report.status ?? "new"] ?? STATUS_LABELS.new;

  const isHumanitarian = Boolean(
    report.is_humanitarian ||
    report.category_id === 9 ||
    report.categories?.slug === "missing-persons" ||
    report.categories?.name_ar?.includes("مفقودين") ||
    report.categories?.name_ar?.includes("إنساني")
  );
  const isResolved = report.status === "resolved";

  const shareReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/report/${report.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          url,
        });
      } catch (error) {
        // User aborted or sharing failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    }
  };

  return (
    <div
      className={`card-soft group flex flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:shadow-elevated ${
        isHumanitarian
          ? "border-2 border-rose-300 dark:border-rose-900/70 bg-gradient-to-b from-rose-50/20 to-background"
          : "hover:border-primary/30"
      }`}
    >
      <Link
        to="/report/$id"
        params={{ id: report.id }}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
      >
        {img ? (
          <img
            src={img}
            alt={report.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              isHumanitarian && isResolved ? "blur-xs" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary">
            <Camera className="size-12" />
          </div>
        )}

        {/* Privacy overlay if resolved humanitarian */}
        {isHumanitarian && isResolved && (
          <div className="absolute inset-0 bg-emerald-950/40 flex items-center justify-center p-2 text-center">
            <span className="rounded-xl bg-emerald-600/90 text-white px-3 py-1 text-xs font-black shadow-md backdrop-blur-xs">
              ✅ تم العثور عليه بفضل الله
            </span>
          </div>
        )}

        {/* Top Badges */}
        {isHumanitarian ? (
          <span className="absolute top-3 start-3 rounded-full bg-red-600 text-white px-2.5 py-0.5 text-[11px] font-black shadow-md flex items-center gap-1 animate-pulse">
            🚨 نداء إنساني
          </span>
        ) : (
          <span
            className={`absolute top-3 start-3 rounded-full px-3 py-1 text-[11px] font-bold ${typeBadge}`}
          >
            {report.type === "lost" ? "مفقود" : "معثور"}
          </span>
        )}

        <span
          className={`absolute top-3 end-3 rounded-full px-3 py-1 text-[11px] font-bold ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
        {report.reward_amount && Number(report.reward_amount) > 0 ? (
          <span className="absolute bottom-3 start-3 inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white px-2.5 py-0.5 text-[11px] font-extrabold shadow-sm backdrop-blur-sm">
            <Gift className="size-3" /> مكافأة: {formatYER(Number(report.reward_amount))}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {report.categories?.name_ar && (
            <span
              className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isHumanitarian
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-secondary text-primary"
              }`}
            >
              <Tag className="size-3" /> {report.categories.name_ar}
            </span>
          )}

          {isHumanitarian && report.age && (
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
              العمر: {report.age}
            </span>
          )}

          {isHumanitarian && report.gender && (
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
              {report.gender === "female" ? "أنثى" : report.gender === "male" ? "ذكر" : ""}
            </span>
          )}

          {report.reward_amount && Number(report.reward_amount) > 0 && !img && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
              <Gift className="size-3" /> مكافأة
            </span>
          )}
        </div>
        <h3 className="mt-2 text-sm font-extrabold text-primary-dark line-clamp-1">
          {report.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {loc && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 text-primary" /> {loc}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3 text-primary" /> {timeAgo(report.created_at)}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Link
            to="/report/$id"
            params={{ id: report.id }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-xs font-bold text-primary-dark transition group-hover:bg-primary group-hover:text-primary-foreground"
          >
            عرض التفاصيل <ChevronLeft className="size-3.5" />
          </Link>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(report);
              }}
              className="inline-flex size-[38px] shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
              aria-label="تعديل البلاغ"
              title="تعديل البلاغ"
            >
              <Pencil className="size-4" />
            </button>
          )}
          <button
            onClick={shareReport}
            className="inline-flex size-[38px] shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/60 text-primary-dark transition hover:bg-primary hover:text-primary-foreground"
            aria-label="مشاركة"
            title="مشاركة"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReportGrid({
  reports,
  onEdit,
}: {
  reports: Report[];
  onEdit?: (report: Report) => void;
}) {
  if (reports.length === 0) return <EmptyState />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} onEdit={onEdit} />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "لا توجد بلاغات",
  subtitle = "لم يتم العثور على نتائج مطابقة",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="card-soft rounded-3xl py-16 text-center">
      <Camera className="mx-auto size-14 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-extrabold text-primary-dark">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
