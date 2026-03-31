import { createClient } from "@supabase/supabase-js";

// Client-side Supabase client (uses NEXT_PUBLIC_ keys, safe for browser)
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.error("Missing Supabase Environment Variables (client)");
}

export const supabase = createClient(
  supabaseUrl || "", 
  supabaseAnon || "", 
  {
    auth: {
      persistSession: false,
    },
  }
);
