import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Plus, Bell, MessageCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "كيف تعمل المنصة | مفقوداتي" }] }),
  component: () => (
    <PageShell title="كيف تعمل المنصة؟" subtitle="أربع خطوات فقط لاستعادة مفقوداتك">
      <div className="max-w-4xl mx-auto grid gap-5 sm:grid-cols-2">
        {[
          { i: Plus, t: "1. أنشئ بلاغاً", d: "أضف تفاصيل المفقود أو المعثور مع صور ووصف دقيق." },
          { i: Bell, t: "2. مطابقة ذكية", d: "يقوم النظام تلقائياً بالبحث عن التطابقات المحتملة." },
          {
            i: MessageCircle,
            t: "3. تواصل آمن",
            d: "تواصل مع الطرف الآخر عبر النظام دون كشف بياناتك.",
          },
          {
            i: CheckCircle2,
            t: "4. استلم مفقودك",
            d: "اتفقا على مكان الاستلام وأكّد نجاح العملية.",
          },
        ].map((s) => (
          <div key={s.t} className="card-soft rounded-3xl p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <s.i className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-primary-dark">{s.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});
