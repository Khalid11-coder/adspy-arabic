import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { SortOption, AdPlatform, AdStatus } from "@/types";

export const dynamic = "force-dynamic";

// Regex to strip anything that isn't a letter, digit, or space (safe for Arabic + Latin)
const SAFE_SEARCH_RE = /[^\w\s\u0600-\u06FF\u0750-\u077F]/g;
function sanitizeSearch(input: string): string {
  return input.replace(SAFE_SEARCH_RE, "").trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawSearch = (searchParams.get("search") || "").trim();
  const search    = sanitizeSearch(rawSearch);
  const category  = (searchParams.get("category") || "الكل").trim();
  const sort      = (searchParams.get("sort") || "latest") as SortOption;
  const platform  = (searchParams.get("platform") || "all") as AdPlatform | "all";
  const status    = (searchParams.get("status") || "all") as AdStatus | "all";
  const limit     = Math.min(parseInt(searchParams.get("limit") || "9"), 50);
  const offset    = parseInt(searchParams.get("offset") || "0");

  try {
    let query = supabaseAdmin
      .from("ads_library")
      .select("*", { count: "exact" });

    // 1. Search — prefer full-text search via search_vector, fallback to ilike
    if (search) {
      // Try textSearch first (uses the TSVECTOR search_vector column)
      query = query.textSearch("search_vector", search, {
        type: "plain",
        config: "simple",
      });
    }

    // 2. Category filter
    if (category !== "الكل" && category !== "all" && category !== "") {
      query = query.eq("category", category);
    }

    // 3. Platform filter
    if (platform !== "all") {
      query = query.eq("platform", platform);
    }

    // 4. Status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 5. Sorting
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
      default:
        query = query.order("created_at", { ascending: false });
    }

    // 6. Pagination
    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      // If textSearch failed (e.g., search_vector not yet populated), fallback to ilike
      if (search && error.message?.includes("search_vector")) {
        const fallback = supabaseAdmin
          .from("ads_library")
          .select("*", { count: "exact" })
          .or(`store_name.ilike.%${search}%,category.ilike.%${search}%`);

        const fbResult = await fallback.range(offset, offset + limit - 1);
        if (fbResult.error) throw fbResult.error;

        const total = fbResult.count || 0;
        return NextResponse.json({
          data: fbResult.data || [],
          total,
          has_more: offset + limit < total,
        });
      }
      throw error;
    }

    const total = count || 0;
    const has_more = offset + limit < total;

    return NextResponse.json({
      data: data || [],
      total,
      has_more,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API route error:", message);
    return NextResponse.json(
      { data: [], total: 0, has_more: false, error: message },
      { status: 500 }
    );
  }
}
