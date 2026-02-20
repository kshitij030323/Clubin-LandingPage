#!/usr/bin/env python3
"""
Pre-render script for GitHub Pages SPA.

After `vite build`, this script:
1. Fetches all clubs, events, and promoters from the API
2. Creates index.html files for each route with proper SEO meta tags
3. Places them in dist/ so GitHub Pages serves 200 (not 404)

Usage:
  python3 scripts/prerender.py           # fetches from API
  python3 scripts/prerender.py --cached  # uses /tmp cached JSON files
"""

import json
import os
import re
import sys
import shutil
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import quote

API_BASE = 'https://api.clubin.info/api'
SITE_URL = 'https://clubin.co.in'
DIST_DIR = Path(__file__).resolve().parent.parent / 'dist'
OG_IMAGE = 'https://clubin.co.in/clubin-logo-og.png'

CITIES = ['Bengaluru', 'Delhi NCR', 'Goa', 'Mumbai', 'Pune', 'Hyderabad', 'Chandigarh', 'Jaipur', 'Chennai']


def get_city_slug(location):
    """Extract city slug from location like 'Malleshwaram, Bengaluru' -> 'bengaluru'."""
    parts = location.split(',')
    city = parts[-1].strip() if parts else location
    for known in CITIES:
        if known.lower() == city.lower():
            return known.lower().replace(' ', '-')
    return city.lower().replace(' ', '-').replace(',', '')


def fetch_json(url):
    """Fetch JSON from URL."""
    try:
        req = Request(url, headers={'User-Agent': 'Clubin-Prerender/1.0'})
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f'  Warning: Could not fetch {url}: {e}')
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
    """Fetch JSON, using cache if --cached flag is set."""
    if '--cached' in sys.argv and os.path.exists(cache_path):
        with open(cache_path) as f:
            return json.load(f)
    data = fetch_json(url)
    if data is not None:
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, 'w') as f:
            json.dump(data, f)
    return data


def read_template():
    """Read the built index.html as template."""
    index_path = DIST_DIR / 'index.html'
    if not index_path.exists():
        print(f'Error: {index_path} not found. Run `npm run build` first.')
        sys.exit(1)
    return index_path.read_text()


def inject_meta(html, title, description, image=None, url=None, structured_data=None):
    """
    Replace default meta tags in the HTML template with page-specific ones.
    Supports structured_data as a single dict or a list of dicts.
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

    # Add route-specific structured data before </head> (supports list of dicts)
    if structured_data:
        items = structured_data if isinstance(structured_data, list) else [structured_data]
        ld_tags = ''.join(
            f'<script type="application/ld+json">{json.dumps(item)}</script>\n'
            for item in items
        )
        html = html.replace('</head>', ld_tags + '</head>', 1)

    return html


def esc(s):
    """Escape HTML entities for attribute values."""
    return str(s).replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')


def write_route(route_path, html):
    """Write an index.html for a given route path."""
    # route_path like '/clubs/bengaluru' -> dist/clubs/bengaluru/index.html
    clean = route_path.strip('/')
    if not clean:
        return  # Skip root, already has index.html

    out_dir = DIST_DIR / clean
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / 'index.html'
    out_file.write_text(html)


def main():
    print('Pre-rendering pages for GitHub Pages SEO...')
    template = read_template()

    # Fetch data
    print('Fetching API data...')
    clubs = fetch_json_cached(f'{API_BASE}/clubs', '/tmp/prerender_clubs.json') or []
    events = fetch_json_cached(f'{API_BASE}/events', '/tmp/prerender_events.json') or []

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

    count = 0

    # 1. /clubs (city select)
    html = inject_meta(template,
        title='Nightclubs & Party Venues in India - Browse by City | Clubin',
        description='Browse nightclubs and party venues across Bengaluru, Mumbai, Delhi NCR, Goa, Pune, Hyderabad, Chennai, Jaipur & Chandigarh. Book guestlists and VIP tables on Clubin.',
        url=f'{SITE_URL}/clubs',
        structured_data=[
            {
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                'name': 'Browse Nightclubs by City',
                'url': f'{SITE_URL}/clubs',
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
    write_route('/clubs', html)
    count += 1

    # 2. City pages
    for city in CITIES:
        slug = city.lower().replace(' ', '-')
        html = inject_meta(template,
            title=f'Best Nightclubs in {city} | Clubin',
            description=f'Discover the hottest nightclubs and party venues in {city}. Book guestlists and get VIP table reservations on Clubin.',
            url=f'{SITE_URL}/clubs/{slug}',
            structured_data=[
                {
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    'name': f'Best Nightclubs in {city}',
                    'url': f'{SITE_URL}/clubs/{slug}',
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                        {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': f'{SITE_URL}/clubs'},
                        {'@type': 'ListItem', 'position': 3, 'name': city},
                    ],
                },
            ]
        )
        write_route(f'/clubs/{slug}', html)
        count += 1

    # 3. Club detail pages (+ short link pages /c/:code)
    #    Use city slug (e.g. "bengaluru") NOT raw location (e.g. "Malleshwaram, Bengaluru")
    for club in clubs:
        city_slug = get_city_slug(club.get('location', 'india'))
        club_url = f'{SITE_URL}/clubs/{city_slug}/{club["id"]}'
        html = inject_meta(template,
            title=f'{club["name"]} - Nightclub in {club.get("location", "")} | Clubin',
            description=f'{club["name"]} in {club.get("location", "")}. {club.get("description", "Book guestlists and VIP tables on Clubin.")[:160]}',
            image=club.get('imageUrl', OG_IMAGE),
            url=club_url,
            structured_data=[
                {
                    '@context': 'https://schema.org',
                    '@type': 'NightClub',
                    'name': club['name'],
                    'image': club.get('imageUrl'),
                    'description': club.get('description', ''),
                    'address': {'@type': 'PostalAddress', 'streetAddress': club.get('address', ''), 'addressLocality': club.get('location', ''), 'addressCountry': 'IN'},
                    'url': club_url,
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                        {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': f'{SITE_URL}/clubs'},
                        {'@type': 'ListItem', 'position': 3, 'name': club.get('location', ''), 'item': f'{SITE_URL}/clubs/{city_slug}'},
                        {'@type': 'ListItem', 'position': 4, 'name': club['name']},
                    ],
                },
            ]
        )
        write_route(f'/clubs/{city_slug}/{club["id"]}', html)
        count += 1

        # Also create a short link and pre-render /c/:code for club sharing
        result = post_json(f'{API_BASE}/shortlinks', {'type': 'club', 'targetId': club['id']})
        if result and result.get('code'):
            write_route(f'/c/{result["code"]}', html)
            count += 1

    # 4. Event pages (+ short link pages /e/:code)
    #    Enriched Event schema with all Google-recommended fields
    shortlink_count = 0
    for event in events:
        date_str = event.get('date', '')[:10]
        event_url = f'{SITE_URL}/events/{event["id"]}'
        event_location = event.get('location', '')
        city_slug = event_location.lower().replace(' ', '-') if event_location else ''
        is_open = event.get('guestlistStatus') in ('open', 'closing')

        # Build start/end datetime strings
        start_dt = date_str
        if event.get('startTime'):
            start_dt = f'{date_str}T{event["startTime"]}:00'
        end_dt = date_str
        if event.get('endTime'):
            end_dt = f'{date_str}T{event["endTime"]}:00'

        # Build offers array with all recommended fields
        offers = []
        for label, price_key in [('Stag Entry', 'stagPrice'), ('Couple Entry', 'couplePrice'), ('Ladies Entry', 'ladiesPrice')]:
            price = event.get(price_key, event.get('price', 0))
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
                    'addressLocality': event_location,
                    'addressCountry': 'IN',
                },
            },
            'url': event_url,
            'offers': offers,
            'performer': {'@type': 'PerformingGroup', 'name': event.get('genre', event['title'])},
        }

        # Add organizer if promoter is available
        promoter_ref = event.get('promoterRef')
        if promoter_ref and promoter_ref.get('name'):
            event_sd['organizer'] = {
                '@type': 'Organization',
                'name': promoter_ref['name'],
                'url': f'{SITE_URL}/promoters/{promoter_ref["id"]}',
            }

        html = inject_meta(template,
            title=f'{event["title"]} at {event.get("club", "")} - {date_str} | Clubin',
            description=f'{event["title"]} at {event.get("club", "")} on {date_str}. {event.get("description", "Book your spot on Clubin!")[:150]}',
            image=event.get('imageUrl', OG_IMAGE),
            url=event_url,
            structured_data=[
                event_sd,
                {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{SITE_URL}/'},
                        {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': f'{SITE_URL}/clubs'},
                        *([{'@type': 'ListItem', 'position': 3, 'name': event.get('club', ''), 'item': f'{SITE_URL}/clubs/{city_slug}'}] if city_slug else []),
                        {'@type': 'ListItem', 'position': 4 if city_slug else 3, 'name': event['title']},
                    ],
                },
            ]
        )
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
        promoter_url = f'{SITE_URL}/promoters/{pid}'
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
                        {'@type': 'ListItem', 'position': 2, 'name': 'Clubs', 'item': f'{SITE_URL}/clubs'},
                        {'@type': 'ListItem', 'position': 3, 'name': name},
                    ],
                },
            ]
        )
        write_route(f'/promoters/{pid}', html)
        count += 1

    print(f'Pre-rendered {count} pages into {DIST_DIR}/')
    print(f'  Cities: {len(CITIES)}, Clubs: {len(clubs)}, Events: {len(events)}, Promoters: {len(promoter_map)}')
    print(f'  Short links (events): {shortlink_count}')


if __name__ == '__main__':
    main()
