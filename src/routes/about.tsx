import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Shield, Target, Users, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "من نحن | مفقوداتي" }] }),
  component: () => (
    <PageShell title="من نحن" subtitle="مفقوداتي - منصة يمنية وطنية لخدمة المجتمع">
      <div className="max-w-3xl mx-auto text-center text-muted-foreground leading-relaxed">
        <p>
          مفقوداتي هي المنصة الوطنية الأولى في الجمهورية اليمنية المتخصصة في ربط أصحاب المفقودات بمن
          يعثر عليها، عبر نظام ذكي وآمن يخدم جميع محافظات الوطن.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
        {[
          {
            i: Target,
            t: "رؤيتنا",
            d: "أن نكون المنصة الرائدة في خدمة المجتمع اليمني لاستعادة المفقودات.",
          },
          {
            i: Heart,
            t: "رسالتنا",
            d: "تسهيل استعادة المقتنيات وبناء ثقافة التعاون بين المواطنين.",
          },
          { i: Shield, t: "قيمنا", d: "الأمان، الخصوصية، الشفافية، وخدمة المجتمع." },
          { i: Users, t: "مجتمعنا", d: "آلاف المستخدمين من كل محافظات اليمن يشاركون يومياً." },
        ].map((c) => (
          <div key={c.t} className="card-soft rounded-3xl p-6 text-center">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <c.i className="size-6" />
            </div>
            <h3 className="mt-4 font-extrabold text-primary-dark">{c.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});
