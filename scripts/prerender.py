#!/usr/bin/env python3
"""
Pre-render script for GitHub Pages SPA.

After `vite build`, this script:
1. Fetches all clubs, events, and promoters from the API
2. Creates index.html files for each route with proper SEO meta tags
   AND real static HTML content inside #root (crawlers see full content
   and internal links on the first wave, before any JS executes; React
   replaces it when it mounts)
3. Places them in dist/ so GitHub Pages serves 200 (not 404)

Canonical URLs use a trailing slash: GitHub Pages serves
dist/<path>/index.html at <path>/ and 301-redirects the no-slash form,
so <path>/ is the real, final URL and must be what canonical/og:url say.

Usage:
  python3 scripts/prerender.py           # fetches from API
  python3 scripts/prerender.py --cached  # uses /tmp cached JSON files
"""

import json
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import urlopen, Request

API_BASE = 'https://api.clubin.info/api'
SITE_URL = 'https://clubin.co.in'
DIST_DIR = Path(__file__).resolve().parent.parent / 'dist'
# Last-known-good API snapshots shared with generate-sitemap.mjs. Persisted
# across CI runs via actions/cache so an API outage can't gut the pre-rendered
# pages (which would otherwise return 404 for every club/event).
CACHE_DIR = Path(__file__).resolve().parent.parent / '.api-cache'
OG_IMAGE = 'https://clubin.co.in/clubin-logo-og.png'

CITIES = ['Bengaluru', 'Delhi NCR', 'Goa', 'Mumbai', 'Pune', 'Hyderabad', 'Chandigarh', 'Jaipur', 'Chennai']

CITY_ALIASES = {
    'new delhi': 'Delhi NCR',
    'delhi': 'Delhi NCR',
    'gurugram': 'Delhi NCR',
    'gurgaon': 'Delhi NCR',
    'noida': 'Delhi NCR',
    'faridabad': 'Delhi NCR',
}

# High-intent sub-areas that fold into a metro by location (so club/event detail
# URLs are unchanged) but get their own landing page listing matching venues.
# slug, display name, location substrings to match. MUST match SUBCITIES in
# src/lib/urls.ts and scripts/generate-sitemap.mjs.
SUBCITIES = [
    ('gurgaon', 'Gurgaon', ('gurgaon', 'gurugram')),
    ('noida', 'Noida', ('noida',)),
    ('lucknow', 'Lucknow', ('lucknow',)),
]


def location_matches(location, needles):
    loc = (location or '').lower()
    return any(n in loc for n in needles)

# Slim sitewide JSON-LD graph for subpages — the template's full @graph
# (FAQPage, WebPage about the home page, etc.) only belongs on the home page.
SLIM_GRAPH = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            '@id': f'{SITE_URL}/#organization',
            'name': 'Clubin',
            'url': f'{SITE_URL}/',
            'logo': {'@type': 'ImageObject', 'url': OG_IMAGE},
        },
        {
            '@type': 'WebSite',
            '@id': f'{SITE_URL}/#website',
            'url': f'{SITE_URL}/',
            'name': 'Clubin - Best Nightclub & Party Event Entry App in India',
            'publisher': {'@id': f'{SITE_URL}/#organization'},
        },
    ],
}


def page_url(path):
    """Canonical URL for a route — always trailing slash (except root which is just '/')."""
    path = path if path.endswith('/') else path + '/'
    return f'{SITE_URL}{path}'


def get_city_slug(location):
    """Extract city slug from location like 'Malleshwaram, Bengaluru' -> 'bengaluru'."""
    parts = location.split(',')
    city = parts[-1].strip().lower() if parts else location.lower()
    resolved = CITY_ALIASES.get(city, city)
    for known in CITIES:
        if known.lower() == resolved.lower():
            return known.lower().replace(' ', '-')
    return resolved.replace(' ', '-').replace(',', '')


def city_name_from_slug(slug):
    for known in CITIES:
        if known.lower().replace(' ', '-') == slug:
            return known
    return slug.replace('-', ' ').title()


def slugify(text):
    """Slug rules MUST match src/lib/urls.ts and scripts/generate-sitemap.mjs exactly."""
    text = (text or '').lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text[:60].rstrip('-')


def slug_id(name, ident):
    """`slug-<id>`, or just `<id>` when the name yields no slug."""
    s = slugify(name)
    return f'{s}-{ident}' if s else ident


def fetch_json(url, retries=3, timeout=15):
    """Fetch JSON from URL with retries. Returns None on persistent failure."""
    for attempt in range(1, retries + 1):
        try:
            req = Request(url, headers={'User-Agent': 'Clubin-Prerender/1.0'})
            with urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read())
        except Exception as e:
            print(f'  Attempt {attempt}/{retries} failed for {url}: {e}')
            if attempt < retries:
                time.sleep(attempt * 2)
    return None


def post_json(url, payload):
    """POST JSON to URL and return parsed response."""
    try:
        data = json.dumps(payload).encode('utf-8')
        req = Request(url, data=data, headers={
            'User-Agent': 'Clubin-Prerender/1.0',
            'Content-Type': 'application/json',
        }, method='POST')
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f'  Warning: POST {url} failed: {e}')
        return None


def fetch_json_cached(url, cache_path):
    """
    Fetch JSON with graceful degradation:
      --cached + cache present  -> use cache (fast local dev, no network)
      live fetch succeeds       -> refresh the cache snapshot and return it
      live fetch fails + cache  -> fall back to the last cached snapshot
      otherwise                 -> None
    """
    cache_path = str(cache_path)
    if '--cached' in sys.argv and os.path.exists(cache_path):
        print(f'  Using cache (--cached): {cache_path}')
        with open(cache_path) as f:
            return json.load(f)
    data = fetch_json(url)
    if data is not None:
        try:
            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
            with open(cache_path, 'w') as f:
                json.dump(data, f)
        except OSError as e:
            print(f'  Warning: could not write cache {cache_path}: {e}')
        return data
    if os.path.exists(cache_path):
        print(f'  Using cached snapshot (live API unavailable): {cache_path}')
        with open(cache_path) as f:
            return json.load(f)
    print(f'  No data available for {url} (live API down, no cache).')
    return None


def read_template():
    """Read the built index.html as template."""
    index_path = DIST_DIR / 'index.html'
    if not index_path.exists():
        print(f'Error: {index_path} not found. Run `npm run build` first.')
        sys.exit(1)
    return index_path.read_text(encoding='utf-8')


def esc(s):
    """Escape HTML entities for attribute values and text."""
    return str(s).replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')


def inject_meta(html, title, description, image=None, url=None, structured_data=None):
    """
    Replace default meta tags in the HTML template with page-specific ones.
    Supports structured_data as a single dict or a list of dicts.
    Also swaps the home page's full JSON-LD @graph for a slim Organization
    + WebSite graph (FAQPage/WebPage markup only belongs on the home page).
    """
    # Replace <title>
    html = re.sub(r'<title>[^<]*</title>', f'<title>{esc(title)}</title>', html, count=1)

    # Replace meta description
    html = re.sub(
        r'<meta name="description"\s+content="[^"]*"\s*/?>',
        f'<meta name="description" content="{esc(description)}" />',
        html, count=1
    )

    # Replace OG tags
    html = re.sub(r'<meta property="og:title" content="[^"]*"\s*/?>', f'<meta property="og:title" content="{esc(title)}" />', html, count=1)
    html = re.sub(r'<meta property="og:description"\s+content="[^"]*"\s*/?>', f'<meta property="og:description" content="{esc(description)}" />', html, count=1)
    if url:
        html = re.sub(r'<meta property="og:url" content="[^"]*"\s*/?>', f'<meta property="og:url" content="{esc(url)}" />', html, count=1)
    if image:
        html = re.sub(r'<meta property="og:image"\s+content="[^"]*"\s*/?>', f'<meta property="og:image" content="{esc(image)}" />', html, count=1)
        # Remove default og:image dimensions when using a custom image (crawlers auto-detect)
        if image != OG_IMAGE:
            html = re.sub(r'\s*<meta property="og:image:width"\s+content="[^"]*"\s*/?>', '', html, count=1)
            html = re.sub(r'\s*<meta property="og:image:height"\s+content="[^"]*"\s*/?>', '', html, count=1)

    # Replace Twitter tags
    html = re.sub(r'<meta name="twitter:title" content="[^"]*"\s*/?>', f'<meta name="twitter:title" content="{esc(title)}" />', html, count=1)
    html = re.sub(r'<meta name="twitter:description"\s+content="[^"]*"\s*/?>', f'<meta name="twitter:description" content="{esc(description)}" />', html, count=1)
    if url:
        html = re.sub(r'<meta name="twitter:url" content="[^"]*"\s*/?>', f'<meta name="twitter:url" content="{esc(url)}" />', html, count=1)
    if image:
        html = re.sub(r'<meta name="twitter:image"\s+content="[^"]*"\s*/?>', f'<meta name="twitter:image" content="{esc(image)}" />', html, count=1)

    # Replace canonical
    if url:
        html = re.sub(r'<link rel="canonical" href="[^"]*"\s*/?>', f'<link rel="canonical" href="{esc(url)}" />', html, count=1)

    # Swap the home page's full @graph for the slim sitewide graph
    html = re.sub(
        r'<script type="application/ld\+json">.*?</script>',
        f'<script type="application/ld+json">{json.dumps(SLIM_GRAPH)}</script>',
        html, count=1, flags=re.S
    )

    # Add route-specific structured data before </head> (supports list of dicts)
    if structured_data:
        items = structured_data if isinstance(structured_data, list) else [structured_data]
        ld_tags = ''.join(
            f'<script type="application/ld+json">{json.dumps(item)}</script>\n'
            for item in items
        )
        html = html.replace('</head>', ld_tags + '</head>', 1)

    return html


# ─── Static body content (visible to crawlers before JS runs) ────────────────

SEO_STYLE = (
    '<style>'
    '.seo-static{font-family:Manrope,Inter,system-ui,-apple-system,sans-serif;background:#0a0812;color:#fff;min-height:100vh;padding:40px 20px;line-height:1.65}'
    '.seo-static .wrap{max-width:960px;margin:0 auto}'
    '.seo-static h1{font-size:2rem;margin:0 0 12px;letter-spacing:-.02em}'
    '.seo-static h2{font-size:1.35rem;margin:32px 0 12px;color:#a484d7}'
    '.seo-static h3{font-size:1.05rem;margin:18px 0 4px}'
    '.seo-static a{color:#a484d7}'
    '.seo-static p{color:rgba(255,255,255,.78);margin:8px 0}'
    '.seo-static ul{padding-left:20px;color:rgba(255,255,255,.78)}'
    '.seo-static li{margin:6px 0}'
    '.seo-static nav{margin-bottom:28px;font-size:.95rem}'
    '.seo-static .muted{color:rgba(255,255,255,.5);font-size:.9rem}'
    '.seo-static img{max-width:100%;border-radius:16px;margin:12px 0}'
    '</style>'
)


def link(href, text):
    return f'<a href="{esc(href)}">{esc(text)}</a>'


def route_path(path):
    """Internal href with trailing slash (matches GH Pages canonical form)."""
    return path if path.endswith('/') else path + '/'


def body_wrap(inner, city_slugs_with_clubs=None):
    """Wrap page content with sitewide nav + footer links (real crawlable <a> tags)."""
    nav = (
        '<nav>'
        + link('/', 'Clubin') + ' &middot; '
        + link('/clubs/', 'Browse Clubs') + ' &middot; '
        + link('/explore/', 'Explore') + ' &middot; '
        + link('/list-your-club/', 'List Your Club')
        + '</nav>'
    )
    city_links = ' &middot; '.join(
        link(f'/clubs/{c.lower().replace(" ", "-")}/', f'Nightclubs in {c}') for c in CITIES
    )
    footer = (
        '<h2>Explore Clubin</h2>'
        f'<p>{city_links}</p>'
        f'<p class="muted">{link("/explore/", "Explore all clubs & events")} &middot; {link("/support/", "Support")} &middot; {link("/terms/", "Terms of Service")} &middot; {link("/privacy/", "Privacy Policy")} &middot; '
        f'{link("/list-your-club/", "Partner with Clubin")}</p>'
    )
    return SEO_STYLE + f'<div class="seo-static"><div class="wrap">{nav}{inner}{footer}</div></div>'


def inject_body(html, body_html):
    """Inject static content inside #root — React replaces it on mount."""
    return re.sub(r'<div id="root">\s*</div>', f'<div id="root">{body_html}</div>', html, count=1)


def write_route(route_path_str, html):
    """Write an index.html for a given route path."""
    clean = route_path_str.strip('/')
    if not clean:
        return  # Root is written separately via write_home
    out_dir = DIST_DIR / clean
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / 'index.html').write_text(html, encoding='utf-8')


def write_home(html):
    (DIST_DIR / 'index.html').write_text(html, encoding='utf-8')


# ─── Data helpers ─────────────────────────────────────────────────────────────

def event_date_str(event):
    return (event.get('date') or '')[:10]


def is_upcoming(event):
    d = event_date_str(event)
    if not d:
        return False
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    return d >= today


def fmt_date(iso_date):
    """'2026-01-17' -> 'Sat, 17 Jan 2026'"""
    try:
        return datetime.strptime(iso_date, '%Y-%m-%d').strftime('%a, %d %b %Y')
    except ValueError:
        return iso_date


def event_city_slug(event):
    region = event.get('region') or event.get('location') or ''
    return get_city_slug(region) if region else ''


def event_price_text(event):
    """Human-readable entry pricing for static content + meta descriptions."""
    parts = []
    for label, key in [('Stag', 'stagPrice'), ('Couple', 'couplePrice'), ('Ladies', 'ladiesPrice')]:
        price = event.get(key) or 0
        if price:
            parts.append(f'{label} ₹{price}')
    if parts:
        return ' · '.join(parts)
    if event.get('priceLabel'):
        return event['priceLabel']
    if event.get('price'):
        return f'₹{event["price"]} Cover'
    return 'Free guestlist'


def event_times_iso(event):
    """Build ISO start/end datetimes with IST offset; roll end to next day if it crosses midnight."""
    date_str = event_date_str(event)
    start_time = event.get('startTime')
    end_time = event.get('endTime')
    start_dt = f'{date_str}T{start_time}:00+05:30' if start_time else date_str
    end_dt = date_str
    if end_time:
        end_date = date_str
        if start_time and end_time <= start_time:
            try:
                end_date = (datetime.strptime(date_str, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d')
            except ValueError:
                pass
        end_dt = f'{end_date}T{end_time}:00+05:30'
    return start_dt, end_dt


def event_list_html(evts, heading=None, limit=None):
    """Crawlable list of event links with date/venue/price."""
    if not evts:
        return ''
    evts = sorted(evts, key=event_date_str)
    if limit:
        evts = evts[:limit]
    items = ''.join(
        f'<li>{link(route_path("/events/" + slug_id(e["title"], e["id"])), e["title"])} '
        f'<span class="muted">at {esc(e.get("club", ""))} — {esc(fmt_date(event_date_str(e)))} · {esc(event_price_text(e))}</span></li>'
        for e in evts
    )
    head = f'<h2>{esc(heading)}</h2>' if heading else ''
    return f'{head}<ul>{items}</ul>'


def club_list_html(club_items, heading=None):
    """Crawlable list of club links with location + description."""
    if not club_items:
        return ''
    items = ''
    for c in club_items:
        slug = get_city_slug(c.get('location', 'india'))
        desc = (c.get('description') or '').strip()
        desc_html = f' <span class="muted">— {esc(desc[:140])}</span>' if desc else ''
        items += (
            f'<li>{link(route_path("/clubs/" + slug + "/" + slug_id(c["name"], c["id"])), c["name"])} '
            f'<span class="muted">({esc(c.get("location", ""))})</span>{desc_html}</li>'
        )
    head = f'<h2>{esc(heading)}</h2>' if heading else ''
    return f'{head}<ul>{items}</ul>'


def city_faq(city, club_names):
    """City-specific Q&A — rendered visibly AND as FAQPage JSON-LD (must match)."""
    if not club_names:
        return []
    names = ', '.join(club_names[:5])
    return [
        (f'Which are the best nightclubs in {city}?',
         f'Some of the best nightclubs in {city} on Clubin are {names}. You can book free guestlist entry, party tickets and VIP tables for each of them on the Clubin app.'),
        (f'How do I get guestlist entry to clubs in {city}?',
         f'Open the club or event page on Clubin, pick your event in {city}, and book your guestlist spot in seconds. Show the QR code at the door and walk in — no queues.'),
        (f'Can I book a VIP table at nightclubs in {city}?',
         f'Yes. Clubin lets you reserve VIP tables at top nightclubs in {city} with transparent pricing and instant confirmation.'),
    ]


def faq_html(qa_pairs):
    if not qa_pairs:
        return ''
    items = ''.join(f'<h3>{esc(q)}</h3><p>{esc(a)}</p>' for q, a in qa_pairs)
    return f'<h2>Frequently Asked Questions</h2>{items}'


def faq_schema(qa_pairs):
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}}
            for q, a in qa_pairs
        ],
    }


def render_city_page(template, clubs_url, slug, display, city_clubs, city_events):
    """Write a /clubs/<slug>/ landing page. Shared by curated cities and sub-areas."""
    city_url = page_url(f'/clubs/{slug}')
    club_names = [c['name'] for c in city_clubs]
    if club_names:
        description = (f'Discover the best nightclubs in {display}: {", ".join(club_names[:4])} & more. '
                       f'Book free guestlist entry, party tickets and VIP tables on Clubin.')[:160]
    else:
        description = f'Discover the hottest nightclubs and party venues in {display}. Book guestlists and get VIP table reservations on Clubin.'
    qa = city_faq(display, club_names)
    city_body = body_wrap(
        f'<h1>Best Nightclubs in {esc(display)}</h1>'
        f'<p>Looking for the best nightlife in {esc(display)}? Browse top nightclubs and party venues, '
        f'check upcoming events, and book free guestlist entry or VIP tables on Clubin.</p>'
        + club_list_html(city_clubs, heading=f'Nightclubs in {display}')
        + event_list_html(city_events, heading=f'Upcoming Parties &amp; Events in {display}')
        + faq_html(qa)
    )
    structured = [
        {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': f'Best Nightclubs in {display}', 'url': city_url},
        {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': clubs_url},
            {'@type': 'ListItem', 'position': 3, 'name': display},
        ]},
    ]
    if qa:
        structured.append(faq_schema(qa))
    html = inject_meta(template,
        title=f'Best Nightclubs in {display} - Guestlist, Events & VIP Tables | Clubin',
        description=description,
        url=city_url,
        structured_data=structured,
    )
    write_route(f'/clubs/{slug}', inject_body(html, city_body))


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print('Pre-rendering pages for GitHub Pages SEO...')
    template = read_template()

    # Fetch data
    print('Fetching API data...')
    clubs = fetch_json_cached(f'{API_BASE}/clubs', CACHE_DIR / 'clubs.json') or []
    events = fetch_json_cached(f'{API_BASE}/events', CACHE_DIR / 'events.json') or []

    # Collect promoters
    promoter_map = {}
    for e in events:
        ref = e.get('promoterRef')
        if ref and ref.get('id'):
            promoter_map[ref['id']] = ref
    for c in clubs:
        for pc in c.get('promoterClubs', []):
            p = pc.get('promoter', {})
            if p.get('id'):
                promoter_map[p['id']] = p

    # Index data for cross-linking
    club_by_id = {c['id']: c for c in clubs}
    upcoming = [e for e in events if is_upcoming(e)]
    clubs_by_city = defaultdict(list)
    for c in clubs:
        clubs_by_city[get_city_slug(c.get('location', 'india'))].append(c)
    events_by_city = defaultdict(list)
    events_by_club = defaultdict(list)
    events_by_promoter = defaultdict(list)
    for e in upcoming:
        slug = event_city_slug(e)
        if slug:
            events_by_city[slug].append(e)
        if e.get('clubId'):
            events_by_club[e['clubId']].append(e)
        ref = e.get('promoterRef')
        if ref and ref.get('id'):
            events_by_promoter[ref['id']].append(e)

    # Sub-area landing pages — only generated where real venues match (no thin pages)
    subcity_pages = []
    for sub_slug, sub_name, needles in SUBCITIES:
        sc_clubs = [c for c in clubs if location_matches(c.get('location', ''), needles)]
        sc_events = [e for e in upcoming if location_matches(e.get('location') or e.get('region', ''), needles)]
        if sc_clubs or sc_events:
            subcity_pages.append((sub_slug, sub_name, sc_clubs, sc_events))

    count = 0

    # 0a. Home page — inject static crawlable content into dist/index.html
    #     (meta tags in the template are already correct for the home page)
    home_body = body_wrap(
        '<h1>Clubin — India’s Nightclub &amp; Party Event Entry App</h1>'
        '<p>Skip the queue at the best clubs in Bengaluru, Mumbai, Delhi NCR, Pune, Goa, Hyderabad, Chennai, Jaipur and Chandigarh. '
        'Get free guestlist entry, book VIP tables, and discover the hottest parties near you — all on Clubin.</p>'
        + event_list_html(upcoming, heading='Trending Parties &amp; Events', limit=10)
        + club_list_html(clubs[:12], heading='Featured Nightclubs')
        + f'<p>Own a venue? {link("/list-your-club/", "List your club on Clubin")} and reach thousands of nightlife lovers.</p>'
    )
    write_home(inject_body(template, home_body))
    count += 1

    # 0b. /list-your-club (static page)
    lyc_url = page_url('/list-your-club')
    lyc_body = body_wrap(
        '<h1>List Your Club on Clubin</h1>'
        '<p>Partner with Clubin to reach thousands of nightlife lovers. Manage guestlists, table bookings and events from one dashboard — with the lowest platform fees in India.</p>'
        '<h2>How it works</h2>'
        '<ul>'
        f'<li><strong>Schedule a meeting</strong> — {link("/list-your-club/schedule/", "book a quick call")} with our partnerships team.</li>'
        '<li><strong>Onboard to Clubin</strong> — dashboard setup, pricing and team training within 48 hours.</li>'
        '<li><strong>Go live</strong> — your club and events become instantly visible to thousands of users.</li>'
        '</ul>'
        '<h2>Transparent pricing</h2>'
        '<p>Flat ₹50 convenience fee per guestlist booking and just 5% on table bookings — with instant payouts to your account. Competitors charge 10–15%.</p>'
        f'<p>{link("/list-your-club/schedule/", "Schedule a meeting")} to get started.</p>'
    )
    html = inject_meta(template,
        title='List Your Club on Clubin - Partner With Us | Clubin',
        description='Partner with Clubin to list your nightclub, manage guestlists, table bookings, and reach a young nightlife audience across India. Lowest platform fees. Schedule a meeting today.',
        url=lyc_url,
        structured_data=[
            {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                'name': 'List Your Club on Clubin',
                'description': 'Partner with Clubin to list your nightclub and manage events, guestlists, and table bookings.',
                'url': lyc_url,
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                    {'@type': 'ListItem', 'position': 2, 'name': 'List Your Club'},
                ],
            },
        ]
    )
    write_route('/list-your-club', inject_body(html, lyc_body))
    count += 1

    # 0c. /list-your-club/schedule (booking page)
    sched_url = page_url('/list-your-club/schedule')
    sched_body = body_wrap(
        '<h1>Schedule a Meeting with Clubin</h1>'
        '<p>Book a quick call with the Clubin partnerships team. Pick a slot that works for you — we’ll understand your venue and goals, and have you live on Clubin within 48 hours.</p>'
        f'<p>{link("/list-your-club/", "Learn more about partnering with Clubin")}.</p>'
    )
    html = inject_meta(template,
        title='Schedule a Meeting - Partner With Clubin | Clubin',
        description='Book a quick call with the Clubin partnerships team. Pick a slot that works for you and we’ll help you list your club on Clubin.',
        url=sched_url,
        structured_data=[
            {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                'name': 'Schedule a Meeting with Clubin',
                'description': 'Book a call with the Clubin partnerships team to list your club on Clubin.',
                'url': sched_url,
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                    {'@type': 'ListItem', 'position': 2, 'name': 'List Your Club', 'item': lyc_url},
                    {'@type': 'ListItem', 'position': 3, 'name': 'Schedule a Meeting'},
                ],
            },
        ]
    )
    write_route('/list-your-club/schedule', inject_body(html, sched_body))
    count += 1

    # 0d. Legal pages (content is client-rendered; static meta + stub so they index)
    for path, title, description, h1 in [
        ('/terms', 'Terms of Service | Clubin',
         'Read the Terms of Service for Clubin. Learn about our guidelines, rules, and user agreements for the ultimate nightlife platform.',
         'Terms of Service'),
        ('/privacy', 'Privacy Policy | Clubin',
         'Read the Privacy Policy for Clubin to learn how we protect your data. Your privacy and security are our top priorities.',
         'Privacy Policy'),
        ('/delete-account', 'Delete Your Account | Clubin',
         'Request deletion of your Clubin account and personal data. We will process your request within 30 days as per our data retention policy.',
         'Delete Your Account'),
    ]:
        html = inject_meta(template, title=title, description=description, url=page_url(path),
            structured_data={'@context': 'https://schema.org', '@type': 'WebPage', 'name': h1, 'url': page_url(path)})
        write_route(path, inject_body(html, body_wrap(f'<h1>{esc(h1)}</h1><p>{esc(description)}</p>')))
        count += 1

    # 0e. Support page — FAQs rendered visibly AND as FAQPage JSON-LD (must match
    #     src/pages/SupportPage.tsx so the structured data reflects what users see)
    support_path = '/support'
    support_url = page_url(support_path)
    support_faqs = [
        ('What is Clubin?',
         'Clubin is a nightlife platform that lets you discover clubs and events, book free guestlist entry, party tickets and VIP tables across India — all from one app.'),
        ('How do I book guestlist entry or tickets?',
         'Open the club or event page in the Clubin app, choose your event, and confirm your guestlist spot or ticket in seconds. You will receive a QR code to show at the door — no queues.'),
        ("I didn't receive my booking confirmation or QR code. What should I do?",
         'Your booking and QR code are available under the "My Bookings" section in the app. If it is missing, email us at admin@clubin.info with your registered phone number and we will help right away.'),
        ('Can I get a refund on my booking?',
         'Refunds are subject to the venue policy and the terms shown at checkout. Convenience fees are non-refundable unless stated otherwise. For refund queries, reach out to admin@clubin.info.'),
        ('Does booking guarantee entry to the venue?',
         'Booking through Clubin secures your spot, but venues reserve the right of admission. Please follow each venue dress code, age policy (18+) and behavioural guidelines.'),
        ('How do I list my club or partner with Clubin?',
         "Head to our List Your Club page and schedule a meeting with our team. We'll get you set up to manage events, guestlists and reach thousands of users."),
        ('How do I delete my account?',
         'You can request permanent deletion of your account and data from our Delete Account page. We process requests within 30 days as per our data retention policy.'),
        ('How can I contact Clubin support?',
         'Email us at admin@clubin.info or info@kauzway.com, or call +91 99110 06848. You can also visit our office in Indiranagar, Bangalore.'),
    ]
    support_body = body_wrap(
        '<h1>Help &amp; Support</h1>'
        '<p>Need help with Clubin? Browse the FAQs below or reach our support team. '
        'Email <a href="mailto:admin@clubin.info">admin@clubin.info</a> or '
        '<a href="mailto:info@kauzway.com">info@kauzway.com</a>, or call '
        '<a href="tel:+919911006848">+91 99110 06848</a>.</p>'
        + faq_html(support_faqs)
    )
    html = inject_meta(template,
        title='Support & FAQs | Clubin',
        description='Need help with Clubin? Find answers to frequently asked questions about bookings, guestlists, refunds and more, or reach our support team by email and phone.',
        url=support_url,
        structured_data=[
            {'@context': 'https://schema.org', '@type': 'WebPage', 'name': 'Help & Support', 'url': support_url},
            faq_schema(support_faqs),
        ])
    write_route(support_path, inject_body(html, support_body))
    count += 1

    # 1. /clubs (city select)
    clubs_url = page_url('/clubs')
    city_items = ''
    for city in CITIES:
        slug = city.lower().replace(' ', '-')
        n_clubs = len(clubs_by_city.get(slug, []))
        n_events = len(events_by_city.get(slug, []))
        counts = []
        if n_clubs:
            counts.append(f'{n_clubs} club{"s" if n_clubs != 1 else ""}')
        if n_events:
            counts.append(f'{n_events} upcoming event{"s" if n_events != 1 else ""}')
        suffix = f' <span class="muted">({", ".join(counts)})</span>' if counts else ''
        city_items += f'<li>{link(f"/clubs/{slug}/", f"Best Nightclubs in {city}")}{suffix}</li>'
    for sub_slug, sub_name, sc_clubs, sc_events in subcity_pages:
        counts = []
        if sc_clubs:
            counts.append(f'{len(sc_clubs)} club{"s" if len(sc_clubs) != 1 else ""}')
        if sc_events:
            counts.append(f'{len(sc_events)} upcoming event{"s" if len(sc_events) != 1 else ""}')
        suffix = f' <span class="muted">({", ".join(counts)})</span>' if counts else ''
        city_items += f'<li>{link(f"/clubs/{sub_slug}/", f"Best Nightclubs in {sub_name}")}{suffix}</li>'
    clubs_body = body_wrap(
        '<h1>Nightclubs &amp; Party Venues in India</h1>'
        '<p>Browse the best nightclubs, lounges and party venues across India. Book free guestlist entry and VIP tables on Clubin.</p>'
        f'<h2>Browse by City</h2><ul>{city_items}</ul>'
        + event_list_html(upcoming, heading='Upcoming Events Across India', limit=12)
    )
    html = inject_meta(template,
        title='Nightclubs & Party Venues in India - Browse by City | Clubin',
        description='Browse nightclubs and party venues across Bengaluru, Mumbai, Delhi NCR, Goa, Pune, Hyderabad, Chennai, Jaipur & Chandigarh. Book guestlists and VIP tables on Clubin.',
        url=clubs_url,
        structured_data=[
            {
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                'name': 'Browse Nightclubs by City',
                'url': clubs_url,
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                    {'@type': 'ListItem', 'position': 2, 'name': 'Clubs'},
                ],
            },
        ]
    )
    write_route('/clubs', inject_body(html, clubs_body))
    count += 1

    # 1b. /explore — internal-linking hub indexing every city, club and event
    explore_url = page_url('/explore')
    explore_city_links = ' &middot; '.join(
        link(f'/clubs/{c.lower().replace(" ", "-")}/', f'Nightclubs in {c}') for c in CITIES
    )
    explore_sub_links = ' &middot; '.join(
        link(f'/clubs/{s}/', f'Nightclubs in {n}') for (s, n, _c, _e) in subcity_pages
    )
    all_city_links = explore_city_links + ((' &middot; ' + explore_sub_links) if explore_sub_links else '')
    explore_body = body_wrap(
        '<h1>Explore Clubin — Nightclubs, Events &amp; Cities</h1>'
        '<p>Browse every nightclub, upcoming party and city on Clubin in one place. '
        'Find clubs and events across India and book free guestlist entry or VIP tables.</p>'
        f'<h2>Browse by City</h2><p>{all_city_links}</p>'
        + club_list_html(clubs, heading='All Nightclubs')
        + event_list_html(upcoming, heading='Upcoming Parties &amp; Events')
    )
    html = inject_meta(template,
        title='Explore Nightclubs, Events & Cities | Clubin',
        description='Browse every nightclub, upcoming party and city on Clubin in one place. Find clubs and events across Bengaluru, Mumbai, Delhi NCR, Goa, Pune, Hyderabad and more.',
        url=explore_url,
        structured_data=[
            {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Explore Clubin', 'url': explore_url},
            {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Explore'},
            ]},
        ]
    )
    write_route('/explore', inject_body(html, explore_body))
    count += 1

    # 2. City pages — curated cities + sub-area landing pages (Gurgaon/Noida/Lucknow)
    for city in CITIES:
        slug = city.lower().replace(' ', '-')
        render_city_page(template, clubs_url, slug, city,
                         clubs_by_city.get(slug, []), events_by_city.get(slug, []))
        count += 1
    for sub_slug, sub_name, sc_clubs, sc_events in subcity_pages:
        render_city_page(template, clubs_url, sub_slug, sub_name, sc_clubs, sc_events)
        count += 1

    # 3. Club detail pages (+ short link pages /c/:code)
    for club in clubs:
        city_slug = get_city_slug(club.get('location', 'india'))
        city = city_name_from_slug(city_slug)
        club_seg = slug_id(club['name'], club['id'])
        club_url = page_url(f'/clubs/{city_slug}/{club_seg}')
        club_events = events_by_club.get(club['id'], [])

        nightclub_sd = {
            '@context': 'https://schema.org',
            '@type': 'NightClub',
            'name': club['name'],
            'image': [u for u in [club.get('imageUrl')] + (club.get('venueImages') or [])[:3] if u] or None,
            'description': club.get('description', ''),
            'address': {'@type': 'PostalAddress', 'streetAddress': club.get('address', ''), 'addressLocality': club.get('location', ''), 'addressCountry': 'IN'},
            'url': club_url,
        }
        if club.get('latitude') and club.get('longitude'):
            nightclub_sd['geo'] = {'@type': 'GeoCoordinates', 'latitude': club['latitude'], 'longitude': club['longitude']}
        if club.get('mapUrl'):
            nightclub_sd['hasMap'] = club['mapUrl']
        if club.get('instagramUrl'):
            nightclub_sd['sameAs'] = [club['instagramUrl']]
        # Only include ratings when real reviews exist (fake markup risks a manual action)
        if club.get('totalReviews') and club.get('averageRating'):
            nightclub_sd['aggregateRating'] = {
                '@type': 'AggregateRating',
                'ratingValue': club['averageRating'],
                'reviewCount': club['totalReviews'],
            }
        nightclub_sd = {k: v for k, v in nightclub_sd.items() if v is not None}

        img_html = ''
        if club.get('imageUrl'):
            img_html = f'<img src="{esc(club["imageUrl"])}" alt="{esc(club["name"])} - nightclub in {esc(club.get("location", ""))}" loading="lazy" />'
        club_body = body_wrap(
            f'<p class="muted">{link("/clubs/", "Clubs")} / {link(f"/clubs/{city_slug}/", city)}</p>'
            f'<h1>{esc(club["name"])}</h1>'
            f'<p class="muted">{esc(club.get("address") or club.get("location", ""))}</p>'
            + img_html
            + (f'<p>{esc(club.get("description", ""))}</p>' if club.get('description') else '')
            + event_list_html(club_events, heading=f'Upcoming Events at {club["name"]}')
            + f'<p>Book free guestlist entry and VIP tables at {esc(club["name"])} on the Clubin app — '
              f'skip the queue and walk in stress-free.</p>'
            + f'<p>{link(f"/clubs/{city_slug}/", f"More nightclubs in {city}")}</p>'
        )
        html = inject_meta(template,
            title=f'{club["name"]} - Nightclub in {club.get("location", "")} | Guestlist & Tables | Clubin',
            description=f'{club["name"]} in {club.get("location", "")}. {club.get("description", "Book guestlists and VIP tables on Clubin.")[:160]}',
            image=club.get('imageUrl', OG_IMAGE),
            url=club_url,
            structured_data=[
                nightclub_sd,
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                        {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': clubs_url},
                        {'@type': 'ListItem', 'position': 3, 'name': city, 'item': page_url(f'/clubs/{city_slug}')},
                        {'@type': 'ListItem', 'position': 4, 'name': club['name']},
                    ],
                },
            ]
        )
        html = inject_body(html, club_body)
        write_route(f'/clubs/{city_slug}/{club_seg}', html)
        count += 1
        # Legacy bare-UUID path: same HTML (its canonical already points to the
        # slug URL), so Google consolidates and previously-indexed links never 404.
        if club_seg != club['id']:
            write_route(f'/clubs/{city_slug}/{club["id"]}', html)
            count += 1

        # Also create a short link and pre-render /c/:code for club sharing
        # (canonical inside points to the full club URL, so no duplicate-content risk)
        result = post_json(f'{API_BASE}/shortlinks', {'type': 'club', 'targetId': club['id']})
        if result and result.get('code'):
            write_route(f'/c/{result["code"]}', html)
            count += 1

    # 4. Event pages (+ short link pages /e/:code)
    #    Enriched Event schema with all Google-recommended fields
    shortlink_count = 0
    for event in events:
        date_str = event_date_str(event)
        event_seg = slug_id(event['title'], event['id'])
        event_url = page_url(f'/events/{event_seg}')
        event_location = event.get('location', '')
        city_slug = event_city_slug(event)
        city = city_name_from_slug(city_slug) if city_slug else ''
        is_open = event.get('guestlistStatus') in ('open', 'closing')
        club = club_by_id.get(event.get('clubId') or '')
        club_ref = event.get('clubRef') or {}
        nice_date = fmt_date(date_str)

        start_dt, end_dt = event_times_iso(event)

        # Build offers array with all recommended fields
        # (`or` fallback: a 0 stag/couple/ladies price means "use the cover price")
        offers = []
        for label, price_key in [('Stag Entry', 'stagPrice'), ('Couple Entry', 'couplePrice'), ('Ladies Entry', 'ladiesPrice')]:
            price = event.get(price_key) or event.get('price') or 0
            offers.append({
                '@type': 'Offer',
                'name': label,
                'price': price,
                'priceCurrency': 'INR',
                'availability': 'https://schema.org/InStock' if is_open else 'https://schema.org/SoldOut',
                'url': event_url,
                'validFrom': event.get('createdAt', date_str)[:10],
            })

        # Build Event structured data
        event_sd = {
            '@context': 'https://schema.org',
            '@type': 'Event',
            'name': event['title'],
            'startDate': start_dt,
            'endDate': end_dt,
            'eventStatus': 'https://schema.org/EventScheduled',
            'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
            'image': event.get('imageUrl'),
            'description': event.get('description', ''),
            'location': {
                '@type': 'Place',
                'name': event.get('club', ''),
                'address': {
                    '@type': 'PostalAddress',
                    'streetAddress': (club or club_ref).get('address', ''),
                    'addressLocality': event_location,
                    'addressCountry': 'IN',
                },
            },
            'url': event_url,
            'offers': offers,
            'performer': {'@type': 'PerformingGroup', 'name': event.get('genre', event['title'])},
            'isAccessibleForFree': False,
        }

        # Add organizer if promoter is available
        promoter_ref = event.get('promoterRef')
        if promoter_ref and promoter_ref.get('name'):
            event_sd['organizer'] = {
                '@type': 'Organization',
                'name': promoter_ref['name'],
                'url': page_url(f'/promoters/{promoter_ref["id"]}'),
            }

        # Static crawlable body: full event details + links to club/city/promoter
        club_link_html = ''
        if club:
            club_city_slug = get_city_slug(club.get('location', 'india'))
            club_link_html = f'<p>Venue: {link(route_path("/clubs/" + club_city_slug + "/" + slug_id(club["name"], club["id"])), club["name"])}</p>'
        elif event.get('club'):
            club_link_html = f'<p>Venue: {esc(event["club"])}</p>'
        promoter_html = ''
        if promoter_ref and promoter_ref.get('name'):
            promoter_html = f'<p>Organised by {link(route_path("/promoters/" + promoter_ref["id"]), promoter_ref["name"])}</p>'
        img_html = ''
        if event.get('imageUrl'):
            img_html = f'<img src="{esc(event["imageUrl"])}" alt="{esc(event["title"])} at {esc(event.get("club", ""))}" loading="lazy" />'
        time_text = nice_date
        if event.get('startTime'):
            time_text += f', {event["startTime"]}'
            if event.get('endTime'):
                time_text += f' – {event["endTime"]}'
        event_body = body_wrap(
            (f'<p class="muted">{link("/clubs/", "Clubs")} / {link(f"/clubs/{city_slug}/", city)}</p>' if city_slug else '')
            + f'<h1>{esc(event["title"])}</h1>'
            + f'<p class="muted">{esc(time_text)} · {esc(event.get("club", ""))}, {esc(event_location)}</p>'
            + img_html
            + (f'<p><strong>Entry:</strong> {esc(event_price_text(event))}</p>')
            + (f'<p><strong>Genre:</strong> {esc(event["genre"])}</p>' if event.get('genre') else '')
            + (f'<p>{esc(event.get("description", ""))}</p>' if event.get('description') else '')
            + (f'<p class="muted">Rules: {esc(event["rules"])}</p>' if event.get('rules') else '')
            + club_link_html
            + promoter_html
            + '<p>Book your guestlist spot or tickets for this party on Clubin — instant confirmation, QR entry, no queues.</p>'
        )

        html = inject_meta(template,
            title=f'{event["title"]} at {event.get("club", "")} - {nice_date} | Guestlist & Tickets | Clubin',
            description=f'{event["title"]} at {event.get("club", "")}, {event_location} on {nice_date}. Entry: {event_price_text(event)}. {event.get("description", "Book your spot on Clubin!")[:110]}',
            image=event.get('imageUrl', OG_IMAGE),
            url=event_url,
            structured_data=[
                event_sd,
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                        {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': clubs_url},
                        *([{'@type': 'ListItem', 'position': 3, 'name': event.get('club', ''), 'item': page_url(f'/clubs/{city_slug}')}] if city_slug else []),
                        {'@type': 'ListItem', 'position': 4 if city_slug else 3, 'name': event['title']},
                    ],
                },
            ]
        )
        html = inject_body(html, event_body)
        write_route(f'/events/{event_seg}', html)
        count += 1
        # Legacy bare-UUID path → same content, canonical points to the slug URL.
        if event_seg != event['id']:
            write_route(f'/events/{event["id"]}', html)
            count += 1

        # Also create a short link and pre-render /e/:code so social media crawlers
        # see OG tags when short links are shared (crawlers don't execute JS)
        result = post_json(f'{API_BASE}/shortlinks', {'type': 'event', 'targetId': event['id']})
        if result and result.get('code'):
            write_route(f'/e/{result["code"]}', html)
            shortlink_count += 1
            count += 1

    # 5. Promoter pages
    for pid, promoter in promoter_map.items():
        name = promoter.get('name', 'Promoter')
        region = promoter.get('region', '')
        promoter_url = page_url(f'/promoters/{pid}')
        promoter_events = events_by_promoter.get(pid, [])
        promoter_body = body_wrap(
            f'<h1>{esc(name)}</h1>'
            + (f'<p class="muted">Event promoter in {esc(region)}</p>' if region else '<p class="muted">Event promoter</p>')
            + event_list_html(promoter_events, heading=f'Upcoming Events by {name}')
            + f'<p>Browse parties and nightclub events by {esc(name)} and book guestlist entry on Clubin.</p>'
        )
        html = inject_meta(template,
            title=f'{name} - Event Promoter{f" in {region}" if region else ""} | Clubin',
            description=f'{name} is an event promoter{f" based in {region}" if region else ""}. Browse their upcoming nightclub events and parties on Clubin.',
            image=promoter.get('logoUrl', OG_IMAGE),
            url=promoter_url,
            structured_data=[
                {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    'name': name,
                    'url': promoter_url,
                    'image': promoter.get('logoUrl'),
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                        {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': clubs_url},
                        {'@type': 'ListItem', 'position': 3, 'name': name},
                    ],
                },
            ]
        )
        write_route(f'/promoters/{pid}', inject_body(html, promoter_body))
        count += 1

    print(f'Pre-rendered {count} pages into {DIST_DIR}/')
    print(f'  Cities: {len(CITIES)}, Clubs: {len(clubs)}, Events: {len(events)} ({len(upcoming)} upcoming), Promoters: {len(promoter_map)}')
    print(f'  Short links (events): {shortlink_count}')


if __name__ == '__main__':
    main()
