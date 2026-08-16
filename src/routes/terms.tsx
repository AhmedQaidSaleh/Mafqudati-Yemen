import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "الشروط والأحكام | مفقوداتي" }] }),
  component: () => (
    <PageShell title="الشروط والأحكام">
      <article className="max-w-3xl mx-auto text-muted-foreground leading-loose space-y-4">
        <p>باستخدامك لمنصة مفقوداتي فإنك توافق على الشروط والأحكام التالية.</p>
        <h2 className="text-xl font-extrabold text-primary-dark">الاستخدام المسؤول</h2>
        <p>يلتزم المستخدم بتقديم معلومات صحيحة وعدم استغلال المنصة لأي غرض غير مشروع.</p>
        <h2 className="text-xl font-extrabold text-primary-dark">المحتوى</h2>
        <p>يحتفظ المستخدم بحقوق المحتوى الذي ينشره، مع منح المنصة حق العرض لأغراض الخدمة.</p>
        <h2 className="text-xl font-extrabold text-primary-dark">إخلاء مسؤولية</h2>
        <p>لا تتحمل المنصة مسؤولية أي معاملات تتم خارج نطاق النظام.</p>
      </article>
    </PageShell>
  ),
});
