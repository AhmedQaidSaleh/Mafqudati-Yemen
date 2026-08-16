import { Link } from "@tanstack/react-router";
import { MapPin, Calendar, Camera, Tag, ChevronLeft, Share2 } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";

type Report = {
  id: string;
  type: "lost" | "found";
  title: string;
  city?: string | null;
  neighborhood?: string | null;
  status?: string;
  created_at: string;
  report_images?: { url: string; sort_order: number }[] | null;
  categories?: { name_ar: string } | null;
  governorates?: { name_ar: string } | null;
  districts?: { name_ar: string } | null;
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

export function ReportCard({ report }: { report: Report }) {
  const img = report.report_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
  const loc = [report.governorates?.name_ar, report.districts?.name_ar || report.city]
    .filter(Boolean)
    .join(" - ");
  const typeBadge =
    report.type === "lost" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700";
  const statusInfo = STATUS_LABELS[report.status ?? "new"] ?? STATUS_LABELS.new;

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
    <div className="card-soft group flex flex-col overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated">
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
        <span
          className={`absolute top-3 end-3 rounded-full px-3 py-1 text-[11px] font-bold ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </Link>
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

export function ReportGrid({ reports }: { reports: Report[] }) {
  if (reports.length === 0) return <EmptyState />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
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
