"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AdCategory } from "@/types";

type Category = AdCategory | "الكل";

const CATEGORY_ICONS: Record<string, string> = {
  "الكل":            "🌐",
  "عطور":            "🌸",
  "مستلزمات المنزل": "🏠",
  "إلكترونيات":      "📱",
  "دورات":           "🎓",
  "منتجات رقمية":    "💻",
  "أزياء":           "👗",
  "صحة وجمال":       "💄",
};

interface CategoryTabsProps {
  value: Category;
  onChange: (cat: Category) => void;
}

interface CategoryItem { label: string; count: number; }

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  if (!categories.length) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 h-10 w-24 shimmer rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" dir="rtl">
      {categories.map(({ label, count }) => {
        const active = value === label;
        return (
          <button
            key={label}
            onClick={() => onChange(label as Category)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border",
              active
                ? "bg-[#1B4FD8] text-white border-[#1B4FD8] shadow-md shadow-blue-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#1B4FD8] hover:text-[#1B4FD8]"
            )}
          >
            <span>{CATEGORY_ICONS[label] || "📦"}</span>
            <span>{label}</span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-bold",
              active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
