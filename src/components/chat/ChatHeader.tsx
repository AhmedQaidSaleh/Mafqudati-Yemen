import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Phone,
} from "lucide-react";
import { initialOf } from "@/lib/format";

interface ChatHeaderProps {
  otherUser?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    phone?: string | null;
  } | null;
  report?: {
    id: string;
    title: string;
    type: "lost" | "found";
    status: "active" | "resolved" | "closed" | "new";
    location_text?: string | null;
    incident_date?: string | null;
    reward_amount?: number | null;
    report_images?: Array<{ url: string }>;
  } | null;
}

export function ChatHeader({ otherUser, report }: ChatHeaderProps) {
  const [showReportDetails, setShowReportDetails] = useState(false);

  const isLost = report?.type === "lost";
  const firstImage = report?.report_images?.[0]?.url;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs">
      {/* Top row: User info & actions */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-3 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/messages"
            aria-label="الرجوع إلى صندوق الوارد"
            className="inline-flex size-9 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition shrink-0"
          >
            <ArrowRight className="size-5" />
          </Link>

          {/* User avatar & status */}
          <div className="relative shrink-0">
            {otherUser?.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.full_name || ""}
                className="size-10 sm:size-11 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="size-10 sm:size-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-primary/20">
                {initialOf(otherUser?.full_name || "م")}
              </div>
            )}
            <span
              className="absolute bottom-0 end-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background"
              title="متصل الآن"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-bold text-sm sm:text-base text-foreground truncate">
                {otherUser?.full_name || "مستخدم مفقوداتي"}
              </h1>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <ShieldCheck className="size-3" /> موثق
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {report ? `بخصوص: ${report.title}` : "محادثة آمنة ومباشرة"}
            </p>
          </div>
        </div>

        {/* Right actions: Phone & Report expand toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {otherUser?.phone && (
            <a
              href={`tel:${otherUser.phone}`}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition"
              title="اتصال هاتفي"
            >
              <Phone className="size-3.5 text-primary" />
              <span>اتصال</span>
            </a>
          )}

          {report && (
            <button
              type="button"
              onClick={() => setShowReportDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-bold transition"
            >
              <span className="hidden sm:inline">تفاصيل البلاغ</span>
              {showReportDetails ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable mini-report summary */}
      {report && showReportDetails && (
        <div className="border-t border-border/80 bg-muted/40 p-3.5 sm:px-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {firstImage ? (
                <img
                  src={firstImage}
                  alt=""
                  className="size-14 rounded-xl object-cover border border-border shrink-0"
                />
              ) : (
                <div className="size-14 rounded-xl bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground font-bold shrink-0">
                  بدون صورة
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                      isLost
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }`}
                  >
                    {isLost ? "مفقود" : "معثور عليه"}
                  </span>
                  {report.status === "resolved" && (
                    <span className="inline-flex rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-extrabold">
                      تم استرداد الأمانة ✅
                    </span>
                  )}
                  <h3 className="font-bold text-xs sm:text-sm text-foreground truncate max-w-xs">
                    {report.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  {report.location_text && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3 text-muted-foreground" />
                      {report.location_text}
                    </span>
                  )}
                  {report.incident_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3 text-muted-foreground" />
                      {report.incident_date}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              to="/report/$id"
              params={{ id: report.id }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
            >
              <span>فتح البلاغ كاملاً</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
