import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PackageSearch, HandHeart, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function ReportTypeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const pick = (type: "lost" | "found") => {
    if (!user) {
      toast.error("يجب تسجيل الدخول لإضافة بلاغ");
      onOpenChange(false);
      navigate({ to: "/auth" });
      return;
    }
    onOpenChange(false);
    navigate({ to: "/report/new", search: { type } as never });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden" dir="rtl">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center sm:text-center items-center mb-6">
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
              ما نوع البلاغ؟
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-2">
              اختر نوع البلاغ الذي ترغب في إنشائه للمتابعة
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <TypeCard
              tone="lost"
              icon={<PackageSearch className="size-7" />}
              title="أبلغ عن مفقود"
              description="فقدت شيئاً وتبحث عنه."
              onClick={() => pick("lost")}
            />
            <TypeCard
              tone="found"
              icon={<HandHeart className="size-7" />}
              title="أبلغ عن معثور"
              description="عثرت على شيء وتريد إرجاعه لصاحبه."
              onClick={() => pick("found")}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TypeCard({
  tone,
  icon,
  title,
  description,
  onClick,
}: {
  tone: "lost" | "found";
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  const isLost = tone === "lost";
  const iconBg = isLost ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600";
  const ring = isLost
    ? "hover:border-rose-300 hover:shadow-rose-100"
    : "hover:border-emerald-300 hover:shadow-emerald-100";
  const btn = isLost
    ? "bg-rose-600 hover:bg-rose-700 text-white"
    : "bg-emerald-600 hover:bg-emerald-700 text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-right rounded-2xl border-2 border-border bg-background p-6 transition-all hover:shadow-xl ${ring}`}
    >
      <div className={`inline-flex size-14 items-center justify-center rounded-2xl ${iconBg} mb-4`}>
        {icon}
      </div>
      <div className="text-lg font-extrabold text-primary-dark mb-1">{title}</div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{description}</p>
      <span
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${btn}`}
      >
        متابعة
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
      </span>
    </button>
  );
}
