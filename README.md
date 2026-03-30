<div align="center">

# أدسباي العربي 🇸🇦
### منصة استخبارات الإعلانات المباشرة للسوق السعودي

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwindcss)
![Python](https://img.shields.io/badge/Python-Playwright-yellow?style=for-the-badge&logo=python)

</div>

---

## 🎯 المميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🔴 **بيانات مباشرة** | جلب إعلانات حية من Meta Ad Library & TikTok Creative Center للسوق السعودي |
| ⚡ **Server-Side Search** | بحث سريع ضد قاعدة Supabase بدون تحميل كل البيانات |
| 📊 **تقدير الـ Metrics** | خوارزمية منطقية لتقدير CTR، النقرات، والمشاهدات |
| ∞ **Infinite Scroll** | تحميل تدريجي بـ 9 إعلانات (limit+offset) |
| 🔔 **Realtime** | Supabase Realtime يُحدّث الواجهة فور إضافة إعلانات جديدة |
| 🗂️ **فلترة متقدمة** | فئة، منصة، حالة، ترتيب — كل شيء من query واحد |
| ⏱️ **طازجية البيانات** | "آخر تحديث: اليوم / منذ 3 ساعات" على كل بطاقة |
| 🌐 **RTL كامل** | تخطيط عربي كامل باتجاه RTL وخط Tajawal |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    أدسباي العربي                         │
├─────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router)  ←→  Supabase Realtime DB      │
│         ↑                              ↑                 │
│   Server-Side API Routes          Python Engine          │
│   /api/ads?search=&sort=          (Playwright)           │
│         ↑                              ↑                 │
│   React Client UI              Meta Ad Library           │
│   (Infinite Scroll)            TikTok Creative Center    │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 تثبيت وتشغيل

### 1. Clone & Install
```bash
git clone https://github.com/your-org/adspy-arabic
cd adspy-arabic
npm install
```

### 2. إعداد Supabase

1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com)
2. شغّل الملف `supabase/schema.sql` في **SQL Editor**
3. شغّل `supabase/mark_inactive_ads.sql` لإضافة الـ RPC function

### 3. متغيرات البيئة
```bash
cp .env.example .env.local
# أضف بيانات Supabase الخاصة بك
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. تشغيل التطوير
```bash
npm run dev
# افتح http://localhost:3000
```

---

## 🤖 Python Scraper Engine

### التثبيت
```bash
cd scraper
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# أضف SUPABASE_URL و SUPABASE_SERVICE_KEY
```

### التشغيل
```bash
# دورة واحدة
python engine.py

# وضع الجدولة (كل 6 ساعات)
python engine.py --schedule

# داخل Docker
docker-compose up -d
```

---

## 📐 خوارزمية تقدير الـ Metrics

نظراً لأن Meta وTikTok **لا تنشر** الإحصاءات الدقيقة، نستخدم نموذجاً منطقياً:

```python
# CTR Estimation
CTR = base(1.0)
    + duration_factor   (max +1.2% for 30-day campaign)
    + authority_factor  (max +2.5% for high-follower stores)
    + engagement_factor (max +3.5% for viral content)
    × platform_multiplier (TikTok ×1.8, Snapchat ×1.2, Meta ×1.0)

# Impressions Estimation  
Impressions = 15,000
            × authority_multiplier  (up to ×41)
            × duration_multiplier   (up to ×9)
            × engagement_multiplier (up to ×6)
            × platform_multiplier

# Clicks = Impressions × (CTR / 100)
```

---

## 📁 Project Structure

```
adspy-arabic/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ads/route.ts         ← Server-side filtering API
│   │   │   └── categories/route.ts  ← Categories with counts
│   │   ├── page.tsx                 ← Main homepage
│   │   ├── layout.tsx               ← RTL layout + Tajawal font
│   │   └── globals.css
│   ├── components/
│   │   ├── ads/
│   │   │   ├── AdCard.tsx           ← Live ad card with metrics
│   │   │   ├── AdGrid.tsx           ← Infinite scroll 3×3 grid
│   │   │   ├── Header.tsx           ← RTL header
│   │   │   ├── SearchBar.tsx        ← Debounced server search
│   │   │   ├── CategoryTabs.tsx     ← KSA niche categories
│   │   │   ├── SortBar.tsx          ← Sort + platform + status
│   │   │   └── StatsBar.tsx         ← Live stats counters
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       └── Skeleton.tsx         ← Shimmer loading
│   ├── hooks/
│   │   └── useRealtimeAds.ts        ← Supabase Realtime hook
│   ├── lib/
│   │   ├── supabase.ts              ← Supabase client
│   │   ├── utils.ts                 ← formatNumber, CTR estimator
│   │   └── mock-data.ts             ← 54 realistic mock ads
│   └── types/index.ts               ← TypeScript interfaces
├── supabase/
│   ├── schema.sql                   ← Full DB schema + indexes
│   ├── mark_inactive_ads.sql        ← RPC for status refresh
│   └── realtime_policy.sql
├── scraper/
│   ├── engine.py                    ← Playwright scraper (Meta+TikTok)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
└── README.md
```

---

## 🔌 Supabase Query Pattern (Production)

```typescript
// Server-side filtering — handles thousands of ads efficiently
let query = supabase
  .from("ads_library")
  .select("*", { count: "exact" })
  .eq("country", "SA");

if (search)            query = query.textSearch("search_vector", search);
if (category !== "الكل") query = query.eq("category", category);
if (platform !== "all") query = query.eq("platform", platform);
if (status !== "all")   query = query.eq("status", status);

switch (sort) {
  case "latest":      query = query.order("start_date",  { ascending: false }); break;
  case "impressions": query = query.order("impressions", { ascending: false }); break;
  case "clicks":      query = query.order("clicks",      { ascending: false }); break;
  case "ctr":         query = query.order("ctr",         { ascending: false }); break;
}

const { data, count } = await query.range(offset, offset + limit - 1);
```

---

## 📊 Ad Card Freshness Logic

```typescript
// Shows "اليوم" or "منذ X ساعة" based on last_seen_at
function freshnessLabel(lastSeenAt: string): string {
  if (isToday(lastSeenAt)) return "اليوم";
  return formatDistanceToNow(parseISO(lastSeenAt), { locale: ar, addSuffix: true });
}
```

---

<div align="center">
  <strong>أدسباي العربي © 2026 — منصة بيانات الإعلانات الأولى للسوق السعودي</strong>
</div>
