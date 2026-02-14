import { useEffect, useState } from 'react';
import { Skeleton } from '../components/Skeleton';
import { VenueImageSlideshow } from '../components/VenueImageSlideshow';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Club, Event } from '../types';
import { fetchClubDetails, fetchEventsByClubId, resolveShortLink, createShortLink, formatDate, formatTime, isMobileDevice, APP_STORE_URL, PLAY_STORE_URL } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, ArrowLeft, Calendar, Clock, ExternalLink, Share2, Check, Copy, ChevronDown, ChevronUp, Instagram, User, Music } from 'lucide-react';

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

    const handleBackAction = () => {
        // If there's history, go back, otherwise go to clubs list
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/clubs');
        }
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [shortUrl, setShortUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Track screen size for performance
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        url: club ? `https://clubin.co.in/clubs/${encodeURIComponent(club.location)}/${club.id}` : undefined,
        structuredData: club ? [
            {
                '@context': 'https://schema.org',
                '@type': 'NightClub',
                name: club.name,
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: club.address || '',
                    addressLocality: club.location,
                    addressCountry: 'IN',
                },
                image: club.imageUrl,
                description: club.description,
                url: `https://clubin.co.in/clubs/${encodeURIComponent(club.location)}/${club.id}`,
                ...(club.mapUrl ? { hasMap: club.mapUrl } : {}),
                ...(club.instagramUrl ? { sameAs: [club.instagramUrl] } : {}),
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clubin.co.in/' },
                    { '@type': 'ListItem', position: 2, name: 'Clubs', item: 'https://clubin.co.in/clubs' },
                    { '@type': 'ListItem', position: 3, name: club.location, item: `https://clubin.co.in/clubs/${encodeURIComponent(club.location)}` },
                    { '@type': 'ListItem', position: 4, name: club.name },
                ],
            },
        ] : undefined,
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

    const [showPastEvents, setShowPastEvents] = useState(false);

    // Filter upcoming events - compare date strings to avoid timezone issues
    const todayStr = getTodayDateString();
    const upcomingEvents = events.filter(
        (e) => e.date.substring(0, 10) >= todayStr
    ).sort((a, b) => a.date.localeCompare(b.date)); // Sort strictly by date asc

    const pastEvents = events.filter(
        (e) => e.date.substring(0, 10) < todayStr
    ).sort((a, b) => b.date.localeCompare(a.date)); // Sort strictly by date desc

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] md:bg-[#0a0a0a] text-white font-manrope">
                {isDesktop ? (
                    <div className="h-screen overflow-hidden flex">
                        {/* Left Skeleton */}
                        <div className="w-[400px] xl:w-[450px] flex-shrink-0 h-full border-r border-white/5 bg-[#0a0a0a] p-8 flex flex-col">
                            <Skeleton className="aspect-square w-full rounded-2xl mb-8" />
                            <Skeleton className="h-10 w-3/4 mb-4" />
                            <Skeleton className="h-6 w-1/2 mb-8" />
                            <div className="space-y-4 flex-1">
                                <Skeleton className="h-24 w-full rounded-xl" />
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>
                        </div>
                        {/* Right Skeleton */}
                        <div className="flex-1 h-full bg-[#0a0a0a] p-8 xl:p-12">
                            <div className="max-w-5xl mx-auto">
                                <Skeleton className="h-8 w-48 mb-8" />
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pb-12 bg-[#0a0a0a]">
                        {/* Hero Skeleton (45vh) */}
                        <div className="relative h-[45vh] w-full">
                            <Skeleton className="h-full w-full rounded-none" />
                            {/* Overlay Text Skeleton */}
                            <div className="absolute bottom-8 left-5 right-5 z-20 space-y-3">
                                <Skeleton className="h-10 w-3/4 rounded-lg bg-white/20" />
                                <Skeleton className="h-5 w-1/2 rounded bg-white/20" />
                            </div>
                        </div>

                        {/* Content Skeleton */}
                        <div className="px-5 mt-6 space-y-8">
                            {/* Upcoming Events Title */}
                            <Skeleton className="h-7 w-40 rounded" />

                            {/* Event Cards List */}
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex h-32 rounded-2xl bg-[#1e1b2e] border border-white/5 overflow-hidden">
                                        <Skeleton className="w-32 h-full rounded-none opacity-50" />
                                        <div className="flex-1 p-4 space-y-3 flex flex-col justify-center">
                                            <Skeleton className="h-5 w-3/4 rounded" />
                                            <Skeleton className="h-3 w-1/2 rounded" />
                                            <Skeleton className="h-4 w-1/3 rounded mt-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
        <div className="min-h-screen bg-[#0a0a0a] md:bg-[#0a0a0a] text-white font-manrope">
            {isDesktop ? (
                /* Desktop Layout - Split View */
                <div className="h-screen overflow-hidden flex animate-in fade-in duration-500">
                    {/* Left Column: Fixed Sidebar (35% or 400px) */}
                    <div className="w-[400px] xl:w-[450px] flex-shrink-0 h-full overflow-y-auto border-r border-white/5 bg-[#0a0a0a] relative">
                        {/* Image Header */}
                        <div className="relative h-72">
                            <img
                                src={club.imageUrl}
                                alt={club.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
                                <button
                                    onClick={handleBackAction}
                                    className="p-2 sm:p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors border border-white/10"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors border border-white/10"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Club Details */}
                        <div className="p-8 -mt-12 relative z-10">
                            <h1 className="text-3xl font-bold mb-4 leading-tight">{club.name}</h1>

                            <div className="flex flex-wrap items-center gap-2 text-white/70 mb-6">
                                <MapPin className="w-5 h-5 text-purple-400" />
                                <span className="font-medium">{club.location}</span>
                            </div>

                            {club.description && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">About</h3>
                                    <p className="text-white/70 leading-relaxed text-sm">
                                        {club.description}
                                    </p>
                                </div>
                            )}

                            {/* Venue Images Slideshow */}
                            {club.venueImages && club.venueImages.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Venue Photos</h3>
                                    <VenueImageSlideshow images={club.venueImages} venueName={club.name} />
                                </div>
                            )}

                            {club.mapUrl && (
                                <a
                                    href={club.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all w-full justify-center mb-4"
                                >
                                    <MapPin className="w-4 h-4 text-purple-400" />
                                    View on Google Maps
                                    <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                                </a>
                            )}

                            {club.instagramUrl && (
                                <a
                                    href={club.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all w-full justify-center mb-6"
                                >
                                    <Instagram className="w-4 h-4 text-purple-400" />
                                    Instagram
                                    <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                                </a>
                            )}

                            {/* Promoters in Sidebar (Desktop) */}
                            {club.promoterClubs && club.promoterClubs.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Promoters</h3>
                                    <div className="space-y-3">
                                        {club.promoterClubs.map((pc) => (
                                            <Link
                                                key={pc.id}
                                                to={`/promoters/${pc.promoter.id}`}
                                                className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-purple-500/20 transition-colors"
                                            >
                                                {pc.promoter.logoUrl ? (
                                                    <img
                                                        src={pc.promoter.logoUrl}
                                                        alt={pc.promoter.name}
                                                        className="w-10 h-10 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                                        <Music className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{pc.promoter.name}</p>
                                                    {pc.promoter.region && (
                                                        <p className="text-xs text-white/40">{pc.promoter.region}</p>
                                                    )}
                                                </div>
                                                {pc.promoter.instagramUrl && (
                                                    <span
                                                        onClick={(e) => { e.preventDefault(); window.open(pc.promoter.instagramUrl!, '_blank'); }}
                                                        className="p-2 rounded-full bg-purple-600/15 hover:bg-purple-600/30 text-purple-400 transition-colors flex-shrink-0"
                                                    >
                                                        <Instagram className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Events Grid */}
                    <div className="flex-1 h-full overflow-y-auto bg-[#0a0a0a] p-8 xl:p-12">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-purple-400" />
                                Upcoming Events
                                {upcomingEvents.length > 0 && (
                                    <span className="text-sm text-black font-bold bg-white px-2.5 py-0.5 rounded-full">
                                        {upcomingEvents.length}
                                    </span>
                                )}
                            </h2>

                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-white/20" />
                                    <p className="text-lg text-white/50">No upcoming events scheduled</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {upcomingEvents.map((event: Event) => (
                                        <Link
                                            key={event.id}
                                            to={`/events/${event.id}`}
                                            className="group block overflow-hidden rounded-2xl bg-[#120f1d] border border-white/5 transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                                        >
                                            {/* Image */}
                                            <div className="relative aspect-[4/3] overflow-hidden">
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1e] via-transparent to-transparent opacity-90" />

                                                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                                                    <p className="text-xs font-bold text-white">
                                                        {formatDate(event.date)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors truncate">
                                                    {event.title}
                                                </h3>
                                                <div className="flex items-center gap-4 text-xs text-white/50 mb-4">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                                                        {formatTime(event.startTime)}
                                                    </span>
                                                    {event.price > 0 ? (
                                                        <span className="font-bold text-green-400">₹{event.price}</span>
                                                    ) : (
                                                        <span className="font-bold text-white/70">Free Entry</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 mt-auto">
                                                    {event.guestlistStatus === 'open' && (
                                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase rounded-full border border-green-500/20">
                                                            Guestlist Open
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Mobile Layout (Redesigned) */
                <div className="pb-12 animate-in fade-in duration-500 bg-[#0a0a0a] pt-[4.5rem]">
                    {/* Fixed Header */}
                    <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] z-[60] flex justify-between items-center px-4 py-2 safe-top border-b border-white/10">
                        <button
                            onClick={handleBackAction}
                            className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div className="flex items-center justify-center">
                            <img src="/clubin-header-logo.png" alt="Clubin" className="h-14 w-auto object-contain" />
                        </div>

                        <button
                            onClick={handleShare}
                            className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Hero Image Section */}
                    <div className="relative h-[45vh] w-full">
                        <img
                            src={club.imageUrl}
                            alt={club.name}
                            className="w-full h-full object-cover"
                        />
                        {/* Gradient Overlay for Text Readability - Taller and darker at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />

                        {/* Club Info Overlay (Bottom Left) */}
                        <div className="absolute bottom-6 left-5 right-5 z-20">
                            <h1 className="text-2xl font-extrabold text-white mb-1.5 leading-tight drop-shadow-lg tracking-tight">{club.name}</h1>
                            <div className="flex items-center gap-1.5 text-white/90">
                                <MapPin className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
                                <span className="text-xs font-medium opacity-90">{club.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Container */}
                    <div className="px-5 -mt-2 relative z-10 space-y-6">
                        {/* Venue Images Slideshow */}
                        {club.venueImages && club.venueImages.length > 0 && (
                            <section>
                                <h2 className="text-base font-bold text-white mb-3">Venue Photos</h2>
                                <VenueImageSlideshow images={club.venueImages} venueName={club.name} />
                            </section>
                        )}

                        {/* Upcoming Events */}
                        <section>
                            <h2 className="text-base font-bold text-white mb-3">Upcoming Events</h2>
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-8 bg-[#1e1b2e] rounded-xl border border-white/5">
                                    <Calendar className="w-6 h-6 mx-auto mb-2 text-white/20" />
                                    <p className="text-white/40 text-sm font-medium">No upcoming events</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingEvents.map((event) => (
                                        <Link
                                            key={event.id}
                                            to={`/events/${event.id}`}
                                            className="flex items-stretch bg-[#1e1b2e] border border-white/5 rounded-xl overflow-hidden hover:bg-[#252139] transition-colors shadow-lg shadow-black/20"
                                        >
                                            {/* Image */}
                                            <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative">
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/10" />
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0 relative">
                                                <h3 className="text-sm font-bold text-white mb-1 truncate pr-2">{event.title}</h3>
                                                <div className="flex items-center gap-2 text-[10px] text-white/50 mb-2 font-medium">
                                                    <Calendar className="w-3 h-3 text-purple-400" />
                                                    <span>{formatDate(event.date)}</span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
                                                    <span>{formatTime(event.startTime)}</span>
                                                </div>
                                                <span className={`text-xs font-bold ${event.price === 0 ? 'text-green-400' : 'text-purple-200'}`}>
                                                    {event.price === 0 ? 'Free Entry' : `₹${event.price}`}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Past Events Accordion */}
                        {pastEvents.length > 0 && (
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowPastEvents(!showPastEvents)}
                                    className="w-full flex items-center justify-between p-3 bg-[#1e1b2e]/50 rounded-lg border border-white/5 text-white/60 hover:text-white hover:bg-[#1e1b2e] transition-all"
                                >
                                    <span className="font-medium text-xs">Past Events ({pastEvents.length})</span>
                                    {showPastEvents ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>

                                {showPastEvents && (
                                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        {pastEvents.map((event) => (
                                            <div key={event.id} className="flex items-stretch bg-[#1e1b2e]/30 border border-white/5 rounded-2xl overflow-hidden opacity-60 grayscale-[50%] hover:grayscale-0 transition-all">
                                                <div className="w-24 h-24 flex-shrink-0">
                                                    <img
                                                        src={event.imageUrl}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                                    <h3 className="text-sm font-bold text-white mb-1 truncate">{event.title}</h3>
                                                    <div className="flex items-center gap-2 text-[10px] text-white/40 mb-1">
                                                        <span>{formatDate(event.date)}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-white/30">Ended</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Promoters Section (Mobile) */}
                        {club.promoterClubs && club.promoterClubs.length > 0 && (
                            <section>
                                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-400" />
                                    Promoters
                                </h2>
                                <div className="space-y-3">
                                    {club.promoterClubs.map((pc) => (
                                        <Link
                                            key={pc.id}
                                            to={`/promoters/${pc.promoter.id}`}
                                            className="flex items-center gap-3 p-3 bg-[#1e1b2e] border border-white/5 rounded-xl hover:bg-[#252139] transition-colors"
                                        >
                                            {pc.promoter.logoUrl ? (
                                                <img
                                                    src={pc.promoter.logoUrl}
                                                    alt={pc.promoter.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                                    <Music className="w-4 h-4 text-purple-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{pc.promoter.name}</p>
                                                {pc.promoter.region && (
                                                    <p className="text-xs text-white/40">{pc.promoter.region}</p>
                                                )}
                                            </div>
                                            {pc.promoter.instagramUrl && (
                                                <span
                                                    onClick={(e) => { e.preventDefault(); window.open(pc.promoter.instagramUrl!, '_blank'); }}
                                                    className="p-2 rounded-full bg-purple-600/15 hover:bg-purple-600/30 text-purple-400 transition-colors flex-shrink-0"
                                                >
                                                    <Instagram className="w-4 h-4" />
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>
                </div>
            )}

            {/* Share Modal (Common) */}
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

            {/* Background decorations (Common) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 md:hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3 mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 mix-blend-screen" />
            </div>
        </div>
    );
}
