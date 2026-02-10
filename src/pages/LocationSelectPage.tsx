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
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold tracking-tight">Browse Clubs</h1>
                    </div>
                    <Link
                        to="/"
                        className="hidden sm:block text-purple-400 hover:text-purple-300 text-sm font-bold uppercase tracking-widest transition-colors"
                    >
                        Home
                    </Link>
                </div>
            </header>

            {/* Hero area */}
            <div className="pt-16 pb-12 px-4 sm:px-6 text-center max-w-7xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-purple-600/10 border border-purple-500/20 mb-6 shadow-2xl shadow-purple-500/10">
                    <MapPin className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent tracking-tighter">
                    Select Your City
                </h2>
                <p className="text-white/40 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
                    Discover the hottest clubs and events near you
                </p>
            </div>

            {/* City Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">


                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => handleCitySelect(city)}
                            className="group relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white/[0.03] backdrop-blur-md border border-white/5 p-4 sm:p-8 transition-all duration-500 hover:bg-white/[0.06] hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20 text-left"
                        >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Icon */}
                            <div className="relative text-2xl sm:text-4xl mb-3 sm:mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                                {city.icon}
                            </div>

                            {/* City name + arrow */}
                            <div className="relative flex items-center justify-between">
                                <span className="text-sm sm:text-lg font-bold text-white/90 group-hover:text-white transition-colors">
                                    {city.label}
                                </span>
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-1" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer note */}
                <div className="text-center mt-16">
                    <p className="text-white/20 text-sm font-bold uppercase tracking-[0.2em]">
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
