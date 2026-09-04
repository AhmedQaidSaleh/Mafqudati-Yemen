import { signInWithPopup, GoogleAuthProvider, setPersistence, inMemoryPersistence } from "firebase/auth";
import { auth, gmailGoogleProvider } from "./firebase";

// In-memory token cache (never stored in localStorage as per security guidelines)
let inMemoryGmailToken: string | null = null;

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
];

export function setGmailAccessToken(token: string | null) {
  inMemoryGmailToken = token;
}

export function getGmailAccessToken(): string | null {
  return inMemoryGmailToken;
}

export async function requestGmailAccessToken(): Promise<string> {
  if (inMemoryGmailToken) return inMemoryGmailToken;

  try {
    let result;
    try {
      result = await signInWithPopup(auth, gmailGoogleProvider);
    } catch (firstErr: unknown) {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      if (msg.includes("Database is closing") || msg.includes("closing/hidden")) {
        await setPersistence(auth, inMemoryPersistence).catch(() => {});
        result = await signInWithPopup(auth, gmailGoogleProvider);
      } else {
        throw firstErr;
      }
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      inMemoryGmailToken = credential.accessToken;
      return credential.accessToken;
    }
    throw new Error("لم يتم الحصول على تصريح الوصول إلى Gmail");
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "";
    const errCode =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : "";

    const isUserCancellation =
      errCode === "auth/popup-closed-by-user" ||
      errCode === "auth/cancelled-popup-request" ||
      errMsg.includes("popup-closed-by-user") ||
      errMsg.includes("cancelled-popup-request");

    if (isUserCancellation) {
      throw new Error("تم إلغاء نافذة تسجيل الدخول");
    }

    const isUnauthorizedDomain =
      errCode === "auth/unauthorized-domain" || errMsg.includes("auth/unauthorized-domain");

    if (isUnauthorizedDomain) {
      const hostname = typeof window !== "undefined" ? window.location.hostname : "هذا النطاق";
      throw new Error(
        `نطاق التطبيق (${hostname}) غير مضاف في قائمة Authorized Domains في إعدادات Firebase Console`,
      );
    }

    console.error("Gmail OAuth error:", error);
    throw error;
  }
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailHeader {
  name: string;
  value: string;
}

export async function fetchGmailProfile(token?: string): Promise<GmailProfile> {
  const activeToken = token || (await requestGmailAccessToken());
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message || "فشل تحميل الملف التعريفي لـ Gmail");
  }

  return res.json();
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export async function listGmailMessages(
  query = "مفقوداتي OR lost OR found",
  maxResults = 5,
  token?: string,
): Promise<GmailMessageSummary[]> {
  const activeToken = token || (await requestGmailAccessToken());
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  if (query) url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message || "تعذر جلب الرسائل من Gmail");
  }

  const data = await res.json();
  if (!data.messages || !Array.isArray(data.messages)) {
    return [];
  }

  // Fetch snippets & headers for the top messages
  const messageDetails = await Promise.all(
    data.messages.map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${activeToken}` },
          },
        );
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
        const detailData = await detailRes.json();
        const headers: GmailHeader[] = detailData.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value;
        const from = headers.find((h) => h.name.toLowerCase() === "from")?.value;
        const date = headers.find((h) => h.name.toLowerCase() === "date")?.value;

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detailData.snippet,
          subject: subject || "بدون عنوان",
          from: from || "غير معروف",
          date: date || "",
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId };
      }
    }),
  );

  return messageDetails;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  reportId?: string;
  reportTitle?: string;
}

/**
 * Creates RFC 2822 email format and encodes it in URL-safe base64
 */
function createRawEmail({ to, subject, body, reportId, reportTitle }: SendEmailPayload): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  let fullBody = body;
  if (reportId || reportTitle) {
    fullBody += `\n\n---\nبشأن البلاغ: ${reportTitle || `#${reportId}`}\nرابط البلاغ في مفقوداتي: ${window.location.origin}/report/${reportId}`;
  }

  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    fullBody,
  ];

  const email = emailLines.join("\r\n");
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmailEmail(
  payload: SendEmailPayload,
  token?: string,
): Promise<{ id: string; threadId: string }> {
  const activeToken = token || (await requestGmailAccessToken());
  const raw = createRawEmail(payload);

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${activeToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message || "فشل إرسال البريد الإلكتروني عبر Gmail");
  }

  return res.json();
}
