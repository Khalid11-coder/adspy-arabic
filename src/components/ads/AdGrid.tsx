"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import type { Ad, FilterState } from "@/types";
import { AdCard } from "./AdCard";
import { AdCardSkeleton } from "@/components/ui/Skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

const BATCH = 9;

interface AdGridProps {
  filters: FilterState;
}

export function AdGrid({ filters }: AdGridProps) {
  const [ads, setAds]           = useState<Ad[]>([]);
  const [total, setTotal]       = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const offsetRef               = useRef(0);
  const abortRef                = useRef<AbortController | null>(null);

  const { ref: loaderRef, inView } = useInView({ threshold: 0 });

  // 1. تفكيك الفلاتر لمنع اللوب اللانهائي
  const { search, category, sort, platform, status } = filters;

  const buildUrl = useCallback(
    (offset: number) => {
      const p = new URLSearchParams({
        search:   search || "",
        category: category || "",
        sort:     sort || "",
        platform: platform || "",
        status:   status || "",
        limit:    String(BATCH),
        offset:   String(offset),
      });
      return `/api/ads?${p.toString()}`;
    },
    // نعتمد على القيم الفردية هنا
    [search, category, sort, platform, status]
  );

  const fetchBatch = useCallback(
    async (offset: number, reset = false) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(buildUrl(offset), {
          signal: abortRef.current.signal,
          headers: {
            'Accept': 'application/json', // 2. مهم جداً لنيتليفاي
          }
        });
        
        if (!res.ok) throw new Error("فشل في جلب البيانات");
        const json = await res.json();

        // 3. تأمين المصفوفة عشان ما يضرب الكود
        const newAds = Array.isArray(json?.data) ? json.data : [];

        setAds((prev) => (reset ? newAds : [...prev, ...newAds]));
        setTotal(json?.total || 0);
        setHasMore(Boolean(json?.has_more));
        offsetRef.current = offset + BATCH;
      } catch (e: unknown) {
        if ((e as Error).name !== "AbortError") {
          console.error("Fetch error:", e);
          setError("حدث خطأ أثناء تحميل الإعلانات. حاول مرة أخرى.");
        }
      } finally {
        setLoading(false);
        setInitLoading(false);
      }
    },
    [buildUrl]
  );

  // Reset on filter change
  useEffect(() => {
    setAds([]);
    setTotal(0);
    setHasMore(true);
    setInitLoading(true);
    offsetRef.current = 0;
    fetchBatch(0, true);
  // نعتمد على القيم الفردية هنا بعد
  }, [search, category, sort, platform, status, fetchBatch]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading && !initLoading) {
      fetchBatch(offsetRef.current);
    }
  }, [inView, hasMore, loading, initLoading, fetchBatch]);

  if (initLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: BATCH }).map((_, i) => (
          <AdCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600 text-lg">{error}</p>
        <Button onClick={() => fetchBatch(0, true)} variant="outline">
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800">لا توجد إعلانات</h3>
        <p className="text-gray-500">جرب تغيير معايير البحث أو الفلترة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <p className="text-sm text-gray-500 font-medium">
        عرض <span className="text-[#1B4FD8] font-bold">{ads.length}</span> من أصل{" "}
        <span className="text-[#1B4FD8] font-bold">{total.toLocaleString("en-US")}</span> إعلان
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} searchQuery={filters.search} />
        ))}

        {/* Skeleton while loading more */}
        {loading &&
          Array.from({ length: BATCH }).map((_, i) => (
            <AdCardSkeleton key={`sk-${i}`} />
          ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={loaderRef} className="h-4" />}

      {/* End of results */}
      {!hasMore && ads.length > 0 && (
        <p className="text-center text-gray-400 text-sm py-6 border-t border-gray-100">
          ✅ تم عرض جميع الإعلانات ({total.toLocaleString("en-US")})
        </p>
      )}
    </div>
  );
}