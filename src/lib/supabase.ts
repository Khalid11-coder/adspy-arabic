import { createClient } from "@supabase/supabase-js";
import type { Ad } from "@/types";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

export type Database = {
  public: {
    Tables: {
      ads_library: {
        Row: Ad;
        Insert: Omit<Ad, "id" | "created_at">;
        Update: Partial<Ad>;
      };
    };
  };
};
