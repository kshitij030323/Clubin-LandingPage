import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

// --- Icons (Inline SVGs) ---

const AppleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
);

const GooglePlayIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.609 1.814L13.445 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 9.099l-2.41 2.41-8.526-8.85z" />
    </svg>
);

const CheckCircle = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const Music = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

const Star = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

// --- Components ---

/**
 * Background Video Component
 */
const BackgroundVideo = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const videoSrc = "https://pub-8cd3bcf3be92492690608c810aba8e95.r2.dev/AI%20Upscaler-2K-abstract_objects_new.mp4";
    const posterSrc = "/poster.webp";

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.src = videoSrc;
        video.play()
            .then(() => setIsPlaying(true))
            .catch(() => { });
    }, []);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden w-full h-full bg-black">
            <div
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 z-10 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                style={{ backgroundImage: `url(${posterSrc})` }}
            />
            <div className="absolute inset-0 bg-black/60 z-20 pointer-events-none" />
            <video
                ref={videoRef}
                className="absolute inset-0 z-0 w-full h-full object-cover"
                poster={posterSrc}
                playsInline
                muted
                loop
                autoPlay
                preload="metadata"
                width="1920"
                height="1080"
            >
                <track kind="captions" />
            </video>
        </div>
    );
};

/**
 * Store Buttons Component
 */
const StoreButtons = ({ centered = false }: { centered?: boolean }) => (
    <div className={`flex flex-col sm:flex-row gap-4 ${centered ? 'justify-center' : ''}`}>
        <button className="group relative flex items-center justify-center gap-3 bg-[#2b2344] hover:bg-[#352b54] text-white px-6 py-3 rounded-xl border border-[rgba(164,132,215,0.3)] backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
            <AppleIcon className="w-6 h-6 fill-current" />
            <div className="text-left">
                <div className="text-[10px] font-manrope uppercase tracking-wider opacity-80">Download on the</div>
                <div className="text-base font-cabin font-bold leading-none">App Store</div>
            </div>
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button className="group relative flex items-center justify-center gap-3 bg-[#2b2344] hover:bg-[#352b54] text-white px-6 py-3 rounded-xl border border-[rgba(164,132,215,0.3)] backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
            <GooglePlayIcon className="w-6 h-6 fill-current" />
            <div className="text-left">
                <div className="text-[10px] font-manrope uppercase tracking-wider opacity-80">Get it on</div>
                <div className="text-base font-cabin font-bold leading-none">Google Play</div>
            </div>
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    </div>
);

/**
 * Scroll Reveal Wrapper
 */
const ScrollReveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentRef = ref.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        if (currentRef) observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out transform-gpu ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
                }`}
            style={{ transitionDelay: `${delay}ms`, willChange: isVisible ? 'auto' : 'opacity, transform' }}
        >
            {children}
        </div>
    );
};

// --- Morphing Feature Section Logic ---

const featuresData = [
    {
        id: 1,
        titlePrefix: "Get In.",
        titleSuffix: "No Stress.",
        text: "Skip the chaos. Clubin makes events simple and effortless. No more uncertainty at the door.",
        icon: CheckCircle,
        accentColor: "#a484d7",
        mockupSrc: "/mockups/iphone-4.webp",
        mockupSrcMobile: "/mockups/iphone-4-mobile.webp",
        mockupSrc2: undefined as string | undefined,
        mockupSrc2Mobile: undefined as string | undefined,
        layoutType: "zoomed"
    },
    {
        id: 2,
        titlePrefix: "One App.",
        titleSuffix: "Every Event.",
        text: "From techno to hip-hop, find the right vibe instantly. Curated events just for you.",
        icon: Music,
        accentColor: "#f87b52",
        mockupSrc: "/mockups/iphone-5.webp",
        mockupSrcMobile: "/mockups/iphone-5-mobile.webp",
        mockupSrc2: "/mockups/iphone-6.webp" as string | undefined,
        mockupSrc2Mobile: "/mockups/iphone-6-mobile.webp" as string | undefined,
        layoutType: "double"
    },
    {
        id: 3,
        titlePrefix: "Your Name",
        titleSuffix: "on the List.",
        text: "Join in seconds and walk in with confidence. Your digital pass is all you need.",
        icon: Star,
        accentColor: "#7b39fc",
        mockupSrc: "/mockups/iphone-2.webp",
        mockupSrcMobile: "/mockups/iphone-2-mobile.webp",
        mockupSrc2: undefined as string | undefined,
        mockupSrc2Mobile: undefined as string | undefined,
        layoutType: "fit"
    }
];

const MorphingFeatureSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const { top, height } = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const scrollY = -top;
            const totalScrollableHeight = height - viewportHeight;

            let newIndex = 0;
            if (totalScrollableHeight > 0) {
                const segmentHeight = totalScrollableHeight / featuresData.length;
                newIndex = Math.floor((scrollY + viewportHeight * 0.3) / segmentHeight);
            }

            if (newIndex < 0) newIndex = 0;
            if (newIndex >= featuresData.length) newIndex = featuresData.length - 1;

            setActiveIndex(newIndex);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full z-30">

            {/* DESKTOP LAYOUT (Sticky - Unified Box) */}
            <div className="hidden lg:block h-[300vh]">
                <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                    {/* Main Unified Glass Container */}
                    <div className="max-w-6xl w-full mx-auto px-6">
                        <div className="relative rounded-[2.5rem] border border-white/10 bg-[#120f1d]/80 backdrop-blur-3xl shadow-2xl h-[75vh] flex items-center">

                            {/* Subtle Ambient Glows inside the box */}
                            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
                            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

                            {/* Bottom fade overlay for phone mockups - sits above the images */}
                            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#120f1d] via-[#120f1d]/90 to-transparent rounded-b-[2.5rem] z-40 pointer-events-none" />

                            <div className="w-full h-full grid grid-cols-2 gap-8 items-center pl-14 pr-0 relative z-10 overflow-hidden rounded-[2.5rem]">

                                {/* LEFT: Text Content */}
                                <div className="flex flex-col justify-center h-full relative">
                                    {featuresData.map((feature, idx) => (
                                        <div
                                            key={feature.id}
                                            className={`absolute left-0 right-0 flex flex-col justify-center transition-all duration-700 ease-out transform-gpu ${idx === activeIndex
                                                ? 'opacity-100 translate-y-0 blur-0'
                                                : idx < activeIndex
                                                    ? 'opacity-0 -translate-y-12 blur-sm'
                                                    : 'opacity-0 translate-y-12 blur-sm'
                                                }`}
                                        >
                                            <div className="mb-8">
                                                <div className="inline-flex w-16 h-16 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 items-center justify-center shadow-xl backdrop-blur-md">
                                                    <feature.icon className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1.5} />
                                                </div>
                                            </div>

                                            <h2 className="text-4xl xl:text-5xl font-inter font-bold text-white mb-6 leading-[1.1]">
                                                {feature.titlePrefix} <br />
                                                <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                            </h2>
                                            <p className="text-lg font-manrope text-white/70 leading-relaxed font-light max-w-md">
                                                {feature.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* RIGHT: Image Content - phone extends to bottom edge of box */}
                                <div className="h-full flex items-end justify-end relative">
                                    {featuresData.map((feature, idx) => (
                                        <div
                                            key={feature.id}
                                            className={`absolute inset-0 flex items-end justify-end transition-all duration-700 ease-out transform-gpu ${idx === activeIndex
                                                ? 'opacity-100 translate-x-0 scale-100'
                                                : 'opacity-0 translate-x-12 scale-95'
                                                }`}
                                        >
                                            {feature.layoutType === "double" ? (
                                                // Double Image Layout - phones extending to bottom
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={feature.mockupSrc}
                                                        alt="App Screen 1"
                                                        className="absolute left-[8%] bottom-[-20px] h-[105%] w-auto object-contain drop-shadow-2xl z-20 -rotate-3"
                                                        width="280"
                                                        height="570"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    <img
                                                        src={feature.mockupSrc2}
                                                        alt="App Screen 2"
                                                        className="absolute right-[0%] top-[-5%] h-[65%] w-auto object-contain drop-shadow-2xl z-10 rotate-6"
                                                        width="280"
                                                        height="570"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                </div>
                                            ) : (
                                                // Single Image Layout - phone extends past bottom edge
                                                <img
                                                    src={feature.mockupSrc}
                                                    alt={`${feature.titlePrefix} ${feature.titleSuffix}`}
                                                    className="absolute right-[0%] bottom-[-20px] h-[105%] w-auto object-contain drop-shadow-2xl"
                                                    width="280"
                                                    height="570"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE LAYOUT (Unified Cards) */}
            <div className="lg:hidden flex flex-col gap-12 py-12 px-4">
                {featuresData.map((feature) => (
                    <ScrollReveal key={feature.id}>
                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#120f1d]/80 backdrop-blur-2xl shadow-2xl">
                            {/* Text Content */}
                            <div className="p-6 pb-0">
                                <div className="mb-4">
                                    <div className="inline-flex w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-transparent border border-white/10 items-center justify-center shadow-lg">
                                        <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-inter font-bold text-white mb-2 leading-tight">
                                    {feature.titlePrefix}{' '}
                                    <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                </h2>
                                <p className="text-sm font-manrope text-white/60 leading-relaxed font-light">
                                    {feature.text}
                                </p>
                            </div>

                            {/* Image Area - phone ends at box edge with bottom fade */}
                            <div className="mt-6 flex justify-center items-end h-[350px] relative">
                                {/* Bottom fade overlay */}
                                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#120f1d] via-[#120f1d]/90 to-transparent z-30 pointer-events-none rounded-b-[2rem]" />

                                {feature.layoutType === "double" ? (
                                    <div className="relative w-full h-full overflow-hidden">
                                        <img
                                            src={feature.mockupSrcMobile}
                                            alt="Screen 1"
                                            className="absolute left-[10%] bottom-[-15px] h-[105%] w-auto object-contain drop-shadow-2xl z-20 -rotate-3"
                                            width="200"
                                            height="408"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <img
                                            src={feature.mockupSrc2Mobile}
                                            alt="Screen 2"
                                            className="absolute right-[5%] top-[-5%] h-[60%] w-auto object-contain drop-shadow-2xl z-10 rotate-6"
                                            width="200"
                                            height="408"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={feature.mockupSrcMobile}
                                        alt="App Screen"
                                        className="absolute bottom-[-15px] h-[105%] w-auto object-contain drop-shadow-2xl z-10"
                                        width="200"
                                        height="408"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                ))}
            </div>

        </div >
    );
};

// --- Main App Component ---

const App = () => {
    return (
        <div className="min-h-screen font-manrope bg-black text-white selection:bg-[#7b39fc] selection:text-white">
            <BackgroundVideo />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3">
                    <img
                        src="/clubin-logo-header.webp"
                        alt="Clubin Logo"
                        className="h-14 w-auto md:h-16 object-contain drop-shadow-lg"
                        width="192"
                        height="128"
                        fetchPriority="high"
                    />
                </div>
                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                    <Link
                        to="/list-your-club"
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm hidden sm:block"
                    >
                        List your Club
                    </Link>
                    <Link
                        to="/clubs"
                        className="px-5 py-2.5 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-xs sm:text-sm font-semibold rounded-xl border border-purple-400/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                        Browse Clubs
                    </Link>
                </div>
            </nav>

            {/* Main Content Scroll Wrapper */}
            <main className="relative z-30 pt-32 pb-20">

                {/* Hero Section */}
                <div className="px-6 md:px-12 min-h-[85vh] flex flex-col justify-center items-center text-center max-w-5xl mx-auto mb-20">
                    <ScrollReveal>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-inter font-extrabold tracking-tighter text-white mb-6 drop-shadow-2xl">
                            Get In.<br />
                            <span className="font-instrument italic font-normal text-[#a484d7]">No Lines. No Stress.</span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal delay={200}>
                        <p className="text-xl md:text-2xl font-manrope text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
                            The easiest way to get into the best events — <br className="hidden md:block" />without the hassle.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={400}>
                        <div className="flex flex-col items-center gap-6">
                            <StoreButtons centered />
                            <div className="text-sm font-manrope text-white/50 animate-pulse">
                                Scroll to explore
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Morphing Features Section */}
                <MorphingFeatureSection />

                {/* Final CTA Section */}
                <div className="px-6 md:px-12 min-h-[60vh] flex flex-col justify-center items-center text-center max-w-4xl mx-auto mt-20">
                    <ScrollReveal>
                        <div className="p-8 md:p-16 rounded-3xl bg-gradient-to-b from-[rgba(85,80,110,0.4)] to-black border border-[rgba(164,132,215,0.3)] backdrop-blur-xl">
                            <h2 className="text-4xl md:text-6xl font-inter font-bold mb-8 tracking-tight">
                                Your events <span className="font-instrument italic font-normal text-[#f87b52]">start here.</span>
                            </h2>

                            <div className="mb-10">
                                <StoreButtons centered />
                            </div>

                            <div className="flex justify-center items-center gap-2 text-white/40 text-sm font-cabin">
                                <span>Clubin © 2026</span>
                                <span>•</span>
                                <span>Experience Events</span>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

            </main>

            <style>{`
        .font-manrope { font-family: 'Manrope', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-cabin { font-family: 'Cabin', sans-serif; }
        .font-instrument { font-family: 'Instrument Serif', serif; }

        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: black; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
        </div>
    );
};

export default App;
