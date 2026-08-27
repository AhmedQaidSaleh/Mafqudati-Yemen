import { auth } from "@/lib/firebase";

const API_BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthToken(): Promise<string | null> {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(false);
    } catch {
      return await auth.currentUser.getIdToken(true);
    }
  }

  // If currentUser is null, wait a brief moment for Firebase auth state to resolve
  if (typeof window !== "undefined") {
    return new Promise<string | null>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        unsubscribe();
        if (user) {
          try {
            const token = await user.getIdToken();
            resolve(token);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
      // Safety timeout in case no user is signed in
      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 1000);
    });
  }

  return null;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  const token = await getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    const errorMsg =
      networkErr instanceof Error && networkErr.name === "AbortError"
        ? "تم إلغاء الطلب"
        : "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.";
    throw new ApiError(0, errorMsg);
  }

  if (!response.ok) {
    let message = "فشل في تنفيذ الطلب من الخادم";
    try {
      const errorData = (await response.json()) as { error?: string; message?: string };
      message = errorData.error || errorData.message || message;
    } catch {
      // Fallback based on HTTP status
      if (response.status === 401) {
        message = "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً";
      } else if (response.status === 403) {
        message = "ليس لديك الصلاحية للقيام بهذا الإجراء";
      } else if (response.status === 404) {
        message = "العنصر المطلوب غير موجود على الخادم";
      } else if (response.status >= 500) {
        message = "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً";
      }
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, unknown>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes("?") ? "&" : "?") + qs;
      }
    }
    return fetchApi<T>(url);
  },
  post: <T = unknown>(endpoint: string, data?: unknown) =>
    fetchApi<T>(endpoint, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  patch: <T = unknown>(endpoint: string, data?: unknown) =>
    fetchApi<T>(endpoint, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T = unknown>(endpoint: string) => fetchApi<T>(endpoint, { method: "DELETE" }),
  upload: <T>(endpoint: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchApi<T>(endpoint, { method: "POST", body: formData });
  },
};
