import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "تواصل معنا | مفقوداتي" }] }),
  component: () => (
    <PageShell title="تواصل معنا" subtitle="فريق مفقوداتي مستعد لمساعدتك في أي وقت">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] max-w-5xl mx-auto">
        <div className="space-y-4">
          {[
            { i: MapPin, t: "العنوان", d: "صنعاء - الجمهورية اليمنية" },
            { i: Mail, t: "البريد الإلكتروني", d: "info@mafqudati.ye" },
            { i: Phone, t: "الهاتف", d: "‎+967 1 000 000" },
          ].map((c) => (
            <div key={c.t} className="card-soft rounded-2xl p-5 flex items-center gap-4">
              <div className="size-12 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <c.i className="size-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground">{c.t}</div>
                <div className="text-sm font-bold text-primary-dark">{c.d}</div>
              </div>
            </div>
          ))}
        </div>
        <form className="card-soft rounded-3xl p-8 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-primary-dark">الاسم</span>
            <input className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-primary-dark">البريد أو الجوال</span>
            <input className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-primary-dark">رسالتك</span>
            <textarea
              rows={5}
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
            />
          </label>
          <button
            type="button"
            className="btn-gradient w-full rounded-xl px-6 py-3 text-sm font-extrabold"
          >
            إرسال الرسالة
          </button>
        </form>
      </div>
    </PageShell>
  ),
});
