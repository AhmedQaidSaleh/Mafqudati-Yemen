import { useState, useRef } from "react";
import {
  Send,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  Sparkles,
  Lock,
  MapPin,
  CheckCircle2,
  X,
} from "lucide-react";
import { api } from "@/client/api/client";
import { toast } from "sonner";

interface ChatInputBarProps {
  onSendMessage: (body: string) => void;
  isPending: boolean;
  onRequestVerification: () => void;
  onOpenMeetupModal: () => void;
  onConfirmHandover: () => void;
  isOwner: boolean;
  isResolved?: boolean;
}

const QUICK_CHIPS = [
  "السلام عليكم، بخصوص البلاغ",
  "هل يمكنك وصف تفصيل خفي فيه؟",
  "أقترح أن نلتقي في مكان عام ومضاء",
  "شكراً جزيلاً وجزاك الله خيراً",
];

export function ChatInputBar({
  onSendMessage,
  isPending,
  onRequestVerification,
  onOpenMeetupModal,
  onConfirmHandover,
  isOwner,
  isResolved,
}: ChatInputBarProps) {
  const [text, setText] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 5 ميغابايت");
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      // Upload image to backend
      const res = await api.postFormData<{ url: string }>("/uploads", formData);
      if (res?.url) {
        onSendMessage(`[IMAGE] ${res.url}`);
        toast.success("تم إرسال الصورة بنجاح");
      }
    } catch {
      toast.error("تعذر رفع الصورة، يرجى المحاولة مرة أخرى");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 sm:p-4 space-y-2.5">
      {/* Quick response pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap ps-1 flex items-center gap-1">
          <Sparkles className="size-3 text-primary" /> ردود سريعة:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setText((prev) => (prev ? `${prev} ${chip}` : chip))}
            className="rounded-xl border border-border/80 bg-muted/40 hover:bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground whitespace-nowrap transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Quick Actions Drawer / Popup */}
      {showQuickActions && (
        <div className="rounded-2xl border border-border bg-card p-3 shadow-lg animate-in slide-in-from-bottom-2 duration-150 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              إجراءات سريعة موجهة
            </span>
            <button
              type="button"
              onClick={() => setShowQuickActions(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowQuickActions(false);
                onRequestVerification();
              }}
              className="flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 p-2.5 text-indigo-950 dark:text-indigo-200 font-bold transition text-start"
            >
              <div className="size-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Lock className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px]">طلب التحقق السري</span>
                <span className="block text-[9px] font-normal opacity-80 truncate">
                  سؤال عن العلامة الخفية
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowQuickActions(false);
                onOpenMeetupModal();
              }}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 p-2.5 text-emerald-950 dark:text-emerald-200 font-bold transition text-start"
            >
              <div className="size-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MapPin className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px]">اقتراح مكان لقاء</span>
                <span className="block text-[9px] font-normal opacity-80 truncate">
                  مكان عام ومضاء
                </span>
              </div>
            </button>

            {isOwner && !isResolved && (
              <button
                type="button"
                onClick={() => {
                  setShowQuickActions(false);
                  onConfirmHandover();
                }}
                className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 p-2.5 text-amber-950 dark:text-amber-200 font-bold transition text-start"
              >
                <div className="size-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[11px]">تأكيد الاستلام</span>
                  <span className="block text-[9px] font-normal opacity-80 truncate">
                    إغلاق البلاغ بنجاح
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main input controls */}
      <div className="flex items-end gap-2">
        {/* Hidden file input for images */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />

        {/* Action / Attachment Buttons */}
        <div className="flex items-center gap-1 shrink-0 pb-1">
          <button
            type="button"
            onClick={() => setShowQuickActions((prev) => !prev)}
            className={`inline-flex size-10 items-center justify-center rounded-xl border transition ${
              showQuickActions
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="إجراءات سريعة"
          >
            <Sparkles className="size-4.5 text-primary" />
          </button>

          <button
            type="button"
            disabled={uploadingImage}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition disabled:opacity-50"
            title="إرفاق صورة إثبات"
          >
            {uploadingImage ? (
              <Loader2 className="size-4.5 animate-spin text-primary" />
            ) : (
              <ImageIcon className="size-4.5" />
            )}
          </button>
        </div>

        {/* Expanding textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا... (Enter للإرسال)"
            className="w-full resize-none rounded-2xl border border-input bg-card p-3 pe-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition min-h-[44px] max-h-[120px] font-medium leading-relaxed"
            dir="rtl"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          disabled={!text.trim() || isPending || uploadingImage}
          onClick={handleSend}
          className="inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 shrink-0 shadow-xs mb-0.5"
          title="إرسال"
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5 -scale-x-100" />
          )}
        </button>
      </div>
    </div>
  );
}
