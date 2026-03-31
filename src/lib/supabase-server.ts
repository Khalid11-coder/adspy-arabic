import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (uses service_role key, NEVER expose to browser)
// Only import this file in API routes (src/app/api/**) or server components.
const supabaseUrl       = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "⚠️  Missing SUPABASE_URL / SUPABASE_SERVICE_KEY — server client will not work"
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceKey || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
