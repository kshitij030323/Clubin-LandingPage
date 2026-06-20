// Canonical URL + slug helpers for club/event pages.
//
// IMPORTANT: the slugify() rules below MUST stay byte-identical to the Python
// copy in scripts/prerender.py and the JS copy in scripts/generate-sitemap.mjs.
// If they drift, the React canonical, the pre-rendered HTML, and the sitemap
// will disagree and Google will see duplicate URLs. Keep all three in sync.

export const SITE_URL = 'https://clubin.co.in';

/** lowercase → non-alphanumerics to single hyphens → trim → cap at 60 chars. */
export function slugify(text: string): string {
    return (text ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/g, '');
}

// A trailing v4-style UUID, e.g. "kitty-su-72c91c8c-4cd2-4f9c-ad18-7681442972ba".
const TRAILING_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pull the real id out of a slug param. New URLs look like `name-slug-<uuid>`;
 * old URLs are a bare `<uuid>`. Falls back to the whole param so legacy
 * (already-indexed) URLs and any non-UUID ids keep resolving.
 */
export function extractId(param?: string): string {
    if (!param) return '';
    const match = param.match(TRAILING_UUID);
    return match ? match[0] : param;
}

/** `slug-<id>`, or just `<id>` when the name yields no slug (keeps all 3 generators in agreement). */
function slugId(name: string, id: string): string {
    const slug = slugify(name);
    return slug ? `${slug}-${id}` : id;
}

export function clubPath(citySlug: string, club: { id: string; name: string }): string {
    return `/clubs/${citySlug}/${slugId(club.name, club.id)}`;
}

export function eventPath(event: { id: string; title: string }): string {
    return `/events/${slugId(event.title, event.id)}`;
}

export const clubUrl = (citySlug: string, club: { id: string; name: string }): string =>
    `${SITE_URL}${clubPath(citySlug, club)}`;

export const eventUrl = (event: { id: string; title: string }): string =>
    `${SITE_URL}${eventPath(event)}`;

// ─── City resolution (MUST mirror scripts/prerender.py + generate-sitemap.mjs) ───

// Club/event DETAIL URLs keep folding sub-areas into their metro so existing
// indexed URLs never change. Gurgaon/Noida/Lucknow additionally get their own
// landing pages (see SUBCITIES) that list these venues without moving them.
// MUST match CITY_ALIASES in scripts/prerender.py + generate-sitemap.mjs.
const CITY_ALIASES: Record<string, string> = {
    'new delhi': 'Delhi NCR',
    'delhi': 'Delhi NCR',
    'gurugram': 'Delhi NCR',
    'gurgaon': 'Delhi NCR',
    'noida': 'Delhi NCR',
    'faridabad': 'Delhi NCR',
};

const KNOWN_CITIES = [
    'Bengaluru', 'Delhi NCR', 'Goa', 'Mumbai', 'Pune',
    'Hyderabad', 'Chandigarh', 'Jaipur', 'Chennai',
];

/** "Malleshwaram, Bengaluru" → "bengaluru". Matches the Python/JS generators. */
export function getCitySlug(location: string): string {
    const parts = (location || '').split(',');
    const city = (parts[parts.length - 1] || location || '').trim().toLowerCase();
    const resolved = CITY_ALIASES[city] || city;
    const match = KNOWN_CITIES.find((c) => c.toLowerCase() === resolved.toLowerCase());
    return (match || resolved).toLowerCase().replace(/\s+/g, '-').replace(/,/g, '');
}

// High-intent sub-areas that fold into a metro by location but get their own
// landing page. slug → substrings to match against a club/event location.
export const SUBCITIES: { slug: string; label: string; needles: string[] }[] = [
    { slug: 'gurgaon', label: 'Gurgaon', needles: ['gurgaon', 'gurugram'] },
    { slug: 'noida', label: 'Noida', needles: ['noida'] },
    { slug: 'lucknow', label: 'Lucknow', needles: ['lucknow'] },
];

/** Does a club/event at `location` belong on the `slug` city/sub-area page? */
export function locationInCity(location: string, slug: string): boolean {
    const sub = SUBCITIES.find((s) => s.slug === slug);
    const loc = (location || '').toLowerCase();
    if (sub) return sub.needles.some((n) => loc.includes(n));
    return getCitySlug(location) === slug;
}
