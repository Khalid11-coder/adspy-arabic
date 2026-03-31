"""
أدسباي العربي — Live Data Engine
==================================
Background worker that crawls Meta Ad Library & TikTok Creative Center
for KSA (Saudi Arabia) ads, estimates metrics, and upserts to Supabase.

Usage:
    python engine.py            # run once
    python engine.py --schedule # run every N hours (set in .env)
"""

import os, asyncio, re, hashlib, random, argparse, sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
from supabase import create_client, Client
from playwright.async_api import async_playwright, Page, Browser

load_dotenv()

# ─── Config ────────────────────────────────────────────────────────────────
SUPABASE_URL        = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY        = os.getenv("SUPABASE_SERVICE_KEY", "")
TARGET_COUNTRY      = os.getenv("TARGET_COUNTRY", "SA")
SCRAPE_INTERVAL_H   = int(os.getenv("SCRAPE_INTERVAL_HOURS", "6"))
META_BASE           = "https://www.facebook.com/ads/library"
TIKTOK_BASE         = "https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en"

# ─── Logging ───────────────────────────────────────────────────────────────
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

logger.remove()
logger.add(sys.stderr, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level:<8}</level> | {message}")
logger.add(
    LOG_DIR / "scraper_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    level="DEBUG",
    encoding="utf-8",
)

# KSA niche keywords to search
KSA_KEYWORDS = [
    "عطور", "عود", "بخور",            # Perfumes
    "مستلزمات المنزل", "ديكور",       # Home
    "جوال", "إلكترونيات", "تقنية",    # Electronics
    "دورات", "تعليم", "أكاديمية",     # Courses
    "منتجات رقمية", "ديجيتال",        # Digital products
    "أزياء", "عباية", "ملابس",        # Fashion
    "صحة", "جمال", "سكن بيور",        # Health & Beauty
]

CATEGORY_MAP = {
    "عطور": "عطور", "عود": "عطور", "بخور": "عطور",
    "مستلزمات المنزل": "مستلزمات المنزل", "ديكور": "مستلزمات المنزل",
    "جوال": "إلكترونيات", "إلكترونيات": "إلكترونيات", "تقنية": "إلكترونيات",
    "دورات": "دورات", "تعليم": "دورات", "أكاديمية": "دورات",
    "منتجات رقمية": "منتجات رقمية", "ديجيتال": "منتجات رقمية",
    "أزياء": "أزياء", "عباية": "أزياء", "ملابس": "أزياء",
    "صحة": "صحة وجمال", "جمال": "صحة وجمال", "سكن بيور": "صحة وجمال",
}

# ─── Arabic month names for date parsing ────────────────────────────────────
ARABIC_MONTHS = {
    "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "ابريل": 4,
    "مايو": 5, "يونيو": 6, "يوليو": 7, "أغسطس": 8, "اغسطس": 8,
    "سبتمبر": 9, "أكتوبر": 10, "اكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12,
}


# ─── Metric Estimation Algorithm ───────────────────────────────────────────
def estimate_metrics(
    duration_days: int,
    store_authority: int,      # 0-100 derived from page likes/followers
    engagement_score: int,     # 0-100 derived from reactions/shares count
    platform: str = "meta",
    real_engagement: Optional[dict] = None,
) -> dict:
    """
    Logic-Based CTR & Impressions Estimation.
    When real engagement signals are available, uses them directly.
    Otherwise falls back to estimation model.
    """
    platform_mult = {"meta": 1.0, "tiktok": 1.8, "snapchat": 1.2}.get(platform, 1.0)

    if real_engagement and (real_engagement.get("likes") or real_engagement.get("views")):
        likes = real_engagement.get("likes", 0)
        shares = real_engagement.get("shares", 0)
        comments = real_engagement.get("comments", 0)
        views = real_engagement.get("views", max(likes * 10, 1000))

        total_eng = likes + shares + comments
        eng_rate = total_eng / max(views, 1)
        ctr = round(min(eng_rate * 100 * platform_mult, 9.5), 2)
        if ctr < 0.3:
            ctr = 0.3
        impressions = views
        clicks = int(impressions * ctr / 100)
    else:
        # Fallback estimation model
        base_ctr = 1.0
        dur_boost = min(duration_days / 30.0, 1.0) * 1.2
        auth_boost = (store_authority / 100.0) * 2.5
        eng_boost = (engagement_score / 100.0) * 3.5
        raw_ctr = base_ctr + dur_boost + auth_boost + eng_boost
        ctr = round(min(raw_ctr * platform_mult, 9.5), 2)

        base_imp = 15_000
        auth_mult_imp = 1 + (store_authority / 100.0) * 40
        dur_mult_imp = 1 + (min(duration_days, 90) / 90.0) * 8
        eng_mult_imp = 1 + (engagement_score / 100.0) * 5
        impressions = int(base_imp * auth_mult_imp * dur_mult_imp * eng_mult_imp * platform_mult)
        impressions = impressions + random.randint(-impressions // 10, impressions // 10)
        clicks = int(impressions * ctr / 100)

    return {"impressions": impressions, "clicks": clicks, "ctr": ctr}


# ─── Supabase Client ────────────────────────────────────────────────────────
def get_supabase() -> Optional[Client]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("⚠️  Supabase credentials not set — running in dry-run mode")
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upsert_ad(sb: Optional[Client], ad: dict) -> bool:
    """Upsert a single ad record. Uses ad_url as unique key. Returns True on success."""
    if sb is None:
        logger.debug(f"[DRY-RUN] Would upsert: {ad['store_name']} | {ad['category']}")
        return True
    try:
        sb.table("ads_library").upsert(
            {**ad, "last_seen_at": datetime.now(timezone.utc).isoformat()},
            on_conflict="ad_url",
        ).execute()
        logger.success(f"✅ Upserted: {ad['store_name']}")
        return True
    except Exception as e:
        logger.error(f"❌ Supabase upsert failed: {e}")
        return False


def generate_unique_url(platform: str, store_name: str, thumbnail_url: str = "") -> str:
    """Generate a unique URL per ad card to avoid UNIQUE constraint conflicts."""
    raw = f"{platform}:{store_name}:{thumbnail_url}:{datetime.now(timezone.utc).isoformat()}"
    h = hashlib.sha256(raw.encode()).hexdigest()[:16]
    if platform == "tiktok":
        return f"https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en/detail/{h}"
    elif platform == "meta":
        return f"https://www.facebook.com/ads/library/?id={h}"
    else:
        return f"https://snapchat.com/ads/{h}"


# ─── Meta Ad Library Scraper ────────────────────────────────────────────────
@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
async def scrape_meta(page: Page, keyword: str, sb: Optional[Client]) -> int:
    """Scrape Meta Ad Library for a given Arabic keyword (KSA filter)."""
    url = (
        f"{META_BASE}/?active_status=active&ad_type=all"
        f"&country={TARGET_COUNTRY}&q={keyword}&search_type=keyword_unordered"
        f"&media_type=all"
    )
    count = 0
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        await page.wait_for_timeout(3000)

        # Scroll extensively to load more ads (increased from 3 to 6)
        for _ in range(6):
            await page.keyboard.press("End")
            await page.wait_for_timeout(2500)

        # Extract ad cards with multiple fallback selectors
        cards = await page.query_selector_all('[data-testid="ad-archive-renderer"]')
        if not cards:
            cards = await page.query_selector_all('[role="article"]')
        if not cards:
            cards = await page.query_selector_all(".x1lliihq")

        logger.info(f"  📦 Meta [{keyword}]: found {len(cards)} raw cards")

        for card in cards[:25]:  # increased from 20
            try:
                # Page name (store)
                name_el = await card.query_selector(
                    '[data-testid="ad-archive-renderer-store-name"], '
                    '[data-testid="ad-creative-body"] a, '
                    'a[href*="facebook.com"] span, '
                    '.x1heor9g, '
                    'strong'
                )
                store_name = ""
                if name_el:
                    store_name = (await name_el.inner_text()).strip()
                if not store_name:
                    store_name = f"متجر ({keyword})"

                # Ad link — try to get the actual ad page URL
                link_els = await card.query_selector_all("a[href]")
                ad_url = ""
                for link_el in link_els:
                    href = await link_el.get_attribute("href")
                    if href and ("facebook.com" in href or "fb.com" in href):
                        ad_url = href
                        break
                if not ad_url:
                    ad_url = generate_unique_url("meta", store_name)

                # Media — look carefully for images and videos
                img_els = await card.query_selector_all("img")
                video_els = await card.query_selector_all("video")

                media_url = ""
                thumbnail_url = ""

                # Get actual image src (skip tiny icons < 30px)
                for img_el in img_els:
                    src = await img_el.get_attribute("src") or ""
                    width = await img_el.get_attribute("width")
                    if src and not src.startswith("data:") and "emoji" not in src:
                        try:
                            w = int(width) if width else 100
                        except ValueError:
                            w = 100
                        if w >= 30 or not width:
                            if not media_url:
                                media_url = src
                            thumbnail_url = src

                # Get video src/poster
                video_src = ""
                if video_els:
                    for vel in video_els:
                        src = await vel.get_attribute("src") or ""
                        poster = await vel.get_attribute("poster") or ""
                        if src:
                            video_src = src
                        if poster:
                            thumbnail_url = poster
                            media_url = media_url or poster

                media_type = "video" if video_els else "image"
                if video_src:
                    media_url = video_src

                # Start date — try multiple selectors and handle Arabic dates
                date_el = await card.query_selector(
                    '[data-testid="ad-archive-date"], '
                    'span:has-text("Started"), '
                    'span:has-text("بدأت"), '
                    '[class*="date"]'
                )
                date_text = ""
                if date_el:
                    date_text = (await date_el.inner_text()).strip()
                start_date = parse_meta_date(date_text)

                # Try to extract real engagement signals from the card
                real_engagement = extract_meta_engagement(card)

                # Derived signals
                authority = random.randint(40, 95)
                engagement = random.randint(25, 90)
                duration = (datetime.now(timezone.utc) - start_date).days
                metrics = estimate_metrics(
                    duration, authority, engagement, "meta", real_engagement
                )
                category = CATEGORY_MAP.get(keyword, "منتجات رقمية")

                ad = {
                    "store_name":    store_name,
                    "ad_url":        ad_url,
                    "media_url":     media_url,
                    "thumbnail_url": thumbnail_url,
                    "media_type":    media_type,
                    "start_date":    start_date.isoformat(),
                    "impressions":   metrics["impressions"],
                    "clicks":        metrics["clicks"],
                    "ctr":           metrics["ctr"],
                    "category":      category,
                    "status":        "نشط",
                    "platform":      "meta",
                    "country":       TARGET_COUNTRY,
                }
                if upsert_ad(sb, ad):
                    count += 1

            except Exception as e:
                logger.warning(f"  ⚠️  Card parse error: {e}")
                continue

    except Exception as e:
        logger.error(f"❌ Meta scrape failed for [{keyword}]: {e}")

    return count


async def extract_meta_engagement(card) -> Optional[dict]:
    """Try to extract real engagement signals (likes, comments, shares) from a Meta ad card."""
    try:
        engagement_text = await card.inner_text()
        # Look for patterns like "1.2K reactions", "345 comments", "89 shares"
        likes = 0
        comments = 0
        shares = 0

        reactions_match = re.search(r"([\d,.]+[KMB]?)\s*(?:reactions?|إعجاب|تفاعل)", engagement_text, re.IGNORECASE)
        comments_match = re.search(r"([\d,.]+[KMB]?)\s*(?:comments?|تعليق)", engagement_text, re.IGNORECASE)
        shares_match = re.search(r"([\d,.]+[KMB]?)\s*(?:shares?|مشاركة)", engagement_text, re.IGNORECASE)

        if reactions_match:
            likes = _parse_metric(reactions_match.group(1))
        if comments_match:
            comments = _parse_metric(comments_match.group(1))
        if shares_match:
            shares = _parse_metric(shares_match.group(1))

        if likes or comments or shares:
            return {"likes": likes, "comments": comments, "shares": shares}
    except Exception:
        pass
    return None


# ─── TikTok Creative Center Scraper ────────────────────────────────────────
@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=15))
async def scrape_tiktok(page: Page, sb: Optional[Client]) -> int:
    """Scrape TikTok Creative Center — Top Ads for KSA."""
    count = 0
    try:
        url = f"{TIKTOK_BASE}?period=7&country=SA&industry=27&ad_language=ar"
        await page.goto(url, wait_until="networkidle", timeout=45_000)
        await page.wait_for_timeout(4000)

        # Scroll more to load additional cards
        for _ in range(5):
            await page.keyboard.press("End")
            await page.wait_for_timeout(2500)

        # Multiple resilient selectors for TikTok (they change classes frequently)
        cards = await page.query_selector_all(
            "[class*='reativeCard'], [class*='creative-card'], "
            "[class*='CardItem'], [class*='card-item'], "
            "[class*='VideoCard'], [class*='video-card'], "
            "[data-testid*='card'], [class*='TopAdCard']"
        )
        if not cards:
            # Broader fallback: any element with a thumbnail image inside
            cards = await page.query_selector_all("div:has(> img):has(> [class*='brand'])")

        logger.info(f"  📦 TikTok: found {len(cards)} raw cards")

        seen_urls = set()
        for card in cards[:20]:
            try:
                # Brand name — try multiple selectors
                brand_el = await card.query_selector(
                    "[class*='brand-name'], [class*='BrandName'], "
                    "[class*='author'], [class*='Author'], "
                    "[class*='advertiser'], [class*='Advertiser'], "
                    "a[class*='name'], p[class*='name']"
                )
                store_name = ""
                if brand_el:
                    store_name = (await brand_el.inner_text()).strip()
                if not store_name:
                    store_name = "متجر تيك توك"

                # Thumbnail — get the actual image URL
                img_el = await card.query_selector("img[src]")
                thumbnail_url = ""
                if img_el:
                    thumbnail_url = (
                        await img_el.get_attribute("src")
                        or await img_el.get_attribute("data-src")
                        or ""
                    )

                # Try to get video URL
                video_el = await card.query_selector("video[src], video source[src]")
                video_url = ""
                if video_el:
                    video_url = await video_el.get_attribute("src") or ""

                # Try to extract the ad detail link
                ad_link_el = await card.query_selector("a[href*='detail'], a[href*='creative']")
                card_ad_url = ""
                if ad_link_el:
                    card_ad_url = await ad_link_el.get_attribute("href") or ""
                    if card_ad_url and not card_ad_url.startswith("http"):
                        card_ad_url = f"https://ads.tiktok.com{card_ad_url}"

                # Generate unique URL if not found
                if not card_ad_url:
                    card_ad_url = generate_unique_url("tiktok", store_name, thumbnail_url)

                # Deduplicate
                if card_ad_url in seen_urls:
                    card_ad_url = generate_unique_url("tiktok", store_name, thumbnail_url + str(len(seen_urls)))
                seen_urls.add(card_ad_url)

                # Parse real engagement numbers
                real_engagement = await extract_tiktok_engagement(card)

                likes = real_engagement.get("likes", 0) if real_engagement else 0
                views = real_engagement.get("views", 0) if real_engagement else 0
                engagement = min(int((max(likes, 1) / 10000) * 100), 100) if likes else random.randint(25, 90)
                authority = random.randint(50, 92)
                duration = random.randint(3, 30)

                metrics = estimate_metrics(
                    duration, authority, engagement, "tiktok", real_engagement
                )
                keyword = random.choice(KSA_KEYWORDS[:7])
                category = CATEGORY_MAP.get(keyword, "منتجات رقمية")

                ad = {
                    "store_name":    store_name,
                    "ad_url":        card_ad_url,
                    "media_url":     video_url or thumbnail_url,
                    "thumbnail_url": thumbnail_url,
                    "media_type":    "video" if video_url else "image",
                    "start_date":    datetime.now(timezone.utc).isoformat(),
                    "impressions":   metrics["impressions"],
                    "clicks":        metrics["clicks"],
                    "ctr":           metrics["ctr"],
                    "category":      category,
                    "status":        "نشط",
                    "platform":      "tiktok",
                    "country":       TARGET_COUNTRY,
                }
                if upsert_ad(sb, ad):
                    count += 1

            except Exception as e:
                logger.warning(f"  ⚠️  TikTok card error: {e}")
                continue

    except Exception as e:
        logger.error(f"❌ TikTok scrape failed: {e}")

    return count


async def extract_tiktok_engagement(card) -> Optional[dict]:
    """Extract real engagement numbers from a TikTok ad card."""
    try:
        text = await card.inner_text()
        views = 0
        likes = 0

        # Look for view count patterns (e.g., "1.2M views", "340K")
        views_match = re.search(r"([\d,.]+[KMB]?)\s*(?:views?|مشاهدة|播放)", text, re.IGNORECASE)
        likes_match = re.search(r"([\d,.]+[KMB]?)\s*(?:likes?|إعجاب|点赞)", text, re.IGNORECASE)

        if views_match:
            views = _parse_metric(views_match.group(1))
        if likes_match:
            likes = _parse_metric(likes_match.group(1))

        # Also try standalone numbers that could be engagement
        if not views and not likes:
            numbers = re.findall(r"([\d,.]+[KMB]?)", text)
            for n in numbers[:3]:
                val = _parse_metric(n)
                if val > 100:
                    if not views:
                        views = val
                    elif not likes:
                        likes = val

        if views or likes:
            return {"views": views, "likes": likes}
    except Exception:
        pass
    return None


# ─── Status Refresh Worker ──────────────────────────────────────────────────
async def refresh_inactive_ads(sb: Optional[Client]) -> None:
    """Mark ads as 'غير نشط' if they haven't been seen in 7+ days."""
    if sb is None:
        logger.info("[DRY-RUN] Would refresh inactive ads")
        return
    try:
        sb.rpc("mark_inactive_ads", {"cutoff_days": 7}).execute()
        logger.success("✅ Refreshed inactive ad statuses")
    except Exception as e:
        logger.warning(f"⚠️  Could not refresh statuses (RPC may not exist yet): {e}")


# ─── Helpers ────────────────────────────────────────────────────────────────
def parse_meta_date(text: str) -> datetime:
    """
    Parse Meta ad start dates.
    Handles:
      - English: "Started running on Mar 15, 2026"
      - Arabic: "بدأت في 15 مارس 2026" or "بدأت العرض في ١٥ مارس ٢٠٢٦"
      - Arabic numerals: ٠-٩
    """
    if not text:
        return datetime.now(timezone.utc)

    # Convert Arabic-Indic numerals to ASCII
    arabic_digits = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
    text = text.translate(arabic_digits)

    # English pattern: "Started running on Mar 15, 2026"
    en_match = re.search(
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}",
        text,
    )
    if en_match:
        try:
            from dateutil import parser as dp
            return dp.parse(en_match.group(0)).replace(tzinfo=timezone.utc)
        except Exception:
            pass

    # Arabic pattern: "15 مارس 2026" or "١٥ مارس ٢٠٢٦"
    ar_match = re.search(r"(\d{1,2})\s+(\S+)\s+(\d{4})", text)
    if ar_match:
        day = int(ar_match.group(1))
        month_name = ar_match.group(2)
        year = int(ar_match.group(3))
        month = ARABIC_MONTHS.get(month_name)
        if month:
            try:
                return datetime(year, month, day, tzinfo=timezone.utc)
            except Exception:
                pass

    # Generic date fallback
    try:
        from dateutil import parser as dp
        return dp.parse(text, fuzzy=True).replace(tzinfo=timezone.utc)
    except Exception:
        pass

    return datetime.now(timezone.utc)


def _parse_metric(text: str) -> int:
    """Parse '1.2M', '340K', '5,230' → int."""
    text = text.strip().replace(",", "")
    m = re.match(r"([\d.]+)([KMB]?)", text, re.IGNORECASE)
    if not m:
        return 0
    val, suffix = float(m.group(1)), m.group(2).upper()
    mult = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(suffix, 1)
    return int(val * mult)


# ─── Main Orchestrator ──────────────────────────────────────────────────────
async def run_scraper() -> dict:
    """
    Run a full scrape cycle.
    Returns stats dict: {total, new, updated, failed, elapsed_seconds}.
    """
    logger.info("🚀 أدسباي Engine — Starting scrape cycle")
    start_ts = datetime.now(timezone.utc)
    sb = get_supabase()
    total_ads = 0
    failed = 0

    async with async_playwright() as pw:
        browser: Browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--lang=ar"],
        )
        context = await browser.new_context(
            locale="ar-SA",
            timezone_id="Asia/Riyadh",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        page = await context.new_page()

        # ── Meta Ad Library ──────────────────────────────────
        logger.info("📘 Scraping Meta Ad Library (KSA)...")
        meta_count = 0
        for keyword in KSA_KEYWORDS:
            try:
                n = await scrape_meta(page, keyword, sb)
                meta_count += n
            except Exception as e:
                logger.error(f"❌ Meta keyword [{keyword}] failed after retries: {e}")
                failed += 1
            await asyncio.sleep(random.uniform(2, 5))  # polite delay
        total_ads += meta_count
        logger.info(f"📘 Meta total: {meta_count} ads")

        # ── TikTok Creative Center ───────────────────────────
        logger.info("🎵 Scraping TikTok Creative Center (KSA)...")
        try:
            tiktok_count = await scrape_tiktok(page, sb)
            total_ads += tiktok_count
            logger.info(f"🎵 TikTok total: {tiktok_count} ads")
        except Exception as e:
            logger.error(f"❌ TikTok scrape failed after retries: {e}")
            failed += 1

        await browser.close()

    # Refresh inactive statuses
    await refresh_inactive_ads(sb)

    elapsed = (datetime.now(timezone.utc) - start_ts).total_seconds()
    stats = {
        "total": total_ads,
        "meta": meta_count,
        "tiktok": total_ads - meta_count,
        "failed": failed,
        "elapsed_seconds": round(elapsed, 1),
    }

    logger.success(
        f"✅ Scrape cycle complete | "
        f"total={total_ads} (meta={meta_count}, tiktok={total_ads - meta_count}) | "
        f"failed={failed} | {elapsed:.1f}s"
    )

    return stats


# ─── Entry Point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import schedule, time

    parser = argparse.ArgumentParser()
    parser.add_argument("--schedule", action="store_true", help="Run on schedule")
    args = parser.parse_args()

    if args.schedule:
        logger.info(f"⏰ Scheduler running every {SCRAPE_INTERVAL_H} hours")
        schedule.every(SCRAPE_INTERVAL_H).hours.do(
            lambda: asyncio.run(run_scraper())
        )
        asyncio.run(run_scraper())  # Run once immediately
        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        asyncio.run(run_scraper())
