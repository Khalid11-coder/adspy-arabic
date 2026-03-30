import type { Ad } from "@/types";
import { estimateCTR, estimateClicks } from "./utils";

const stores = [
  { name: "متجر النخبة", authority: 85, logo: "N" },
  { name: "عطور الفخامة", authority: 90, logo: "ع" },
  { name: "تك هب السعودية", authority: 78, logo: "T" },
  { name: "بيت الأناقة", authority: 72, logo: "ب" },
  { name: "أكاديمية الريادة", authority: 95, logo: "أ" },
  { name: "ديجيتال ستور", authority: 65, logo: "D" },
  { name: "سوق الإلكترونيات", authority: 88, logo: "S" },
  { name: "كورسات برو", authority: 82, logo: "K" },
  { name: "منزلي الجميل", authority: 70, logo: "م" },
  { name: "عالم العود", authority: 93, logo: "ع" },
];

const categories = [
  "عطور","مستلزمات المنزل","إلكترونيات","دورات","منتجات رقمية","أزياء","صحة وجمال"
] as const;

const platforms = ["meta","tiktok","snapchat"] as const;

const adImages = [
  "https://picsum.photos/seed/ad1/400/500",
  "https://picsum.photos/seed/ad2/400/500",
  "https://picsum.photos/seed/ad3/400/500",
  "https://picsum.photos/seed/ad4/400/500",
  "https://picsum.photos/seed/ad5/400/500",
  "https://picsum.photos/seed/ad6/400/500",
  "https://picsum.photos/seed/ad7/400/500",
  "https://picsum.photos/seed/ad8/400/500",
  "https://picsum.photos/seed/ad9/400/500",
  "https://picsum.photos/seed/ad10/400/500",
  "https://picsum.photos/seed/ad11/400/500",
  "https://picsum.photos/seed/ad12/400/500",
  "https://picsum.photos/seed/ad13/400/500",
  "https://picsum.photos/seed/ad14/400/500",
  "https://picsum.photos/seed/ad15/400/500",
  "https://picsum.photos/seed/ad16/400/500",
  "https://picsum.photos/seed/ad17/400/500",
  "https://picsum.photos/seed/ad18/400/500",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function generateMockAds(count = 54): Ad[] {
  return Array.from({ length: count }, (_, i) => {
    const store = stores[i % stores.length];
    const category = categories[i % categories.length];
    const platform = platforms[i % platforms.length];
    const durationDays = randomInt(1, 90);
    const engagement = randomInt(20, 95);
    const ctr = estimateCTR(durationDays, store.authority, engagement);
    const impressions = randomInt(10_000, 2_500_000);
    const clicks = estimateClicks(impressions, ctr);
    const startDaysAgo = randomInt(0, durationDays);
    const lastSeenDaysAgo = randomInt(0, 2);

    return {
      id: `ad-${i + 1}`,
      store_name: store.name,
      ad_url: `https://www.facebook.com/ads/library/?id=${100000 + i}`,
      media_url: adImages[i % adImages.length],
      media_type: i % 3 === 0 ? "video" : "image",
      start_date: randomDate(startDaysAgo),
      impressions,
      clicks,
      ctr,
      category,
      status: durationDays < 60 ? "نشط" : "غير نشط",
      platform,
      last_seen_at: randomDate(lastSeenDaysAgo),
      created_at: randomDate(startDaysAgo),
      country: "SA",
      store_logo: store.logo,
      thumbnail_url: adImages[i % adImages.length],
    };
  });
}

export const MOCK_ADS = generateMockAds(54);
