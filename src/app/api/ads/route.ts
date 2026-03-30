import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Ad, SortOption, AdCategory, AdPlatform, AdStatus } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  try {
    const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

    let query = supabase
      .from("ads_library")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`store_name.ilike.%${search}%,category.ilike.%${search}%`);
    }
    if (category !== "الكل") {
      query = query.eq("category", category);
    }
    if (platform !== "all") {
      query = query.eq("platform", platform);
    }
    if (status !== "all") {
      query = query.eq("status", status);
    }

    switch (sort) {
      case "latest":
        query = query.order("start_date", { ascending: false });
        break;
      case "impressions":
        query = query.order("impressions", { ascending: false });
        break;
      case "clicks":
        query = query.order("clicks", { ascending: false });
        break;
      case "ctr":
        query = query.order("ctr", { ascending: false });
        break;
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ data: [], total: 0, has_more: false }, { status: 500 });
    }

    const total = count || 0;
    const has_more = offset + limit < total;

    return NextResponse.json({
      data: data || [],
      total,
      has_more,
    });
  } catch (err: any) {
    console.error("API route error:", err);
    return NextResponse.json({ data: [], total: 0, has_more: false }, { status: 500 });
  }
}