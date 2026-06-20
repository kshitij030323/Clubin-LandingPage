import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Club, Event } from '../types';
import { CITIES } from '../types';
import { fetchClubs, fetchEvents, formatDate } from '../api';
import { useSEO } from '../hooks/useSEO';
import { clubPath, eventPath, getCitySlug, SUBCITIES } from '../lib/urls';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';

const PAGE_URL = 'https://clubin.co.in/explore';

const citySlug = (id: string) => id.toLowerCase().replace(/\s+/g, '-');

export function ExplorePage() {
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        fetchClubs().then(setClubs).catch(() => { });
        fetchEvents(undefined, true).then(setEvents).catch(() => { });
    }, []);

    useSEO({
        title: 'Explore Nightclubs, Events & Cities | Clubin',
        description: 'Browse every nightclub, upcoming party and city on Clubin in one place. Find clubs and events across Bengaluru, Mumbai, Delhi NCR, Goa, Pune, Hyderabad and more.',
        url: PAGE_URL,
        structuredData: [
            {
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Explore Clubin',
                description: 'A complete index of nightclubs, events and cities on Clubin.',
                url: PAGE_URL,
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clubin.co.in/' },
                    { '@type': 'ListItem', position: 2, name: 'Explore' },
                ],
            },
        ],
    });

    const cityLinks = [
        ...CITIES.map((c) => ({ slug: citySlug(c.id), label: c.label })),
        ...SUBCITIES.map((s) => ({ slug: s.slug, label: s.label })),
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope">
            <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] z-[60] flex justify-between items-center px-4 py-2 safe-top border-b border-white/10">
                <button
                    onClick={() => navigate('/')}
                    className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <img src="/clubin-logo-header.webp" alt="Clubin" className="h-14 w-auto object-contain" width="192" height="128" />
                <div className="w-10" />
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pt-28">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Explore Clubin</h1>
                <p className="text-white/50 text-sm sm:text-base mb-10 max-w-2xl">
                    Discover nightclubs, upcoming parties and cities across India. Book free guestlist entry and VIP tables on Clubin.
                </p>

                {/* Cities */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4">Browse by City</h2>
                    <div className="flex flex-wrap gap-2.5">
                        {cityLinks.map((c) => (
                            <Link
                                key={c.slug}
                                to={`/clubs/${c.slug}`}
                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 hover:border-purple-500/30 transition-all"
                            >
                                <MapPin className="w-3.5 h-3.5 text-purple-400 inline mr-1.5 -mt-0.5" />
                                Nightclubs in {c.label}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Clubs */}
                {clubs.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xl font-bold mb-4">All Nightclubs</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {clubs.map((club) => (
                                <Link
                                    key={club.id}
                                    to={clubPath(getCitySlug(club.location), club)}
                                    className="block p-4 rounded-xl bg-[#1e1b2e]/80 border border-white/5 hover:border-purple-500/30 hover:bg-[#252139] transition-all"
                                >
                                    <p className="font-bold text-sm mb-0.5 truncate">{club.name}</p>
                                    <p className="text-xs text-white/40 truncate">{club.location}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Events */}
                {events.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
                        <ul className="space-y-2">
                            {events.map((event) => (
                                <li key={event.id}>
                                    <Link
                                        to={eventPath(event)}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all"
                                    >
                                        <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">{event.title}</span>
                                        <span className="text-xs text-white/40 ml-auto flex-shrink-0">
                                            {event.club} · {formatDate(event.date)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    );
}
