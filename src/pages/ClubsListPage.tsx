import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Club } from '../types';
import { CITIES } from '../types';
import { fetchClubs } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, Calendar, ArrowLeft, Search, Loader2, X } from 'lucide-react';

export function ClubsListPage() {
    const { city } = useParams<{ city: string }>();
    const navigate = useNavigate();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/clubs')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-semibold truncate">Clubs in {displayCity}</h1>
                        <p className="text-sm text-white/50">
                            {loading ? 'Loading...' : `${filteredClubs.length} ${filteredClubs.length === 1 ? 'club' : 'clubs'} found`}
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs sm:text-sm font-medium rounded-lg border border-purple-500/20 transition-colors flex-shrink-0"
                    >
                        Download App
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search clubs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/40 transition-colors text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4 text-white/40" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {filteredClubs.map((club) => (
                            <Link
                                key={club.id}
                                to={`/clubs/${city}/${club.id}`}
                                className="group block overflow-hidden rounded-2xl bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/15 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
                            >
                                {/* Club Image */}
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img
                                        src={club.imageUrl}
                                        alt={club.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                                    {/* Event count badge */}
                                    {club._count && club._count.events > 0 && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/90 backdrop-blur-sm rounded-full text-xs font-medium">
                                            <Calendar className="w-3 h-3" />
                                            {club._count.events} {club._count.events === 1 ? 'event' : 'events'}
                                        </div>
                                    )}
                                </div>

                                {/* Club Info */}
                                <div className="p-4">
                                    <h3 className="text-base font-semibold mb-1.5 group-hover:text-purple-300 transition-colors leading-snug">
                                        {club.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-white/50 text-sm">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{club.location}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-40 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
