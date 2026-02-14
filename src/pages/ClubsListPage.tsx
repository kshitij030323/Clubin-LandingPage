import { useEffect, useState } from 'react';
import { Skeleton } from '../components/Skeleton';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Club } from '../types';
import { CITIES } from '../types';
import { fetchClubs, APP_STORE_URL, PLAY_STORE_URL, isMobileDevice } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, Calendar, ArrowLeft, Search, X, Download } from 'lucide-react';

export function ClubsListPage() {
    const { city } = useParams<{ city: string }>();
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    useEffect(() => {
        // Show modal after a short delay
        const timer = setTimeout(() => {
            setShowDownloadModal(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Get display name for city
    const cityData = CITIES.find(
        (c) => c.id.toLowerCase().replace(/\s+/g, '-') === city?.toLowerCase()
    );
    const displayCity = cityData?.label || city || 'All Cities';
    const cityParam = cityData?.id || city;

    // SEO
    useSEO({
        title: `Best Nightclubs in ${displayCity} | Clubin`,
        description: `Discover the hottest nightclubs and party venues in ${displayCity}. Book guestlists and get VIP table reservations on Clubin.`,
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Best Nightclubs in ${displayCity}`,
            description: `Discover the hottest nightclubs and party venues in ${displayCity}.`,
            url: `https://clubin.co.in/clubs/${cityParam}`,
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clubin.co.in/' },
                    { '@type': 'ListItem', position: 2, name: 'Clubs', item: 'https://clubin.co.in/clubs' },
                    { '@type': 'ListItem', position: 3, name: displayCity, item: `https://clubin.co.in/clubs/${cityParam}` },
                ],
            },
        },
    });

    useEffect(() => {
        async function loadClubs() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchClubs(cityParam);
                setClubs(data);
            } catch (err) {
                setError('Failed to load clubs. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadClubs();
    }, [cityParam]);

    // Filter clubs by search query
    const filteredClubs = clubs.filter((club) =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope">

            {/* Header - Fixed & Styled */}
            <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] z-[60] flex justify-between items-center px-4 py-2 safe-top border-b border-white/10">
                <button
                    onClick={() => navigate('/clubs')}
                    className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                <div className="flex items-center justify-center">
                    <img src="/clubin-header-logo.png" alt="Clubin" className="h-14 w-auto object-contain" />
                </div>

                <a
                    href={isMobileDevice() ? (navigator.userAgent.match(/Android/i) ? PLAY_STORE_URL : APP_STORE_URL) : APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <Download className="w-5 h-5" />
                </a>
            </div>

            {/* Content */}
            <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-28">
                {/* Title & Search Section */}
                <div className="mb-8 space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-purple-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50">{displayCity}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Clubs</h1>
                        <p className="text-white/50 text-sm mt-1">
                            {loading ? 'Loading venues...' : `${filteredClubs.length} ${filteredClubs.length === 1 ? 'venue' : 'venues'} found in ${displayCity}`}
                        </p>
                    </div>

                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search clubs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-10 py-3.5 bg-[#120f1d] border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/40 transition-colors text-sm shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4 text-white/40" />
                            </button>
                        )}
                    </div>
                </div>


                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="rounded-2xl bg-[#1e1b2e]/50 border border-white/5 overflow-hidden">
                                <Skeleton className="aspect-[16/10] w-full" />
                                <div className="p-5 space-y-4">
                                    <Skeleton className="h-7 w-3/4 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-1/2 rounded" />
                                        <Skeleton className="h-4 w-full rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors font-medium"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredClubs.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                            <Search className="w-7 h-7 text-white/20" />
                        </div>
                        <p className="text-white/50 text-lg">
                            {searchQuery
                                ? 'No clubs match your search'
                                : 'No clubs available in this city yet'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                        {filteredClubs.map((club) => (
                            <Link
                                key={club.id}
                                to={`/clubs/${city}/${club.id}`}
                                className="group block overflow-hidden rounded-2xl bg-[#1e1b2e]/90 backdrop-blur-xl border border-white/5 transition-all duration-500 hover:bg-[#252139]/90 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                            >
                                {/* Club Image */}
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img
                                        src={club.imageUrl}
                                        alt={club.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {/* Glass Overlay on Image */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />

                                    {/* Event count badge - Glass Style */}
                                    {club._count && club._count.events > 0 && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.2 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-purple-300">
                                            <Calendar className="w-3 h-3" />
                                            {club._count.events} {club._count.events === 1 ? 'event' : 'events'}
                                        </div>
                                    )}
                                </div>

                                {/* Club Info */}
                                <div className="p-4 sm:p-5 relative">
                                    <h3 className="text-base sm:text-lg font-bold mb-1.5 group-hover:text-purple-400 transition-colors leading-tight">
                                        {club.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-white/40 text-xs sm:text-sm">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-purple-500/50" />
                                        <span className="truncate">{club.location}</span>
                                    </div>

                                    {/* Subtle bottom glow on hover */}
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/0 to-transparent group-hover:via-purple-500/40 transition-all duration-700" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Background decorations */}
            {/* Download App Modal */}
            {showDownloadModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowDownloadModal(false); }}
                >
                    <div className="relative bg-[#1a1625] border border-white/10 p-6 rounded-[2rem] shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <button
                            onClick={() => setShowDownloadModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-50 group"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                        </button>

                        <div className="flex items-start gap-4 mb-6 relative z-10">
                            <div className="w-16 h-16 flex-shrink-0 bg-black/30 rounded-2xl flex items-center justify-center border border-white/5 backdrop-blur-md overflow-hidden">
                                <img
                                    src="/app-logo.png"
                                    alt="Clubin App"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white leading-tight mb-1">Download Clubin App</h3>
                                <p className="text-white/60 text-xs font-medium leading-relaxed">
                                    Get exclusive access to guestlists, VIP tables, and seamless entry.
                                </p>
                            </div>
                        </div>

                        <a
                            href={isMobileDevice() ? (navigator.userAgent.match(/Android/i) ? PLAY_STORE_URL : APP_STORE_URL) : APP_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3.5 bg-white hover:bg-white/90 text-black text-center font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            Download Now
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
