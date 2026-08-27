import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider, useTheme } from "@/lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">حدث خطأ في تحميل الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول مرة أخرى أو عد للرئيسية.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "مفقوداتي | Mafqudati - المنصة الوطنية للمفقودات والمعثورات في اليمن" },
      {
        name: "description",
        content:
          "أبلغ عن مفقوداتك أو ساعد الآخرين في استعادة ممتلكاتهم عبر منصة مفقوداتي الذكية في اليمن.",
      },
      { name: "author", content: "Mafqudati" },
      {
        property: "og:title",
        content: "مفقوداتي | Mafqudati - المنصة الوطنية للمفقودات والمعثورات في اليمن",
      },
      {
        property: "og:description",
        content:
          "أبلغ عن مفقوداتك أو ساعد الآخرين في استعادة ممتلكاتهم عبر منصة مفقوداتي الذكية في اليمن.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "مفقوداتي | Mafqudati - المنصة الوطنية للمفقودات والمعثورات في اليمن",
      },
      {
        name: "twitter:description",
        content:
          "أبلغ عن مفقوداتك أو ساعد الآخرين في استعادة ممتلكاتهم عبر منصة مفقوداتي الذكية في اليمن.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/37e6f857-1d07-4d87-bf35-e83f7a2304ca/id-preview-5db7fe92--715c76d4-6a05-46bd-8f88-77eb3667ee1e.lovable.app-1784418852747.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/37e6f857-1d07-4d87-bf35-e83f7a2304ca/id-preview-5db7fe92--715c76d4-6a05-46bd-8f88-77eb3667ee1e.lovable.app-1784418852747.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppContent() {
  const { theme } = useTheme();
  return (
    <div className="flex min-h-dvh flex-col bg-background" dir="rtl">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster
        theme={theme}
        richColors
        position="top-center"
        dir="rtl"
        closeButton
        duration={4500}
      />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
