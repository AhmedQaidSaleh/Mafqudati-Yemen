import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sendGmailEmail, getGmailAccessToken, requestGmailAccessToken } from "@/lib/gmail";
import { Mail, Send, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface GmailContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  recipientName?: string;
  reportId: string;
  reportTitle: string;
  reportType: "lost" | "found";
}

export function GmailContactModal({
  open,
  onOpenChange,
  recipientEmail,
  recipientName,
  reportId,
  reportTitle,
  reportType,
}: GmailContactModalProps) {
  const defaultSubject = `استفسار بخصوص بلاغ: ${reportTitle} (#${reportId.slice(0, 8)})`;
  const defaultBody =
    reportType === "lost"
      ? `مرحباً ${recipientName || ""},\n\nأود الاستفسار بخصوص الغرض المفقود "${reportTitle}" المنشور على منصة مفقوداتي، أعتقد أن لدي معلومات قد تفيدك.`
      : `مرحباً ${recipientName || ""},\n\nأود التواصل بخصوص الغرض المعثور عليه "${reportTitle}" المنشور على منصة مفقوداتي، للتأكد من مواصفاته ومطابقتها.`;

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("يرجى ملء موضوع الرسالة ونصها");
      return;
    }
    // Show explicit confirmation step
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setSending(true);
    try {
      let token = getGmailAccessToken();
      if (!token) {
        token = await requestGmailAccessToken();
      }

      await sendGmailEmail(
        {
          to: recipientEmail,
          subject: subject.trim(),
          body: body.trim(),
          reportId,
          reportTitle,
        },
        token,
      );

      toast.success("تم إرسال البريد الإلكتروني عبر Gmail بنجاح!");
      setShowConfirm(false);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Gmail send error:", err);
      const msg = err instanceof Error ? err.message : "تعذّر إرسال البريد الإلكتروني";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {!showConfirm ? (
          <form onSubmit={handleInitialSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Mail className="size-5" />
                <DialogTitle>إرسال بريد إلكتروني عبر Gmail</DialogTitle>
              </div>
              <DialogDescription>
                تواصل مباشرة مع المُبلِّغ ({recipientName || recipientEmail}) من خلال حساب Gmail
                الخاص بك.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  المُستلم (To)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail}`}
                  className="input bg-secondary/50 cursor-not-allowed text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-dark mb-1">
                  عنوان الموضوع (Subject)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary-dark mb-1">
                  نص الرسالة (Message Body)
                </label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="input text-sm leading-relaxed"
                  required
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  * سيتم إرفاق رابط وتفاصيل البلاغ تلقائياً في نهاية الرسالة.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                إلغاء
              </Button>
              <Button type="submit" className="gap-2">
                <Send className="size-4" /> مراجعة وإرسال
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="size-5" />
                <DialogTitle>تأكيد إرسال البريد عبر Gmail</DialogTitle>
              </div>
              <DialogDescription>
                يرجى تأكيد إرسال هذا البريد من حساب Gmail الخاص بك إلى المُستلم المحدد أدناه:
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2 text-xs">
              <div>
                <span className="font-bold text-muted-foreground">إلى: </span>
                <span className="font-medium text-foreground">{recipientEmail}</span>
              </div>
              <div>
                <span className="font-bold text-muted-foreground">الموضوع: </span>
                <span className="font-medium text-foreground">{subject}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <span className="font-bold text-muted-foreground block mb-1">المحتوى:</span>
                <div className="bg-background rounded-lg p-2.5 whitespace-pre-line text-foreground/90 max-h-32 overflow-y-auto">
                  {body}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={sending}
              >
                رجوع وتعديل
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSend}
                disabled={sending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                تأكيد الإرسال الآن
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
