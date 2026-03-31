import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("en-US");
}

export function formatCTR(ctr: number | null | undefined): string {
  if (ctr == null || isNaN(ctr)) return "0.00%";
  return ctr.toFixed(2) + "%";
}

export function timeAgo(isoDate: string): string {
  try {
    if (!isoDate) return "غير معروف";
    return formatDistanceToNow(parseISO(isoDate), {
      addSuffix: true,
      locale: ar,
    });
  } catch {
    return "غير معروف";
  }
}

export function isToday(isoDate: string): boolean {
  try {
    const d = parseISO(isoDate);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth()    === today.getMonth()    &&
      d.getDate()     === today.getDate()
    );
  } catch {
    return false;
  }
}

export function freshnessLabel(lastSeenAt: string): string {
  if (!lastSeenAt) return "غير معروف";
  if (isToday(lastSeenAt)) return "اليوم";
  return timeAgo(lastSeenAt);
}

/**
 * Logic-based CTR estimation with platform-specific multipliers.
 * Uses real engagement signals when available; falls back to estimation when not.
 */
export function estimateCTR(
  durationDays: number,
  storeAuthority: number,     // 0-100
  engagementScore: number,    // 0-100
  platform: string = "meta",
  realEngagement?: { likes?: number; shares?: number; comments?: number; views?: number }
): number {
  // Platform-specific multipliers (TikTok has higher organic reach)
  const platformMult: Record<string, number> = { meta: 1.0, tiktok: 1.8, snapchat: 1.2 };
  const mult = platformMult[platform] ?? 1.0;

  let ctr: number;

  if (realEngagement && (realEngagement.likes || realEngagement.views)) {
    // Real engagement available — derive CTR from it
    const likes = realEngagement.likes ?? 0;
    const shares = realEngagement.shares ?? 0;
    const comments = realEngagement.comments ?? 0;
    const views = realEngagement.views ?? Math.max(likes * 10, 1000);

    const totalEngagements = likes + shares + comments;
    const engagementRate = totalEngagements / Math.max(views, 1);

    // Convert engagement rate to CTR (engagement rate * platform factor)
    ctr = Math.min(parseFloat((engagementRate * 100 * mult).toFixed(2)), 12);
    if (ctr < 0.3) ctr = 0.3; // floor
  } else {
    // Fallback to estimation model
    const base = 1.2;
    const durationBoost = Math.min(durationDays / 30, 1) * 1.5;
    const authorityBoost = (storeAuthority / 100) * 2.0;
    const engagementBoost = (engagementScore / 100) * 3.0;
    const raw = (base + durationBoost + authorityBoost + engagementBoost) * mult;
    ctr = Math.min(parseFloat(raw.toFixed(2)), 12);
  }

  return ctr;
}

export function estimateClicks(impressions: number, ctr: number): number {
  if (!impressions || isNaN(impressions) || !ctr || isNaN(ctr)) return 0;
  return Math.round((impressions * ctr) / 100);
}

export function highlightText(text: string, query: string): string {
  if (!text) return "";
  if (!query || !query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}
