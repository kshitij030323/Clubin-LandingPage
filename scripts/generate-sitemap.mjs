#!/usr/bin/env node
/**
 * Sitemap generator - fetches all clubs, events, and promoters from the API
 * and generates a comprehensive sitemap.xml for SEO.
 *
 * Run: node scripts/generate-sitemap.mjs
 */

import fs from 'fs';
import path from 'path';

const API_BASE = 'https://api.clubin.info/api';
const SITE_URL = 'https://clubin.co.in';

// Shared with prerender.py — last-known-good API snapshots so an API outage
// can't gut the sitemap (or the pre-rendered pages). Persisted across CI runs
// via actions/cache in .github/workflows/deploy.yml.
const CACHE_DIR = path.join(process.cwd(), '.api-cache');

const CITIES = [
    'Bengaluru', 'Delhi NCR', 'Goa', 'Mumbai', 'Pune',
    'Hyderabad', 'Chandigarh', 'Jaipur', 'Chennai',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Fetch JSON with retries + timeout. Returns null on persistent failure (never throws). */
async function fetchJSON(url, { retries = 3, timeoutMs = 15000 } = {}) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'Clubin-Sitemap/1.0' },
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } finally {
                clearTimeout(timer);
            }
        } catch (err) {
            console.warn(`  Attempt ${attempt}/${retries} failed for ${url}: ${err.message}`);
            if (attempt < retries) await sleep(attempt * 2000);
        }
    }
    return null;
}

/**
 * Load API data with graceful degradation:
 *   1. Try the live API (with retries).
 *   2. On success, refresh the on-disk cache snapshot and return it.
 *   3. On failure, fall back to the last cached snapshot if present.
 *   4. If nothing is available, return null (caller preserves the existing sitemap).
 */
async function loadData(name, url) {
    const cachePath = path.join(CACHE_DIR, `${name}.json`);
    const fresh = await fetchJSON(url);
    if (fresh !== null) {
        try {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
            fs.writeFileSync(cachePath, JSON.stringify(fresh), 'utf-8');
        } catch (err) {
            console.warn(`  Could not write cache for ${name}: ${err.message}`);
        }
        return fresh;
    }
    if (fs.existsSync(cachePath)) {
        console.warn(`  Using cached ${name} snapshot (live API unavailable): ${cachePath}`);
        try {
            return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        } catch (err) {
            console.warn(`  Cached ${name} snapshot is unreadable: ${err.message}`);
        }
    }
    console.warn(`  No data available for ${name} (live API down, no cache).`);
    return null;
}

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

/** Slug rules MUST match src/lib/urls.ts and scripts/prerender.py exactly. */
function slugify(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/g, '');
}

/** `slug-<id>`, or just `<id>` when the name yields no slug. */
function slugId(name, id) {
    const slug = slugify(name);
    return slug ? `${slug}-${id}` : id;
}

// High-intent sub-areas with their own landing page (mirrors src/lib/urls.ts
// and scripts/prerender.py). Only sitemapped when real venues match.
const SUBCITIES = [
    { slug: 'gurgaon', needles: ['gurgaon', 'gurugram'] },
    { slug: 'noida', needles: ['noida'] },
    { slug: 'lucknow', needles: ['lucknow'] },
];

function locationMatches(location, needles) {
    const loc = (location || '').toLowerCase();
    return needles.some((n) => loc.includes(n));
}

// Aliases for location strings that don't exactly match a CITIES entry
const CITY_ALIASES = {
    'new delhi': 'Delhi NCR',
    'delhi': 'Delhi NCR',
    'gurugram': 'Delhi NCR',
    'gurgaon': 'Delhi NCR',
    'noida': 'Delhi NCR',
    'faridabad': 'Delhi NCR',
};

/** Extract city slug from location like "Malleshwaram, Bengaluru" -> "bengaluru" */
function getCitySlug(location) {
    const parts = location.split(',');
    const city = parts[parts.length - 1].trim().toLowerCase();
    const alias = CITY_ALIASES[city];
    const match = CITIES.find(c => c.toLowerCase() === (alias || city).toLowerCase());
    return (match || alias || city).toLowerCase().replace(/\s+/g, '-');
}

async function generateSitemap() {
    console.log('Fetching data from API...');

    const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');

    const [clubsData, eventsData] = await Promise.all([
        loadData('clubs', `${API_BASE}/clubs`),
        loadData('events', `${API_BASE}/events`),
    ]);

    // Total outage with no cache: never overwrite a good sitemap with a reduced
    // one (that would drop every club/event URL Google already knows). Keep the
    // last deployed sitemap if it exists; only write a static-only fallback when
    // there is nothing at all to serve.
    if (clubsData === null && eventsData === null) {
        if (fs.existsSync(outPath)) {
            console.warn('API unavailable and no cache — preserving existing sitemap.xml unchanged.');
            return;
        }
        console.warn('API unavailable and no cache — writing a static-only sitemap fallback.');
    }

    const clubs = clubsData || [];
    const events = eventsData || [];

    // Collect unique promoter IDs from events
    const promoterIds = new Set();
    for (const event of events) {
        if (event.promoterRef?.id) {
            promoterIds.add(event.promoterRef.id);
        }
    }

    // Also collect from clubs' promoterClubs
    for (const club of clubs) {
        if (club.promoterClubs) {
            for (const pc of club.promoterClubs) {
                if (pc.promoter?.id) {
                    promoterIds.add(pc.promoter.id);
                }
            }
        }
    }

    const today = todayISO();
    const urls = [];

    // 1. Static pages
    // Root is the only URL without a trailing slash — all others are pre-rendered
    // as dist/<path>/index.html so GitHub Pages serves them at <path>/ and
    // 301-redirects the no-slash form. Sitemap must match the final destination.
    urls.push({ loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0', lastmod: today });
    urls.push({ loc: `${SITE_URL}/list-your-club/`, changefreq: 'monthly', priority: '0.8', lastmod: today });
    urls.push({ loc: `${SITE_URL}/list-your-club/schedule/`, changefreq: 'monthly', priority: '0.6', lastmod: today });
    urls.push({ loc: `${SITE_URL}/clubs/`, changefreq: 'weekly', priority: '0.9', lastmod: today });
    urls.push({ loc: `${SITE_URL}/explore/`, changefreq: 'weekly', priority: '0.7', lastmod: today });
    urls.push({ loc: `${SITE_URL}/support/`, changefreq: 'monthly', priority: '0.5', lastmod: today });
    urls.push({ loc: `${SITE_URL}/terms/`, changefreq: 'monthly', priority: '0.3', lastmod: today });
    urls.push({ loc: `${SITE_URL}/privacy/`, changefreq: 'monthly', priority: '0.3', lastmod: today });
    urls.push({ loc: `${SITE_URL}/delete-account/`, changefreq: 'monthly', priority: '0.3', lastmod: today });

    // 2. City pages — use lowercase slugs matching React routes
    for (const city of CITIES) {
        const slug = city.toLowerCase().replace(/\s+/g, '-');
        urls.push({
            loc: `${SITE_URL}/clubs/${slug}/`,
            changefreq: 'daily',
            priority: '0.8',
            lastmod: today,
        });
    }

    // 3. Club detail pages — use city slug, not raw location
    //    Include images (image sitemap extension) for Google Images visibility
    for (const club of clubs) {
        const citySlug = getCitySlug(club.location || 'India');
        const images = [club.imageUrl, ...(club.venueImages || []).slice(0, 3)].filter(Boolean);
        urls.push({
            loc: `${SITE_URL}/clubs/${citySlug}/${slugId(club.name, club.id)}/`,
            changefreq: 'weekly',
            priority: '0.7',
            lastmod: club.updatedAt ? club.updatedAt.split('T')[0] : today,
            images,
        });
    }

    // 4. Upcoming event pages only — past events are removed to avoid stale URLs
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date || e.startTime || e.updatedAt) >= now);

    // Sub-area landing pages — only when real venues match (mirrors prerender.py)
    for (const { slug, needles } of SUBCITIES) {
        const hasClub = clubs.some(c => locationMatches(c.location, needles));
        const hasEvent = upcomingEvents.some(e => locationMatches(e.location || e.region, needles));
        if (hasClub || hasEvent) {
            urls.push({ loc: `${SITE_URL}/clubs/${slug}/`, changefreq: 'daily', priority: '0.8', lastmod: today });
        }
    }

    for (const event of upcomingEvents) {
        urls.push({
            loc: `${SITE_URL}/events/${slugId(event.title, event.id)}/`,
            changefreq: 'daily',
            priority: '0.8',
            lastmod: event.updatedAt ? event.updatedAt.split('T')[0] : today,
            images: [event.imageUrl].filter(Boolean),
        });
    }

    // 5. Promoter pages
    for (const id of promoterIds) {
        urls.push({
            loc: `${SITE_URL}/promoters/${id}/`,
            changefreq: 'weekly',
            priority: '0.6',
            lastmod: today,
        });
    }

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
    xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
    xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
    xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;

    for (const url of urls) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        xml += `    <priority>${url.priority}</priority>\n`;
        for (const img of url.images || []) {
            xml += `    <image:image><image:loc>${escapeXml(img)}</image:loc></image:image>\n`;
        }
        xml += `  </url>\n`;
    }

    xml += `\n</urlset>\n`;

    // Write to public/sitemap.xml. robots.txt advertises a STABLE sitemap URL
    // (no ?v= cache-buster) — Google re-reads on its own cadence using <lastmod>,
    // and a URL that changes daily just fragments Search Console tracking.
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, xml, 'utf-8');

    console.log(`Sitemap generated with ${urls.length} URLs -> ${outPath}`);
    console.log(`  - Static: 8`);
    console.log(`  - Cities: ${CITIES.length}`);
    console.log(`  - Clubs: ${clubs.length}`);
    console.log(`  - Events: ${upcomingEvents.length} upcoming (${events.length - upcomingEvents.length} past skipped)`);
    console.log(`  - Promoters: ${promoterIds.size}`);
}

generateSitemap().catch((err) => {
    // Never break the deploy over the sitemap step: log loudly and exit 0 so
    // tsc/vite/prerender still run. Any previously deployed sitemap.xml is left
    // in place and the next scheduled build regenerates it.
    console.error('::warning::Sitemap generation failed; continuing build with existing sitemap.', err);
    process.exit(0);
});
