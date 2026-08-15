export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const compact = (value: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact" }).format(value ?? 0);

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type ExpiryTone = "expired" | "critical" | "soon" | "safe" | "none";

export function expiryTone(days: number | null): ExpiryTone {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 30) return "critical";
  if (days <= 90) return "soon";
  return "safe";
}

export const expiryLabel = (days: number | null) =>
  days === null
    ? "No expiry set"
    : days < 0
      ? `Expired ${Math.abs(days)} days ago`
      : days === 0
        ? "Expires today"
        : `Expires in ${days} days`;

export const dateLabel = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const timeLabel = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
