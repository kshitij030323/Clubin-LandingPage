import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

// ─── Background Video with Fluted Glass Strips ────────────────────────────────
// Same video as the landing page, with vertical frosted-glass "fluted" strips
// layered over it to create a reeded/ridged glass texture.

const VIDEO_SRC = 'https://pub-8cd3bcf3be92492690608c810aba8e95.r2.dev/AI%20Upscaler-2K-abstract_objects_new.mp4';
const FLUTE_COUNT = 14;

function PageVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.src = VIDEO_SRC;
        video.play().then(() => setIsPlaying(true)).catch(() => { });
    }, []);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black">
            {/* Poster while video loads */}
            <div
                className={`absolute inset-0 bg-cover bg-center z-10 transition-opacity duration-1000 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                style={{ backgroundImage: 'url(/poster.webp)' }}
            />
            {/* Video */}
            <video
                ref={videoRef}
                className="absolute inset-0 z-0 w-full h-full object-cover"
                poster="/poster.webp"
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
            {/* Dark overlay – same depth as landing page */}
            <div className="absolute inset-0 bg-black/62 z-20 pointer-events-none" />
            {/* Fluted glass strips – alternating blur/opacity for ridged glass look */}
            <div className="absolute inset-0 z-30 flex pointer-events-none">
                {Array.from({ length: FLUTE_COUNT }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 h-full"
                        style={{
                            borderRight: '1px solid rgba(255,255,255,0.045)',
                            backdropFilter: i % 2 === 0 ? 'blur(3px)' : 'blur(0.6px)',
                            background: i % 2 === 0
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.022) 0%, rgba(255,255,255,0.005) 100%)'
                                : 'transparent',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── ScrollReveal ─────────────────────────────────────────────────────────────

function ScrollReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.1, rootMargin: '-50px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out transform-gpu ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}
            style={{ transitionDelay: `${delay}ms`, willChange: visible ? 'auto' : 'transform, opacity' }}
        >
            {children}
        </div>
    );
}

// ─── Lordicon animated icon CDN URLs ─────────────────────────────────────────
// Icons from lordicon.com – free tier with attribution

const ICON = {
    calendar:  'https://cdn.lordicon.com/abfverha.json',
    checklist: 'https://cdn.lordicon.com/oqdmuxru.json',
    rocket:    'https://cdn.lordicon.com/ujmbgxhm.json',
    barChart:  'https://cdn.lordicon.com/tyvtvbcy.json',
    share:     'https://cdn.lordicon.com/ftngahli.json',
    qrCode:    'https://cdn.lordicon.com/qrbcugnv.json',
    bell:      'https://cdn.lordicon.com/lyjmfxtw.json',
    wallet:    'https://cdn.lordicon.com/qhgmphtg.json',
    money:     'https://cdn.lordicon.com/qsdqfzml.json',
    growth:    'https://cdn.lordicon.com/dxjqoygy.json',
} as const;

// Consistent purple colour palette passed to every lord-icon
const LORD_COLORS = 'primary:#a484d7,secondary:#7b39fc';
const LORD_SIZE   = { width: '44px', height: '44px' } as const;

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
    {
        lordSrc: ICON.calendar,
        title:   'Schedule a Meeting',
        desc:    "Book a quick call with our partnerships team via Google Calendar. We'll understand your venue and goals.",
        accent:  '#a484d7',
    },
    {
        lordSrc: ICON.checklist,
        title:   'Onboard to Clubin',
        desc:    'We set up your club dashboard, configure pricing, and train your team — all within 48 hours.',
        accent:  '#7b39fc',
    },
    {
        lordSrc: ICON.rocket,
        title:   'Go Live on Clubin',
        desc:    'Your club and events are live on the Clubin app, instantly visible to thousands of nightlife enthusiasts.',
        accent:  '#f87b52',
    },
];

const FEATURES = [
    { lordSrc: ICON.barChart,  title: 'Revenue Metrics Dashboard', desc: 'Track bookings, revenue, footfall, and growth trends in real time with a clean analytics dashboard.', accent: '#7b39fc' },
    { lordSrc: ICON.share,     title: 'Social Media Share Links',  desc: 'Generate beautiful share links for your events. One tap to post on Instagram, WhatsApp, or anywhere.',    accent: '#a484d7' },
    { lordSrc: ICON.qrCode,    title: 'Scanner Portal',            desc: 'Secure QR-based entry system. Your door team scans tickets in seconds — no paper lists, no confusion.',    accent: '#22c55e' },
    { lordSrc: ICON.bell,      title: 'Push Notifications',        desc: 'Send targeted notifications to nightlife lovers in your area. Fill your venue before doors even open.',    accent: '#f87b52' },
    { lordSrc: ICON.money,     title: 'Dynamic Table Pricing',     desc: 'Our algorithm adjusts table prices based on demand, maximising your revenue on peak nights.',             accent: '#6366f1' },
    { lordSrc: ICON.wallet,    title: 'Instant Payouts',           desc: 'Ticket and booking payments land directly in your account via our payment aggregator. No delays.',          accent: '#22c55e' },
];

const WHY = [
    { lordSrc: ICON.growth,  title: 'Reach a Young Audience',  desc: 'Connect with the next generation of nightlife lovers. Our user base is 18–30, digitally native, and ready to party.', accent: '#a484d7' },
    { lordSrc: ICON.money,   title: 'Dynamic Table Pricing',   desc: 'Our algorithm adjusts table prices based on demand, day of week, and event hype — so you never leave money on the table.', accent: '#7b39fc' },
    { lordSrc: ICON.wallet,  title: 'Instant Settlements',     desc: 'No waiting for payouts. Every booking goes directly to your account minus our small fee. Powered by leading payment aggregators.', accent: '#f87b52' },
];

const MEETING_URL = 'https://calendar.google.com/calendar/u/0/r/eventedit?text=Clubin+Club+Partnership+Meeting&details=Meeting+to+discuss+listing+your+club+on+Clubin+app.&location=Google+Meet';

// ─── Glass card class helpers ─────────────────────────────────────────────────

const glass      = 'bg-[rgba(12,10,22,0.72)] backdrop-blur-2xl border border-white/[0.08]';
const glassHover = 'hover:border-[#a484d7]/30 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-500';

// ─── Component ────────────────────────────────────────────────────────────────

export function ListYourClubPage() {
    useSEO({
        title:       'List Your Club on Clubin - Partner With Us | Clubin',
        description: 'Partner with Clubin to list your nightclub, manage guestlists, table bookings, and reach a young nightlife audience across India. Lowest platform fees. Schedule a meeting today.',
        url:         'https://clubin.co.in/list-your-club',
        structuredData: [
            {
                '@context': 'https://schema.org',
                '@type':    'WebPage',
                name:        'List Your Club on Clubin',
                description: 'Partner with Clubin to list your nightclub and manage events, guestlists, and table bookings.',
                url:         'https://clubin.co.in/list-your-club',
            },
            {
                '@context': 'https://schema.org',
                '@type':    'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clubin.co.in/' },
                    { '@type': 'ListItem', position: 2, name: 'List Your Club' },
                ],
            },
        ],
    });

    const [countUp, setCountUp] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = statsRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setCountUp(true); obs.disconnect(); } },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <>
            {/* Fixed video + fluted glass background */}
            <PageVideo />

            {/* Scrollable content sits above the fixed video */}
            <div className="relative z-10 min-h-screen text-white font-manrope selection:bg-[#7b39fc] selection:text-white overflow-x-hidden">

                {/* ── Navbar ───────────────────────────────────────────── */}
                <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 md:px-12 md:py-5">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />
                    <Link to="/" className="relative z-10 flex items-center gap-3">
                        <img src="/clubin-logo-header.webp" alt="Clubin" className="h-12 md:h-14 w-auto object-contain" width="192" height="128" />
                    </Link>
                    <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                        <Link
                            to="/clubs"
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
                        >
                            Browse Clubs
                        </Link>
                        <a
                            href={MEETING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-xs sm:text-sm font-semibold rounded-xl border border-purple-400/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                        >
                            Schedule Meeting
                        </a>
                    </div>
                </nav>

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-5 pt-28 pb-16">
                    <ScrollReveal>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-white/60 mb-6 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                            Now Onboarding Clubs
                        </span>
                    </ScrollReveal>

                    <ScrollReveal delay={100}>
                        <h1 className="font-inter font-extrabold text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.95] mb-6 max-w-5xl">
                            List Your Club
                            <br />
                            {/* Instrument Serif italic = the "No Lines No Stress" font from the landing page */}
                            <span className="font-instrument italic font-normal text-[#a484d7]">on </span>
                            <span className="font-inter font-extrabold text-[#a484d7]">Clubin</span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal delay={200}>
                        <p className="text-white/55 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-10 font-manrope font-light">
                            Reach thousands of nightlife lovers. Manage guestlists, table bookings, and events — all from one dashboard. Lowest platform fees in the industry.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={300}>
                        <a
                            href={MEETING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-base sm:text-lg font-bold rounded-2xl border border-purple-400/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/25"
                        >
                            {/* Inline calendar icon as CTA icon */}
                            <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Schedule a Meeting
                        </a>
                    </ScrollReveal>

                    {/* Scroll hint */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 animate-pulse">
                        <span className="text-[10px] uppercase tracking-widest font-bold font-manrope">Scroll to explore</span>
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M8 2v10m0 0l4-4m-4 4L4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                </section>

                {/* ── How It Works ─────────────────────────────────────── */}
                <section className="relative px-5 py-20 md:py-32">
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 font-manrope">How It Works</span>
                                <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                                    Three steps to <span className="text-[#f87b52]">go live</span>
                                </h2>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {STEPS.map((step, i) => (
                                <ScrollReveal key={i} delay={i * 150}>
                                    <div className="relative group h-full">
                                        {/* Desktop connector */}
                                        {i < STEPS.length - 1 && (
                                            <div className="hidden md:block absolute top-[4.5rem] -right-4 w-8 h-px bg-gradient-to-r from-white/20 to-transparent z-10" />
                                        )}
                                        <div className={`relative h-full p-8 rounded-[2rem] ${glass} ${glassHover} overflow-hidden`}>
                                            {/* Top glass edge highlight */}
                                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                                            {/* Accent glow */}
                                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: `${step.accent}18` }} />

                                            <div className="relative flex items-center gap-4 mb-6">
                                                {/* Step number badge */}
                                                <span className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-extrabold font-inter shrink-0" style={{ backgroundColor: `${step.accent}20`, color: step.accent }}>
                                                    {i + 1}
                                                </span>
                                                {/* Lordicon animated icon */}
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/[0.06] flex items-center justify-center group-hover:border-white/15 transition-all duration-500">
                                                    <lord-icon
                                                        src={step.lordSrc}
                                                        trigger="loop-on-hover"
                                                        colors={LORD_COLORS}
                                                        style={LORD_SIZE}
                                                    />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold font-inter mb-2">{step.title}</h3>
                                            <p className="text-white/40 text-sm leading-relaxed font-manrope">{step.desc}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Dashboard Features ───────────────────────────────── */}
                <section className="relative px-5 py-20 md:py-32">
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 font-manrope">Your Dashboard</span>
                                <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                                    Everything you need to{' '}
                                    <span className="font-instrument italic font-normal text-[#a484d7]">run your club</span>
                                </h2>
                                <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm sm:text-base font-manrope font-light">
                                    A powerful promoter panel to manage events, pricing, guestlists, and more — all from one place.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                            {FEATURES.map((feat, i) => (
                                <ScrollReveal key={i} delay={i * 100}>
                                    <div className={`group h-full p-7 rounded-[1.75rem] ${glass} ${glassHover} relative overflow-hidden`}>
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: `${feat.accent}14` }} />
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-white/15 transition-all duration-500">
                                                <lord-icon
                                                    src={feat.lordSrc}
                                                    trigger="loop-on-hover"
                                                    colors={LORD_COLORS}
                                                    style={LORD_SIZE}
                                                />
                                            </div>
                                            <h3 className="text-lg font-bold font-inter mb-2 group-hover:text-[#a484d7] transition-colors duration-300">{feat.title}</h3>
                                            <p className="text-white/35 text-sm leading-relaxed font-manrope">{feat.desc}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing / Fees ───────────────────────────────────── */}
                <section className="relative px-5 py-20 md:py-32">
                    <div className="max-w-5xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 font-manrope">Transparent Pricing</span>
                                <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                                    Lowest fees. <span className="text-[#22c55e]">Your revenue, your way.</span>
                                </h2>
                                <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm sm:text-base font-manrope font-light">
                                    We use a payment aggregator so bookings hit your account instantly. Our cut is the lowest in the industry.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Guest List card */}
                            <ScrollReveal delay={0}>
                                <div className={`relative overflow-hidden p-8 sm:p-10 rounded-[2rem] ${glass} ${glassHover}`}>
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a484d7]/25 to-transparent" />
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#7b39fc]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    <div className="relative">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#a484d7] font-manrope">Guest List</span>
                                        <div className="flex items-baseline gap-2 mt-3 mb-4">
                                            <span className="font-inter font-extrabold text-5xl sm:text-6xl tracking-tight">₹50</span>
                                            <span className="text-white/30 text-sm font-medium font-manrope">per booking</span>
                                        </div>
                                        <p className="text-white/40 text-sm leading-relaxed mb-6 font-manrope">
                                            A flat ₹50 convenience fee per guestlist booking. The rest goes directly to your account. No hidden charges.
                                        </p>
                                        <div className="flex items-center gap-2 text-[#22c55e] text-sm font-semibold font-manrope">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Instant payout to your account
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>

                            {/* Table Bookings card */}
                            <ScrollReveal delay={150}>
                                <div className={`relative overflow-hidden p-8 sm:p-10 rounded-[2rem] ${glass} ${glassHover}`}>
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f87b52]/25 to-transparent" />
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#f87b52]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    <div className="relative">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#f87b52] font-manrope">Table Bookings</span>
                                        <div className="flex items-baseline gap-2 mt-3 mb-4">
                                            <span className="font-inter font-extrabold text-5xl sm:text-6xl tracking-tight">5%</span>
                                            <span className="text-white/30 text-sm font-medium font-manrope">per booking</span>
                                        </div>
                                        <p className="text-white/40 text-sm leading-relaxed mb-6 font-manrope">
                                            Just 5% on table bookings. Our dynamic pricing algorithm maximises your table revenue — you earn more than you pay.
                                        </p>
                                        <div className="flex items-center gap-2 text-[#22c55e] text-sm font-semibold font-manrope">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Dynamic pricing included free
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>

                        <ScrollReveal delay={200}>
                            <div className="mt-8 p-6 rounded-2xl bg-[rgba(12,10,22,0.60)] backdrop-blur-xl border border-white/[0.06] text-center">
                                <p className="text-white/50 text-sm font-manrope">
                                    <span className="text-white font-semibold">Lowest platform fees in India.</span>{' '}
                                    Competitors charge 10–15% on every booking. We believe in growing together — our fees are designed so you always come out ahead.
                                </p>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* ── Why Clubin ───────────────────────────────────────── */}
                <section className="relative px-5 py-20 md:py-32" ref={statsRef}>
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-16">
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 font-manrope">Why Clubin</span>
                                <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                                    Boost your club's <span className="text-[#f87b52]">potential</span>
                                </h2>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {WHY.map((item, i) => (
                                <ScrollReveal key={i} delay={i * 150}>
                                    <div className={`group h-full p-8 rounded-[2rem] bg-gradient-to-b from-[rgba(12,10,22,0.72)] to-[rgba(8,6,18,0.85)] backdrop-blur-2xl border border-white/[0.08] ${glassHover} relative overflow-hidden`}>
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: `${item.accent}12` }} />
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-6 group-hover:border-white/15 transition-all duration-500">
                                                <lord-icon
                                                    src={item.lordSrc}
                                                    trigger="loop-on-hover"
                                                    colors={LORD_COLORS}
                                                    style={LORD_SIZE}
                                                />
                                            </div>
                                            <h3 className="text-xl font-bold font-inter mb-3" style={{ color: item.accent }}>{item.title}</h3>
                                            <p className="text-white/35 text-sm leading-relaxed font-manrope">{item.desc}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* Stats row */}
                        <ScrollReveal delay={200}>
                            <div className="mt-16 grid grid-cols-3 gap-4">
                                {[
                                    { value: '9',  label: 'Cities',          suffix: '+',  prefix: false },
                                    { value: '50', label: 'Convenience Fee', suffix: '₹',  prefix: true  },
                                    { value: '5',  label: 'Table Fee',       suffix: '%',  prefix: false },
                                ].map((stat, i) => (
                                    <div key={i} className="text-center p-6 rounded-2xl bg-[rgba(12,10,22,0.60)] backdrop-blur-xl border border-white/[0.06]">
                                        <div className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-white">
                                            {countUp ? (
                                                <>
                                                    {stat.prefix && stat.suffix}
                                                    <CountUpNumber target={parseInt(stat.value)} duration={1500} />
                                                    {!stat.prefix && stat.suffix}
                                                </>
                                            ) : (
                                                <span className="text-white/10">—</span>
                                            )}
                                        </div>
                                        <span className="text-white/30 text-xs sm:text-sm font-medium mt-1 block font-manrope">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* ── Final CTA ────────────────────────────────────────── */}
                <section className="relative px-5 py-20 md:py-32">
                    <ScrollReveal>
                        <div className="max-w-3xl mx-auto text-center relative overflow-hidden p-10 sm:p-14 rounded-[2.5rem] bg-gradient-to-b from-[rgba(85,60,130,0.45)] to-[rgba(8,6,18,0.85)] border border-[rgba(164,132,215,0.22)] backdrop-blur-2xl">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a484d7]/35 to-transparent" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[180px] bg-[#7b39fc]/12 rounded-full blur-[80px] pointer-events-none" />
                            <div className="relative">
                                <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
                                    Let's <span className="font-instrument italic font-normal text-[#a484d7]">grow</span> together
                                </h2>
                                <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed font-manrope font-light">
                                    Join the growing network of clubs on Clubin. Schedule a quick meeting and we'll have you live within 48 hours.
                                </p>
                                <a
                                    href={MEETING_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3 px-8 py-4 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-base sm:text-lg font-bold rounded-2xl border border-purple-400/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/25"
                                >
                                    <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    Schedule a Meeting
                                </a>
                                <p className="text-white/20 text-xs mt-6 font-manrope">Free to get started. No commitment required.</p>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ── Footer ───────────────────────────────────────────── */}
                <footer className="border-t border-white/5 px-5 py-8 text-center">
                    <Link to="/" className="inline-block mb-4">
                        <img src="/clubin-logo-header.webp" alt="Clubin" className="h-10 w-auto mx-auto opacity-60 hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-white/20 text-xs font-manrope">© {new Date().getFullYear()} Clubin. All rights reserved.</p>
                    {/* Lordicon attribution (required for free tier) */}
                    <a href="https://lordicon.com" target="_blank" rel="noopener noreferrer" className="text-white/10 text-[10px] font-manrope mt-1 inline-block hover:text-white/20 transition-colors">
                        Icons by Lordicon
                    </a>
                </footer>
            </div>
        </>
    );
}

// ─── Count-Up Number Animation ────────────────────────────────────────────────

function CountUpNumber({ target, duration }: { target: number; duration: number }) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        const start = performance.now();
        function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }, [target, duration]);
    return <>{value}</>;
}
