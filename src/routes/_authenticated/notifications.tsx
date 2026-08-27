import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { notificationsQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { api } from "@/client/api/client";
import {
  Bell,
  BellRing,
  CheckCircle2,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Send,
  Loader2,
  CheckCheck,
  Smartphone,
  Trash2,
  Filter,
  Check,
  Search,
  Volume2,
  SlidersHorizontal,
} from "lucide-react";
import { timeAgo } from "@/lib/format";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "الإشعارات | مفقوداتي" }] }),
  component: NotificationsPage,
});

type NotificationFilter = "ALL" | "UNREAD" | "MATCH" | "MESSAGE" | "STATUS" | "ADMIN";

function NotificationsPage() {
  const { user, pushPermissionStatus, requestPushPermission } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(notificationsQuery(user?.id));
  const [testingPush, setTestingPush] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingRead, setClearingRead] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await api.post<{
        success: boolean;
        hasFcmToken: boolean;
        fcmPushSent: boolean;
        fcmError?: string;
      }>("/notifications/test-push");

      if (res.data.success) {
        playNotificationSound();
        toast.success("تم إرسال الإشعار التجريبي بنجاح!");
        qc.invalidateQueries({ queryKey: ["notifications"] });
        qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
      }
    } catch (err) {
      console.error("Test push failed:", err);
      toast.error("تعذر إرسال الإشعار التجريبي حالياً");
    } finally {
      setTestingPush(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post("/notifications/read-all");
      toast.success("تم تمييز جميع الإشعارات كمقروءة");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    } catch (err) {
      console.error("Mark all read failed:", err);
      toast.error("تعذر التحديث حالياً");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClearReadNotifications = async () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في مسح وتنظيف كافة الإشعارات المقروءة من سجلك؟")) {
      return;
    }
    setClearingRead(true);
    try {
      await api.delete("/notifications/clear-read");
      toast.success("تم مسح الإشعارات المقروءة بنجاح");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    } catch (err) {
      toast.error("فشل مسح الإشعارات");
    } finally {
      setClearingRead(false);
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      toast.success("تم حذف الإشعار");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    } catch (err) {
      toast.error("فشل حذف الإشعار");
    }
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "match":
      case "MATCH":
        return { icon: Sparkles, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "message":
      case "MESSAGE":
        return { icon: MessageCircle, bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case "REPORT_STATUS":
      case "status":
        return { icon: CheckCircle2, bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" };
      case "ADMIN_BROADCAST":
        return { icon: ShieldAlert, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case "SYSTEM_TEST":
        return { icon: Volume2, bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      default:
        return { icon: Bell, bg: "bg-secondary text-primary" };
    }
  };

  const unreadCount = data.filter((n) => !n.read_at && !n.read).length;
  const readCount = data.filter((n) => n.read_at || n.read).length;

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return data.filter((n) => {
      // 1. Text search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const matchesBody = n.body?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBody) return false;
      }

      // 2. Tab filter
      const isRead = !!n.read_at || !!n.read;
      const type = (n.type || "").toUpperCase();

      if (activeFilter === "UNREAD") return !isRead;
      if (activeFilter === "MATCH") return type === "MATCH";
      if (activeFilter === "MESSAGE") return type === "MESSAGE";
      if (activeFilter === "STATUS") return type === "REPORT_STATUS" || type === "STATUS";
      if (activeFilter === "ADMIN") return type === "ADMIN_BROADCAST";

      return true;
    });
  }, [data, activeFilter, searchQuery]);

  return (
    <PageShell title="مركز الإشعارات والتنبيهات" subtitle="تنبيهات فورية ومباشرة عن بلاغاتك ومطابقات الذكاء الاصطناعي">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Device Push Notification Activation Card */}
        <div className="card-soft rounded-3xl p-5 sm:p-6 border border-border/80 shadow-sm bg-gradient-to-br from-card to-secondary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="size-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Smartphone className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-foreground">
                    إشعارات الويب والأجهزة (Web Push)
                  </h2>
                  {pushPermissionStatus === "granted" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      🟢 مفعلة
                    </span>
                  ) : pushPermissionStatus === "denied" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive border border-destructive/30">
                      🔴 محظورة بالمتصفح
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      🟡 غير مفعلة
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {pushPermissionStatus === "granted"
                    ? "الإشعارات الفورية تعمل بنجاح. ستصلك التنبيهات في الخلفية حتى عند إغلاق التطبيق."
                    : pushPermissionStatus === "denied"
                    ? "تم حظر الإشعارات من إعدادات متصفحك. يرجى السماح بالإشعارات من أيقونة القفل بجانب شريط العنوان."
                    : "قم بتفعيل الإشعارات لتصلك تنبيهات فورية لحظة مطابقة مفقوداتك أو استلام رسائل جديدة."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {pushPermissionStatus !== "granted" ? (
                <button
                  type="button"
                  onClick={requestPushPermission}
                  className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm"
                >
                  <BellRing className="size-4" />
                  تفعيل الإشعارات
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTestPush}
                  disabled={testingPush}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors disabled:opacity-50 shadow-sm"
                >
                  {testingPush ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 text-primary" />}
                  إرسال إشعار تجريبي
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في الإشعارات..."
                className="w-full rounded-2xl border border-border bg-card pr-10 pl-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {data.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-primary hover:bg-secondary transition-colors disabled:opacity-50 shadow-sm"
                >
                  {markingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}

              {readCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearReadNotifications}
                  disabled={clearingRead}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shadow-sm"
                  title="مسح الإشعارات المقروءة لتنظيم القائمة"
                >
                  {clearingRead ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  <span>مسح المقروءة</span>
                </button>
              )}

              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shadow-sm"
                title="تفضيلات الإشعارات"
              >
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">التفضيلات</span>
              </Link>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            {[
              { id: "ALL", label: `الكل (${data.length})` },
              { id: "UNREAD", label: `غير المقروءة (${unreadCount})` },
              { id: "MATCH", label: "المطابقات الذكية 🎯" },
              { id: "MESSAGE", label: "المحادثات 💬" },
              { id: "STATUS", label: "تحديثات البلاغات 📋" },
              { id: "ADMIN", label: "التعاميم الإدارية 📢" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as NotificationFilter)}
                className={`rounded-xl px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  activeFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="card-soft rounded-3xl py-16 text-center">
            <Loader2 className="mx-auto size-8 text-primary animate-spin" />
            <p className="mt-3 text-xs text-muted-foreground">جاري تحميل الإشعارات...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card-soft rounded-3xl py-16 text-center">
            <Bell className="mx-auto size-14 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-bold text-foreground">لا توجد إشعارات مطابقة</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery
                ? "لا توجد نتائج تطابق بحثك الحالي."
                : "ستظهر هنا تنبيهات المطابقات الذكية والرسائل الجديدة وتحديثات بلاغاتك."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredNotifications.map((n) => {
              const { icon: Icon, bg } = iconForType(n.type);
              const isRead = !!n.read_at || !!n.read;

              const handleItemClick = async () => {
                if (!isRead) {
                  try {
                    await api.patch("/notifications/read", { ids: [n.id] });
                    qc.invalidateQueries({ queryKey: ["notifications"] });
                    qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
                  } catch (e) {
                    console.warn("Mark read error:", e);
                  }
                }
              };

              const content = (
                <div
                  onClick={handleItemClick}
                  className={`group card-soft rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all hover:border-primary/50 cursor-pointer relative ${
                    !isRead ? "border-primary/40 bg-primary/[0.02] shadow-sm" : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className={`size-11 shrink-0 rounded-2xl flex items-center justify-center ${bg}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {!isRead && <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />}
                        <h3 className={`text-sm font-extrabold truncate ${!isRead ? "text-primary dark:text-primary-foreground font-black" : "text-foreground"}`}>
                          {n.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(e, n.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity size-7 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                          title="حذف هذا الإشعار"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {n.body && <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{n.body}</p>}
                  </div>
                </div>
              );

              return n.link ? (
                <Link key={n.id} to={n.link} className="block focus:outline-none">
                  {content}
                </Link>
              ) : (
                <li key={n.id} className="list-none">
                  {content}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
