import { MapPin, Key, ExternalLink, Settings, Sparkles } from "lucide-react";

interface ApiKeyPromptProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ApiKeyPrompt({
  title = "مفتاح Google Maps Platform مطلوب",
  description = "لعرض الخريطة التفاعلية والبحث الجغرافي الدقيق، يرجى تفعيل مفتاح Google Maps API في إعدادات التطبيق.",
  className = "",
}: ApiKeyPromptProps) {
  return (
    <div
      className={`rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-6 md:p-10 text-center ${className}`}
      dir="rtl"
    >
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-5">
        <MapPin className="size-8 animate-bounce" />
      </div>

      <h2 className="text-xl md:text-2xl font-black text-foreground mb-2">{title}</h2>
      <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8">
        {description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-right mb-8">
        <div className="rounded-2xl bg-background/80 border border-border p-5">
          <div className="flex items-center gap-2 font-bold text-foreground mb-2">
            <Key className="size-4 text-primary" />
            <span>الخطوة 1: احصل على المفتاح</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            أنشئ مفتاح API مجاني من لوحة تحكم Google Cloud Console:
          </p>
          <a
            href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>الحصول على مفتاح Google Maps</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        <div className="rounded-2xl bg-background/80 border border-border p-5">
          <div className="flex items-center gap-2 font-bold text-foreground mb-2">
            <Settings className="size-4 text-primary" />
            <span>الخطوة 2: أضف المفتاح في Secrets</span>
          </div>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside pr-1">
            <li>
              افتح <strong>الإعدادات (⚙️)</strong> في الزاوية العلوية
            </li>
            <li>
              اختر <strong>Secrets</strong>
            </li>
            <li>
              أدخل الاسم:{" "}
              <code className="bg-secondary px-1 py-0.5 rounded font-mono text-[11px]">
                GOOGLE_MAPS_PLATFORM_KEY
              </code>
            </li>
            <li>
              الصق المفتاح واضغط <strong>Enter</strong>
            </li>
          </ol>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-background/50 border border-border/60 px-4 py-2 rounded-full">
        <Sparkles className="size-3.5 text-amber-500" />
        <span>يعيد التطبيق البناء تلقائياً فور حفظ المفتاح دون الحاجة لإعادة تحميل المتصفح</span>
      </div>
    </div>
  );
}
