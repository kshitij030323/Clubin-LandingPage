import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Event } from '../types';
import { fetchEventDetails, formatDate, formatTime, createShortLink, openInApp, isMobileDevice, APP_STORE_URL, PLAY_STORE_URL } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, ArrowLeft, Calendar, Clock, Loader2, Share2, Ticket, Users, Check, Copy, ExternalLink } from 'lucide-react';

export function EventDetailPage() {
    const { eventId, code } = useParams<{ eventId?: string; code?: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shortUrl, setShortUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

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
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
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
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope pb-24">

            {/* Hero Image/Video */}
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[28rem]">
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

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

            {/* Event Info - two column on large screens */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10">
                <div className="lg:grid lg:grid-cols-[1fr,340px] lg:gap-6">

                    {/* Left column - main info */}
                    <div>
                        {/* Main Info Card */}
                        <div className="bg-[#120f1d]/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 sm:p-6 lg:p-8 mb-6">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{event.title}</h1>

                            {/* Date & Time */}
                            <div className="flex flex-wrap gap-4 mb-4 text-white/70">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                    <span className="font-medium">{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                                </div>
                            </div>

                            {/* Club & Location */}
                            <div className="flex items-start gap-2.5 text-white/60 mb-5">
                                <MapPin className="w-5 h-5 mt-0.5 text-purple-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-white">{event.club}</p>
                                    <p className="text-sm">{event.location}</p>
                                </div>
                            </div>

                            {/* Price Info */}
                            <div className="grid grid-cols-3 gap-3 p-4 bg-purple-600/8 rounded-xl border border-purple-500/15">
                                <div className="text-center">
                                    <p className="text-xs text-white/40 mb-1 uppercase tracking-wide">Stags</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {event.originalStagPrice && event.originalStagPrice > event.stagPrice && (
                                            <span className="text-white/30 line-through text-xs sm:text-sm mr-1">
                                                ₹{event.originalStagPrice}
                                            </span>
                                        )}
                                        <span className="text-green-400">₹{event.stagPrice}</span>
                                    </p>
                                </div>
                                <div className="text-center border-x border-purple-500/15">
                                    <p className="text-xs text-white/40 mb-1 uppercase tracking-wide">Couples</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {event.originalCouplePrice && event.originalCouplePrice > event.couplePrice && (
                                            <span className="text-white/30 line-through text-xs sm:text-sm mr-1">
                                                ₹{event.originalCouplePrice}
                                            </span>
                                        )}
                                        <span className="text-green-400">₹{event.couplePrice}</span>
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-white/40 mb-1 uppercase tracking-wide">Ladies</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {event.originalLadiesPrice && event.originalLadiesPrice > event.ladiesPrice && (
                                            <span className="text-white/30 line-through text-xs sm:text-sm mr-1">
                                                ₹{event.originalLadiesPrice}
                                            </span>
                                        )}
                                        <span className="text-green-400">₹{event.ladiesPrice}</span>
                                    </p>
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
                    </div>

                    {/* Right column - sidebar (desktop) / inline (mobile) */}
                    <div className="lg:sticky lg:top-6 lg:self-start">
                        {/* Guestlist Status */}
                        <div className="flex items-center gap-3 p-4 bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/15 rounded-xl mb-4">
                            <Users className="w-6 h-6 text-purple-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">Guestlist Status</p>
                                <p className="text-xs text-white/50">
                                    {event.guestlistStatus === 'open'
                                        ? 'Guestlist is open - book now!'
                                        : event.guestlistStatus === 'closing'
                                            ? 'Guestlist closing soon!'
                                            : 'Guestlist is closed'}
                                </p>
                            </div>
                            <div
                                className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${event.guestlistStatus === 'open'
                                    ? 'bg-green-500/15 text-green-400'
                                    : event.guestlistStatus === 'closing'
                                        ? 'bg-yellow-500/15 text-yellow-400'
                                        : 'bg-red-500/15 text-red-400'
                                    }`}
                            >
                                {event.guestlistStatus === 'open'
                                    ? 'Open'
                                    : event.guestlistStatus === 'closing'
                                        ? 'Closing'
                                        : 'Closed'}
                            </div>
                        </div>

                        {/* Desktop CTA */}
                        <div className="hidden lg:block">
                            <button
                                onClick={handleGetTickets}
                                disabled={!isGuestlistOpen}
                                className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${isGuestlistOpen
                                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-white/5 text-white/40 cursor-not-allowed'
                                    }`}
                            >
                                <Ticket className="w-5 h-5" />
                                {isGuestlistOpen ? 'Get Tickets on App' : 'Guestlist Closed'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom CTA (mobile / tablet) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 lg:hidden z-40">
                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={handleGetTickets}
                        disabled={!isGuestlistOpen}
                        className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${isGuestlistOpen
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white'
                            : 'bg-white/5 text-white/40 cursor-not-allowed'
                            }`}
                    >
                        <Ticket className="w-5 h-5" />
                        {isGuestlistOpen ? 'Get Tickets on App' : 'Guestlist Closed'}
                    </button>
                </div>
            </div>

            {/* Share / Download Modal */}
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

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-40 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
