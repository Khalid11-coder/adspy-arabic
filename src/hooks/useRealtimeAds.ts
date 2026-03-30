"use client";
/**
 * useRealtimeAds — subscribes to Supabase Realtime INSERT events
 * on the ads_library table, prepends new ads to state.
 *
 * Usage:
 *   const { newAdsCount, clearNewAds } = useRealtimeAds(onNewAd);
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Ad } from "@/types";

export function useRealtimeAds(onNewAd?: (ad: Ad) => void) {
  const [newAdsCount, setNewAdsCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return; // skip in mock mode

    const channel = supabase
      .channel("ads_library_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ads_library" },
        (payload) => {
          const newAd = payload.new as Ad;
          setNewAdsCount((c) => c + 1);
          onNewAd?.(newAd);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [onNewAd]);

  const clearNewAds = () => setNewAdsCount(0);

  return { newAdsCount, clearNewAds };
}
