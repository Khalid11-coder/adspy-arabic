import { createClient } from "@supabase/supabase-js";

// تأكد أن الأسماء مطابقة تماماً لما هو موجود في ملف .env.local
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// التحقق من وجود القيم قبل التشغيل لتجنب أخطاء وقت التنفيذ
if (!supabaseUrl || !supabaseAnon) {
  console.error("Missing Supabase Environment Variables");
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