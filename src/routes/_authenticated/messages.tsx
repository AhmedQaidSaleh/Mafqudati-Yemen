import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/client/api/client";
import { PageShell } from "@/components/layout/PageShell";
import { MessageCircle, Search, User } from "lucide-react";
import { formatYER, timeAgo, initialOf } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data as any[];
    },
    refetchInterval: 10000,
  });

  return (
    <PageShell title="الرسائل" description="تواصل مع أصحاب البلاغات">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-extrabold mb-6">صندوق الوارد</h1>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-2xl" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="text-center py-16 card-soft rounded-3xl">
            <MessageCircle className="mx-auto size-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-bold text-lg mb-2">لا توجد رسائل</h3>
            <p className="text-muted-foreground text-sm">
              ستظهر هنا محادثاتك بخصوص البلاغات المفقودة أو المعثور عليها.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations?.map((conv) => (
              <Link
                key={`${conv.report_id}_${conv.other_user.id}`}
                to="/chat/$reportId/$userId"
                params={{ reportId: conv.report_id, userId: conv.other_user.id }}
                className="flex items-center gap-4 p-4 card-soft hover:bg-muted/50 transition-colors rounded-2xl relative"
              >
                <div className="relative">
                  {conv.other_user.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {initialOf(conv.other_user.full_name)}
                    </div>
                  )}
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold truncate">{conv.other_user.full_name}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap mr-3">
                      {timeAgo(new Date(conv.last_message.created_at))}
                    </span>
                  </div>
                  <p className="text-sm text-primary/80 font-medium truncate mb-1">
                    بخصوص: {conv.report_title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message.sender_id === user?.id && "أنت: "}
                    {conv.last_message.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
