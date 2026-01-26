import React, { useState, useEffect, useRef } from 'react';
import { Apple, Play, Smartphone, Music, CheckCircle, ArrowRight, Star } from 'lucide-react';

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
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const videoSrc = "https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/manifest/video.m3u8";
    const posterSrc = "https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/thumbnails/thumbnail.jpg";

    useEffect(() => {
        const initVideo = () => {
            const video = videoRef.current;
            if (!video) return;

            if (videoSrc.endsWith('.mp4')) {
                video.src = videoSrc;
                video.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay blocked", e));
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
const StoreButtons = ({ centered = false }) => (
    <div className={`flex flex-col sm:flex-row gap-4 ${centered ? 'justify-center' : ''}`}>
        <button className="group relative flex items-center justify-center gap-3 bg-[#2b2344] hover:bg-[#352b54] text-white px-6 py-3 rounded-xl border border-[rgba(164,132,215,0.3)] backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
            <Apple className="w-6 h-6 fill-current" />
            <div className="text-left">
                <div className="text-[10px] font-manrope uppercase tracking-wider opacity-80">Download on the</div>
                <div className="text-base font-cabin font-bold leading-none">App Store</div>
            </div>
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button className="group relative flex items-center justify-center gap-3 bg-[#2b2344] hover:bg-[#352b54] text-white px-6 py-3 rounded-xl border border-[rgba(164,132,215,0.3)] backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg">
            <Play className="w-6 h-6 fill-current" />
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
const ScrollReveal = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        if (ref.current) observer.observe(ref.current);
        return () => {
            if (ref.current) observer.unobserve(ref.current);
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
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone.png?raw=true"
    },
    {
        id: 2,
        titlePrefix: "One App.",
        titleSuffix: "Every Night.",
        text: "From techno to hip-hop, find the right vibe instantly. Curated events just for you.",
        icon: Music,
        accentColor: "#f87b52",
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(1).png?raw=true"
    },
    {
        id: 3,
        titlePrefix: "Your Name",
        titleSuffix: "on the List.",
        text: "Join in seconds and walk in with confidence. Your digital pass is all you need.",
        icon: Star,
        accentColor: "#7b39fc",
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(2).png?raw=true"
    }
];

const MorphingFeatureSection = () => {
    const containerRef = useRef(null);
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

            {/* DESKTOP LAYOUT (Sticky) */}
            <div className="hidden lg:block h-[300vh]">
                <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                    {/* Expanded max-width for bigger images */}
                    <div className="max-w-[90rem] w-full mx-auto px-8 grid grid-cols-12 gap-12 items-center">

                        {/* LEFT: Morphing Box (Reduced to 4 cols to give image more space) */}
                        <div className="col-span-4 relative">
                            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-[#120f1d]/70 backdrop-blur-2xl p-10 shadow-2xl transition-all duration-500 min-h-[400px] flex flex-col justify-center">

                                {featuresData.map((feature, idx) => (
                                    <div
                                        key={feature.id}
                                        className={`absolute inset-0 p-10 flex flex-col justify-center transition-all duration-700 ease-out transform-gpu ${idx === activeIndex
                                                ? 'opacity-100 translate-y-0 scale-100'
                                                : idx < activeIndex
                                                    ? 'opacity-0 -translate-y-8 scale-95'
                                                    : 'opacity-0 translate-y-8 scale-95'
                                            }`}
                                    >
                                        <div className="mb-8">
                                            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 items-center justify-center shadow-xl backdrop-blur-md">
                                                <feature.icon className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1.5} />
                                            </div>
                                        </div>

                                        <h3 className="text-4xl xl:text-5xl font-inter font-bold text-white mb-6 leading-tight">
                                            {feature.titlePrefix} <br />
                                            <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                        </h3>
                                        <p className="text-lg font-manrope text-white/70 leading-relaxed font-light">
                                            {feature.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Image Area (Increased to 8 cols) */}
                        <div className="col-span-8 relative h-[85vh] flex items-center justify-center">
                            {featuresData.map((feature, idx) => (
                                <div
                                    key={feature.id}
                                    className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out transform-gpu ${idx === activeIndex
                                            ? 'opacity-100 translate-y-0 scale-100 blur-0'
                                            : 'opacity-0 translate-y-20 scale-95 blur-sm'
                                        }`}
                                >
                                    <img
                                        src={feature.mockupSrc}
                                        alt={`${feature.titlePrefix} ${feature.titleSuffix}`}
                                        className="h-full max-h-[90vh] w-auto object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700"
                                    />
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {/* MOBILE LAYOUT (Stacked & Optimized) */}
            <div className="lg:hidden flex flex-col gap-16 py-12 px-4">
                {featuresData.map((feature) => (
                    <ScrollReveal key={feature.id}>
                        <div className="flex flex-col gap-8">

                            {/* Text Box - Reduced padding and adjusted sizing */}
                            <div className="rounded-[2rem] border border-white/20 bg-[#120f1d]/70 backdrop-blur-xl p-6 shadow-xl">
                                <div className="mb-4">
                                    <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 items-center justify-center shadow-lg">
                                        <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-inter font-bold text-white mb-3 leading-tight">
                                    {feature.titlePrefix} <br />
                                    <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                </h3>
                                <p className="text-base font-manrope text-white/70 leading-relaxed font-light">
                                    {feature.text}
                                </p>
                            </div>

                            {/* Image - Made SIGNIFICANTLY bigger */}
                            <div className="flex justify-center -mt-2">
                                <img
                                    src={feature.mockupSrc}
                                    alt="App Screen"
                                    // Changed max-w from 280px to 360px (or full width on very small screens) to make it "BIG"
                                    className="w-full max-w-[360px] h-auto object-contain drop-shadow-2xl"
                                />
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