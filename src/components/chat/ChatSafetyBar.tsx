import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ChatSafetyBarProps {
  isOwner: boolean;
  isResolved?: boolean;
  secretVerificationMark?: string | null;
  onRequestVerification: () => void;
  onOpenMeetupModal: () => void;
  onConfirmHandover: () => void;
}

export function ChatSafetyBar({
  isOwner,
  isResolved,
  secretVerificationMark,
  onRequestVerification,
  onOpenMeetupModal,
  onConfirmHandover,
}: ChatSafetyBarProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-b border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/90 via-background to-indigo-50/50 dark:from-indigo-950/40 dark:via-background dark:to-indigo-950/20 px-3.5 py-2.5 sm:px-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="inline-flex size-6 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
            <ShieldCheck className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 block truncate">
              إجراءات الأمان والتحقق المعتمدة
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Collapse/expand tip button */}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 rounded-lg px-2 py-1 transition"
          >
            <span>{collapsed ? "عرض الإرشادات" : "طي"}</span>
            {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-2 text-[11px] text-indigo-900/85 dark:text-indigo-300 space-y-2">
          <p className="leading-relaxed font-medium">
            🔒 <strong>تنبيه لمنع الاحتيال:</strong> لا تقم بدفع مبالغ شحن مسبقة. تحقق من هوية الغرض والعلامة السرية قبل اللقاء، واجعل التسليم دائماً في <strong>مكان عام ومضاء</strong>.
          </p>

          {/* If the current user has a secret mark on this report, show the reveal widget */}
          {isOwner && secretVerificationMark && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-background/90 p-2.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <Lock className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>علامتك السرية لمطابقة الإجابة:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecret((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 hover:bg-muted px-2 py-0.5 text-[11px] font-bold transition text-foreground"
                >
                  {showSecret ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  <span>{showSecret ? "إخفاء" : "إظهار"}</span>
                </button>
              </div>

              <div className="text-xs font-mono font-semibold text-foreground bg-muted/40 rounded-lg p-1.5 break-words">
                {showSecret ? (
                  secretVerificationMark
                ) : (
                  <span className="text-muted-foreground tracking-widest">
                    ••••••••••••••••••••
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                هذه العلامة سرية وخاصة بك فقط لمقارنة إجابة الطرف الآخر بها.
              </p>
            </div>
          )}

          {/* Fast Quick Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={onRequestVerification}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-xs font-bold transition shadow-xs"
            >
              <Lock className="size-3.5" />
              <span>طلب التحقق السري</span>
            </button>

            <button
              type="button"
              onClick={onOpenMeetupModal}
              className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-background hover:bg-muted text-indigo-900 dark:text-indigo-200 px-2.5 py-1 text-xs font-bold transition"
            >
              <MapPin className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>اقتراح مكان لقاء عام</span>
            </button>

            {isOwner && !isResolved && (
              <button
                type="button"
                onClick={onConfirmHandover}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold transition shadow-xs ms-auto"
              >
                <CheckCircle2 className="size-3.5" />
                <span>تأكيد الاستلام</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
