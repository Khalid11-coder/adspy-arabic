"use client";
import { useState } from "react";
import { Play, ExternalLink, MousePointer, Eye } from "lucide-react";

interface Ad {
  id: string;
  store: string;
  storeUrl: string;
  status: string;
  date: string;
  thumbnail: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctr: string;
  clicks: number;
  impressions: number;
  category: string;
}

export default function AdCard({ ad }: { ad: Ad }) {
  const [playing, setPlaying] = useState(false);
  const isActive = ad.status === "نشط";

  const fmt = (n: number) => n.toLocaleString("en-US");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      
      {/* ── Media Container ── */}
      <div className="relative w-full aspect-video bg-gray-100 overflow-hidden group cursor-pointer" onClick={() => setPlaying(!playing)}>
        <img
          src={ad.thumbnail}
          alt={ad.store}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        
        {/* Play Button */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play size={22} className="text-white mr-[-2px]" fill="white" />
            </div>
          </div>
        )}

        {/* Date Badge — bottom right */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md font-medium">
          {ad.date}
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        {/* External Link Icon — Right (RTL = first) */}
        <a
          href={ad.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
          title="فتح الإعلان الأصلي"
        >
          <ExternalLink size={16} />
        </a>

        {/* Store Name */}
        <span className="text-blue-600 font-bold text-sm flex-1 truncate">{ad.store}</span>

        {/* Status Tag */}
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
            isActive
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}
        >
          {ad.status}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pt-3 pb-2 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{ad.title}</p>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{ad.description}</p>
      </div>

      {/* ── CTA Button ── */}
      <div className="px-4 pb-3">
        <button className="w-full py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors duration-200 shadow-sm">
          {ad.ctaLabel}
        </button>
      </div>

      {/* ── Metrics Footer ── */}
      <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100">
        {/* CTR */}
        <div className="metric-cell">
          <span className="text-xs text-gray-400 font-medium mb-0.5">CTR</span>
          <span className="text-sm font-bold text-gray-800">{ad.ctr}%</span>
        </div>
        {/* Clicks */}
        <div className="metric-cell">
          <span className="text-xs text-gray-400 font-medium mb-0.5 flex items-center gap-1">
            <MousePointer size={10} />
            النقرات
          </span>
          <span className="text-sm font-bold text-gray-800">{fmt(ad.clicks)}</span>
        </div>
        {/* Impressions */}
        <div className="metric-cell">
          <span className="text-xs text-gray-400 font-medium mb-0.5 flex items-center gap-1">
            <Eye size={10} />
            الانطباعات
          </span>
          <span className="text-sm font-bold text-gray-800">{fmt(ad.impressions)}</span>
        </div>
      </div>
    </div>
  );
}
