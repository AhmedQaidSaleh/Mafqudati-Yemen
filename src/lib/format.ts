import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export function timeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ar });
  } catch {
    return "";
  }
}

export function formatYER(amount?: number | null) {
  if (amount == null) return "";
  return new Intl.NumberFormat("ar-YE", {
    style: "currency",
    currency: "YER",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function initialOf(name?: string | null) {
  const n = (name ?? "م").trim();
  return n.charAt(0) || "م";
}
