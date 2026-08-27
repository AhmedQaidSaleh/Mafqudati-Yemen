import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  UserX,
  FileCheck2,
  FileClock,
  Bell,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  AlertTriangle,
  ExternalLink,
  Trash2,
  UserCheck,
  Check,
  X,
  Megaphone,
  Radio,
  SlidersHorizontal,
  Ban,
  Lock,
  Unlock,
  AlertOctagon,
} from "lucide-react";
import { api } from "@/client/api/client";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { profileQuery } from "@/lib/queries";
import { toast } from "sonner";

interface AdminSummaryData {
  stats: {
    users: number;
    verifiedUsers: number;
    reports: number;
    lost: number;
    found: number;
    resolved: number;
    missingPersons: number;
    pendingVerifications: number;
    fcmSubscribers?: number;
  };
  missingPersons: Array<{
    id: string;
    title: string;
    description: string;
    type: "lost" | "found";
    status: "active" | "resolved" | "closed";
    category_id?: number;
    governorate_id?: number;
    location_text?: string;
    incident_date?: string;
    primary_image?: string;
    images?: Array<{ url: string }>;
    contact_preference?: string;
    created_at: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
  }>;
  pendingVerifications: Array<{
    id: string;
    title: string;
    description: string;
    type: "lost" | "found";
    status: "active" | "resolved" | "closed";
    created_at: string;
    user_name?: string;
    user_email?: string;
    user_phone?: string;
  }>;
  recentNotifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    created_at: string;
    user_name?: string;
    user_email?: string;
  }>;
  recentReports: Array<{
    id: string;
    title: string;
    type: "lost" | "found";
    status: "active" | "resolved" | "closed";
    created_at: string;
  }>;
}

interface AdminUserItem {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "USER" | "ADMIN";
  is_restricted?: boolean;
  avatar_url?: string;
  created_at: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useQuery(profileQuery(user?.id));
  const [data, setData] = useState<AdminSummaryData | null>(null);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "missing_persons" | "reports" | "notifications" | "users">("overview");

  // Broadcast modal state
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Search and actions state
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "restricted" | "admin" | "user">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const summary = await api.get<AdminSummaryData>("/admin/dashboard-summary");
      setData(summary);
    } catch (err) {
      console.error("Failed to load admin summary:", err);
      // Fallback to basic stats if summary route is loading
      try {
        const stats = await api.get<{ users: number; reports: number }>("/admin/stats");
        setData({
          stats: {
            users: stats.users || 0,
            verifiedUsers: 0,
            reports: stats.reports || 0,
            lost: 0,
            found: 0,
            resolved: 0,
            missingPersons: 0,
            pendingVerifications: 0,
          },
          missingPersons: [],
          pendingVerifications: [],
          recentNotifications: [],
          recentReports: [],
        });
      } catch (statsErr) {
        toast.error("فشل في تحميل بيانات لوحة الإدارة");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get<AdminUserItem[]>("/admin/users");
      setUsersList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setProcessingId(reportId);
    try {
      await api.patch(`/admin/reports/${reportId}/status`, { status: newStatus });
      toast.success(
        newStatus === "active"
          ? "تم تفعيل واعتماد البلاغ بنجاح"
          : newStatus === "resolved"
          ? "تم وسم البلاغ كمسترجع ومكتمل"
          : "تم تحديث حالة البلاغ"
      );
      loadDashboardData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل تحديث الحالة";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا البلاغ نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    setProcessingId(reportId);
    try {
      await api.delete(`/admin/reports/${reportId}`);
      toast.success("تم حذف البلاغ بنجاح");
      loadDashboardData();
    } catch (err) {
      toast.error("فشل حذف البلاغ");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleUserRole = async (targetUser: AdminUserItem) => {
    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await api.patch(`/admin/users/${targetUser.id}`, { role: newRole });
      toast.success(newRole === "ADMIN" ? "تمت ترقية المستخدم إلى مدير" : "تم تحويل المستخدم إلى عضو عادي");
      loadUsers();
      loadDashboardData();
    } catch (err) {
      toast.error("فشل تعديل رتبة المستخدم");
    }
  };

  const handleToggleRestrictUser = async (targetUser: AdminUserItem) => {
    if (targetUser.id === profile?.id || targetUser.email?.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("لا يمكنك تقييد حسابك الحالي");
      return;
    }
    const newStatus = !targetUser.is_restricted;
    const actionText = newStatus ? "تقييد وحظر" : "إلغاء تقييد";
    if (!window.confirm(`هل أنت متأكد من رغبتك في ${actionText} حساب المستخدم (${targetUser.full_name || targetUser.email})؟`)) {
      return;
    }
    setProcessingId(targetUser.id);
    try {
      await api.patch(`/admin/users/${targetUser.id}/restrict`, { is_restricted: newStatus });
      toast.success(newStatus ? "تم تقييد الحساب بنجاح ومنع العمليات" : "تم إلغاء تقييد الحساب وإعادته للعمل");
      loadUsers();
      loadDashboardData();
    } catch (err: any) {
      toast.error(err?.message || "فشل تعديل حالة تقييد الحساب");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (targetUser: AdminUserItem) => {
    if (targetUser.id === profile?.id || targetUser.email?.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("لا يمكنك حذف حسابك الحالي كمدير للنظام");
      return;
    }
    const confirmDelete = window.confirm(
      `⚠️ تحذير أمني:\nهل أنت متأكد من حذف حساب (${targetUser.full_name || targetUser.email}) نهائياً؟\n\nسيتم حذف كافة بلاغاته وصوره ورسائله وسجلاته بالكامل من قاعدة البيانات. لا يمكن التراجع عن هذا الإجراء!`
    );
    if (!confirmDelete) return;

    setProcessingId(targetUser.id);
    try {
      await api.delete(`/admin/users/${targetUser.id}`);
      toast.success("تم حذف حساب المستخدم وكافة بياناته نهائياً");
      loadUsers();
      loadDashboardData();
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف حساب المستخدم");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error("يرجى كتابة العنوان والتفاصيل");
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>("/admin/broadcast-notification", {
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
      });
      toast.success(res.message || "تم إرسال التنبيه العام لجميع المستخدمين");
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastOpen(false);
      loadDashboardData();
    } catch (err) {
      toast.error("فشل إرسال التنبيه");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Check admin role
  const isAuthorized =
    profile?.role === "ADMIN" ||
    user?.email?.toLowerCase() === "qayda079@gmail.com" ||
    user?.email?.toLowerCase() === "admin@mafqudati.ye" ||
    user?.email?.toLowerCase().startsWith("admin@");

  if (!isProfileLoading && !isAuthorized) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center" dir="rtl">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="text-2xl font-black text-foreground">منطقة محمية - مخصصة لمديري المنصة</h1>
        <p className="mt-3 text-muted-foreground text-sm">
          أنت مسجل بالبريد: <strong className="text-foreground">{user?.email || "غير مسجل"}</strong>. هذه اللوحة متاحة فقط لمديري النظام (Administrators).
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const missingPersons = data?.missingPersons || [];
  const recentNotifications = data?.recentNotifications || [];
  const recentReports = data?.recentReports || [];

  const filteredPersons = missingPersons.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.user_name && p.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <ShieldCheck className="size-3.5" />
            <span>لوحة الإدارة المركزية والأمان</span>
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-cairo">
            إدارة المنصة والمفقودين
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إحصائيات فورية، متابعة بلاغات الأشخاص المفقودين، مراجعة الحالات، وتعميم الإشعارات للمواطنين.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all"
          >
            <Megaphone className="size-4" />
            <span>إرسال تعميم عاجل</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loadDashboardData();
              if (activeTab === "users") loadUsers();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-secondary px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Missing Persons */}
        <div
          onClick={() => setActiveTab("missing_persons")}
          className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all ${
            activeTab === "missing_persons"
              ? "border-rose-500/60 bg-rose-500/10 shadow-sm"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">بلاغات المفقودين</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
              <UserX className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-500 font-cairo">
            {stats?.missingPersons ?? "..."}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
            <AlertTriangle className="size-3 text-rose-500" />
            <span>حالات ذات أولوية إنسانية</span>
          </div>
        </div>

        {/* Total Reports */}
        <div
          onClick={() => setActiveTab("overview")}
          className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all ${
            activeTab === "overview"
              ? "border-primary/60 bg-primary/10 shadow-sm"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">إجمالي البلاغات</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileCheck2 className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-foreground font-cairo">
            {stats?.reports ?? "..."}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="text-primary font-bold">{stats?.resolved ?? 0} تم استرجاعها</span>
            <span>•</span>
            <span>{stats?.lost ?? 0} مفقود</span>
          </div>
        </div>

        {/* Total Registered Users */}
        <div
          onClick={() => setActiveTab("users")}
          className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all ${
            activeTab === "users"
              ? "border-blue-500/60 bg-blue-500/10 shadow-sm"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">المستخدمون المسجلون</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-foreground font-cairo">
            {stats?.users ?? "..."}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
            <UserCheck className="size-3 text-blue-500" />
            <span>حسابات نشطة في المنصة</span>
          </div>
        </div>

        {/* Activity & Notifications */}
        <div
          onClick={() => setActiveTab("notifications")}
          className={`cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all ${
            activeTab === "notifications"
              ? "border-amber-500/60 bg-amber-500/10 shadow-sm"
              : "border-border bg-card hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">التنبيهات والنشاط</span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
              <Bell className="size-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-amber-500 font-cairo">
            {recentNotifications.length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
            <Clock className="size-3 text-amber-500" />
            <span>سجل إشعارات وتنبيهات</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Radio className="size-4" />
          <span>نظرة شاملة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("missing_persons")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            activeTab === "missing_persons"
              ? "bg-rose-500 text-white shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserX className="size-4" />
          <span>الأشخاص المفقودون ({missingPersons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            activeTab === "notifications"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="size-4" />
          <span>سجل التنبيهات ({recentNotifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            activeTab === "users"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-4" />
          <span>إدارة المستخدمين</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Missing Persons Spotlight */}
            {missingPersons.length > 0 && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-sm sm:text-base">
                    <UserX className="size-5" />
                    <span>أحدث بلاغات الأشخاص المفقودين المسجلة</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("missing_persons")}
                    className="text-xs font-bold text-rose-500 hover:underline"
                  >
                    عرض الكل ({missingPersons.length})
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {missingPersons.slice(0, 3).map((person) => (
                    <div key={person.id} className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
                      <div className="flex items-start gap-3">
                        {person.primary_image ? (
                          <img
                            src={person.primary_image}
                            alt={person.title}
                            className="size-14 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="flex size-14 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 font-bold">
                            <UserX className="size-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-bold text-foreground truncate">{person.title}</h4>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                person.status === "resolved"
                                  ? "bg-emerald-500/15 text-emerald-500"
                                  : "bg-rose-500/15 text-rose-500"
                              }`}
                            >
                              {person.status === "resolved" ? "تم العثور عليه" : "مفقود"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{person.description}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{new Date(person.created_at).toLocaleDateString("ar-YE")}</span>
                            <Link to="/report/$id" params={{ id: person.id }} className="text-primary font-bold hover:underline">
                              معاينة
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent System Notifications */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-primary" />
                    <h3 className="text-base font-bold text-foreground">أحدث الإشعارات والتنبيهات</h3>
                  </div>
                  <button onClick={() => setActiveTab("notifications")} className="text-xs text-primary font-bold hover:underline">
                    المزيد
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {recentNotifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      لا توجد تنبيهات مسجلة مؤخراً
                    </div>
                  ) : (
                    recentNotifications.slice(0, 4).map((n) => (
                      <div key={n.id} className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                          <Bell className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{n.title}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(n.created_at).toLocaleDateString("ar-YE")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            المستلم: <span className="font-semibold text-foreground">{n.user_name || n.user_email || "مستخدم"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Reports in App */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="size-4 text-primary" />
                    <h3 className="text-base font-bold text-foreground">أحدث البلاغات المضافة</h3>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">تحديث مباشر</span>
                </div>

                <div className="mt-4 space-y-3">
                  {recentReports.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      لا توجد بلاغات مسجلة
                    </div>
                  ) : (
                    recentReports.slice(0, 4).map((rep) => (
                      <div key={rep.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${rep.type === "lost" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                              {rep.type === "lost" ? "مفقود" : "معثور عليه"}
                            </span>
                            <span className="text-xs font-bold text-foreground truncate">{rep.title}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground mt-1 block">
                            {new Date(rep.created_at).toLocaleDateString("ar-YE")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            to="/report/$id"
                            params={{ id: rep.id }}
                            className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(rep.id)}
                            className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-card text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MISSING PERSONS */}
        {activeTab === "missing_persons" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">سجل بلاغات الأشخاص المفقودين</h3>
                <p className="text-xs text-muted-foreground">
                  متابعة وتدقيق بلاغات المفقودين في اليمن للتنسيق والتواصل الفوري.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في بلاغات المفقودين..."
                  className="w-full rounded-xl border border-border bg-card pr-9 pl-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {filteredPersons.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
                <UserX className="size-12 mx-auto mb-3 opacity-40 text-rose-500" />
                <p className="text-base font-bold text-foreground">لا توجد بلاغات أشخاص مفقودين مطابقة</p>
                <p className="text-xs mt-1">تأكد من اختيار تصنيف الأشخاص عند تسجيل البلاغ.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPersons.map((item) => (
                  <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            item.status === "resolved"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-rose-500/15 text-rose-500"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {item.status === "resolved" ? "تم العثور عليه" : "مفقود (نشط)"}
                        </span>

                        <span className="text-[11px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("ar-YE")}
                        </span>
                      </div>

                      <div className="mt-3 flex items-start gap-3">
                        {item.primary_image ? (
                          <img
                            src={item.primary_image}
                            alt={item.title}
                            className="size-16 rounded-xl object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="flex size-16 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 font-bold shrink-0">
                            <UserX className="size-7" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-foreground truncate">{item.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 rounded-xl bg-secondary/50 p-2.5 text-xs text-muted-foreground">
                        {item.location_text && (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3 text-primary" />
                            <span>{item.location_text}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                          المبلغ: {item.user_name || item.user_email || "مستخدم مسجل"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div>
                        {item.status !== "resolved" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, "resolved")}
                            disabled={processingId === item.id}
                            className="rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white px-2.5 py-1 text-xs font-bold transition-all"
                          >
                            تم العثور عليه
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Link
                          to="/report/$id"
                          params={{ id: item.id }}
                          className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
                          title="عرض البلاغ"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(item.id)}
                          disabled={processingId === item.id}
                          className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-card text-destructive hover:bg-destructive/10"
                          title="حذف البلاغ"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">سجل إشعارات وتنبيهات النظام</h3>
                <p className="text-xs text-muted-foreground">
                  مراقبة الإشعارات المرسلة للمواطنين وإرسال تعميمات عاجلة وفورية لجميع الأجهزة.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  📱 أجهزة مشتركة بالـ Push: {stats?.fcmSubscribers ?? 0}
                </span>

                <button
                  type="button"
                  onClick={() => setBroadcastOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-sm"
                >
                  <Send className="size-3.5" />
                  <span>إرسال تعميم جديد</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {recentNotifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Bell className="size-12 mx-auto mb-2 opacity-30" />
                  <p>لا توجد إشعارات مسجلة</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentNotifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-secondary/20 transition-colors flex items-start gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <Bell className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-sm font-bold text-foreground">{notif.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notif.created_at).toLocaleString("ar-YE")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{notif.body}</p>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          المستلم: <strong className="text-foreground">{notif.user_name || notif.user_email || "مستخدم"}</strong> • النوع: {notif.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: USERS */}
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">دليل المستخدمين وإدارة الحسابات</h3>
                <p className="text-xs text-muted-foreground">
                  مراجعة حسابات المواطنين، تقييد أو حظر الحسابات المخالفة، وحذف الحسابات نهائياً.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-muted-foreground">
                  إجمالي المستخدمين: {usersList.length}
                </span>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="size-8 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground"
                  title="تحديث القائمة"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                  className="w-full rounded-xl border border-border bg-card pr-10 pl-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {userSearchQuery && (
                  <button
                    onClick={() => setUserSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    مسح
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setUserFilter("all")}
                  className={`rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    userFilter === "all"
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  الكل ({usersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserFilter("restricted")}
                  className={`rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    userFilter === "restricted"
                      ? "bg-amber-500 text-white"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  المقيدة ({usersList.filter((u) => u.is_restricted).length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserFilter("admin")}
                  className={`rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    userFilter === "admin"
                      ? "bg-rose-500 text-white"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  المدراء ({usersList.filter((u) => u.role === "ADMIN").length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserFilter("user")}
                  className={`rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                    userFilter === "user"
                      ? "bg-secondary text-foreground font-black"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  النشطة العادية
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="p-3.5">المستخدم</th>
                      <th className="p-3.5">البريد الإلكتروني</th>
                      <th className="p-3.5">الهاتف</th>
                      <th className="p-3.5">الصلاحية</th>
                      <th className="p-3.5">حالة الحساب</th>
                      <th className="p-3.5 text-center">إجراءات الحساب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersList
                      .filter((u) => {
                        const matchesSearch =
                          !userSearchQuery.trim() ||
                          u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          (u.phone && u.phone.includes(userSearchQuery));

                        if (!matchesSearch) return false;

                        if (userFilter === "restricted") return u.is_restricted === true;
                        if (userFilter === "admin") return u.role === "ADMIN";
                        if (userFilter === "user") return u.role === "USER" && !u.is_restricted;
                        return true;
                      })
                      .map((u) => {
                        const isCurrentAdmin =
                          u.id === profile?.id ||
                          u.email?.toLowerCase() === user?.email?.toLowerCase();

                        return (
                          <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3.5 font-bold text-foreground">
                              <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                  {u.full_name?.charAt(0) || "م"}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{u.full_name || "مستخدم"}</span>
                                    {isCurrentAdmin && (
                                      <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold">
                                        حسابك
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    انضم: {new Date(u.created_at).toLocaleDateString("ar-YE")}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-muted-foreground">{u.email}</td>
                            <td className="p-3.5 text-muted-foreground" dir="ltr">
                              {u.phone || "—"}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                  u.role === "ADMIN"
                                    ? "bg-rose-500/15 text-rose-500"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {u.role === "ADMIN" ? "مدير نظام 🛡️" : "مواطن"}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {u.is_restricted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  <Ban className="size-3" />
                                  مقيد / محظور
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="size-3" />
                                  نشط
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Restrict / Unrestrict Button */}
                                <button
                                  type="button"
                                  disabled={isCurrentAdmin || processingId === u.id}
                                  onClick={() => handleToggleRestrictUser(u)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                    isCurrentAdmin
                                      ? "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground"
                                      : u.is_restricted
                                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20"
                                      : "bg-amber-500/10 border border-amber-500/30 text-amber-600 hover:bg-amber-500/20"
                                  }`}
                                  title={u.is_restricted ? "فك التقييد عن المستخدم" : "تقييد وحظر هذا الحساب"}
                                >
                                  {u.is_restricted ? (
                                    <>
                                      <Unlock className="size-3.5" />
                                      <span>فك التقييد</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="size-3.5" />
                                      <span>تقييد الحساب</span>
                                    </>
                                  )}
                                </button>

                                {/* Toggle Role Button */}
                                <button
                                  type="button"
                                  disabled={isCurrentAdmin || processingId === u.id}
                                  onClick={() => handleToggleUserRole(u)}
                                  className="rounded-lg border border-border bg-secondary hover:bg-secondary/80 px-2.5 py-1 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                  title={u.role === "ADMIN" ? "تنزيل الرتبة إلى مستخدم" : "ترقية إلى مدير نظام"}
                                >
                                  {u.role === "ADMIN" ? "تنزيل لمستخدم" : "ترقية لمدير"}
                                </button>

                                {/* Delete User Button */}
                                <button
                                  type="button"
                                  disabled={isCurrentAdmin || processingId === u.id}
                                  onClick={() => handleDeleteUser(u)}
                                  className={`inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-500 transition-colors ${
                                    isCurrentAdmin ? "opacity-30 cursor-not-allowed" : ""
                                  }`}
                                  title="حذف هذا الحساب نهائياً مع كافة بلاغاته"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>حذف</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="size-5 text-amber-500" />
                <h3 className="text-lg font-bold text-foreground">إرسال تعميم أو تنبيه عام</h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="size-8 rounded-lg border border-border text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  عنوان التنبيه <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="مثال: تعميم هام بشأن حالات المفقودين"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  نص التنبيه <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="اكتب تفاصيل التنبيه لجميع مستخدمي المنصة..."
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setBroadcastOpen(false)}
                  className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                  <span>{sendingBroadcast ? "جارِ الإرسال..." : "إرسال التنبيه الآن"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
