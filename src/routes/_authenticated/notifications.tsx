import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { notificationsQuery } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { api } from "@/client/api/client";
import { Bell, CheckCircle2, MessageCircle } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "الإشعارات | مفقوداتي" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery(notificationsQuery(user?.id));

  useEffect(() => {
    if (!user) return;
    const unread = data.filter((n) => !n.read_at && !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    api
      .patch("/notifications/read", { ids: unread })
      .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .catch((e) => console.warn("Failed to mark notifications read:", e));
  }, [data, user, qc]);

  const icon = (t: string) =>
    t === "match" ? CheckCircle2 : t === "message" ? MessageCircle : Bell;

  return (
    <PageShell title="الإشعارات" subtitle="تحديثات فورية عن بلاغاتك ورسائلك">
      {data.length === 0 ? (
        <div className="card-soft max-w-3xl mx-auto rounded-3xl py-16 text-center">
          <Bell className="mx-auto size-14 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">لا توجد إشعارات بعد</p>
        </div>
      ) : (
        <ul className="max-w-3xl mx-auto space-y-3">
          {data.map((n) => {
            const Icon = icon(n.type);
            const isRead = !!n.read_at || !!n.read;
            const content = (
              <li
                className={`card-soft rounded-2xl p-5 flex gap-4 ${!isRead ? "border-primary/40" : ""}`}
              >
                <div className="size-11 shrink-0 rounded-xl bg-secondary text-primary flex items-center justify-center">
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-primary-dark">{n.title}</h3>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                </div>
              </li>
            );
            return n.link ? (
              <Link key={n.id} to={n.link}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
