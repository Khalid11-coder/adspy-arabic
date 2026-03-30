import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("en-US");
}

export function formatCTR(ctr: number): string {
  return ctr.toFixed(2) + "%";
}

export function timeAgo(isoDate: string): string {
  try {
    return formatDistanceToNow(parseISO(isoDate), {
      addSuffix: true,
      locale: ar,
    });
  } catch {
    return "غير معروف";
  }
}

export function isToday(isoDate: string): boolean {
  const d = parseISO(isoDate);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth()    === today.getMonth()    &&
    d.getDate()     === today.getDate()
  );
}

export function freshnessLabel(lastSeenAt: string): string {
  if (isToday(lastSeenAt)) return "اليوم";
  return timeAgo(lastSeenAt);
}

/** Logic-based CTR estimation from scraper signals */
export function estimateCTR(
  durationDays: number,
  storeAuthority: number,   // 0-100
  engagementScore: number   // 0-100
): number {
  const base = 1.2;
  const durationBoost = Math.min(durationDays / 30, 1) * 1.5;
  const authorityBoost = (storeAuthority / 100) * 2.0;
  const engagementBoost = (engagementScore / 100) * 3.0;
  const raw = base + durationBoost + authorityBoost + engagementBoost;
  return Math.min(parseFloat(raw.toFixed(2)), 12);
}

export function estimateClicks(impressions: number, ctr: number): number {
  return Math.round((impressions * ctr) / 100);
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}
