import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  MapPin,
  Calendar,
  Clock,
  CheckCheck,
  Check,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { timeAgo, initialOf } from "@/lib/format";
import { MessageItem } from "@/types/models";

interface ChatMessageItemProps {
  message: MessageItem;
  isMe: boolean;
  isOwner: boolean;
  isResolved?: boolean;
  onSelectQuickReply?: (text: string) => void;
  onConfirmHandoverDirectly?: () => void;
}

export function ChatMessageItem({
  message,
  isMe,
  isOwner,
  isResolved,
  onSelectQuickReply,
  onConfirmHandoverDirectly,
}: ChatMessageItemProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const rawBody = message.body || "";

  // Check if message is a special structured card
  const isVerificationReq = rawBody.startsWith("[VERIFICATION_REQUEST]");
  const isMeetupProposal = rawBody.startsWith("[MEETUP_PROPOSAL]");
  const isHandoverConfirmed = rawBody.startsWith("[HANDOVER_CONFIRMED]");
  const isImageAttachment = rawBody.startsWith("[IMAGE]");

  // Parse payload
  let meetupData: { location?: string; time?: string; notes?: string } | null = null;
  if (isMeetupProposal) {
    try {
      const jsonStr = rawBody.replace("[MEETUP_PROPOSAL]", "").trim();
      meetupData = JSON.parse(jsonStr);
    } catch {
      meetupData = { location: rawBody.replace("[MEETUP_PROPOSAL]", "").trim() };
    }
  }

  const imageUrl = isImageAttachment
    ? rawBody.replace("[IMAGE]", "").trim()
    : null;

  const verificationText = isVerificationReq
    ? rawBody.replace("[VERIFICATION_REQUEST]", "").trim()
    : "";

  const handoverText = isHandoverConfirmed
    ? rawBody.replace("[HANDOVER_CONFIRMED]", "").trim()
    : "";

  const renderContent = () => {
    // 1. Image attachment
    if (isImageAttachment && imageUrl) {
      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setImagePreview(imageUrl)}
            className="overflow-hidden rounded-2xl border border-border/80 block max-w-xs transition hover:opacity-95"
          >
            <img
              src={imageUrl}
              alt="صورة مرفقة"
              className="max-h-60 w-full object-cover"
              loading="lazy"
            />
          </button>
          <span className="text-[10px] opacity-80 block">انقر لتكبير الصورة</span>
        </div>
      );
    }

    // 2. Verification Request Card
    if (isVerificationReq) {
      return (
        <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 sm:p-4 text-start space-y-2.5 max-w-sm">
          <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-extrabold text-xs sm:text-sm">
            <div className="size-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Lock className="size-3.5" />
            </div>
            <span>طلب تحقق أمني من الهوية</span>
          </div>

          <p className="text-xs text-indigo-900/90 dark:text-indigo-200 leading-relaxed font-medium whitespace-pre-wrap">
            {verificationText || "نرجو منك وصف العلامة السرية أو تفصيل دقيق لا يظهر بالصور للتأكد من هوية صاحب الغرض قبل اللقاء."}
          </p>

          {!isMe && onSelectQuickReply && (
            <button
              type="button"
              onClick={() => onSelectQuickReply("العلامة المميزة للغرض هي: ")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs w-full justify-center"
            >
              <MessageSquare className="size-3.5" />
              <span>إرسال إجابة التحقق</span>
            </button>
          )}
        </div>
      );
    }

    // 3. Meetup Proposal Card
    if (isMeetupProposal && meetupData) {
      return (
        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 sm:p-4 text-start space-y-3 max-w-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-extrabold text-xs sm:text-sm">
              <div className="size-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MapPin className="size-3.5" />
              </div>
              <span>اقتراح مكان لقاء عام وآمن</span>
            </div>
            <span className="rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              مكان عام 🛡️
            </span>
          </div>

          <div className="space-y-1.5 bg-background/80 rounded-xl p-2.5 border border-emerald-200/60 dark:border-emerald-900/50 text-xs">
            {meetupData.location && (
              <div className="flex items-start gap-1.5">
                <strong className="text-foreground shrink-0">المكان:</strong>
                <span className="text-muted-foreground">{meetupData.location}</span>
              </div>
            )}
            {meetupData.time && (
              <div className="flex items-start gap-1.5">
                <strong className="text-foreground shrink-0">الموعد:</strong>
                <span className="text-muted-foreground">{meetupData.time}</span>
              </div>
            )}
            {meetupData.notes && (
              <div className="flex items-start gap-1.5">
                <strong className="text-foreground shrink-0">ملاحظات:</strong>
                <span className="text-muted-foreground">{meetupData.notes}</span>
              </div>
            )}
          </div>

          {!isMe && onSelectQuickReply && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onSelectQuickReply(
                    `تمت الموافقة على اللقاء في "${meetupData?.location || "المكان المحدد"}" بالموعد المتفق عليه.`
                  )
                }
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 text-xs font-bold transition text-center shadow-xs"
              >
                موافق على المكان والموعد ✅
              </button>
            </div>
          )}
        </div>
      );
    }

    // 4. Handover Confirmation Card
    if (isHandoverConfirmed) {
      return (
        <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 p-4 text-start space-y-2.5 max-w-sm">
          <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-extrabold text-xs sm:text-sm">
            <div className="size-6 rounded-md bg-amber-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-3.5" />
            </div>
            <span>تم استلام الأمانة بنجاح 🎉</span>
          </div>

          <p className="text-xs text-amber-900/90 dark:text-amber-200 leading-relaxed font-medium">
            {handoverText || "تم بحمد الله الاتفاق والتسليم بنجاح، جزاكم الله خيراً لمساهمتكم في الأمانة."}
          </p>

          {isOwner && !isResolved && onConfirmHandoverDirectly && (
            <button
              type="button"
              onClick={onConfirmHandoverDirectly}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="size-4" />
              <span>تأكيد إغلاق البلاغ رسمياً في المنصة</span>
            </button>
          )}
        </div>
      );
    }

    // 5. Normal text message
    return (
      <p className="whitespace-pre-wrap leading-relaxed break-words text-xs sm:text-sm">
        {rawBody}
      </p>
    );
  };

  const isSpecialCard = isVerificationReq || isMeetupProposal || isHandoverConfirmed;

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1 w-full`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl transition shadow-2xs ${
          isSpecialCard
            ? "p-0 bg-transparent"
            : isMe
              ? "bg-primary text-primary-foreground px-4 py-2.5 rounded-bl-xs shadow-xs"
              : "bg-card text-foreground border border-border px-4 py-2.5 rounded-br-xs shadow-2xs"
        }`}
      >
        {renderContent()}
      </div>

      <div
        className={`flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 ${
          isMe ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <span>{timeAgo(new Date(message.created_at))}</span>
        {isMe && (
          <span
            title={message.read_at ? "تمت القراءة" : "تم الإرسال"}
            className={message.read_at ? "text-primary" : "text-muted-foreground"}
          >
            {message.read_at ? (
              <CheckCheck className="size-3.5 inline stroke-[2.5]" />
            ) : (
              <Check className="size-3.5 inline" />
            )}
          </span>
        )}
      </div>

      {/* Lightbox image preview modal */}
      {imagePreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={imagePreview}
              alt="معاينة الصورة"
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute top-3 end-3 size-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
