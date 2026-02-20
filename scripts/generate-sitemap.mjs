#!/usr/bin/env node
/**
 * Sitemap generator - fetches all clubs, events, and promoters from the API
 * and generates a comprehensive sitemap.xml for SEO.
 *
 * Run: node scripts/generate-sitemap.mjs
 */

const API_BASE = 'https://api.clubin.info/api';
const SITE_URL = 'https://clubin.co.in';

const CITIES = [
    'Bengaluru', 'Delhi NCR', 'Goa', 'Mumbai', 'Pune',
    'Hyderabad', 'Chandigarh', 'Jaipur', 'Chennai',
];

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.json();
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

/** Extract city slug from location like "Malleshwaram, Bengaluru" -> "bengaluru" */
function getCitySlug(location) {
    const parts = location.split(',');
    const city = parts[parts.length - 1].trim();
    const match = CITIES.find(c => c.toLowerCase() === city.toLowerCase());
    return (match || city).toLowerCase().replace(/\s+/g, '-');
}

async function generateSitemap() {
    console.log('Fetching data from API...');

    const [clubs, events] = await Promise.all([
        fetchJSON(`${API_BASE}/clubs`),
        fetchJSON(`${API_BASE}/events`),
    ]);

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
    urls.push({ loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0', lastmod: today });
    urls.push({ loc: `${SITE_URL}/list-your-club`, changefreq: 'monthly', priority: '0.8', lastmod: today });
    urls.push({ loc: `${SITE_URL}/clubs`, changefreq: 'weekly', priority: '0.9', lastmod: today });

    // 2. City pages — use lowercase slugs matching React routes
    for (const city of CITIES) {
        const slug = city.toLowerCase().replace(/\s+/g, '-');
        urls.push({
            loc: `${SITE_URL}/clubs/${slug}`,
            changefreq: 'daily',
            priority: '0.8',
            lastmod: today,
        });
    }

    // 3. Club detail pages — use city slug, not raw location
    for (const club of clubs) {
        const citySlug = getCitySlug(club.location || 'India');
        urls.push({
            loc: `${SITE_URL}/clubs/${citySlug}/${club.id}`,
            changefreq: 'weekly',
            priority: '0.7',
            lastmod: club.updatedAt ? club.updatedAt.split('T')[0] : today,
        });
    }

    // 4. Event pages
    for (const event of events) {
        urls.push({
            loc: `${SITE_URL}/events/${event.id}`,
            changefreq: 'daily',
            priority: '0.8',
            lastmod: event.updatedAt ? event.updatedAt.split('T')[0] : today,
        });
    }

    // 5. Promoter pages
    for (const id of promoterIds) {
        urls.push({
            loc: `${SITE_URL}/promoters/${id}`,
            changefreq: 'weekly',
            priority: '0.6',
            lastmod: today,
        });
    }

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
    xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
    xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;

    for (const url of urls) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        xml += `    <priority>${url.priority}</priority>\n`;
        xml += `  </url>\n`;
    }

    xml += `\n</urlset>\n`;

    // Write to public/sitemap.xml
    const fs = await import('fs');
    const path = await import('path');
    const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(outPath, xml, 'utf-8');

    // Update robots.txt sitemap version to bust Google's cache on each build
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
        let robots = fs.readFileSync(robotsPath, 'utf-8');
        const version = today.replace(/-/g, '');
        robots = robots.replace(
            /Sitemap:\s*https:\/\/clubin\.co\.in\/sitemap\.xml\S*/,
            `Sitemap: https://clubin.co.in/sitemap.xml?v=${version}`
        );
        fs.writeFileSync(robotsPath, robots, 'utf-8');
        console.log(`Updated robots.txt sitemap version to ?v=${version}`);
    }

    console.log(`Sitemap generated with ${urls.length} URLs -> ${outPath}`);
    console.log(`  - Static: 2`);
    console.log(`  - Cities: ${CITIES.length}`);
    console.log(`  - Clubs: ${clubs.length}`);
    console.log(`  - Events: ${events.length}`);
    console.log(`  - Promoters: ${promoterIds.size}`);
}

generateSitemap().catch((err) => {
    console.error('Failed to generate sitemap:', err);
    process.exit(1);
});
