import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Ad, SortOption, AdCategory, AdPlatform, AdStatus } from "@/types";

// استدعاء العميل مرة واحدة خارج الدالة للسرعة
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // تنظيف المدخلات لضمان عدم وجود فراغات زائدة
  const search   = (searchParams.get("search")   || "").trim();
  const category = (searchParams.get("category") || "الكل").trim();
  const sort     = (searchParams.get("sort")     || "latest") as SortOption;
  const platform = (searchParams.get("platform") || "all") as AdPlatform | "all";
  const status   = (searchParams.get("status")   || "all") as AdStatus | "all";
  const limit    = parseInt(searchParams.get("limit") || "9");
  const offset   = parseInt(searchParams.get("offset") || "0");

  try {
    let query = supabase
      .from("ads_library")
      .select("*", { count: "exact" });

    // 1. فلتر البحث (Search) - نستخدم ilike للبحث غير الحساس لحالة الأحرف
    if (search) {
      query = query.or(`store_name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // 2. فلتر التصنيف (Category) - تجاهل "الكل" أو "all"
    if (category !== "الكل" && category !== "all" && category !== "") {
      query = query.eq("category", category);
    }

    // 3. فلتر المنصة (Platform)
    if (platform !== "all") {
      query = query.eq("platform", platform);
    }

    // 4. فلتر الحالة (Status)
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 5. الترتيب (Sorting)
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

    // جلب البيانات بناءً على الـ offset والـ limit
    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;
    const has_more = offset + limit < total;

    return NextResponse.json({
      data: data || [],
      total,
      has_more,
    });

  } catch (err: any) {
    console.error("API route error:", err.message);
    return NextResponse.json(
      { data: [], total: 0, has_more: false, error: err.message }, 
      { status: 500 }
    );
  }
}