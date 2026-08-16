import { queryOptions } from "@tanstack/react-query";
import { api } from "@/client/api/client";
import type {
  Governorate,
  District,
  Category,
  Report,
  Profile,
  NotificationItem,
  MessageItem,
} from "@/types/models";

export type ReportFilter = {
  type?: "lost" | "found";
  category_id?: number;
  governorate_id?: number;
  district_id?: number;
  user_id?: string;
  status?: "open" | "closed" | "resolved" | "active";
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: "newest" | "oldest";
  limit?: number;
};

export const governoratesQuery = queryOptions({
  queryKey: ["governorates"],
  queryFn: async (): Promise<Governorate[]> => {
    try {
      return await api.get<Governorate[]>("/meta/governorates");
    } catch {
      return [];
    }
  },
  staleTime: 60 * 60 * 1000,
});

export const districtsQuery = (govId?: number | null) =>
  queryOptions({
    queryKey: ["districts", govId ?? null],
    queryFn: async (): Promise<District[]> => {
      if (!govId) return [];
      try {
        return await api.get<District[]>("/meta/districts", { governorate_id: govId });
      } catch {
        return [];
      }
    },
    staleTime: 60 * 60 * 1000,
  });

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    try {
      return await api.get<Category[]>("/meta/categories");
    } catch {
      return [];
    }
  },
  staleTime: 60 * 60 * 1000,
});

export const reportsQuery = (filter: ReportFilter = {}) =>
  queryOptions({
    queryKey: ["reports", filter],
    queryFn: async (): Promise<Report[]> => {
      try {
        return await api.get<Report[]>("/reports", filter);
      } catch {
        return [];
      }
    },
  });

export const reportByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["report", id],
    queryFn: async (): Promise<Report | null> => {
      try {
        return await api.get<Report>(`/reports/${id}`);
      } catch {
        return null;
      }
    },
  });

export const myReportsQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-reports", userId ?? null],
    queryFn: async (): Promise<Report[]> => {
      if (!userId) return [];
      try {
        return await api.get<Report[]>("/reports/my");
      } catch {
        return [];
      }
    },
  });

export const savedReportsQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["saved-reports", userId ?? null],
    queryFn: async (): Promise<Report[]> => {
      if (!userId) return [];
      try {
        return await api.get<Report[]>("/saved-reports");
      } catch {
        return [];
      }
    },
  });

export const profileQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["profile", userId ?? null],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      try {
        return await api.get<Profile>("/auth/me");
      } catch {
        return null;
      }
    },
  });

export const notificationsQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["notifications", userId ?? null],
    queryFn: async (): Promise<NotificationItem[]> => {
      if (!userId) return [];
      try {
        return await api.get<NotificationItem[]>("/notifications");
      } catch {
        return [];
      }
    },
  });

export const messagesQuery = (reportId: string, userId?: string) =>
  queryOptions({
    queryKey: ["messages", reportId, userId ?? null],
    queryFn: async (): Promise<MessageItem[]> => {
      if (!userId || !reportId) return [];
      try {
        return await api.get<MessageItem[]>(`/messages/${reportId}`);
      } catch {
        return [];
      }
    },
  });

export const homeStatsQuery = queryOptions({
  queryKey: ["home-stats"],
  queryFn: async (): Promise<{ lost: number; found: number }> => {
    try {
      return await api.get<{ lost: number; found: number }>("/reports/stats/counts");
    } catch {
      return { lost: 0, found: 0 };
    }
  },
  staleTime: 60_000,
});
