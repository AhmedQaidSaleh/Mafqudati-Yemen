import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Tag,
  Zap,
  Shield,
  Users,
  FileText,
  CheckCircle2,
  Star,
  Laptop,
  Wallet,
  Key,
  FileBadge,
  ShoppingBag,
  HelpCircle,
  MapPin,
  ChevronLeft,
  Bell,
  Camera,
  MessageCircle,
  ChevronDown,
  ArrowUpLeft,
} from "lucide-react";
import { Suspense, useState } from "react";
import heroImg from "@/assets/hero.png";
import { SmartAiSearch } from "@/components/home/SmartAiSearch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مفقوداتي | Mafqudati - المنصة الوطنية للمفقودات والمعثورات في اليمن" },
      {
        name: "description",
        content:
          "أبلغ عن مفقوداتك أو ساعد الآخرين في استعادة ممتلكاتهم عبر منصة مفقوداتي الذكية في اليمن.",
      },
      {
        property: "og:title",
        content: "مفقوداتي | Mafqudati - المنصة الوطنية للمفقودات والمعثورات في اليمن",
      },
      {
        property: "og:description",
        content:
          "أبلغ عن مفقوداتك أو ساعد الآخرين في استعادة ممتلكاتهم عبر منصة مفقوداتي الذكية في اليمن.",
      },
    ],
  }),
  component: HomePage,
});

const stats = [
  { icon: Users, value: "25,430+", label: "مستخدم نشط" },
  { icon: FileText, value: "12,840+", label: "بلاغ مفقود" },
  { icon: CheckCircle2, value: "8,920+", label: "بلاغ معثور" },
  { icon: Star, value: "6,720+", label: "عمليات استعادة ناجحة" },
];

const categories = [
  { icon: Laptop, name: "إلكترونيات", count: "2,430", tint: "bg-cat-1", color: "text-primary" },
  {
    icon: Wallet,
    name: "محافظ ونقود",
    count: "1,920",
    tint: "bg-cat-2",
    color: "text-emerald-700",
  },
  { icon: Key, name: "مفاتيح", count: "1,580", tint: "bg-cat-3", color: "text-amber-700" },
  {
    icon: FileBadge,
    name: "وثائق رسمية",
    count: "1,240",
    tint: "bg-cat-4",
    color: "text-purple-700",
  },
  { icon: ShoppingBag, name: "حقائب", count: "1,120", tint: "bg-cat-5", color: "text-rose-700" },
  { icon: HelpCircle, name: "أخرى", count: "4,550", tint: "bg-cat-6", color: "text-slate-700" },
];

const latestLost = [
  { title: "هاتف آيفون 14 برو", location: "صنعاء - حدة", time: "منذ 2 ساعة" },
  { title: "محفظة جلدية سوداء", location: "عدن - المعلا", time: "منذ 3 ساعات" },
  { title: "مفاتيح سيارة تويوتا", location: "تعز - المدينة", time: "منذ 5 ساعات" },
];

const latestFound = [
  { title: "سماعات AirPods", location: "عدن - كريتر", time: "منذ ساعة" },
  { title: "حقيبة ظهر زرقاء", location: "صنعاء - التحرير", time: "منذ ساعتين" },
  { title: "ساعة يد ذكية", location: "حضرموت - المكلا", time: "منذ 4 ساعات" },
];

const governorates = [
  "أمانة العاصمة",
  "صنعاء",
  "عدن",
  "تعز",
  "الحديدة",
  "إب",
  "ذمار",
  "حضرموت",
  "مأرب",
  "صعدة",
  "حجة",
  "المهرة",
  "شبوة",
  "أبين",
  "لحج",
  "الضالع",
  "عمران",
  "البيضاء",
  "ريمة",
  "الجوف",
  "سقطرى",
  "المحويت",
];

const howSteps = [
  { icon: Plus, title: "أضف البلاغ", desc: "أنشئ بلاغ مفقود أو معثور مع وصف دقيق وصور واضحة." },
  {
    icon: Bell,
    title: "استلم إشعارات ذكية",
    desc: "يقوم نظامنا بمطابقة البلاغات وإرسال تنبيهات فورية.",
  },
  {
    icon: MessageCircle,
    title: "تواصل بأمان",
    desc: "تواصل مع الطرف الآخر عبر النظام دون كشف بياناتك.",
  },
  {
    icon: CheckCircle2,
    title: "استعد ممتلكاتك",
    desc: "أكّد استلامك وشاركنا قصة نجاحك مع المجتمع.",
  },
];

const stories = [
  {
    name: "أحمد الصلوي",
    city: "صنعاء",
    text: "استعدت هاتفي خلال يومين فقط عبر منصة مفقوداتي. خدمة رائعة وآمنة.",
  },
  {
    name: "منى عبدالله",
    city: "عدن",
    text: "وجدت محفظتي بكل ما فيها بعد أن فقدت الأمل. شكراً لكل من ساعد.",
  },
  {
    name: "خالد باعبود",
    city: "المكلا",
    text: "المطابقة الذكية سرّعت العملية كثيراً. توصيتي لكل يمني.",
  },
];

const faqs = [
  {
    q: "هل استخدام المنصة مجاني؟",
    a: "نعم، جميع خدمات مفقوداتي مجانية بالكامل لكافة المواطنين في الجمهورية اليمنية.",
  },
  {
    q: "كيف يتم حماية بياناتي الشخصية؟",
    a: "نستخدم تشفيراً كاملاً للبيانات، ولا نكشف معلومات التواصل إلا بعد موافقتك الصريحة.",
  },
  {
    q: "ما المناطق التي تغطيها المنصة؟",
    a: "تغطي المنصة جميع محافظات ومديريات الجمهورية اليمنية.",
  },
  {
    q: "كم يستغرق نشر البلاغ؟",
    a: "يتم نشر البلاغ فور تقديمه بعد مراجعة تلقائية سريعة تضمن جودة المحتوى.",
  },
];

function HomePage() {
  return (
    <>
      <Hero />
      <Suspense
        fallback={
          <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="card-soft h-96 rounded-3xl animate-pulse" />
          </div>
        }
      >
        <SmartAiSearch />
      </Suspense>
      <StatsBar />
      <CategoriesAndLatest />
      <HowItWorks />
      <YemenMap />
      <Stories />
      <FAQ />
      <CtaBanner />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-bg pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-24 lg:px-8">
        {/* Text side (LEFT in RTL → order-2) */}
        <div className="order-2 text-right">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            المنصة الوطنية للمفقودات والمعثورات
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.2] text-primary-dark sm:text-5xl lg:text-6xl">
            ابحث عن مفقوداتك
            <br />
            <span className="text-primary">أو ساعد في إعادتها</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg mr-0 ml-auto">
            منصة مفقوداتي تساعد في ربط أصحاب المفقودات بمن يعثر عليها باستخدام نظام ذكي وآمن لتسهيل
            استعادة المقتنيات في جميع محافظات اليمن.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/report/new"
              search={{ type: "lost" as const }}
              className="btn-gradient inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold"
            >
              <Plus className="size-4" />
              أضف بلاغ
            </Link>
            <Link
              to="/lost"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-6 py-3.5 text-sm font-bold hover:bg-secondary"
            >
              <Search className="size-4" />
              استكشف المفقودات
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <span className="inline-flex items-center gap-2 text-primary-dark font-semibold">
              <Tag className="size-4 text-primary" /> مجاني
            </span>
            <span className="inline-flex items-center gap-2 text-primary-dark font-semibold">
              <Zap className="size-4 text-primary" /> سريع
            </span>
            <span className="inline-flex items-center gap-2 text-primary-dark font-semibold">
              <Shield className="size-4 text-primary" /> آمن
            </span>
          </div>
        </div>

        {/* Hero illustration side */}
        <div className="order-1 relative flex justify-center aspect-square max-w-xl mx-auto w-full">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/5 blur-2xl" />
          <img
            src={heroImg}
            alt="مفقوداتي - إعادة الأشياء الضائعة"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="card-soft grid grid-cols-2 gap-4 rounded-3xl p-6 sm:p-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <s.icon className="size-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-primary-dark sm:text-2xl">{s.value}</div>
              <div className="text-xs text-muted-foreground sm:text-sm">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoriesAndLatest() {
  return (
    <section className="mx-auto mt-12 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
      {/* Categories */}
      <div className="card-soft rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-primary-dark sm:text-xl">
            التصنيفات الرئيسية
          </h2>
          <Link
            to="/lost"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            عرض جميع التصنيفات <ChevronLeft className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.name}
              to="/lost"
              className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border bg-background p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated"
            >
              <div
                className={`inline-flex size-14 items-center justify-center rounded-2xl ${c.tint} ${c.color} shadow-sm transition duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                <c.icon className="size-7" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-extrabold text-primary-dark">{c.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{c.count} بلاغ</div>
              </div>
              <ArrowUpLeft className="absolute end-4 top-4 size-4 text-primary/0 transition-all duration-300 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>

      {/* Latest lost + latest found stacked to fit visual density */}
      <div className="grid gap-6 sm:grid-cols-2">
        <ReportList title="أحدث المفقودات" items={latestLost} to="/lost" tone="text-destructive" />
        <ReportList title="أحدث المعثورات" items={latestFound} to="/found" tone="text-primary" />
      </div>
    </section>
  );
}

function ReportList({
  title,
  items,
  to,
  tone,
}: {
  title: string;
  items: typeof latestLost;
  to: string;
  tone: string;
}) {
  return (
    <div className="card-soft rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-extrabold ${tone}`}>{title}</h3>
        <Link to={to} className="text-xs font-semibold text-primary hover:underline">
          عرض الكل
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {items.map((it) => (
          <li key={it.title} className="flex items-center gap-3 py-3">
            <div className="size-12 shrink-0 rounded-xl bg-secondary flex items-center justify-center text-primary">
              <Camera className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-primary-dark truncate">{it.title}</div>
              <div className="text-xs text-muted-foreground">{it.location}</div>
            </div>
            <div className="text-[11px] text-muted-foreground shrink-0">{it.time}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-primary-dark sm:text-4xl">كيف تعمل المنصة؟</h2>
        <p className="mt-3 text-muted-foreground">
          أربع خطوات بسيطة لاستعادة مفقوداتك أو مساعدة الآخرين
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {howSteps.map((s, i) => (
          <div key={s.title} className="card-soft relative rounded-3xl p-6">
            <div className="absolute -top-3 -right-3 size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-extrabold shadow-lg">
              {i + 1}
            </div>
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <s.icon className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-primary-dark">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function YemenMap() {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="card-soft overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
              <MapPin className="size-3.5" /> خريطة تفاعلية
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-primary-dark sm:text-4xl">
              تغطية شاملة لكل محافظات اليمن
            </h2>
            <p className="mt-3 text-muted-foreground">
              تصفح البلاغات حسب المحافظة والمديرية، وابحث عن مفقوداتك بالقرب من موقعك.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {governorates.slice(0, 12).map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary-dark"
                >
                  <MapPin className="size-3 text-primary" />
                  {g}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                +{governorates.length - 12} محافظة أخرى
              </span>
            </div>
            <Link
              to="/map"
              className="mt-8 inline-flex btn-gradient items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold"
            >
              <MapPin className="size-4" />
              افتح الخريطة التفاعلية
            </Link>
          </div>
          <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-secondary to-background border border-border p-6 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,theme(colors.primary/25)_1px,transparent_0)] [background-size:22px_22px]" />
            <div className="relative text-center">
              <MapPin className="mx-auto size-16 text-primary" />
              <div className="mt-3 text-lg font-extrabold text-primary-dark">الجمهورية اليمنية</div>
              <div className="text-xs text-muted-foreground mt-1">22 محافظة · تغطية كاملة</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-bold text-primary-dark">
                {["صنعاء", "عدن", "تعز", "الحديدة", "حضرموت", "إب"].map((c) => (
                  <span
                    key={c}
                    className="rounded-lg bg-background/80 backdrop-blur px-2 py-1 border border-border"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stories() {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-primary-dark sm:text-4xl">قصص نجاح حقيقية</h2>
        <p className="mt-3 text-muted-foreground">مواطنون يمنيون استعادوا ممتلكاتهم بفضل المنصة</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {stories.map((s) => (
          <figure key={s.name} className="card-soft rounded-3xl p-6">
            <div className="flex gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
              "{s.text}"
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="inline-flex size-11 items-center justify-center rounded-full bg-secondary text-primary font-extrabold">
                {s.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-primary-dark">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.city}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto mt-20 max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-primary-dark sm:text-4xl">الأسئلة الشائعة</h2>
        <p className="mt-3 text-muted-foreground">
          إجابات لأكثر الأسئلة التي يطرحها مستخدمو مفقوداتي
        </p>
      </div>
      <div className="mt-8 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="card-soft rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 text-right"
              >
                <span className="text-sm font-bold text-primary-dark sm:text-base">{f.q}</span>
                <ChevronDown
                  className={`size-5 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground border-t border-border pt-4">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative">
          <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            ابدأ الآن وساهم في مجتمع أكثر أماناً
          </h2>
          <p className="mt-3 text-primary-foreground/85 max-w-2xl mx-auto">
            انضم إلى آلاف المواطنين اليمنيين الذين يساعدون في إعادة المفقودات إلى أصحابها.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/report/new"
              search={{ type: "lost" as const }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-primary hover:bg-white/90"
            >
              <Plus className="size-4" /> أضف بلاغ الآن
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" as const }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 backdrop-blur"
            >
              أنشئ حسابك
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
