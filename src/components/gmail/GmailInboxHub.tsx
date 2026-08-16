import { useState, useEffect, useCallback } from "react";
import {
  requestGmailAccessToken,
  getGmailAccessToken,
  fetchGmailProfile,
  listGmailMessages,
  type GmailProfile,
  type GmailMessageSummary,
} from "@/lib/gmail";
import { Mail, RefreshCw, CheckCircle2, Inbox, ExternalLink, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function GmailInboxHub() {
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("مفقوداتي OR lost OR found");

  const checkConnectionAndLoad = useCallback(
    async (forceAuth = false) => {
      setLoading(true);
      try {
        let token = getGmailAccessToken();
        if (!token && forceAuth) {
          token = await requestGmailAccessToken();
        }

        if (token) {
          setConnected(true);
          const userProfile = await fetchGmailProfile(token);
          setProfile(userProfile);

          const msgs = await listGmailMessages(searchQuery, 6, token);
          setMessages(msgs);
        } else {
          setConnected(false);
        }
      } catch (err: unknown) {
        console.error("Gmail hub load error:", err);
        if (forceAuth) {
          const msg = err instanceof Error ? err.message : "تعذّر الاتصال بخدمة Gmail";
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    // Check if we already have a cached token
    if (getGmailAccessToken()) {
      checkConnectionAndLoad(false);
    }
  }, [checkConnectionAndLoad]);

  return (
    <div className="card-soft rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
            <Mail className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-primary-dark">بريد Gmail المرتبط</h3>
            <p className="text-xs text-muted-foreground">
              متابعة الرسائل والاستفسارات المتعلقة بالبلاغات عبر Gmail
            </p>
          </div>
        </div>

        {connected ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="size-3.5" /> {profile?.emailAddress || "متصل"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => checkConnectionAndLoad(false)}
              disabled={loading}
              className="size-8 p-0"
              title="تحديث الرسائل"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => checkConnectionAndLoad(true)}
            disabled={loading}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            ربط والتحقق من Gmail
          </Button>
        )}
      </div>

      {connected ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في رسائل Gmail (مثل: مفقوداتي، محفظة، بطاقة)..."
                className="input text-xs pl-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") checkConnectionAndLoad(false);
                }}
              />
              <Search className="size-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => checkConnectionAndLoad(false)}
              disabled={loading}
              className="text-xs"
            >
              بحث
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span>الرسائل الأخيرة ذات الصلة</span>
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                فتح Gmail <ExternalLink className="size-3" />
              </a>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                <Loader2 className="size-4 animate-spin" /> جارِ جلب الرسائل...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                <Inbox className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                لا توجد رسائل مطابقة لبحثك في صندوق البريد حالياً.
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden bg-background">
                {messages.map((m) => (
                  <div key={m.id} className="p-3.5 hover:bg-secondary/40 transition-colors text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-primary-dark truncate max-w-[200px] sm:max-w-[300px]">
                        {m.from}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{m.date}</span>
                    </div>
                    <div className="font-semibold text-foreground mt-0.5">{m.subject}</div>
                    {m.snippet && (
                      <p className="text-muted-foreground text-[11px] line-clamp-1 mt-1 font-normal">
                        {m.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-3">
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            يمكنك ربط حسابك في Gmail لاستقبال إشعارات البلاغات، وإرسال استفسارات مباشرة للمُبلّغين
            عبر البريد الإلكتروني بكل سهولة وموثوقية.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkConnectionAndLoad(true)}
            disabled={loading}
            className="gap-2"
          >
            <Mail className="size-4 text-rose-500" /> تفعيل مزامنة Gmail
          </Button>
        </div>
      )}
    </div>
  );
}
