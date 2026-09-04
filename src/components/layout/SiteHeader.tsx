import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogIn, Plus, Bell, MessageCircle, User, LogOut, FileText, Bookmark, Sun, Moon, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/client/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialOf } from "@/lib/format";
import { ReportTypeModal } from "@/components/reports/ReportTypeModal";

const navItems = [
  { to: "/", label: "الرئيسية" },
  { to: "/lost", label: "المفقودات" },
  { to: "/found", label: "المعثورات" },
  { to: "/map", label: "الخريطة" },
  { to: "/how-it-works", label: "كيف تعمل المنصة" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery({
    queryKey: ["unread-notifications-count", user?.id],
    queryFn: async () => {
      if (!user) return { unreadCount: 0 };
      const res = await api.get<{ unreadCount: number }>("/notifications/unread-count");
      return res || { unreadCount: 0 };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.unreadCount || 0;

  const doSignOut = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={logo} alt="مفقوداتي Mafqudati" className="h-11 w-11 object-contain" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-lg font-extrabold text-primary-dark">مفقوداتي</span>
            <span className="text-[11px] font-medium text-primary tracking-wide">Mafqudati</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary bg-secondary" }}
              inactiveProps={{
                className: "text-foreground/70 hover:text-primary hover:bg-secondary/60",
              }}
              className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary transition-colors"
            aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الليلي"}
            title={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الليلي"}
          >
            {theme === "dark" ? (
              <Sun className="size-4 text-amber-400 animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="size-4 text-muted-foreground" />
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/notifications"
                className="relative hidden sm:inline-flex items-center justify-center rounded-lg p-2 hover:bg-secondary min-h-11 min-w-11"
                aria-label="الإشعارات"
              >
                <Bell className="size-5 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 start-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground shadow-sm animate-pulse">
                    {unreadCount > 99 ? "+99" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/messages"
                className="hidden sm:inline-flex items-center justify-center rounded-lg p-2 hover:bg-secondary min-h-11 min-w-11"
                aria-label="الرسائل"
              >
                <MessageCircle className="size-5 text-primary" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 hover:bg-secondary">
                  <div className="size-8 rounded-full bg-secondary text-primary flex items-center justify-center font-extrabold text-sm">
                    {initialOf(user.displayName ?? user.email)}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-right">
                    <div className="text-sm font-bold text-primary-dark truncate">
                      {user.displayName ?? "حسابي"}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex-row-reverse w-full">
                      <User className="size-4 ms-2" /> الملف الشخصي
                    </Link>
                  </DropdownMenuItem>
                  {(user.email?.toLowerCase() === "qayda079@gmail.com" ||
                    user.email?.toLowerCase() === "admin@mafqudati.ye" ||
                    user.email?.toLowerCase().startsWith("admin@")) && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex-row-reverse w-full text-primary font-bold bg-primary/10">
                        <ShieldCheck className="size-4 ms-2 text-primary" /> لوحة الإدارة والأمان
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      search={{ tab: "reports" } as never}
                      className="flex-row-reverse w-full"
                    >
                      <FileText className="size-4 ms-2" /> بلاغاتي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      search={{ tab: "saved" } as never}
                      className="flex-row-reverse w-full"
                    >
                      <Bookmark className="size-4 ms-2" /> المحفوظة
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={doSignOut}
                    className="text-destructive flex-row-reverse"
                  >
                    <LogOut className="size-4 ms-2" /> تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <LogIn className="size-4" />
              تسجيل الدخول
            </Link>
          )}
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
          >
            <Plus className="size-4" />
            أضف بلاغ
          </button>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-secondary min-h-11 min-w-11"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-primary bg-secondary" }}
                inactiveProps={{ className: "text-foreground/80" }}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setReportOpen(true);
              }}
              className="btn-gradient inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold mt-2"
            >
              <Plus className="size-4" />
              أضف بلاغ
            </button>
            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold border border-border bg-card hover:bg-secondary transition-colors mt-2"
            >
              <span className="flex items-center gap-2">
                {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
                <span>{theme === "dark" ? "الوضع الفاتح" : "الوضع الليلي"}</span>
              </span>
              <span className="text-xs text-muted-foreground">{theme === "dark" ? "داكن" : "فاتح"}</span>
            </button>

            {user ? (
              <>
                <Link
                  to="/messages"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold mt-2"
                >
                  الرسائل
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold"
                >
                  <span>الإشعارات</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold border border-border mt-2"
                >
                  الملف الشخصي
                </Link>
                {(user.email?.toLowerCase() === "qayda079@gmail.com" ||
                  user.email?.toLowerCase() === "admin@mafqudati.ye" ||
                  user.email?.toLowerCase().startsWith("admin@")) && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-primary bg-primary/10 border border-primary/20"
                  >
                    <ShieldCheck className="size-4" />
                    <span>لوحة الإدارة والأمان</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    doSignOut();
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-destructive text-right"
                >
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold border border-border mt-2"
              >
                تسجيل الدخول
              </Link>
            )}
          </nav>
        </div>
      )}
      <ReportTypeModal open={reportOpen} onOpenChange={setReportOpen} />
    </header>
  );
}
