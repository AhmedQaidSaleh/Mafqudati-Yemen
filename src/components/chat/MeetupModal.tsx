import { useState } from "react";
import { MapPin, Calendar, Clock, ShieldCheck, X } from "lucide-react";

interface MeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { location: string; time: string; notes: string }) => void;
}

const PUBLIC_SAFE_SPOTS = [
  "بوابة مجمع تجاري معروف (مكان عام ومضاء)",
  "أمام قسم أو مركز الشرطة",
  "باحة مسجد رئيسي بعد الصلاة",
  "مدخل مستشفى عام معروف",
  "شارع عام حيوي ومضاء",
];

export function MeetupModal({ isOpen, onClose, onSubmit }: MeetupModalProps) {
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    onSubmit({
      location: location.trim(),
      time: time.trim() || "بالاتفاق المباشر",
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-background border border-border p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MapPin className="size-4" />
            </div>
            <h3 className="font-extrabold text-base text-foreground">
              اقتراح مكان لقاء عام وآمن
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-xl hover:bg-muted text-muted-foreground flex items-center justify-center transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 flex items-start gap-2.5 text-xs text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed">
          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>توجيه أمني:</strong> احرص دائماً على اختيار مكان عام مأهول بالمارة ومضاء، ولا تقبل اللقاء في أماكن معزولة إطلاقاً.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              المكان العام المقترح *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: أمام بوابة مجمع الرويشان التجاري..."
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition font-medium"
            />

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1 mt-2">
              {PUBLIC_SAFE_SPOTS.map((spot) => (
                <button
                  key={spot}
                  type="button"
                  onClick={() => setLocation(spot)}
                  className="rounded-lg border border-border bg-muted/40 hover:bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  + {spot}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              الوقت والتاريخ المقترح
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="مثال: غداً بعد صلاة العصر (الساعة 4:30 عصراً)"
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              ملاحظات إضافية (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: سأكون واقفاً أمام الصراف الآلي..."
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!location.trim()}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <MapPin className="size-3.5" />
              <span>إرسال بطاقة اللقاء</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
