import type { City } from '../types';
import { CITIES } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export function LocationSelectPage() {
    const navigate = useNavigate();

    useSEO({
        title: 'Browse Clubs by City | Clubin',
        description: 'Discover the hottest nightclubs and party venues across India. Select your city to find the best clubs near you.',
    });

    const handleCitySelect = (city: City) => {
        navigate(`/clubs/${city.id.toLowerCase().replace(/\s+/g, '-')}`);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope">

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold">Browse Clubs</h1>
                    </div>
                    <Link
                        to="/"
                        className="hidden sm:block text-purple-400 hover:text-purple-300 text-sm font-medium"
                    >
                        Home
                    </Link>
                </div>
            </header>

            {/* Hero area */}
            <div className="pt-10 pb-8 px-4 sm:px-6 text-center max-w-5xl mx-auto">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600/15 border border-purple-500/20 mb-5">
                    <MapPin className="w-7 h-7 text-purple-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                    Select Your City
                </h2>
                <p className="text-white/50 text-base sm:text-lg max-w-md mx-auto">
                    Discover the hottest clubs and events near you
                </p>
            </div>

            {/* City Grid */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => handleCitySelect(city)}
                            className="group relative overflow-hidden rounded-2xl bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/15 p-5 sm:p-6 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:bg-[#1a1528]/90 text-left"
                        >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Icon */}
                            <div className="relative text-3xl sm:text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">
                                {city.icon}
                            </div>

                            {/* City name + arrow */}
                            <div className="relative flex items-center justify-between">
                                <span className="text-sm sm:text-base font-semibold text-white/90 group-hover:text-white transition-colors">
                                    {city.label}
                                </span>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-0.5" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer note */}
                <div className="text-center mt-10">
                    <p className="text-white/30 text-sm">
                        More cities coming soon!
                    </p>
                </div>
            </main>

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
