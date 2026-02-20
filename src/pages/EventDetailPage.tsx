import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import { VenueImageSlideshow } from '../components/VenueImageSlideshow';
import type { Event } from '../types';
import { fetchEventDetails, formatDate, formatTime, createShortLink, openInApp, isMobileDevice, APP_STORE_URL, PLAY_STORE_URL } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, ArrowLeft, Calendar, Clock, Share2, Ticket, Check, Copy, ExternalLink, Instagram, User, Music, Image, Play, Volume2, VolumeX } from 'lucide-react';

export function EventDetailPage() {
    const { eventId, code } = useParams<{ eventId?: string; code?: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [viewBanner, setViewBanner] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const handleBackAction = () => {
        // Check if there is history to go back to
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/clubs');
        }
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
        async function loadEvent() {
            try {
                setLoading(true);
                setError(null);

                let eventData: Event;

                if (code) {
                    const response = await fetch(`https://api.clubin.info/api/shortlinks/${code}`);
                    if (!response.ok) throw new Error('Event not found');
                    const data = await response.json();
                    if (data.type !== 'event') throw new Error('Invalid link');
                    eventData = data.data;
                } else if (eventId) {
                    eventData = await fetchEventDetails(eventId);
                } else {
                    throw new Error('No event specified');
                }

                setEvent(eventData);
            } catch (err) {
                setError('Failed to load event. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadEvent();
    }, [eventId, code]);

    // SEO
    const isGuestlistOpen = event?.guestlistStatus === 'open' || event?.guestlistStatus === 'closing';
    useSEO({
        title: event ? `${event.title} at ${event.club} - ${formatDate(event.date)} | Clubin` : 'Event | Clubin',
        description: event ? `${event.title} at ${event.club} on ${formatDate(event.date)}. ${event.description?.substring(0, 150) || 'Book your spot on Clubin!'}` : undefined,
        image: event?.imageUrl,
        url: event ? `https://clubin.co.in/events/${event.id}` : undefined,
        structuredData: event ? [
            {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: event.title,
                startDate: event.date.split('T')[0] + (event.startTime ? `T${event.startTime}:00` : ''),
                endDate: event.date.split('T')[0] + (event.endTime ? `T${event.endTime}:00` : ''),
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                eventStatus: 'https://schema.org/EventScheduled',
                location: {
                    '@type': 'Place',
                    name: event.club,
                    address: {
                        '@type': 'PostalAddress',
                        streetAddress: event.clubRef?.address || '',
                        addressLocality: event.location,
                        addressCountry: 'IN',
                    },
                },
                image: event.imageUrl,
                description: event.description,
                url: `https://clubin.co.in/events/${event.id}`,
                offers: [
                    { '@type': 'Offer', name: 'Stag Entry', price: event.stagPrice, priceCurrency: 'INR', availability: isGuestlistOpen ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: `https://clubin.co.in/events/${event.id}` },
                    { '@type': 'Offer', name: 'Couple Entry', price: event.couplePrice, priceCurrency: 'INR', availability: isGuestlistOpen ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: `https://clubin.co.in/events/${event.id}` },
                    { '@type': 'Offer', name: 'Ladies Entry', price: event.ladiesPrice, priceCurrency: 'INR', availability: isGuestlistOpen ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: `https://clubin.co.in/events/${event.id}` },
                ],
                ...(event.promoterRef ? { organizer: { '@type': 'Organization', name: event.promoterRef.name, url: `https://clubin.co.in/promoters/${event.promoterRef.id}` } } : {}),
                performer: { '@type': 'PerformingGroup', name: event.genre || event.title },
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clubin.co.in/' },
                    { '@type': 'ListItem', position: 2, name: 'Clubs', item: 'https://clubin.co.in/clubs' },
                    { '@type': 'ListItem', position: 3, name: event.club, item: `https://clubin.co.in/clubs/${event.location.toLowerCase().replace(/\s+/g, '-')}` },
                    { '@type': 'ListItem', position: 4, name: event.title },
                ],
            },
        ] : undefined,
    });

    const handleShare = async () => {
        if (!event) return;
        try {
            if (!shortUrl) {
                const result = await createShortLink('event', event.id);
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

    const handleGetTickets = () => {
        if (!event) return;
        if (isMobileDevice()) {
            openInApp('event', event.id);
        } else {
            setShowShareModal(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                {isDesktop ? (
                    <div className="h-screen overflow-hidden flex">
                        {/* Left column skeleton */}
                        <div className="w-[35%] h-full relative border-r border-white/5 bg-white/5">
                            <Skeleton className="w-full h-full" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12">
                                <Skeleton className="h-10 w-3/4 mb-3" />
                                <Skeleton className="h-5 w-1/2" />
                            </div>
                        </div>
                        {/* Right column skeleton */}
                        <div className="w-[65%] h-full flex flex-col p-8 lg:p-12">
                            <div className="max-w-4xl mx-auto w-full space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-24 rounded-2xl" />
                                    <Skeleton className="h-24 rounded-2xl" />
                                </div>
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-48" />
                                    <div className="grid grid-cols-3 gap-4">
                                        <Skeleton className="h-28 rounded-2xl" />
                                        <Skeleton className="h-28 rounded-2xl" />
                                        <Skeleton className="h-28 rounded-2xl" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <Skeleton className="h-48 rounded-2xl" />
                                    <Skeleton className="h-48 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#0a0a0a] min-h-screen">
                        <Skeleton className="h-[55vh] w-full" />
                        <div className="px-4 -mt-16 relative z-10 space-y-6">
                            <Skeleton className="h-72 w-full rounded-2xl bg-[#120f1d]/95 border border-purple-500/20" />
                            <Skeleton className="h-40 w-full rounded-2xl bg-[#120f1d]/50" />
                            <Skeleton className="h-40 w-full rounded-2xl bg-[#120f1d]/50" />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-2xl">!</span>
                </div>
                <p className="text-red-400 mb-4 text-center">{error || 'Event not found'}</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2.5 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors font-medium"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope selection:bg-purple-500/30">
            {isDesktop ? (
                /* Desktop Layout - Reverted to Old Split Design */
                <div className="h-screen overflow-hidden flex animate-in fade-in duration-500">
                    {/* Left Column: Media (35%) */}
                    <div className="w-[35%] h-full relative border-r border-white/5 bg-black">
                        {event.videoUrl ? (
                            <video
                                src={event.videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-80"
                            />
                        ) : (
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover opacity-80"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />

                        {/* Top Bar on Image */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
                            <button
                                onClick={handleBackAction}
                                className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors border border-white/10"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors border border-white/10"
                            >
                                <Share2 className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Event Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 z-10">
                            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-3">
                                {event.title}
                            </h1>
                            <div className="flex items-center gap-2 text-white/70">
                                <MapPin className="w-5 h-5 text-purple-400" />
                                <span className="text-base font-medium">{event.club}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content (65%) */}
                    <div className="w-[65%] h-full flex flex-col bg-[#0a0a0a]">
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="max-w-4xl mx-auto p-8 pb-12">
                                {/* Key Info Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3 mb-2 text-purple-400">
                                            <Calendar className="w-5 h-5" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                                        </div>
                                        <p className="text-xl font-bold">{formatDate(event.date)}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3 mb-2 text-purple-400">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Time</span>
                                        </div>
                                        <p className="text-xl font-bold">{formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                                    </div>
                                </div>

                                {/* Ticket Prices */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-purple-400" />
                                        Entry & Pricing
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Stags</p>
                                            <p className="text-2xl font-bold text-green-400">₹{event.stagPrice}</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Couples</p>
                                            <p className="text-2xl font-bold text-green-400">₹{event.couplePrice}</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Ladies</p>
                                            <p className="text-2xl font-bold text-green-400">₹{event.ladiesPrice}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Description & Rules */}
                                <div className="grid gap-6">
                                    {event.description && (
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <h3 className="text-lg font-bold mb-3">About This Event</h3>
                                            <p className="text-base text-white/70 leading-relaxed whitespace-pre-line">
                                                {event.description}
                                            </p>
                                        </div>
                                    )}
                                    {event.rules && (
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <h3 className="text-lg font-bold mb-3">Entry Rules</h3>
                                            <p className="text-base text-white/70 leading-relaxed whitespace-pre-line">
                                                {event.rules}
                                            </p>
                                        </div>
                                    )}

                                    {/* Promoter Section (Desktop) */}
                                    {event.promoterRef && (
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                                <User className="w-5 h-5 text-purple-400" />
                                                Promoted by
                                            </h3>
                                            <Link to={`/promoters/${event.promoterRef.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                {event.promoterRef.logoUrl ? (
                                                    <img
                                                        src={event.promoterRef.logoUrl}
                                                        alt={event.promoterRef.name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-purple-600/20 border-2 border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                                        <Music className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold">{event.promoterRef.name}</p>
                                                    {event.promoterRef.region && (
                                                        <p className="text-xs text-white/40">{event.promoterRef.region}</p>
                                                    )}
                                                </div>
                                                {event.promoterRef.instagramUrl && (
                                                    <span
                                                        onClick={(e) => { e.preventDefault(); window.open(event.promoterRef!.instagramUrl!, '_blank'); }}
                                                        className="p-2.5 rounded-full bg-purple-600/15 hover:bg-purple-600/30 text-purple-400 transition-colors flex-shrink-0"
                                                    >
                                                        <Instagram className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </Link>
                                        </div>
                                    )}

                                    {/* Venue Section (Desktop) */}
                                    {event.clubRef && (
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-purple-400" />
                                                Venue
                                            </h3>
                                            {/* Venue Image Slideshow */}
                                            {event.clubRef.venueImages && event.clubRef.venueImages.length > 0 && (
                                                <div className="mb-4">
                                                    <VenueImageSlideshow images={event.clubRef.venueImages} venueName={event.clubRef.name} />
                                                </div>
                                            )}
                                            <div className="flex items-start gap-3">
                                                {event.clubRef.imageUrl ? (
                                                    <img
                                                        src={event.clubRef.imageUrl}
                                                        alt={event.clubRef.name}
                                                        className="w-16 h-16 rounded-xl object-cover border border-purple-500/20 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                        <MapPin className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold mb-0.5">{event.clubRef.name}</p>
                                                    <p className="text-xs text-white/50 mb-2">
                                                        {event.clubRef.address || event.location}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {event.clubRef.mapUrl && (
                                                            <a
                                                                href={event.clubRef.mapUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/20 rounded-lg text-purple-400 hover:text-purple-300 text-xs transition-colors"
                                                            >
                                                                <MapPin className="w-3 h-3" />
                                                                Directions
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                        {event.clubRef.instagramUrl && (
                                                            <a
                                                                href={event.clubRef.instagramUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/20 rounded-lg text-purple-400 hover:text-purple-300 text-xs transition-colors"
                                                            >
                                                                <Instagram className="w-3 h-3" />
                                                                Instagram
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer for Desktop */}
                        <div className="flex-shrink-0 p-6 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between z-10 relative">
                            {/* Gradient Fade Top */}
                            <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />

                            <div>
                                <p className="text-xs text-white/50 mb-1">Guestlist Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isGuestlistOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className={`font-bold text-sm ${isGuestlistOpen ? 'text-green-400' : 'text-red-400'}`}>
                                        {event.guestlistStatus === 'open' ? 'Open & Filling Fast' : 'Closed'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleGetTickets}
                                disabled={!isGuestlistOpen}
                                className={`px-8 py-3 rounded-xl font-bold text-base transition-all ${isGuestlistOpen
                                    ? 'bg-white text-black hover:bg-white/90 hover:scale-105 shadow-xl shadow-white/10'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                                    }`}
                            >
                                {isGuestlistOpen ? 'Get Tickets on App' : 'Guestlist Closed'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Mobile Layout - New Immersive Design with Smaller Text */
                <div className="pb-24 pt-[4.5rem]">
                    {/* Top Navigation - Fixed with Fade */}
                    <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] z-[60] flex justify-between items-center px-4 py-2 safe-top border-b border-white/10">
                        <button
                            onClick={handleBackAction}
                            className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        {/* Center Logo */}
                        <div className="flex items-center justify-center">
                            <img src="/clubin-logo-header.webp" alt="Clubin" className="h-14 w-auto object-contain" width="192" height="128" />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleShare}
                                className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Hero Section */}
                    <div className="relative h-[60vh] w-full overflow-hidden">
                        {event.videoUrl && !viewBanner ? (
                            <video
                                src={event.videoUrl}
                                autoPlay
                                loop
                                muted={isMuted}
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent pointer-events-none h-32" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent pointer-events-none" />

                        {/* Floating Media Actions (Gallery/Video) */}
                        <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
                            {/* Volume Toggle */}
                            {event.videoUrl && !viewBanner && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsMuted(!isMuted);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-lg border border-white/10 text-white hover:bg-white/10 transition-all shadow-lg active:scale-95"
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                            )}

                            {/* Banner/Video Toggle */}
                            {event.videoUrl && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setViewBanner(!viewBanner);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 text-sm font-bold hover:bg-white/10 transition-all shadow-lg active:scale-95 text-white"
                                >
                                    {viewBanner ? <Play className="w-4 h-4 fill-white" /> : <Image className="w-4 h-4" />}
                                    {viewBanner ? 'Video' : 'Banner'}
                                </button>
                            )}
                        </div>

                        {/* Main Event Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-4 z-40 flex flex-col items-center text-center">
                            {/* Date Badge */}
                            <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg">
                                <Calendar className="w-2.5 h-2.5 text-white/80" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">
                                    {formatDate(event.date)}
                                </span>
                            </div>

                            {/* Title - Significantly Reduced Size */}
                            <h1 className="text-2xl font-black tracking-tight leading-none mb-1 drop-shadow-2xl">
                                {event.title}
                            </h1>

                            {/* Location Pill - Reduced Size */}
                            <div className="flex items-center gap-1.5 text-white/90 mb-3 backdrop-blur-md px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-lg cursor-pointer hover:bg-white/10 transition-colors">
                                <MapPin className="w-3 h-3 text-purple-400" />
                                <span className="text-xs font-bold">{event.club}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row - Glassy Card (Smaller Text) */}
                    <div className="px-4 mt-4 w-full max-w-4xl mx-auto">
                        <div className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl grid grid-cols-4 gap-0 divide-x divide-white/5">
                            <div className="text-center px-1 py-1">
                                <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mb-1.5">Date</p>
                                <p className="text-[10px] font-bold text-white whitespace-nowrap">{formatDate(event.date).split(',')[0]} {formatDate(event.date).split(',')[1]}</p>
                            </div>
                            <div className="text-center px-1 py-1">
                                <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mb-1.5">Time</p>
                                <p className="text-[10px] font-bold text-white whitespace-nowrap">{formatTime(event.startTime)}</p>
                            </div>
                            <div className="text-center px-1 py-1">
                                <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mb-1.5">Entry</p>
                                <p className={`text-[10px] font-bold whitespace-nowrap ${event.price === 0 ? 'text-green-400' : 'text-white'}`}>
                                    {event.price === 0 ? 'Free Entry' : `₹${event.price}`}
                                </p>
                            </div>
                            <div className="text-center px-1 py-1">
                                <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold mb-1.5">Spots</p>
                                <p className="text-[10px] font-bold text-white whitespace-nowrap">
                                    {event.spotsRemaining ? event.spotsRemaining : '∞'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="max-w-3xl mx-auto px-6 py-8 space-y-10 pb-32">
                        {/* Ticket Pricing Breakdown - Smaller Text */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 pl-1">Entry & Cover</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 text-center">
                                    <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1 font-bold">Stags</p>
                                    <p className="text-base font-bold text-white">₹{event.stagPrice}</p>
                                    {event.stagPrice === 0 && <p className="text-[9px] text-green-400 font-bold mt-0.5">FREE</p>}
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 text-center">
                                    <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1 font-bold">Couples</p>
                                    <p className="text-base font-bold text-white">₹{event.couplePrice}</p>
                                    {event.couplePrice === 0 && <p className="text-[9px] text-green-400 font-bold mt-0.5">FREE</p>}
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 text-center">
                                    <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1 font-bold">Ladies</p>
                                    <p className="text-base font-bold text-white">₹{event.ladiesPrice}</p>
                                    {event.ladiesPrice === 0 && <p className="text-[9px] text-green-400 font-bold mt-0.5">FREE</p>}
                                </div>
                            </div>
                        </div>

                        {/* Collaboration Section - Smaller Text */}
                        {event.promoterRef && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 pl-1">In Collaboration With</h3>
                                <Link
                                    to={`/promoters/${event.promoterRef.id}`}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 border border-white/10 shadow-lg flex-shrink-0">
                                        {event.promoterRef.logoUrl ? (
                                            <img src={event.promoterRef.logoUrl} alt={event.promoterRef.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-base bg-purple-900/20">
                                                {event.promoterRef.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-8">
                                        <h4 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                                            {event.promoterRef.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-white/50">
                                            <p className="text-[10px] truncate">Official Event Partner</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {event.promoterRef.instagramUrl && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    window.open(event.promoterRef!.instagramUrl || '', '_blank');
                                                }}
                                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-500/20 transition-colors z-10"
                                            >
                                                <Instagram className="w-4 h-4 text-white/70 hover:text-purple-400 transition-colors" />
                                            </button>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Venue Section (Mobile) */}
                        {event.clubRef && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 pl-1">Venue</h3>
                                {/* Venue Image Slideshow */}
                                {event.clubRef.venueImages && event.clubRef.venueImages.length > 0 && (
                                    <div className="mb-3">
                                        <VenueImageSlideshow images={event.clubRef.venueImages} venueName={event.clubRef.name} />
                                    </div>
                                )}
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-white/[0.05] to-transparent border border-white/5">
                                    {event.clubRef.imageUrl ? (
                                        <img
                                            src={event.clubRef.imageUrl}
                                            alt={event.clubRef.name}
                                            className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-lg flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-purple-900/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-white/40" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-white truncate">{event.clubRef.name}</p>
                                        <p className="text-[10px] text-white/50 truncate">{event.clubRef.address || event.location}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {event.clubRef.mapUrl && (
                                            <a
                                                href={event.clubRef.mapUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-500/20 transition-colors"
                                            >
                                                <MapPin className="w-4 h-4 text-white/70" />
                                            </a>
                                        )}
                                        {event.clubRef.instagramUrl && (
                                            <a
                                                href={event.clubRef.instagramUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-500/20 transition-colors"
                                            >
                                                <Instagram className="w-4 h-4 text-white/70" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description - Smaller Text */}
                        {event.description && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 pl-1">The Vibe</h3>
                                <div className="text-white/80 leading-relaxed text-sm font-light tracking-wide whitespace-pre-line">
                                    {event.description}
                                </div>
                            </div>
                        )}

                        {/* Rules - Smaller Text */}
                        {event.rules && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 pl-1">Important Info</h3>
                                <div className="p-5 rounded-2xl bg-[#121212] border border-white/5 shadow-inner">
                                    <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                        Club Rules
                                    </h4>
                                    <div className="text-white/60 leading-relaxed text-xs whitespace-pre-line space-y-2 font-medium">
                                        {event.rules}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Footer CTA - Slightly Smaller */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-50 pb-8 pt-12">
                        <div className="max-w-3xl mx-auto">
                            <button
                                onClick={handleGetTickets}
                                disabled={!isGuestlistOpen}
                                className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${isGuestlistOpen
                                    ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_50px_rgba(255,255,255,0.15)] border border-white/20'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                                    }`}
                            >
                                <Ticket className="w-4 h-4" />
                                {isGuestlistOpen ? 'Get on Guestlist' : 'Guestlist Closed'}
                            </button>
                            <p className="text-center text-[9px] text-white/30 mt-2 font-medium uppercase tracking-widest flex items-center justify-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                Secure booking via Clubin App
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Share / Download Modal (Common) */}
            {showShareModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
                >
                    <div className="bg-[#120f1d] border border-purple-500/20 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <h3 className="text-xl font-semibold mb-4 text-center">
                            {isMobileDevice() ? 'Share Event' : 'Download Clubin App'}
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
        </div>
    );
}
