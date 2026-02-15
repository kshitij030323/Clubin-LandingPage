import type { City } from '../types';
import { CITIES } from '../types';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    ArrowLeft,
    Building2,
    Landmark,
    Palmtree,
    Building,
    Castle,
    CircleDot,
    TreePine,
    Crown,
    Waves,
    Download
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { APP_STORE_URL, PLAY_STORE_URL, isMobileDevice } from '../api';

const getCityIcon = (iconName: string) => {
    const props = { className: "w-6 h-6 sm:w-8 sm:h-8" };
    switch (iconName) {
        case 'building-2': return <Building2 {...props} />;
        case 'landmark': return <Landmark {...props} />;
        case 'palmtree': return <Palmtree {...props} />;
        case 'building': return <Building {...props} />;
        case 'castle': return <Castle {...props} />;
        case 'circle-dot': return <CircleDot {...props} />;
        case 'tree-pine': return <TreePine {...props} />;
        case 'crown': return <Crown {...props} />;
        case 'waves': return <Waves {...props} />;
        default: return <MapPin {...props} />;
    }
};

export function LocationSelectPage() {
    const navigate = useNavigate();

    useSEO({
        title: 'Nightclubs & Party Venues in India - Browse by City | Clubin',
        description: 'Browse nightclubs and party venues across Bengaluru, Mumbai, Delhi NCR, Goa, Pune, Hyderabad, Chennai, Jaipur & Chandigarh. Book guestlists and VIP tables on Clubin.',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Browse Nightclubs by City',
            description: 'Browse nightclubs and party venues across major Indian cities on Clubin.',
            url: 'https://clubin.co.in/clubs',
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clubin.co.in/' },
                    { '@type': 'ListItem', position: 2, name: 'Clubs', item: 'https://clubin.co.in/clubs' },
                ],
            },
        },
    });

    const handleCitySelect = (city: City) => {
        navigate(`/clubs/${city.id.toLowerCase().replace(/\s+/g, '-')}`);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope">

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <img
                        src="/clubin-logo-header.webp"
                        alt="Clubin"
                        className="h-14 w-auto md:h-16 object-contain"
                        width="192"
                        height="128"
                    />

                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            {/* Hero area */}
            <div className="pt-12 pb-10 px-4 sm:px-6 text-center max-w-7xl mx-auto">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-600/10 border border-purple-500/20 mb-6 shadow-2xl shadow-purple-500/10">
                    <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                <h2 className="text-3xl sm:text-5xl font-extrabold mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent tracking-tight">
                    Pick a Region
                </h2>
                <p className="text-white/40 text-sm sm:text-lg max-w-md mx-auto font-medium leading-relaxed">
                    Choose your city to see nearby clubs and events
                </p>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

                {/* App Download Banner */}
                <div className="mb-12 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#1e1b2e] to-[#2d2a4a] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-purple-900/20 max-w-3xl mx-auto">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 w-full sm:w-auto text-left">
                            <div className="w-14 h-14 flex-shrink-0 bg-black/30 rounded-xl p-2 border border-white/5 backdrop-blur-md">
                                <img
                                    src="/app-logo.png"
                                    alt="Clubin App"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight mb-1">Download Clubin App</h3>
                                <p className="text-white/60 text-xs font-medium leading-relaxed">
                                    Get exclusive access to guestlists and VIP tables.
                                </p>
                            </div>
                        </div>
                        <a
                            href={isMobileDevice() ? (navigator.userAgent.match(/Android/i) ? PLAY_STORE_URL : APP_STORE_URL) : APP_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full sm:w-auto py-3 px-6 bg-white hover:bg-white/90 text-black text-center font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download now</span>
                        </a>
                    </div>
                </div>

                <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-1">Popular Cities</span>
                </div>

                {/* City Grid - 3x3 on mobile */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                    {CITIES.map((city) => (
                        <button
                            key={city.id}
                            onClick={() => handleCitySelect(city)}
                            className="group flex flex-col items-center justify-center p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.03] border border-white/5 transition-all duration-300 hover:bg-white/[0.06] hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/20"
                        >
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:bg-purple-500/20">
                                <div className="text-purple-400">
                                    {getCityIcon(city.icon as string)}
                                </div>
                            </div>
                            <span className="text-[10px] sm:text-base font-bold text-white/80 group-hover:text-white transition-colors text-center">
                                {city.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Footer note */}
                <div className="text-center mt-16">
                    <p className="text-white/20 text-[10px] sm:text-sm font-bold uppercase tracking-[0.2em]">
                        More cities coming soon!
                    </p>
                </div>
            </main>

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
