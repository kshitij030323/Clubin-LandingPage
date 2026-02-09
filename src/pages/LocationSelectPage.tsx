import { CITIES, City } from '../types';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';

export function LocationSelectPage() {
    const navigate = useNavigate();

    const handleCitySelect = (city: City) => {
        navigate(`/clubs/${city.id.toLowerCase().replace(/\s+/g, '-')}`);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope">
            {/* Header */}
            <header className="pt-8 pb-6 px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <MapPin className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                    Select Your City
                </h1>
                <p className="text-white/60 text-lg">
                    Discover the hottest clubs and events near you
                </p>
            </header>

            {/* City Grid */}
            <main className="max-w-4xl mx-auto px-6 pb-20">
                <div className="grid grid-cols-3 gap-4 md:gap-6">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => handleCitySelect(city)}
                            className="group relative overflow-hidden rounded-2xl bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/20 p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                        >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Icon */}
                            <div className="relative text-3xl md:text-4xl mb-2 md:mb-3 transition-transform duration-300 group-hover:scale-110">
                                {city.icon}
                            </div>

                            {/* City name */}
                            <div className="relative">
                                <span className="text-sm md:text-base font-medium text-white/90 group-hover:text-white transition-colors">
                                    {city.label}
                                </span>
                            </div>

                            {/* Arrow indicator */}
                            <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-4 h-4 text-purple-400" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* All Cities Link */}
                <div className="text-center mt-8">
                    <p className="text-white/40 text-sm">
                        More cities coming soon!
                    </p>
                </div>
            </main>

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
