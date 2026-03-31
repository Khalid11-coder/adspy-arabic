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

  // 1. تفكيك الفلاتر لمنع اللوب اللانهائي ومراقبة التغييرات بدقة
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
    [search, category, sort, platform, status]
  );

  const fetchBatch = useCallback(
    async (offset: number, reset = false) => {
      // إلغاء أي طلب سابق لضمان عدم تداخل البيانات
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(buildUrl(offset), {
          signal: abortRef.current.signal,
          headers: {
            'Accept': 'application/json', // مهم جداً لبيئة Production في نيتليفاي
          }
        });
        
        if (!res.ok) throw new Error("فشل في جلب البيانات من السيرفر");
        
        const json = await res.json();

        // --- التعديل الجذري هنا ---
        // التأكد من استخراج المصفوفة من حقل data لأن الـ API يرجع كائن (Object)
        const newAds = Array.isArray(json?.data) ? json.data : [];
        const currentTotal = json?.total || 0;

        setAds((prev) => (reset ? newAds : [...prev, ...newAds]));
        setTotal(currentTotal);
        
        // تحديث حالة "هل يوجد المزيد" بناءً على الـ offset والعدد الكلي
        const nextOffset = offset + newAds.length;
        setHasMore(nextOffset < currentTotal && newAds.length > 0);
        
        offsetRef.current = nextOffset;
      } catch (e: unknown) {
        if ((e as Error).name !== "AbortError") {
          console.error("Fetch error:", e);
          setError("حدث خطأ أثناء تحميل الإعلانات. تأكد من اتصالك وحاول مرة أخرى.");
        }
      } finally {
        setLoading(false);
        setInitLoading(false);
      }
    },
    [buildUrl]
  );

  // إعادة ضبط الشبكة عند تغيير أي فلتر
  useEffect(() => {
    setAds([]);
    setTotal(0);
    setHasMore(true);
    setInitLoading(true);
    offsetRef.current = 0;
    fetchBatch(0, true);
  }, [search, category, sort, platform, status, fetchBatch]);

  // تفعيل الـ Infinite Scroll عند النزول لأسفل الصفحة
  useEffect(() => {
    if (inView && hasMore && !loading && !initLoading) {
      fetchBatch(offsetRef.current);
    }
  }, [inView, hasMore, loading, initLoading, fetchBatch]);

  // حالة التحميل الأولية (Skeletons)
  if (initLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: BATCH }).map((_, i) => (
          <AdCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600 text-lg">{error}</p>
        <Button onClick={() => fetchBatch(0, true)} variant="outline">
          <RefreshCw className="w-4 h-4 ml-2" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  // حالة عدم وجود نتائج
  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800">لا توجد إعلانات</h3>
        <p className="text-gray-500">جرب تغيير معايير البحث أو الفلترة للحصول على نتائج أفضل</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* عداد النتائج */}
      <div className="flex justify-between items-center border-b border-gray-50 pb-4">
        <p className="text-sm text-gray-500 font-medium">
          عرض <span className="text-[#1B4FD8] font-bold">{ads.length}</span> من أصل{" "}
          <span className="text-[#1B4FD8] font-bold">{total.toLocaleString("en-US")}</span> إعلان
        </p>
      </div>

      {/* شبكة الإعلانات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} searchQuery={search} />
        ))}

        {/* تحميل المزيد (Skeletons) */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <AdCardSkeleton key={`sk-${i}`} />
          ))}
      </div>

      {/* مراقب التمرير (Sentinel) */}
      {hasMore && <div ref={loaderRef} className="h-10 w-full" />}

      {/* نهاية النتائج */}
      {!hasMore && ads.length > 0 && (
        <div className="py-10 text-center">
          <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
            <span className="w-8 h-[1px] bg-gray-200"></span>
            ✅ تم عرض جميع الإعلانات المتاحة ({total.toLocaleString("en-US")})
            <span className="w-8 h-[1px] bg-gray-200"></span>
          </p>
        </div>
      )}
    </div>
  );
}