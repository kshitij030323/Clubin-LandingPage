import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import type { PromoterPublicResponse } from '../types';
import { fetchPromoterPublic, formatDate, formatTime } from '../api';
import { useSEO } from '../hooks/useSEO';
import { ArrowLeft, Calendar, Clock, Instagram, ExternalLink, Music, MapPin } from 'lucide-react';

export function PromoterDetailPage() {
    const { promoterId } = useParams<{ promoterId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<PromoterPublicResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleBackAction = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/clubs');
        }
    };

    useEffect(() => {
        async function loadPromoter() {
            if (!promoterId) return;
            try {
                setLoading(true);
                setError(null);
                const result = await fetchPromoterPublic(promoterId);
                setData(result);
            } catch (err) {
                setError('Failed to load promoter details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadPromoter();
    }, [promoterId]);

    useSEO({
        title: data ? `${data.promoter.name} - Event Promoter${data.promoter.region ? ` in ${data.promoter.region}` : ''} | Clubin` : 'Promoter | Clubin',
        description: data ? `${data.promoter.name} is an event promoter${data.promoter.region ? ` based in ${data.promoter.region}` : ''}. Browse their upcoming nightclub events and parties on Clubin.` : undefined,
        image: data?.promoter.logoUrl || undefined,
        structuredData: data ? {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: data.promoter.name,
            description: `Event promoter${data.promoter.region ? ` in ${data.promoter.region}` : ''}`,
            image: data.promoter.logoUrl || undefined,
            url: `https://clubin.co.in/promoters/${data.promoter.id}`,
            sameAs: data.promoter.instagramUrl ? [data.promoter.instagramUrl] : undefined,
            areaServed: data.promoter.region ? {
                '@type': 'City',
                name: data.promoter.region,
            } : undefined,
        } : undefined,
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0a1e] md:bg-[#0a0a0a] text-white font-manrope">
                {isDesktop ? (
                    <div className="h-screen overflow-hidden flex">
                        <div className="w-[400px] xl:w-[450px] flex-shrink-0 h-full border-r border-white/5 bg-[#0a0a0a] p-8 flex flex-col items-center">
                            <Skeleton className="w-32 h-32 rounded-full mb-6" />
                            <Skeleton className="h-8 w-48 mb-3" />
                            <Skeleton className="h-5 w-32 mb-6" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <div className="flex-1 h-full bg-[#0a0a0a] p-8 xl:p-12">
                            <div className="max-w-5xl mx-auto">
                                <Skeleton className="h-8 w-48 mb-8" />
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[...Array(6)].map((_, i) => (
                                        <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pb-12">
                        <div className="px-5 pt-20 pb-8 flex flex-col items-center">
                            <Skeleton className="w-24 h-24 rounded-full mb-4" />
                            <Skeleton className="h-7 w-40 mb-2" />
                            <Skeleton className="h-5 w-28" />
                        </div>
                        <div className="px-5 space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex h-24 rounded-xl bg-[#1e1b2e] border border-white/5 overflow-hidden">
                                    <Skeleton className="w-24 h-full rounded-none" />
                                    <div className="flex-1 p-3 space-y-2 flex flex-col justify-center">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-2xl">!</span>
                </div>
                <p className="text-red-400 mb-4 text-center">{error || 'Promoter not found'}</p>
                <button
                    onClick={handleBackAction}
                    className="px-6 py-2.5 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors font-medium"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { promoter, events } = data;

    return (
        <div className="min-h-screen bg-[#0f0a1e] md:bg-[#0a0a0a] text-white font-manrope">
            {isDesktop ? (
                /* Desktop Layout - Split View */
                <div className="h-screen overflow-hidden flex animate-in fade-in duration-500">
                    {/* Left Column: Promoter Info */}
                    <div className="w-[400px] xl:w-[450px] flex-shrink-0 h-full overflow-y-auto border-r border-white/5 bg-[#0a0a0a] relative">
                        {/* Back Button */}
                        <div className="p-6">
                            <button
                                onClick={handleBackAction}
                                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Promoter Profile */}
                        <div className="px-8 pb-8 flex flex-col items-center text-center">
                            {promoter.logoUrl ? (
                                <img
                                    src={promoter.logoUrl}
                                    alt={promoter.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/30 mb-6 shadow-2xl shadow-purple-500/20"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-purple-600/20 border-4 border-purple-500/30 flex items-center justify-center mb-6">
                                    <Music className="w-12 h-12 text-purple-400" />
                                </div>
                            )}

                            <h1 className="text-3xl font-bold mb-2 leading-tight">{promoter.name}</h1>

                            {promoter.region && (
                                <div className="flex items-center gap-2 text-white/60 mb-6">
                                    <MapPin className="w-4 h-4 text-purple-400" />
                                    <span className="font-medium">{promoter.region}</span>
                                </div>
                            )}

                            <p className="text-sm text-white/50 mb-8 max-w-xs">
                                Event promoter{promoter.region ? ` based in ${promoter.region}` : ''}. {events.length} upcoming event{events.length !== 1 ? 's' : ''}.
                            </p>

                            {promoter.instagramUrl && (
                                <a
                                    href={promoter.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all w-full justify-center"
                                >
                                    <Instagram className="w-4 h-4 text-purple-400" />
                                    Follow on Instagram
                                    <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Events Grid */}
                    <div className="flex-1 h-full overflow-y-auto bg-[#0a0a0a] p-8 xl:p-12">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-purple-400" />
                                Events by {promoter.name}
                                {events.length > 0 && (
                                    <span className="text-sm text-black font-bold bg-white px-2.5 py-0.5 rounded-full">
                                        {events.length}
                                    </span>
                                )}
                            </h2>

                            {events.length === 0 ? (
                                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-white/20" />
                                    <p className="text-lg text-white/50">No upcoming events</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {events.map((event) => (
                                        <Link
                                            key={event.id}
                                            to={`/events/${event.id}`}
                                            className="group block overflow-hidden rounded-2xl bg-[#120f1d] border border-white/5 transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                                        >
                                            <div className="relative aspect-[4/3] overflow-hidden">
                                                <img
                                                    src={event.imageUrl}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1e] via-transparent to-transparent opacity-90" />
                                                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                                                    <p className="text-xs font-bold text-white">{formatDate(event.date)}</p>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-lg font-bold mb-1 group-hover:text-purple-400 transition-colors truncate">
                                                    {event.title}
                                                </h3>
                                                <p className="text-xs text-white/40 mb-3 truncate">{event.club} &middot; {event.location}</p>
                                                <div className="flex items-center gap-4 text-xs text-white/50">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                                                        {formatTime(event.startTime)}
                                                    </span>
                                                    {event.price > 0 ? (
                                                        <span className="font-bold text-green-400">₹{event.price}</span>
                                                    ) : (
                                                        <span className="font-bold text-white/70">Free Entry</span>
                                                    )}
                                                    {event.guestlistStatus === 'open' && (
                                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase rounded-full border border-green-500/20">
                                                            Open
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
                /* Mobile Layout */
                <div className="pb-12 animate-in fade-in duration-500 bg-[#0f0a1e]">
                    {/* Top Bar */}
                    <div className="sticky top-0 z-30 bg-[#0f0a1e]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={handleBackAction}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-semibold truncate">{promoter.name}</span>
                    </div>

                    {/* Promoter Profile Header */}
                    <div className="px-5 pt-6 pb-6 flex flex-col items-center text-center">
                        {promoter.logoUrl ? (
                            <img
                                src={promoter.logoUrl}
                                alt={promoter.name}
                                className="w-24 h-24 rounded-full object-cover border-3 border-purple-500/30 mb-4 shadow-xl shadow-purple-500/20"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-purple-600/20 border-3 border-purple-500/30 flex items-center justify-center mb-4">
                                <Music className="w-10 h-10 text-purple-400" />
                            </div>
                        )}

                        <h1 className="text-xl font-extrabold mb-1">{promoter.name}</h1>

                        {promoter.region && (
                            <div className="flex items-center gap-1.5 text-white/50 mb-3">
                                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-xs font-medium">{promoter.region}</span>
                            </div>
                        )}

                        {promoter.instagramUrl && (
                            <a
                                href={promoter.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all"
                            >
                                <Instagram className="w-4 h-4 text-purple-400" />
                                Instagram
                                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                            </a>
                        )}
                    </div>

                    {/* Events List */}
                    <div className="px-5">
                        <h2 className="text-base font-bold text-white mb-3">
                            Upcoming Events ({events.length})
                        </h2>

                        {events.length === 0 ? (
                            <div className="text-center py-8 bg-[#1e1b2e] rounded-xl border border-white/5">
                                <Calendar className="w-6 h-6 mx-auto mb-2 text-white/20" />
                                <p className="text-white/40 text-sm font-medium">No upcoming events</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <Link
                                        key={event.id}
                                        to={`/events/${event.id}`}
                                        className="flex items-stretch bg-[#1e1b2e] border border-white/5 rounded-xl overflow-hidden hover:bg-[#252139] transition-colors shadow-lg shadow-black/20"
                                    >
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 relative">
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/10" />
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                            <h3 className="text-sm font-bold text-white mb-0.5 truncate pr-2">{event.title}</h3>
                                            <p className="text-[10px] text-white/40 mb-1.5 truncate">{event.club} &middot; {event.location}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-white/50 mb-1.5 font-medium">
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
                    </div>
                </div>
            )}

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 md:hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3 mix-blend-screen" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 mix-blend-screen" />
            </div>
        </div>
    );
}
