import { useState, useEffect } from "react";
import { Bell, BellRing, Sparkles, MessageCircle, ShieldAlert, Volume2, VolumeX, Save, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/sound";
import { useAuth } from "@/lib/auth";

export interface UserNotificationSettings {
  messages: boolean;
  matches: boolean;
  statusUpdates: boolean;
  adminBroadcasts: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEY = "mafqudati_notification_preferences";

export function getStoredPreferences(): UserNotificationSettings {
  if (typeof window === "undefined") {
    return {
      messages: true,
      matches: true,
      statusUpdates: true,
      adminBroadcasts: true,
      soundEnabled: true,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read notification preferences:", e);
  }

  return {
    messages: true,
    matches: true,
    statusUpdates: true,
    adminBroadcasts: true,
    soundEnabled: true,
  };
}

export function NotificationPreferencesTab() {
  const { pushPermissionStatus, requestPushPermission } = useAuth();
  const [prefs, setPrefs] = useState<UserNotificationSettings>(getStoredPreferences());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrefs(getStoredPreferences());
  }, []);

  const handleToggle = (key: keyof UserNotificationSettings) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      toast.success("تم حفظ تفضيلات الإشعارات بنجاح");
    } catch (e) {
      toast.error("فشل حفظ التفضيلات");
    } finally {
      setSaving(false);
    }
  };

  const handleTestChime = () => {
    playNotificationSound();
    toast.success("تم تشغيل نغمة التنبيه التجريبية");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground">تفضيلات وقنوات الإشعارات</h2>
          <p className="text-xs text-muted-foreground mt-1">
            خصص أنواع التنبيهات والأصوات التي تود استقبالها على هاتفك وحاسوبك.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestChime}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors self-start sm:self-auto"
        >
          <Volume2 className="size-4 text-primary" />
          <span>تجربة نغمة الإشعار</span>
        </button>
      </div>

      {/* Push Status Banner */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-secondary/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="size-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BellRing className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">إذن إشعارات المتصفح (Web Push)</span>
              {pushPermissionStatus === "granted" ? (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  مفعل
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  غير مفعّل
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              تسمح هذه الميزة للنظام بتنبيهك حتى أثناء إغلاقك للمتصفح.
            </p>
          </div>
        </div>

        {pushPermissionStatus !== "granted" && (
          <button
            type="button"
            onClick={requestPushPermission}
            className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shrink-0 self-end sm:self-center shadow-sm"
          >
            <Bell className="size-3.5" />
            تفعيل الآن
          </button>
        )}
      </div>

      {/* Preferences List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">أنواع التنبيهات المستلمة</h3>

        {/* Matches */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="size-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-foreground">مطابقات الذكاء الاصطناعي للبلاغات</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                تنبيهك فوراً عند رصد مفقودات أو معثورات تتطابق مع مواصفات بلاغاتك المسجلة.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("matches")}
            className={`size-6 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
              prefs.matches ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {prefs.matches && <CheckCircle2 className="size-4" />}
          </button>
        </div>

        {/* Messages */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="size-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-foreground">رسائل المحادثات المباشرة</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                تنبيهك عند استلام رسالة جديدة من مواطن بخصوص أحد بلاغاتك المفتوحة.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("messages")}
            className={`size-6 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
              prefs.messages ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {prefs.messages && <CheckCircle2 className="size-4" />}
          </button>
        </div>

        {/* Status updates */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-xl bg-secondary text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="size-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-foreground">تحديثات حالة البلاغ</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                إشعارك عند اعتماد بلاغك، حله، أو إغلاقه بنجاح.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("statusUpdates")}
            className={`size-6 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
              prefs.statusUpdates ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {prefs.statusUpdates && <CheckCircle2 className="size-4" />}
          </button>
        </div>

        {/* Admin Broadcasts */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="size-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-foreground">التعاميم والتنبيهات الإدارية العاجلة</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                إشعارات السلامة الوطنية والتعاميم الصادرة من إدارة منصة مفقوداتي.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("adminBroadcasts")}
            className={`size-6 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
              prefs.adminBroadcasts ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {prefs.adminBroadcasts && <CheckCircle2 className="size-4" />}
          </button>
        </div>

        {/* Sounds */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              {prefs.soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </div>
            <div>
              <span className="text-sm font-extrabold text-foreground">النغمات والتنبيهات الصوتية الحركية (Haptics)</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                تشغيل نغمة لطيفة واهتزاز خفيف عند وصول رسالة جديدة أو إشعار فوري.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("soundEnabled")}
            className={`size-6 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
              prefs.soundEnabled ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {prefs.soundEnabled && <CheckCircle2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          حفظ التفضيلات
        </button>
      </div>
    </div>
  );
}
