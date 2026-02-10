import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Club, Event } from '../types';
import { fetchClubDetails, fetchEventsByClubId, resolveShortLink, createShortLink, formatDate, formatTime, isMobileDevice, APP_STORE_URL, PLAY_STORE_URL } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, ArrowLeft, Calendar, Clock, Loader2, ExternalLink, Share2, Check, Copy } from 'lucide-react';

function getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function ClubDetailPage() {
    const { clubId, code } = useParams<{ city: string; clubId: string; code: string }>();
    const navigate = useNavigate();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [shortUrl, setShortUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        async function loadClub() {
            try {
                setLoading(true);
                setError(null);

                let clubData: Club;

                if (code) {
                    const data = await resolveShortLink(code);
                    if (data.type !== 'club') throw new Error('Invalid link');
                    clubData = data.data as Club;
                } else if (clubId) {
                    clubData = await fetchClubDetails(clubId);
                } else {
                    throw new Error('No club specified');
                }

                setClub(clubData);

                // Fetch events separately since /api/clubs/:id returns empty events
                const clubEvents = await fetchEventsByClubId(clubData.id);
                setEvents(clubEvents);
            } catch (err) {
                setError('Failed to load club details. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadClub();
    }, [clubId, code]);

    // SEO
    useSEO({
        title: club ? `${club.name} - Nightclub in ${club.location} | Clubin` : 'Club | Clubin',
        description: club ? `${club.name} in ${club.location}. ${club.description || 'Book guestlists and VIP tables on Clubin.'}` : undefined,
        image: club?.imageUrl,
        structuredData: club ? {
            '@context': 'https://schema.org',
            '@type': 'NightClub',
            name: club.name,
            address: club.address || club.location,
            image: club.imageUrl,
            description: club.description,
        } : undefined,
    });

    const handleShare = async () => {
        if (!club) return;
        try {
            if (!shortUrl) {
                const result = await createShortLink('club', club.id);
                setShortUrl(result.shortUrl);
            }
            setShowShareModal(true);
        } catch (err) {
            console.error('Failed to create share link:', err);
        }
    };

    const copyToClipboard = async () => {
        if (!shortUrl) return;
        try {
            await navigator.clipboard.writeText(shortUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.createElement('input');
            input.value = shortUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Filter upcoming events - compare date strings to avoid timezone issues
    const todayStr = getTodayDateString();
    const upcomingEvents = events.filter(
        (e) => e.date.substring(0, 10) >= todayStr
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error || !club) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-2xl">!</span>
                </div>
                <p className="text-red-400 mb-4 text-center">{error || 'Club not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors font-medium"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope">

            {/* Hero Image */}
            <div className="relative h-56 sm:h-72 md:h-80 lg:h-96">
                <img
                    src={club.imageUrl}
                    alt={club.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Club Info */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
                <div className="bg-[#120f1d]/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 sm:p-5 lg:p-6 mb-6">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">{club.name}</h1>
                    <div className="flex flex-wrap items-center gap-1.5 text-white/60 mb-3 text-xs sm:text-sm">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                        <span>{club.location}</span>
                        {club.address && (
                            <>
                                <span className="text-white/20">|</span>
                                <span>{club.address}</span>
                            </>
                        )}
                    </div>
                    {club.description && (
                        <p className="text-white/50 leading-relaxed text-xs sm:text-sm">{club.description}</p>
                    )}

                    {club.mapUrl && (
                        <a
                            href={club.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/20 rounded-lg text-purple-400 hover:text-purple-300 text-xs sm:text-sm transition-colors"
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            View on Map
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>

                {/* Upcoming Events */}
                <section className="pb-16">
                    <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        Upcoming Events
                        {upcomingEvents.length > 0 && (
                            <span className="text-xs text-white/40 font-normal bg-white/5 px-2 py-0.5 rounded-full">
                                {upcomingEvents.length}
                            </span>
                        )}
                    </h2>

                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-12 text-white/40 bg-[#120f1d]/50 rounded-2xl border border-purple-500/10">
                            <Calendar className="w-8 h-8 mx-auto mb-2 text-white/15" />
                            <p className="text-sm">No upcoming events at this club</p>
                            <p className="text-xs mt-1 text-white/25">Check back later for new events</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {upcomingEvents.map((event: Event) => (
                                <Link
                                    key={event.id}
                                    to={`/events/${event.id}`}
                                    className="group block overflow-hidden rounded-2xl bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/15 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
                                >
                                    <div className="flex flex-row">
                                        {/* Event Image */}
                                        <div className="relative w-28 sm:w-36 lg:w-40 flex-shrink-0 overflow-hidden">
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        {/* Event Info */}
                                        <div className="flex-1 p-3 sm:p-4 min-w-0">
                                            <h3 className="text-sm sm:text-base font-semibold mb-1.5 group-hover:text-purple-300 transition-colors truncate">
                                                {event.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-white/50 mb-2">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-purple-400/70" />
                                                    {formatDate(event.date)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-purple-400/70" />
                                                    {formatTime(event.startTime)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs sm:text-sm font-medium text-purple-400">
                                                    {event.priceLabel || `₹${event.price}`}
                                                </span>
                                                {event.guestlistStatus === 'open' && (
                                                    <span className="px-2 py-0.5 bg-green-500/15 text-green-400 text-xs rounded-full font-medium">
                                                        Guestlist Open
                                                    </span>
                                                )}
                                                {event.guestlistStatus === 'closing' && (
                                                    <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-400 text-xs rounded-full font-medium">
                                                        Closing Soon
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
                >
                    <div className="bg-[#120f1d] border border-purple-500/20 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm">
                        <h3 className="text-base sm:text-lg font-semibold mb-4 text-center">
                            {isMobileDevice() ? 'Share Club' : 'Share & Download App'}
                        </h3>

                        {shortUrl && (
                            <div className="mb-6">
                                <p className="text-sm text-white/50 mb-2">Share this link:</p>
                                <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg border border-white/5">
                                    <input
                                        type="text"
                                        value={shortUrl}
                                        readOnly
                                        className="flex-1 bg-transparent text-sm text-white/80 outline-none min-w-0"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-white/60" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2.5 mb-4">
                            <a
                                href={PLAY_STORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Google Play Store
                            </a>
                            <a
                                href={APP_STORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Apple App Store
                            </a>
                        </div>

                        <button
                            onClick={() => setShowShareModal(false)}
                            className="w-full py-3 text-white/50 hover:text-white transition-colors text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-40 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
