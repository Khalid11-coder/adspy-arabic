-- ═══════════════════════════════════════════════════════════
--  أدسباي العربي — Supabase Schema
--  Run this in: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Main ads table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads_library (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_name    TEXT NOT NULL,
  ad_url        TEXT NOT NULL UNIQUE,
  media_url     TEXT,
  thumbnail_url TEXT,
  media_type    TEXT CHECK (media_type IN ('video','image')) DEFAULT 'image',
  start_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  impressions   BIGINT NOT NULL DEFAULT 0,
  clicks        BIGINT NOT NULL DEFAULT 0,
  ctr           NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  category      TEXT NOT NULL CHECK (
    category IN (
      'عطور','مستلزمات المنزل','إلكترونيات',
      'دورات','منتجات رقمية','أزياء','صحة وجمال'
    )
  ),
  status        TEXT NOT NULL CHECK (status IN ('نشط','غير نشط')) DEFAULT 'نشط',
  platform      TEXT NOT NULL CHECK (platform IN ('meta','tiktok','snapchat')) DEFAULT 'meta',
  country       TEXT NOT NULL DEFAULT 'SA',
  store_logo    TEXT,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes for fast filtering & sorting ────────────────────
CREATE INDEX idx_ads_category    ON ads_library(category);
CREATE INDEX idx_ads_platform    ON ads_library(platform);
CREATE INDEX idx_ads_status      ON ads_library(status);
CREATE INDEX idx_ads_start_date  ON ads_library(start_date DESC);
CREATE INDEX idx_ads_impressions ON ads_library(impressions DESC);
CREATE INDEX idx_ads_clicks      ON ads_library(clicks DESC);
CREATE INDEX idx_ads_ctr         ON ads_library(ctr DESC);
CREATE INDEX idx_ads_country     ON ads_library(country);
CREATE INDEX idx_ads_store_name  ON ads_library USING gin(to_tsvector('simple', store_name));
CREATE INDEX idx_ads_last_seen   ON ads_library(last_seen_at DESC);

-- ── Full-text search index ───────────────────────────────────
ALTER TABLE ads_library ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
UPDATE ads_library SET search_vector = to_tsvector('simple', store_name || ' ' || category);
CREATE INDEX idx_ads_fts ON ads_library USING gin(search_vector);

-- ── Auto-update updated_at trigger ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ads_updated_at
  BEFORE UPDATE ON ads_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Auto-update search_vector trigger ───────────────────────
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('simple', NEW.store_name || ' ' || NEW.category);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ads_search_vector
  BEFORE INSERT OR UPDATE ON ads_library
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE ads_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON ads_library FOR SELECT USING (true);
CREATE POLICY "Service role write"  ON ads_library FOR ALL USING (auth.role() = 'service_role');

-- ── Enable Realtime ──────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE ads_library;

-- ── Sample seed data (KSA March 2026) ───────────────────────
INSERT INTO ads_library
  (store_name, ad_url, media_url, media_type, start_date, impressions, clicks, ctr, category, status, platform)
VALUES
  ('متجر النخبة',        'https://fb.com/ads/library/?id=111001','https://picsum.photos/seed/s1/400/500','image', NOW() - INTERVAL '2 days',  820000, 23780, 2.90, 'عطور',            'نشط',     'meta'),
  ('عطور الفخامة',       'https://fb.com/ads/library/?id=111002','https://picsum.photos/seed/s2/400/500','video', NOW() - INTERVAL '1 day',  1500000, 67500, 4.50, 'عطور',            'نشط',     'meta'),
  ('تك هب السعودية',     'https://fb.com/ads/library/?id=111003','https://picsum.photos/seed/s3/400/500','image', NOW() - INTERVAL '5 days',  340000, 11220, 3.30, 'إلكترونيات',      'نشط',     'tiktok'),
  ('أكاديمية الريادة',   'https://fb.com/ads/library/?id=111004','https://picsum.photos/seed/s4/400/500','video', NOW() - INTERVAL '3 days',  980000, 58800, 6.00, 'دورات',           'نشط',     'meta'),
  ('ديجيتال ستور',       'https://fb.com/ads/library/?id=111005','https://picsum.photos/seed/s5/400/500','image', NOW() - INTERVAL '7 days',  250000,  5750, 2.30, 'منتجات رقمية',    'نشط',     'snapchat'),
  ('منزلي الجميل',       'https://fb.com/ads/library/?id=111006','https://picsum.photos/seed/s6/400/500','image', NOW() - INTERVAL '10 days', 410000, 10660, 2.60, 'مستلزمات المنزل', 'نشط',     'meta'),
  ('عالم العود',         'https://fb.com/ads/library/?id=111007','https://picsum.photos/seed/s7/400/500','video', NOW() - INTERVAL '0 days', 2200000,132000, 6.00, 'عطور',            'نشط',     'tiktok'),
  ('كورسات برو',         'https://fb.com/ads/library/?id=111008','https://picsum.photos/seed/s8/400/500','image', NOW() - INTERVAL '4 days',  770000, 30800, 4.00, 'دورات',           'نشط',     'meta'),
  ('سوق الإلكترونيات',   'https://fb.com/ads/library/?id=111009','https://picsum.photos/seed/s9/400/500','video', NOW() - INTERVAL '6 days',  620000, 18600, 3.00, 'إلكترونيات',      'نشط',     'snapchat'),
  ('بيت الأناقة',        'https://fb.com/ads/library/?id=111010','https://picsum.photos/seed/s10/400/500','image',NOW() - INTERVAL '90 days', 95000,  1330, 1.40, 'أزياء',           'غير نشط', 'meta');
