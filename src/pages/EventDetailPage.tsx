import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import type { Event } from '../types';
import { fetchEventDetails, formatDate, formatTime, createShortLink, openInApp, isMobileDevice, APP_STORE_URL, PLAY_STORE_URL } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, ArrowLeft, Calendar, Clock, Share2, Ticket, Check, Copy, ExternalLink, Instagram, User, Music } from 'lucide-react';

export function EventDetailPage() {
    const { eventId, code } = useParams<{ eventId?: string; code?: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);

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
        structuredData: event ? {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: event.title,
            startDate: event.date,
            location: {
                '@type': 'Place',
                name: event.club,
                address: event.location,
            },
            image: event.imageUrl,
            description: event.description,
            offers: {
                '@type': 'Offer',
                price: event.price,
                priceCurrency: 'INR',
                availability: isGuestlistOpen
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/SoldOut',
            },
        } : undefined,
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
                    <div className="bg-[#0f0a1e] min-h-screen">
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
        <div className="min-h-screen bg-[#0f0a1e] md:bg-[#0a0a0a] text-white font-manrope">
            {isDesktop ? (
                /* Desktop Layout - 35% Left (Media) / 65% Right (Content) */
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
                                            {event.originalStagPrice && event.originalStagPrice > event.stagPrice && (
                                                <p className="text-xs line-through text-white/20 mt-0.5">₹{event.originalStagPrice}</p>
                                            )}
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Couples</p>
                                            <p className="text-2xl font-bold text-green-400">₹{event.couplePrice}</p>
                                            {event.originalCouplePrice && event.originalCouplePrice > event.couplePrice && (
                                                <p className="text-xs line-through text-white/20 mt-0.5">₹{event.originalCouplePrice}</p>
                                            )}
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Ladies</p>
                                            <p className="text-2xl font-bold text-green-400">₹{event.ladiesPrice}</p>
                                            {event.originalLadiesPrice && event.originalLadiesPrice > event.ladiesPrice && (
                                                <p className="text-xs line-through text-white/20 mt-0.5">₹{event.originalLadiesPrice}</p>
                                            )}
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
                                            <div className="flex items-center gap-3">
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
                                                    <a
                                                        href={event.promoterRef.instagramUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2.5 rounded-full bg-purple-600/15 hover:bg-purple-600/30 text-purple-400 transition-colors flex-shrink-0"
                                                    >
                                                        <Instagram className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Venue Section (Desktop) */}
                                    {event.clubRef && (
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-purple-400" />
                                                Venue
                                            </h3>
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
                /* Mobile Layout - Conserved EXACTLY as before */
                <div className="pb-24 animate-in fade-in duration-500">
                    {/* Hero Image/Video */}
                    <div className="relative h-[55vh]">
                        {event.videoUrl ? (
                            <video
                                src={event.videoUrl}
                                autoPlay
                                loop
                                muted
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
                        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                            <button
                                onClick={handleBackAction}
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

                    {/* Event Info - two column on large screens */}
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
                        <div className="lg:grid lg:grid-cols-[1fr,340px] lg:gap-6">

                            {/* Left column - main info */}
                            <div>
                                {/* Main Info Card */}
                                <div className="bg-[#120f1d]/95 backdrop-blur-2xl border border-purple-500/20 rounded-2xl p-5 sm:p-8 lg:p-10 mb-6 shadow-2xl">
                                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight leading-tight">{event.title}</h1>

                                    {/* Date & Time */}
                                    <div className="flex flex-wrap gap-4 sm:gap-6 mb-5 sm:mb-6 text-white/80">
                                        <div className="flex items-center gap-2 sm:gap-2.5">
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                                            </div>
                                            <span className="font-semibold text-xs sm:text-base">{formatDate(event.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-2.5">
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10">
                                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                                            </div>
                                            <span className="font-medium text-xs sm:text-base">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                                        </div>
                                    </div>

                                    {/* Club & Location */}
                                    <div className="flex items-start gap-2.5 sm:gap-3 text-white/70 mb-6 sm:mb-8 p-0.5">
                                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 text-purple-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-white text-sm sm:text-lg mb-0.5">{event.club}</p>
                                            <p className="text-xs sm:text-base font-medium opacity-80">{event.location}</p>
                                        </div>
                                    </div>

                                    {/* Price Info */}
                                    <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                                        <div className="text-center flex flex-col justify-between h-full">
                                            <p className="text-[9px] sm:text-[10px] text-white/40 mb-2 uppercase tracking-[0.1em] sm:tracking-[0.2em] font-bold">Stags</p>
                                            <div className="flex flex-col justify-end h-full">
                                                {event.originalStagPrice && event.originalStagPrice > event.stagPrice && (
                                                    <span className="text-white/20 line-through text-[9px] sm:text-sm block mb-0.5">
                                                        ₹{event.originalStagPrice}
                                                    </span>
                                                )}
                                                <span className="font-bold text-sm sm:text-lg text-green-400">₹{event.stagPrice}</span>
                                            </div>
                                        </div>

                                        <div className="text-center border-x border-white/10 flex flex-col justify-between h-full">
                                            <p className="text-[9px] sm:text-[10px] text-white/40 mb-2 uppercase tracking-[0.1em] sm:tracking-[0.2em] font-bold">Couples</p>
                                            <div className="flex flex-col justify-end h-full">
                                                {event.originalCouplePrice && event.originalCouplePrice > event.couplePrice && (
                                                    <span className="text-white/20 line-through text-[9px] sm:text-sm block mb-0.5">
                                                        ₹{event.originalCouplePrice}
                                                    </span>
                                                )}
                                                <span className="font-bold text-sm sm:text-lg text-green-400">₹{event.couplePrice}</span>
                                            </div>
                                        </div>

                                        <div className="text-center flex flex-col justify-between h-full">
                                            <p className="text-[9px] sm:text-[10px] text-white/40 mb-2 uppercase tracking-[0.1em] sm:tracking-[0.2em] font-bold">Ladies</p>
                                            <div className="flex flex-col justify-end h-full">
                                                {event.originalLadiesPrice && event.originalLadiesPrice > event.ladiesPrice && (
                                                    <span className="text-white/20 line-through text-[9px] sm:text-sm block mb-0.5">
                                                        ₹{event.originalLadiesPrice}
                                                    </span>
                                                )}
                                                <span className="font-bold text-sm sm:text-lg text-green-400">₹{event.ladiesPrice}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {event.description && (
                                    <div className="mb-6 bg-[#120f1d]/50 backdrop-blur-xl border border-purple-500/10 rounded-2xl p-5 sm:p-6">
                                        <h2 className="text-lg font-semibold mb-3">About This Event</h2>
                                        <p className="text-white/60 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                            {event.description}
                                        </p>
                                    </div>
                                )}

                                {/* Rules */}
                                {event.rules && (
                                    <div className="mb-6 bg-[#120f1d]/50 backdrop-blur-xl border border-purple-500/10 rounded-2xl p-5 sm:p-6">
                                        <h2 className="text-lg font-semibold mb-3">Entry Rules</h2>
                                        <p className="text-white/60 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                            {event.rules}
                                        </p>
                                    </div>
                                )}

                                {/* Promoter Section (Mobile) */}
                                {event.promoterRef && (
                                    <div className="mb-6 bg-[#120f1d]/50 backdrop-blur-xl border border-purple-500/10 rounded-2xl p-5 sm:p-6">
                                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <User className="w-4 h-4 text-purple-400" />
                                            Promoted by
                                        </h2>
                                        <div className="flex items-center gap-3">
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
                                                <a
                                                    href={event.promoterRef.instagramUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 rounded-full bg-purple-600/15 hover:bg-purple-600/30 text-purple-400 transition-colors flex-shrink-0"
                                                >
                                                    <Instagram className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Venue Section (Mobile) */}
                                {event.clubRef && (
                                    <div className="mb-6 bg-[#120f1d]/50 backdrop-blur-xl border border-purple-500/10 rounded-2xl p-5 sm:p-6">
                                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-purple-400" />
                                            Venue
                                        </h2>
                                        <div className="flex items-start gap-3">
                                            {event.clubRef.imageUrl ? (
                                                <img
                                                    src={event.clubRef.imageUrl}
                                                    alt={event.clubRef.name}
                                                    className="w-14 h-14 rounded-xl object-cover border border-purple-500/20 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
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

                    {/* Fixed Bottom CTA (mobile / tablet) */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f0a1e]/95 backdrop-blur-xl border-t border-white/5 z-40">
                        <div className="max-w-5xl mx-auto">
                            <button
                                onClick={handleGetTickets}
                                disabled={!isGuestlistOpen}
                                className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${isGuestlistOpen
                                    ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5'
                                    : 'bg-white/5 text-white/40 cursor-not-allowed'
                                    }`}
                            >
                                <Ticket className="w-5 h-5" />
                                {isGuestlistOpen ? 'Get Tickets on App' : 'Guestlist Closed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share / Download Modal (Common) */}
            {showShareModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}
                >
                    <div className="bg-[#120f1d] border border-purple-500/20 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm">
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

            {/* Background decorations (Common) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 md:hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3 mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 mix-blend-screen" />
            </div>
        </div>
    );
}
