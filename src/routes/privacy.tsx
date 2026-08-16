import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "سياسة الخصوصية | مفقوداتي" }] }),
  component: () => (
    <PageShell title="سياسة الخصوصية">
      <article className="prose prose-slate max-w-3xl mx-auto text-muted-foreground leading-loose space-y-4">
        <p>
          تحترم منصة مفقوداتي خصوصية مستخدميها وتلتزم بحماية بياناتهم الشخصية وفقاً لأعلى المعايير.
        </p>
        <h2 className="text-xl font-extrabold text-primary-dark">جمع البيانات</h2>
        <p>نجمع فقط البيانات الضرورية لتقديم الخدمة، مثل الاسم ورقم الجوال والمحافظة.</p>
        <h2 className="text-xl font-extrabold text-primary-dark">حماية البيانات</h2>
        <p>تُخزَّن جميع البيانات بشكل مشفر ولا تُشارك مع أي طرف ثالث دون موافقة صريحة.</p>
        <h2 className="text-xl font-extrabold text-primary-dark">حقوق المستخدم</h2>
        <p>يحق لكل مستخدم الوصول إلى بياناته وتعديلها أو حذفها في أي وقت.</p>
      </article>
    </PageShell>
  ),
});
