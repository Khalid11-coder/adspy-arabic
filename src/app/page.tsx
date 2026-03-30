"use client";
import { useState, useCallback } from "react";
import { Header } from "@/components/ads/Header";
import { StatsBar } from "@/components/ads/StatsBar";
import { SearchBar } from "@/components/ads/SearchBar";
import { CategoryTabs } from "@/components/ads/CategoryTabs";
import { SortBar } from "@/components/ads/SortBar";
import { AdGrid } from "@/components/ads/AdGrid";
import type { FilterState, SortOption, AdCategory } from "@/types";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "الكل",
  sort: "latest",
  platform: "all",
  status: "all",
};

export default function HomePage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  
  // ✅ تم تصحيح النوع من K إلى keyof FilterState
  const updateFilter = useCallback(
    (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    // ✅ تم إضافة div أب لضبط التنسيق والاتجاه
    <div className="min-h-screen bg-gray-50" dir="rtl">
      
      {/* ── Hero ── */}
      <section className="text-center space-y-4 py-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1B4FD8] px-4 py-1.5 rounded-full text-sm font-bold">
          <span className="live-dot w-2 h-2 rounded-full bg-[#1B4FD8] inline-block" />
          بيانات مباشرة من السوق السعودي — مارس 2026
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
          اكتشف الإعلانات{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#1B4FD8] to-[#4F46E5]">
            الرابحة
          </span>{" "}
          في السوق السعودي
        </h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
          منصة استخبارات إعلانية تحليلية تجمع بيانات حية من{" "}
          <strong className="text-gray-700">ميتا · تيك توك · سناب شات</strong>{" "}
          للسوق السعودي في الوقت الفعلي
        </p>
      </section>

      {/* ── Stats ── */}
      <StatsBar />

      {/* ── Search ── */}
      <SearchBar
        value={filters.search}
        // ✅ تم تصحيح سهم الدالة من = > إلى =>
        onChange={(v) => updateFilter("search", v)}
      />

      {/* ── Categories ── */}
      <CategoryTabs
        value={filters.category as AdCategory | "الكل"}
        onChange={(v) => updateFilter("category", v as AdCategory | "الكل")}
      />

      {/* ── Sort / Filter Bar ── */}
      <SortBar
        value={filters.sort}
        onChange={(v: SortOption) => updateFilter("sort", v)}
        platformFilter={filters.platform}
        onPlatformChange={(v) => updateFilter("platform", v as FilterState["platform"])}
        statusFilter={filters.status}
        onStatusChange={(v) => updateFilter("status", v as FilterState["status"])}
      />

      {/* ── Ad Grid (Infinite Scroll) ── */}
      <AdGrid filters={filters} />

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p className="font-bold text-[#1B4FD8] text-base">أدسباي العربي ©2026</p>
          <p>منصة بيانات الإعلانات الأولى للسوق السعودي والخليجي</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#1B4FD8] transition-colors">الشروط</a>
            <a href="#" className="hover:text-[#1B4FD8] transition-colors">الخصوصية</a>
            <a href="#" className="hover:text-[#1B4FD8] transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}