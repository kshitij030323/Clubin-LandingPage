import React, { useState, useEffect, useRef } from 'react';

// --- Icons (Inline SVGs to replace external dependency) ---

const AppleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.96-.86 1.76.18 3.07.88 3.92 2.15-3.52 1.95-2.9 6.7 1.25 8.16-.32.96-.74 1.9-1.21 2.78zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
);

const GooglePlayIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.09 21.94c-.58.17-1.09-.17-1.09-.9V2.96c0-.73.51-1.06 1.09-.9l.06.02 9.66 8.56-4.14 4.14-5.58 7.16zm12.37-9.37L6.44 2.57c-.55-.3-1.3-.11-1.66.42l8.89 7.9 2.79 1.68zM4.78 21.01l11.67-9.62 2.79 1.68-8.9 7.9c-.35.52-1.1.72-1.65.41l-3.91-2.17zm11.23-6.93l3.66 2.06c.72.41.72 1.06 0 1.47l-3.66 2.06-2.5-2.79 2.5-2.8z" />
    </svg>
);

const CheckCircle = ({ className, strokeWidth = 2 }) => (
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

const Music = ({ className, strokeWidth = 2 }) => (
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

const Star = ({ className, strokeWidth = 2 }) => (
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
        // New zoomed in image
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(4).png?raw=true",
        layoutType: "zoomed"
    },
    {
        id: 2,
        titlePrefix: "One App.",
        titleSuffix: "Every Night.",
        text: "From techno to hip-hop, find the right vibe instantly. Curated events just for you.",
        icon: Music,
        accentColor: "#f87b52",
        // Two new images for this card
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
        // Original image, zoomed out layout
        mockupSrc: "https://github.com/kshitij030323/Clubin/blob/claude/fix-navigation-blank-screen-9zoc1/Phone%20mockups/iPhone%20(2).png?raw=true",
        layoutType: "fit"
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

            {/* DESKTOP LAYOUT (Sticky - Unified Box) */}
            <div className="hidden lg:block h-[300vh]">
                <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                    {/* Main Unified Glass Container */}
                    <div className="max-w-[85rem] w-full mx-auto px-6">
                        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#120f1d]/80 backdrop-blur-3xl shadow-2xl h-[85vh] flex items-center">

                            {/* Subtle Ambient Glows inside the box */}
                            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
                            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="w-full h-full grid grid-cols-12 gap-12 items-center px-16 relative z-10">

                                {/* LEFT: Text Content (Sticky Position inside relative container) */}
                                <div className="col-span-5 flex flex-col justify-center h-full relative">
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
                                            <div className="mb-10">
                                                <div className="inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 items-center justify-center shadow-xl backdrop-blur-md">
                                                    <feature.icon className="w-10 h-10 text-white drop-shadow-md" strokeWidth={1.5} />
                                                </div>
                                            </div>

                                            <h3 className="text-5xl xl:text-6xl font-inter font-bold text-white mb-8 leading-[1.1]">
                                                {feature.titlePrefix} <br />
                                                <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                            </h3>
                                            <p className="text-xl font-manrope text-white/70 leading-relaxed font-light max-w-md">
                                                {feature.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* RIGHT: Image Content (Inside the box now) */}
                                <div className="col-span-7 h-full flex items-center justify-center relative">
                                    {featuresData.map((feature, idx) => (
                                        <div
                                            key={feature.id}
                                            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out transform-gpu ${idx === activeIndex
                                                    ? 'opacity-100 translate-x-0 scale-100'
                                                    : 'opacity-0 translate-x-12 scale-95'
                                                }`}
                                        >
                                            {feature.layoutType === "double" ? (
                                                // Double Image Layout (Card 2)
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={feature.mockupSrc}
                                                        alt="App Screen 1"
                                                        className="absolute left-[10%] bottom-[10%] h-[75%] w-auto object-contain drop-shadow-2xl z-20 hover:z-40 transition-all duration-500 hover:scale-105"
                                                    />
                                                    <img
                                                        src={feature.mockupSrc2}
                                                        alt="App Screen 2"
                                                        className="absolute right-[10%] top-[10%] h-[75%] w-auto object-contain drop-shadow-2xl z-10 hover:z-40 transition-all duration-500 hover:scale-105"
                                                    />
                                                </div>
                                            ) : (
                                                // Single Image Layout (Zoomed or Fit)
                                                <img
                                                    src={feature.mockupSrc}
                                                    alt={`${feature.titlePrefix} ${feature.titleSuffix}`}
                                                    className={`w-auto object-contain drop-shadow-2xl ${feature.layoutType === 'fit' ? 'h-[80%]' : 'h-[92%]'}`}
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
            <div className="lg:hidden flex flex-col gap-16 py-12 px-4">
                {featuresData.map((feature) => (
                    <ScrollReveal key={feature.id}>
                        {/* Single Unified Card for Mobile */}
                        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#120f1d]/80 backdrop-blur-2xl shadow-2xl">
                            <div className="p-8 pb-0 flex flex-col gap-6">
                                <div className="flex items-start justify-between">
                                    <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 items-center justify-center shadow-lg">
                                        <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-3xl font-inter font-bold text-white mb-3 leading-tight">
                                        {feature.titlePrefix} <br />
                                        <span className="font-instrument italic font-normal" style={{ color: feature.accentColor }}>{feature.titleSuffix}</span>
                                    </h3>
                                    <p className="text-base font-manrope text-white/70 leading-relaxed font-light">
                                        {feature.text}
                                    </p>
                                </div>
                            </div>

                            {/* Image Area */}
                            <div className="mt-8 flex justify-center items-end overflow-hidden">

                                {feature.layoutType === "double" ? (
                                    // Double Layout for Mobile
                                    <div className="relative w-full h-[350px] flex justify-center mt-4">
                                        <img
                                            src={feature.mockupSrc}
                                            alt="Screen 1"
                                            className="absolute left-[-10px] bottom-0 w-[60%] h-auto object-contain drop-shadow-2xl z-20"
                                        />
                                        <img
                                            src={feature.mockupSrc2}
                                            alt="Screen 2"
                                            className="absolute right-[-10px] top-0 w-[60%] h-auto object-contain drop-shadow-2xl z-10"
                                        />
                                    </div>
                                ) : feature.layoutType === "fit" ? (
                                    // Fit Layout (Zoomed Out - Card 3)
                                    <img
                                        src={feature.mockupSrc}
                                        alt="App Screen"
                                        className="w-full max-w-[280px] h-auto object-contain drop-shadow-2xl translate-y-2 mb-8"
                                    />
                                ) : (
                                    // Zoomed Layout (Card 1)
                                    <img
                                        src={feature.mockupSrc}
                                        alt="App Screen"
                                        className="w-[140%] max-w-none h-auto object-cover translate-y-10 drop-shadow-2xl"
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

export default App;