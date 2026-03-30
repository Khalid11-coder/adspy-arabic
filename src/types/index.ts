export type AdCategory =
  | "عطور"
  | "مستلزمات المنزل"
  | "إلكترونيات"
  | "دورات"
  | "منتجات رقمية"
  | "أزياء"
  | "صحة وجمال";

export type AdStatus = "نشط" | "غير نشط";
export type AdPlatform = "meta" | "tiktok" | "snapchat";
export type SortOption = "latest" | "impressions" | "clicks" | "ctr";

export interface Ad {
  id: string;
  store_name: string;
  ad_url: string;
  media_url: string;
  media_type: "video" | "image";
  start_date: string;           // ISO string
  impressions: number;
  clicks: number;
  ctr: number;                  // percentage 0-100
  category: AdCategory;
  status: AdStatus;
  platform: AdPlatform;
  last_seen_at: string;         // ISO string – freshness
  created_at: string;
  country: string;
  store_logo?: string;
  thumbnail_url?: string;
}

export interface AdsResponse {
  data: Ad[];
  total: number;
  has_more: boolean;
}

export interface FilterState {
  search: string;
  category: AdCategory | "الكل";
  sort: SortOption;
  platform: AdPlatform | "all";
  status: AdStatus | "all";
}
