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
  const response = await fetch(`${baseUrl}${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "API request failed";
    try {
      const errorData = (await response.json()) as { error?: string };
      message = errorData.error || message;
    } catch {
      // Not JSON
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
