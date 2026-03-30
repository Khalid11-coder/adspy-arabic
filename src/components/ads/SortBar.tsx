"use client";

import { ArrowUpDown, TrendingUp, Eye, MousePointer, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortOption } from "@/types";

const OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: "latest",      label: "الأحدث",          icon: <Clock className="w-3.5 h-3.5" /> },
  { value: "impressions", label: "أعلى مشاهدات",    icon: <Eye className="w-3.5 h-3.5" /> },
  { value: "clicks",      label: "أعلى نقرات",       icon: <MousePointer className="w-3.5 h-3.5" /> },
  { value: "ctr",         label: "أعلى CTR",         icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

interface SortBarProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
  platformFilter: string;
  onPlatformChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
}

export function SortBar({
  value, onChange,
  platformFilter, onPlatformChange,
  statusFilter, onStatusChange,
}: SortBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-gray-200 p-3 shadow-sm">
      {/* Sort by */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500">ترتيب:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200",
              value === opt.value
                ? "bg-[#1B4FD8] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#1B4FD8]"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Platform */}
      <select
        value={platformFilter}
        onChange={(e) => onPlatformChange(e.target.value)}
        className="text-xs font-semibold text-gray-600 bg-gray-100 border-0 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer hover:bg-blue-50"
        dir="rtl"
      >
        <option value="all">كل المنصات</option>
        <option value="meta">ميتا</option>
        <option value="tiktok">تيك توك</option>
        <option value="snapchat">سناب شات</option>
      </select>

      {/* Status */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="text-xs font-semibold text-gray-600 bg-gray-100 border-0 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer hover:bg-blue-50"
        dir="rtl"
      >
        <option value="all">كل الحالات</option>
        <option value="نشط">نشط فقط</option>
        <option value="غير نشط">غير نشط</option>
      </select>
    </div>
  );
}
