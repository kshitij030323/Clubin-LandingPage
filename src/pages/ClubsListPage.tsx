import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Club } from '../types';
import { CITIES } from '../types';
import { fetchClubs } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, Calendar, ArrowLeft, Search, Loader2 } from 'lucide-react';

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
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/clubs')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold">{displayCity}</h1>
                        <p className="text-sm text-white/60">
                            {clubs.length} clubs available
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                        Download App
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="max-w-6xl mx-auto px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search clubs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredClubs.length === 0 ? (
                    <div className="text-center py-20 text-white/60">
                        {searchQuery
                            ? 'No clubs match your search'
                            : 'No clubs available in this city'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClubs.map((club) => (
                            <Link
                                key={club.id}
                                to={`/clubs/${city}/${club.id}`}
                                className="group block overflow-hidden rounded-2xl bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/20 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                            >
                                {/* Club Image */}
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <img
                                        src={club.imageUrl}
                                        alt={club.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {/* Event count badge */}
                                    {club._count && club._count.events > 0 && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/90 backdrop-blur-sm rounded-full text-xs font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {club._count.events} events
                                        </div>
                                    )}
                                </div>

                                {/* Club Info */}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                                        {club.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-white/60 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {club.location}
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
