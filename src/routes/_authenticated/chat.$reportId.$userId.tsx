import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/client/api/client";
import { PageShell } from "@/components/layout/PageShell";
import { MessageCircle, Send, Loader2, ArrowRight } from "lucide-react";
import { timeAgo, initialOf } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat/$reportId/$userId")({
  component: ChatPage,
});

function ChatPage() {
  const { reportId, userId } = Route.useParams();
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat", reportId, userId],
    queryFn: async () => {
      const res = await api.get(`/messages/${reportId}/${userId}`);
      return res.data as any[];
    },
    refetchInterval: 5000,
  });

  const sendMsg = useMutation({
    mutationFn: async (msgText: string) => {
      const res = await api.post("/messages", {
        report_id: reportId,
        receiver_id: userId,
        body: msgText,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", reportId, userId] });
      setBody("");
    },
    onError: () => {
      toast.error("تعذر إرسال الرسالة");
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const otherUser = messages?.find(m => m.sender_id === userId)?.sender || 
                    messages?.find(m => m.receiver_id === userId)?.receiver;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-4 bg-background z-10 sticky top-0">
          <Link to="/messages" className="p-2 hover:bg-muted rounded-full">
            <ArrowRight className="size-5" />
          </Link>
          {otherUser ? (
            <div className="flex items-center gap-3">
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {initialOf(otherUser.full_name)}
                </div>
              )}
              <h2 className="font-bold">{otherUser.full_name}</h2>
            </div>
          ) : (
             <h2 className="font-bold">محادثة</h2>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="text-center py-16 card-soft rounded-3xl mt-8">
              <MessageCircle className="mx-auto size-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-bold text-lg">بدء محادثة جديدة</h3>
              <p className="text-muted-foreground text-sm">أرسل رسالتك الأولى الآن.</p>
            </div>
          ) : (
            messages?.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-muted rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                    {timeAgo(new Date(msg.created_at))}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form 
          className="p-4 bg-background border-t border-border flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim() && !sendMsg.isPending) {
              sendMsg.mutate(body.trim());
            }
          }}
        >
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-muted/50 rounded-2xl p-3 max-h-32 min-h-[50px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (body.trim() && !sendMsg.isPending) {
                  sendMsg.mutate(body.trim());
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={!body.trim() || sendMsg.isPending}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 shrink-0 mb-0.5"
          >
            {sendMsg.isPending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 -mr-1" />}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
