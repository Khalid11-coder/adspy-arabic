import { NextRequest, NextResponse } from "next/server";
import { MOCK_ADS } from "@/lib/mock-data";
import type { Ad, SortOption, AdCategory, AdPlatform, AdStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const search   = (searchParams.get("search")   || "").toLowerCase().trim();
  const category = searchParams.get("category")  || "الكل";
  const sort     = (searchParams.get("sort")     || "latest") as SortOption;
  const platform = (searchParams.get("platform") || "all") as AdPlatform | "all";
  const status   = (searchParams.get("status")   || "all") as AdStatus | "all";
  const limit    = parseInt(searchParams.get("limit") || "9");
  const offset   = parseInt(searchParams.get("offset") || "0");

  /* ── SUPABASE QUERY (swap MOCK_ADS for real Supabase when env vars are set) ── */
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // if (supabaseUrl) {
  //   let query = supabase.from("ads_library").select("*", { count: "exact" });
  //   if (search)            query = query.or(`store_name.ilike.%${search}%`);
  //   if (category !== "الكل") query = query.eq("category", category);
  //   if (platform !== "all") query = query.eq("platform", platform);
  //   if (status !== "all")   query = query.eq("status", status);
  //   switch (sort) {
  //     case "latest":      query = query.order("start_date", { ascending: false }); break;
  //     case "impressions": query = query.order("impressions", { ascending: false }); break;
  //     case "clicks":      query = query.order("clicks", { ascending: false }); break;
  //     case "ctr":         query = query.order("ctr", { ascending: false }); break;
  //   }
  //   const { data, count, error } = await query.range(offset, offset + limit - 1);
  //   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  //   return NextResponse.json({ data, total: count, has_more: offset + limit < (count ?? 0) });
  // }

  /* ── MOCK fallback ── */
  let filtered: Ad[] = [...MOCK_ADS];

  if (search) {
    filtered = filtered.filter(
      (ad) =>
        ad.store_name.toLowerCase().includes(search) ||
        ad.category.toLowerCase().includes(search)
    );
  }
  if (category !== "الكل") {
    filtered = filtered.filter((ad) => ad.category === category);
  }
  if (platform !== "all") {
    filtered = filtered.filter((ad) => ad.platform === platform);
  }
  if (status !== "all") {
    filtered = filtered.filter((ad) => ad.status === status);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sort) {
      case "latest":      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      case "impressions": return b.impressions - a.impressions;
      case "clicks":      return b.clicks - a.clicks;
      case "ctr":         return b.ctr - a.ctr;
      default:            return 0;
    }
  });

  const total    = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginated,
    total,
    has_more: offset + limit < total,
  });
}
