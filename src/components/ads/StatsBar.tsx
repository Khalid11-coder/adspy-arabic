"use client";

import { TrendingUp, Store, RefreshCw } from "lucide-react";

const STATS = [
  { icon: "📢", label: "إعلان نشط", value: "54,000+", color: "text-[#1B4FD8]" },
  { icon: "🏪", label: "متجر سعودي", value: "8,200+",  color: "text-emerald-600" },
  { icon: "🔄", label: "تحديث يومي",  value: "24/7",    color: "text-amber-600"  },
  { icon: "📈", label: "حملة محللة",  value: "120K+",   color: "text-purple-600" },
];

export function StatsBar() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {STATS.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">{s.icon}</span>
          <div>
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
