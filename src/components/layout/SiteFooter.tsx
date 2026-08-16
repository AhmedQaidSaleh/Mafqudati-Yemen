import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.svg";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="مفقوداتي" className="h-12 w-12 object-contain" />
              <div>
                <div className="text-lg font-extrabold text-primary-dark">مفقوداتي</div>
                <div className="text-xs font-medium text-primary">Mafqudati</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              المنصة الوطنية الذكية للمفقودات والمعثورات في الجمهورية اليمنية.
            </p>
            <div className="mt-4 flex gap-2">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="social"
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background text-primary hover:bg-secondary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary-dark mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/", label: "الرئيسية" },
                { to: "/lost", label: "المفقودات" },
                { to: "/found", label: "المعثورات" },
                { to: "/map", label: "الخريطة" },
                { to: "/how-it-works", label: "كيف تعمل المنصة" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-muted-foreground hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary-dark mb-4">المنصة</h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/about", label: "من نحن" },
                { to: "/contact", label: "تواصل معنا" },
                { to: "/privacy", label: "سياسة الخصوصية" },
                { to: "/terms", label: "الشروط والأحكام" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-muted-foreground hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-primary-dark mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> صنعاء، الجمهورية اليمنية
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-primary" /> info@mafqudati.ye
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-primary" /> ‎+967 1 000 000
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} مفقوداتي - Mafqudati. جميع الحقوق محفوظة.</p>
          <p>صُنع بعناية في الجمهورية اليمنية</p>
        </div>
      </div>
    </footer>
  );
}
