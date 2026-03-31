"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Play, ExternalLink, Eye, MousePointer, TrendingUp,
  Clock, CheckCircle, XCircle, Zap
} from "lucide-react";
import type { Ad } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn, formatNumber, formatCTR, freshnessLabel } from "@/lib/utils";

const PLATFORM_LABELS: Record<string, string> = {
  meta: "ميتا",
  tiktok: "تيك توك",
  snapchat: "سناب شات",
};

const PLATFORM_COLORS: Record<string, string> = {
  meta: "bg-blue-600",
  tiktok: "bg-black",
  snapchat: "bg-yellow-400",
};

interface AdCardProps {
  ad: Ad;
  searchQuery?: string;
}

export function AdCard({ ad, searchQuery = "" }: AdCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const freshness = freshnessLabel(ad.last_seen_at);
  const isActive  = ad.status === "نشط";

  const highlight = (text: string) => {
    if (!searchQuery.trim()) return text;
    const re = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi");
    return text.replace(re, '<mark class="bg-yellow-100 text-yellow-800 rounded px-0.5">$1</mark>');
  };

  const formattedDate = new Date(ad.start_date).toLocaleDateString("ar-SA", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });

  return (
    <article
      className="ad-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:border-blue-200 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Media ── */}
<div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "4/5" }}>
  {!imgError ? (
    <Image
      // أضفنا || "" لضمان عدم تمرير null أبداً، وإذا كان كلاهما null سيذهب للـ onError
      src={ad.thumbnail_url || ad.media_url || ""} 
      alt={ad.store_name || "إعلان"}
      fill
      // إضافة unoptimized مهمة جداً الآن للتأكد أن المشكلة ليست من إعدادات الصور في next.config
      unoptimized 
      className={cn(
        "object-cover transition-transform duration-500",
        isHovered && "scale-105"
      )}
      onError={() => setImgError(true)}
      sizes="(max-width: 768px) 100vw, 33vw"
    />
  ) : (
    // هذا الجزء سيظهر إذا فشلت الصورة أو كانت الروابط فارغة
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
       <span className="text-4xl font-black text-blue-300">
         {ad.store_name ? ad.store_name.charAt(0) : "A"}
       </span>
    </div>
  )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Play button for video */}
        {ad.media_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-all duration-300",
              isHovered ? "scale-110 bg-white" : "scale-100"
            )}>
              <Play className="w-6 h-6 text-[#1B4FD8] fill-[#1B4FD8] mr-0.5" />
            </div>
          </div>
        )}

        {/* Top badges row */}
        <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2">
          {/* Platform badge */}
          <span className={cn(
            "px-2 py-0.5 rounded-lg text-xs font-bold text-white",
            PLATFORM_COLORS[ad.platform]
          )}>
            {PLATFORM_LABELS[ad.platform]}
          </span>

          {/* Status badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm",
            isActive
              ? "bg-emerald-500/90 text-white"
              : "bg-red-500/90 text-white"
          )}>
            {isActive ? (
              <>
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-white inline-block" />
                نشط
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                غير نشط
              </>
            )}
          </div>
        </div>

        {/* Bottom-left: start date */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedDate}
          </span>
        </div>

        {/* Bottom-right: external link */}
        <a
          href={ad.ad_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 left-3 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-md"
          onClick={(e) => e.stopPropagation()}
          title="فتح الإعلان الأصلي"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#1B4FD8]" />
        </a>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 space-y-3">
        {/* Store info row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Logo circle */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B4FD8] to-[#4F46E5] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm">
              {ad.store_logo || (ad.store_name ? ad.store_name.charAt(0) : "A")}
            </div>
            <span
              className="font-bold text-gray-800 text-sm truncate"
              dangerouslySetInnerHTML={{ __html: highlight(ad.store_name) }}
            />
          </div>
          <Badge variant="category" className="flex-shrink-0 text-xs">
            {ad.category}
          </Badge>
        </div>

        {/* Freshness / Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>
            آخر تحديث:{" "}
            <span className={cn(
              "font-semibold",
              freshness === "اليوم" ? "text-emerald-600" : "text-gray-700"
            )}>
              {freshness}
            </span>
          </span>
        </div>

        {/* Metrics footer */}
        <div className="grid grid-cols-3 gap-1 pt-3 border-t border-gray-100">
          {/* CTR */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-[#1B4FD8]" />
              <span className="text-xs text-gray-500 font-medium">CTR</span>
            </div>
            <p className="font-black text-sm text-[#1B4FD8] ltr-num">
              {formatCTR(ad.ctr)}
            </p>
          </div>

          {/* Clicks */}
          <div className="text-center border-x border-gray-100">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <MousePointer className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-gray-500 font-medium">نقرات</span>
            </div>
            <p className="font-black text-sm text-amber-600 ltr-num">
              {formatNumber(ad.clicks)}
            </p>
          </div>

          {/* Impressions */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Eye className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-gray-500 font-medium">مشاهدات</span>
            </div>
            <p className="font-black text-sm text-purple-600 ltr-num">
              {formatNumber(ad.impressions)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
