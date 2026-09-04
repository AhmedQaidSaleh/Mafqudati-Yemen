import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/client/api/client";
import { PageShell } from "@/components/layout/PageShell";
import { MessageCircle, Loader2, ShieldCheck, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { MessageItem, ReportDetail } from "@/types/models";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatStepper, HandoverStep } from "@/components/chat/ChatStepper";
import { ChatSafetyBar } from "@/components/chat/ChatSafetyBar";
import { ChatMessageItem } from "@/components/chat/ChatMessageItem";
import { MeetupModal } from "@/components/chat/MeetupModal";
import { ChatInputBar } from "@/components/chat/ChatInputBar";

export const Route = createFileRoute("/_authenticated/chat/$reportId/$userId")({
  component: ChatPage,
});

function ChatPage() {
  const { reportId, userId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [isConfirmHandoverModalOpen, setIsConfirmHandoverModalOpen] = useState(false);
  const [selectedStepOverride, setSelectedStepOverride] = useState<HandoverStep | null>(null);

  // 1. Fetch conversation messages
  const { data: messages, isLoading: isMessagesLoading } = useQuery<MessageItem[]>({
    queryKey: ["chat", reportId, userId],
    queryFn: async () => {
      const res = await api.get<MessageItem[]>(`/messages/${reportId}/${userId}`);
      return res || [];
    },
    refetchInterval: 4000,
  });

  // 2. Fetch report details
  const { data: report } = useQuery<ReportDetail>({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const res = await api.get<ReportDetail>(`/reports/${reportId}`);
      return res;
    },
  });

  // 3. Send message mutation
  const sendMsg = useMutation({
    mutationFn: async (msgText: string) => {
      const res = await api.post("/messages", {
        report_id: reportId,
        receiver_id: userId,
        body: msgText,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", reportId, userId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast.error("تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى");
    },
  });

  // 4. Resolve report mutation (when handover is confirmed)
  const resolveReportMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/reports/${reportId}`, { status: "resolved" });
      // Also post a celebration message in the chat
      await api.post("/messages", {
        report_id: reportId,
        receiver_id: userId,
        body: "[HANDOVER_CONFIRMED] تم بحمد الله وتوفيقه استلام الأمانة بنجاح وإغلاق البلاغ رسمياً. نتوجه بجزيل الشكر لكل من ساهم في الحفاظ على الأمانة وردّها لصاحبها.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      queryClient.invalidateQueries({ queryKey: ["chat", reportId, userId] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("تم تأكيد الاستلام وإغلاق البلاغ بنجاح 🎉");
      setIsConfirmHandoverModalOpen(false);
    },
    onError: () => {
      toast.error("تعذر تحديث حالة البلاغ");
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Identify other user
  const otherUser = useMemo(() => {
    const fromMsg =
      messages?.find((m) => m.sender_id === userId)?.sender ||
      messages?.find((m) => m.receiver_id === userId)?.receiver;

    if (fromMsg) {
      return {
        id: fromMsg.id,
        full_name: fromMsg.full_name,
        avatar_url: fromMsg.avatar_url,
        phone: report?.author?.id === userId ? report.author.phone : null,
      };
    }

    if (report?.author && report.author.id === userId) {
      return {
        id: report.author.id,
        full_name: report.author.full_name,
        avatar_url: report.author.avatar_url,
        phone: report.author.phone,
      };
    }

    return null;
  }, [messages, report, userId]);

  // Detect current user role
  const isOwner = !!(report && user && report.user_id === user.id);
  const isResolved = report?.status === "resolved";

  // Compute current handover step based on conversation content
  const detectedStep = useMemo<HandoverStep>(() => {
    if (isResolved) return 4;
    if (!messages || messages.length === 0) return 1;

    const hasHandover = messages.some((m) => m.body.startsWith("[HANDOVER_CONFIRMED]"));
    if (hasHandover) return 4;

    const hasMeetup = messages.some((m) => m.body.startsWith("[MEETUP_PROPOSAL]"));
    if (hasMeetup) return 3;

    const hasVerification = messages.some((m) => m.body.startsWith("[VERIFICATION_REQUEST]"));
    if (hasVerification) return 2;

    return 1;
  }, [messages, isResolved]);

  const currentStep = selectedStepOverride ?? detectedStep;

  // Handler for sending verification prompt
  const handleRequestVerification = () => {
    const isLost = report?.type === "lost";
    const promptText = isLost
      ? "[VERIFICATION_REQUEST] 🔒 طلب تحقق أمني: نرجو من حضرتك وصف العلامة المميزة السرية أو تفصيل دقيق لا يظهر بالصور للتأكد من هوية الغرض المعثور عليه قبل تحديد موعد التسليم."
      : "[VERIFICATION_REQUEST] 🔒 سؤال أمان وتأكد من الملكية: نرجو من حضرتك التفضل بذكر تفاصيل علامة مميزة أو محتوى خفي بالغرض لإثبات ملكيتك الحقيقية قبل التسليم.";

    sendMsg.mutate(promptText);
    toast.info("تم إرسال بطاقة التحقق الأمني في المحادثة");
  };

  // Handler for submitting meetup proposal
  const handleMeetupSubmit = (data: { location: string; time: string; notes: string }) => {
    const payload = `[MEETUP_PROPOSAL] ${JSON.stringify(data)}`;
    sendMsg.mutate(payload);
    toast.success("تم اقتراح موعد ومكان اللقاء في المحادثة");
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-80px)] sm:h-[calc(100vh-96px)] bg-background border-x border-border/70 shadow-xs">
        {/* 1. Header (User info + report quick drawer) */}
        <ChatHeader otherUser={otherUser} report={report} />

        {/* 2. Interactive Handover Progress Stepper (Scheme 4) */}
        <ChatStepper
          currentStep={currentStep}
          isResolved={isResolved}
          onSelectStep={(step) => {
            setSelectedStepOverride(step);
            if (step === 2) {
              handleRequestVerification();
            } else if (step === 3) {
              setIsMeetupModalOpen(true);
            } else if (step === 4 && isOwner && !isResolved) {
              setIsConfirmHandoverModalOpen(true);
            }
          }}
        />

        {/* 3. Safety Guidance & Secret Mark Bar (Scheme 1) */}
        <ChatSafetyBar
          isOwner={isOwner}
          isResolved={isResolved}
          secretVerificationMark={report?.secret_verification_mark}
          onRequestVerification={handleRequestVerification}
          onOpenMeetupModal={() => setIsMeetupModalOpen(true)}
          onConfirmHandover={() => setIsConfirmHandoverModalOpen(true)}
        />

        {/* 4. Messages Feed (Scheme 2) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-muted/20">
          {isMessagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">جاري تحميل الرسائل الآمنة...</p>
            </div>
          ) : messages?.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-border bg-card/60 my-auto max-w-md mx-auto space-y-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <MessageCircle className="size-6" />
              </div>
              <h2 className="font-extrabold text-base text-foreground">بدء محادثة استرداد آمنة</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                تواصل بكل راحة وأمان. لا تشارك أية مبالغ مالية قبل فحص الغرض والتأكد من هويته عبر العلامة السرية.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => sendMsg.mutate("السلام عليكم ورحمة الله، بخصوص البلاغ المنشور.")}
                  className="rounded-xl border border-border bg-background hover:bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition"
                >
                  السلام عليكم ورحمة الله 👋
                </button>
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                >
                  طلب التحقق السري 🔒
                </button>
              </div>
            </div>
          ) : (
            messages?.map((msg) => {
              // In this 1-on-1 chat, userId in the URL is the other party.
              // Therefore, any message where sender_id !== userId is sent by ME (the current user).
              const isMe = msg.sender_id !== userId || (!!user?.id && msg.sender_id === user.id);
              return (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  isMe={isMe}
                  isOwner={isOwner}
                  isResolved={isResolved}
                  onSelectQuickReply={(replyText) => {
                    sendMsg.mutate(replyText);
                  }}
                  onConfirmHandoverDirectly={() => setIsConfirmHandoverModalOpen(true)}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 5. Rich Input Dock (Scheme 2) */}
        <ChatInputBar
          onSendMessage={(text) => sendMsg.mutate(text)}
          isPending={sendMsg.isPending}
          onRequestVerification={handleRequestVerification}
          onOpenMeetupModal={() => setIsMeetupModalOpen(true)}
          onConfirmHandover={() => setIsConfirmHandoverModalOpen(true)}
          isOwner={isOwner}
          isResolved={isResolved}
        />

        {/* Safe Meetup Proposal Modal */}
        <MeetupModal
          isOpen={isMeetupModalOpen}
          onClose={() => setIsMeetupModalOpen(false)}
          onSubmit={handleMeetupSubmit}
        />

        {/* Confirm Handover Modal (Final Step 4) */}
        {isConfirmHandoverModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setIsConfirmHandoverModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-3xl bg-background border border-border p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-start"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">
                      تأكيد استلام الأمانة وإغلاق البلاغ
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      الخطوة الختامية لرحلة الاسترداد
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfirmHandoverModalOpen(false)}
                  className="size-8 rounded-xl hover:bg-muted text-muted-foreground flex items-center justify-center transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2 text-xs text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed">
                <p>
                  هل تم استلام الغرض والتأكد من سلامته وجميع تفاصيله وجهاً لوجه؟
                </p>
                <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300">
                  عند التأكيد، سيتم تغيير حالة البلاغ في المنصة إلى <strong>«تم الاسترداد بنجاح ✅»</strong> وسيتم إرسال بطاقة شكر ختامية في هذه المحادثة.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmHandoverModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  disabled={resolveReportMutation.isPending}
                  onClick={() => resolveReportMutation.mutate()}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resolveReportMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  <span>نعم، تم الاستلام بنجاح</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
