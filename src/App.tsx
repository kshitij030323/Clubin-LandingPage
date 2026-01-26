import { useState, useEffect, useRef, type ReactNode } from 'react';

// --- Extend Window for HLS.js ---
declare global {
    interface Window {
        Hls: {
            isSupported(): boolean;
            Events: { MANIFEST_PARSED: string };
            new(): {
                loadSource(src: string): void;
                attachMedia(video: HTMLVideoElement): void;
                on(event: string, callback: () => void): void;
            };
        };
    }
}

// --- Icons (Inline SVGs to replace external dependency) ---

const AppleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.96-.86 1.76.18 3.07.88 3.92 2.15-3.52 1.95-2.9 6.7 1.25 8.16-.32.96-.74 1.9-1.21 2.78zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
);

const GooglePlayIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.09 21.94c-.58.17-1.09-.17-1.09-.9V2.96c0-.73.51-1.06 1.09-.9l.06.02 9.66 8.56-4.14 4.14-5.58 7.16zm12.37-9.37L6.44 2.57c-.55-.3-1.3-.11-1.66.42l8.89 7.9 2.79 1.68zM4.78 21.01l11.67-9.62 2.79 1.68-8.9 7.9c-.35.52-1.1.72-1.65.41l-3.91-2.17zm11.23-6.93l3.66 2.06c.72.41.72 1.06 0 1.47l-3.66 2.06-2.5-2.79 2.5-2.8z" />
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
 * Utility Component to load external scripts (HLS.js) and Fonts
 */
const ResourceLoader = () => {
    useEffect(() => {
        // Load Google Fonts
        const link = document.createElement('link');
        link.href = "https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        // Load HLS.js
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.4.0/dist/hls.min.js";
        script.async = true;
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.head.removeChild(script);
        };
    }, []);

    return null;
};

/**
 * Background Video Component using HLS
 */
const BackgroundVideo = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const videoSrc = "https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/manifest/video.m3u8";
    const posterSrc = "https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/thumbnails/thumbnail.jpg";

    useEffect(() => {
        const initVideo = () => {
            const video = videoRef.current;
            if (!video) return;

            if (videoSrc.endsWith('.mp4')) {
                video.src = videoSrc;
                video.play().then(() => setIsPlaying(true)).catch((e: unknown) => console.log("Autoplay blocked", e));
                return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = videoSrc;
                video.play().then(() => setIsPlaying(true)).catch(() => { });
            }
            else if (window.Hls && window.Hls.isSupported()) {
                const hls = new window.Hls();
                hls.loadSource(videoSrc);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                    video.play().then(() => setIsPlaying(true)).catch(() => { });
                });
            }
        };

        if (videoSrc.endsWith('.mp4') || window.Hls) {
            initVideo();
        } else {
            const checkHls = setInterval(() => {
                if (window.Hls) {
                    clearInterval(checkHls);
                    initVideo();
                }
            }, 100);
        }
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
                playsInline
                muted
                loop
                autoPlay
            />
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
            style={{ transitionDelay: `${delay}ms`, willChange: 'opacity, transform' }}
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
        text: "Skip the chaos. Clubin makes nights simple and effortless. No more uncertainty at the door.",
        icon: CheckCircle,
        accentColor: "#a484d7",
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(4).png?raw=true",
        mockupSrc2: undefined as string | undefined,
        layoutType: "zoomed"
    },
    {
        id: 2,
        titlePrefix: "One App.",
        titleSuffix: "Every Night.",
        text: "From techno to hip-hop, find the right vibe instantly. Curated events just for you.",
        icon: Music,
        accentColor: "#f87b52",
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(5).png?raw=true",
        mockupSrc2: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(6).png?raw=true",
        layoutType: "double"
    },
    {
        id: 3,
        titlePrefix: "Your Name",
        titleSuffix: "on the List.",
        text: "Join in seconds and walk in with confidence. Your digital pass is all you need.",
        icon: Star,
        accentColor: "#7b39fc",
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(2).png?raw=true",
        mockupSrc2: undefined as string | undefined,
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
                    <div className="max-w-7xl w-full mx-auto px-6">
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#120f1d]/80 backdrop-blur-3xl shadow-2xl h-[80vh] flex items-center">

                            {/* Subtle Ambient Glows inside the box */}
                            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
                            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="w-full h-full grid grid-cols-2 gap-8 items-center pl-14 pr-0 relative z-10">

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

                                            <h3 className="text-4xl xl:text-5xl font-inter font-bold text-white mb-6 leading-[1.1]">
                                                {feature.titlePrefix} <br />
                                                <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                            </h3>
                                            <p className="text-lg font-manrope text-white/70 leading-relaxed font-light max-w-md">
                                                {feature.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* RIGHT: Image Content - overflow hidden clips phone at bottom edge */}
                                <div className="h-full flex items-end justify-center relative overflow-hidden">
                                    {featuresData.map((feature, idx) => (
                                        <div
                                            key={feature.id}
                                            className={`absolute inset-0 flex items-end justify-center transition-all duration-700 ease-out transform-gpu ${idx === activeIndex
                                                    ? 'opacity-100 translate-x-0 scale-100'
                                                    : 'opacity-0 translate-x-12 scale-95'
                                                }`}
                                        >
                                            {feature.layoutType === "double" ? (
                                                // Double Image Layout - diagonal like reference
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={feature.mockupSrc}
                                                        alt="App Screen 1"
                                                        className="absolute left-[2%] bottom-[-8%] h-[85%] w-auto object-contain drop-shadow-2xl z-20 -rotate-6"
                                                    />
                                                    <img
                                                        src={feature.mockupSrc2}
                                                        alt="App Screen 2"
                                                        className="absolute right-[2%] top-[2%] h-[65%] w-auto object-contain drop-shadow-2xl z-10 rotate-6"
                                                    />
                                                </div>
                                            ) : (
                                                // Single Image Layout - phone sits at bottom edge, clipped
                                                <img
                                                    src={feature.mockupSrc}
                                                    alt={`${feature.titlePrefix} ${feature.titleSuffix}`}
                                                    className="h-[95%] w-auto object-contain drop-shadow-2xl translate-y-[10%]"
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
                                <h3 className="text-2xl font-inter font-bold text-white mb-2 leading-tight">
                                    {feature.titlePrefix}{' '}
                                    <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                </h3>
                                <p className="text-sm font-manrope text-white/60 leading-relaxed font-light">
                                    {feature.text}
                                </p>
                            </div>

                            {/* Image Area - phone clips at bottom edge */}
                            <div className="mt-6 flex justify-center items-end overflow-hidden h-[320px] relative">
                                {feature.layoutType === "double" ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={feature.mockupSrc}
                                            alt="Screen 1"
                                            className="absolute left-[5%] bottom-[-5%] h-[90%] w-auto object-contain drop-shadow-2xl z-20 -rotate-6"
                                        />
                                        <img
                                            src={feature.mockupSrc2}
                                            alt="Screen 2"
                                            className="absolute right-[5%] top-[5%] h-[65%] w-auto object-contain drop-shadow-2xl z-10 rotate-6"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={feature.mockupSrc}
                                        alt="App Screen"
                                        className="h-[110%] w-auto object-contain drop-shadow-2xl translate-y-[12%]"
                                    />
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                ))}
            </div>

        </div>
    );
};

// --- Main App Component ---

const App = () => {
    return (
        <div className="min-h-screen font-manrope bg-black text-white selection:bg-[#7b39fc] selection:text-white">
            <ResourceLoader />
            <BackgroundVideo />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3">
                    <img
                        src="https://raw.githubusercontent.com/kshitij030323/Clubin/9b47f8e7c0bb79125c6b8ba6272000859d3dd0dc/admin/public/clubin-logo.png"
                        alt="Clubin Logo"
                        className="h-10 w-auto md:h-12 object-contain drop-shadow-lg"
                    />
                </div>
                <div className="relative z-10 hidden md:block">
                    <StoreButtons />
                </div>
            </nav>

            {/* Main Content Scroll Wrapper */}
            <div className="relative z-30 pt-32 pb-20">

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
                            The easiest way to get into the best nights — <br className="hidden md:block" />without the hassle.
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
                                Your nights <span className="font-instrument italic font-normal text-[#f87b52]">start here.</span>
                            </h2>

                            <div className="mb-10">
                                <StoreButtons centered />
                            </div>

                            <div className="flex justify-center items-center gap-2 text-white/40 text-sm font-cabin">
                                <span>Clubin © 2024</span>
                                <span>•</span>
                                <span>Experience Nightlife</span>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

            </div>

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
