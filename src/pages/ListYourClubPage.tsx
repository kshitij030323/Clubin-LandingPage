import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import {
    CalendarCheck,
    MonitorCog,
    Rocket,
    LineChart,
    Share2,
    ScanLine,
    BellRing,
    IndianRupee,
    WalletCards,
    Users,
    TrendingUp
} from 'lucide-react';
import { Footer } from '../components/Footer';

// ─── Background Video with Scratch-Built Fluted Glass ──────────────────────────

const VIDEO_SRC = 'https://pub-8cd3bcf3be92492690608c810aba8e95.r2.dev/AI%20Upscaler-2K-abstract_objects_new.mp4';
const FLUTE_COUNT_DESKTOP = 24;
const FLUTE_COUNT_MOBILE = 8; // Wider strips on mobile

function PageVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.src = VIDEO_SRC;
        video.play().then(() => setIsPlaying(true)).catch(() => { });
    }, []);

    const FlutedStrip = ({ i }: { i: number }) => (
        <div className="flex-1 h-full relative" style={{ marginRight: '-1px' }}>
            <div className={`absolute inset-0 backdrop-blur-md ${i % 2 === 0 ? 'bg-white/[0.005]' : 'bg-transparent'}`} />
            {/* Creating gradient blur using a mask over a heavily blurred layer */}
            <div className="absolute inset-0 backdrop-blur-2xl [mask-image:linear-gradient(to_right,transparent_0%,black_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_100%)] flex-1 h-full z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.015] via-transparent to-black/[0.1] border-r border-white/5 shadow-[inset_1px_0_1px_rgba(255,255,255,0.03),inset_-1px_0_2px_rgba(0,0,0,0.2)] z-20 pointer-events-none" />
        </div>
    );

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
                className="absolute inset-0 z-0 w-full h-full object-cover scale-[1.02]"
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

            {/* Dark overlay for a premium moody look deeper than before */}
            <div className="absolute inset-0 bg-black/70 z-20 pointer-events-none" />

            {/* Ambient Multi-colored Glows matching landing page */}
            <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[160px] pointer-events-none z-30" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none z-30" />
            <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-orange-900/10 rounded-full blur-[120px] pointer-events-none z-30" />

            {/* Completely reimagined fluted glass from scratch */}
            <div className="absolute inset-0 z-30 hidden md:flex pointer-events-none scale-[1.01]">
                {Array.from({ length: FLUTE_COUNT_DESKTOP }).map((_, i) => <FlutedStrip key={i} i={i} />)}
            </div>
            <div className="absolute inset-0 z-30 flex md:hidden pointer-events-none scale-[1.01]">
                {Array.from({ length: FLUTE_COUNT_MOBILE }).map((_, i) => <FlutedStrip key={i} i={i} />)}
            </div>
        </div>
    );
}

// ─── ScrollReveal ─────────────────────────────────────────────────────────────

function ScrollReveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
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
            className={`transition-all duration-1000 ease-out transform-gpu ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-95'} ${className}`}
            style={{ transitionDelay: `${delay}ms`, willChange: visible ? 'auto' : 'transform, opacity' }}
        >
            {children}
        </div>
    );
}

// ─── Custom Animated Lucide Icons ────────────────────────────────────────────

function AnimatedIcon({ Icon, color }: { Icon: any; color: string }) {
    return (
        <div className="relative group w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/[0.06] flex items-center justify-center transition-all duration-700 hover:border-white/20 hover:scale-[1.12] hover:-translate-y-1 shadow-xl overflow-hidden mb-6 z-10">
            {/* Soft background glow on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700 blur-xl" style={{ backgroundColor: color }} />
            {/* Shiny gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* The icon itself with a drop shadow */}
            <Icon
                className="w-7 h-7 relative z-10 transition-all duration-700 group-hover:scale-[1.15]"
                color={color}
                strokeWidth={1.5}
                style={{ filter: `drop-shadow(0 0 10px ${color}80)` }}
            />
        </div>
    );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
    { Icon: CalendarCheck, title: 'Schedule a Meeting', desc: 'Book a quick call with our partnerships team via Google Calendar. We\'ll understand your venue and goals.', accent: '#a484d7' },
    { Icon: MonitorCog, title: 'Onboard to Clubin', desc: 'We set up your club dashboard, configure pricing, and train your team — all within 48 hours.', accent: '#7b39fc' },
    { Icon: Rocket, title: 'Go Live on Clubin', desc: 'Your club and events are live on the Clubin app, instantly visible to thousands of nightlife enthusiasts.', accent: '#f87b52' },
];

const FEATURES = [
    { Icon: LineChart, title: 'Revenue Metrics', desc: 'Track bookings, revenue, footfall, and growth trends in real time with a clean analytics dashboard.', accent: '#7b39fc' },
    { Icon: Share2, title: 'Social Share Links', desc: 'Generate beautiful share links for your events. One tap to post on Instagram, WhatsApp, or anywhere.', accent: '#a484d7' },
    { Icon: ScanLine, title: 'Scanner Portal', desc: 'Secure QR-based entry system. Your door team scans tickets in seconds — no paper lists, no confusion.', accent: '#22c55e' },
    { Icon: BellRing, title: 'Push Notifications', desc: 'Send targeted notifications to nightlife lovers in your area. Fill your venue before doors even open.', accent: '#f87b52' },
    { Icon: TrendingUp, title: 'Dynamic Pricing', desc: 'Our algorithm adjusts table prices based on demand, maximising your revenue on peak nights.', accent: '#6366f1' },
    { Icon: WalletCards, title: 'Instant Payouts', desc: 'Ticket and booking payments land directly in your account via our payment aggregator. No delays.', accent: '#22c55e' },
];

const WHY = [
    { Icon: Users, title: 'Reach a Young Audience', desc: 'Connect with the next generation of nightlife lovers. Our user base is 18–30, digitally native, and ready to party.', accent: '#a484d7' },
    { Icon: TrendingUp, title: 'Maximize Revenue', desc: 'Our algorithm adjusts table prices based on demand, day of week, and event hype — so you never leave money on the table.', accent: '#7b39fc' },
    { Icon: IndianRupee, title: 'Instant Settlements', desc: 'No waiting for payouts. Every booking goes directly to your account minus our small fee. Powered by reliable payment tech.', accent: '#f87b52' },
];

const MEETING_URL = 'https://calendar.google.com/calendar/u/0/r/eventedit?text=Clubin+Club+Partnership+Meeting&details=Meeting+to+discuss+listing+your+club+on+Clubin+app.&location=Google+Meet';

// ─── Glass card class helpers ─────────────────────────────────────────────────

const glass = 'bg-[rgba(12,10,22,0.65)] backdrop-blur-[40px] border border-white/[0.06]';
const glassHover = 'hover:border-white/[0.12] hover:bg-[rgba(18,15,30,0.75)] hover:shadow-2xl hover:shadow-[#a484d7]/10 hover:-translate-y-2 transition-all duration-700 ease-out';

// ─── Component ────────────────────────────────────────────────────────────────

export function ListYourClubPage() {
    useSEO({
        title: 'List Your Club on Clubin - Partner With Us | Clubin',
        description: 'Partner with Clubin to list your nightclub, manage guestlists, table bookings, and reach a young nightlife audience across India. Lowest platform fees. Schedule a meeting today.',
        url: 'https://clubin.co.in/list-your-club',
        structuredData: [
            {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: 'List Your Club on Clubin',
                description: 'Partner with Clubin to list your nightclub and manage events, guestlists, and table bookings.',
                url: 'https://clubin.co.in/list-your-club',
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
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
            {/* Global style injections to ensure fonts load exactly like the App.tsx landing page */}
            <style>{`
                .font-manrope { font-family: 'Manrope', sans-serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                .font-instrument { font-family: 'Instrument Serif', serif; }
            `}</style>

            {/* Fixed video + fluted glass background */}
            <PageVideo />

            {/* Scrollable content sits above the fixed video */}
            <div className="relative z-10 min-h-screen text-white font-manrope selection:bg-[#7b39fc] selection:text-white overflow-x-hidden">

                {/* ── Navbar ───────────────────────────────────────────── */}
                <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                    <Link to="/" className="relative z-10 flex items-center gap-3">
                        <img
                            src="/clubin-logo-header.webp"
                            alt="Clubin"
                            className="h-14 w-auto md:h-16 object-contain drop-shadow-lg"
                            width="192"
                            height="128"
                            fetchPriority="high"
                        />
                    </Link>
                    <div className="relative z-10 flex items-center gap-2 sm:gap-4">
                        <Link
                            to="/clubs"
                            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm hidden sm:block shadow-sm"
                        >
                            Browse Clubs
                        </Link>
                        <a
                            href={MEETING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-xs sm:text-sm font-semibold rounded-xl border border-purple-400/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                        >
                            Schedule Meeting
                        </a>
                    </div>
                </nav>

                {/* ── Hero ─────────────────────────────────────────────── */}
                {/* Removed extra pt padding, matched landing page min-h and flex layout */}
                <section className="relative px-6 md:px-12 min-h-[95vh] flex flex-col justify-center items-center text-center max-w-5xl mx-auto mb-20 pt-20">
                    <ScrollReveal>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-[#a484d7] mb-8 backdrop-blur-md shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#a484d7] animate-pulse drop-shadow-[0_0_8px_rgba(164,132,215,0.8)]" />
                            Now Onboarding Clubs
                        </span>
                    </ScrollReveal>

                    <ScrollReveal delay={150}>
                        {/* Matching exact typography from the landing page H1 */}
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-inter font-extrabold tracking-tighter text-white mb-6 drop-shadow-2xl leading-[1.05]">
                            List Your Club<br />
                            <span className="font-instrument italic font-normal text-[#a484d7]">on</span>{' '}
                            <span className="text-[#a484d7]">Clubin.</span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal delay={300}>
                        <p className="text-xl md:text-2xl font-manrope text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-md">
                            Reach thousands of nightlife lovers. Manage guestlists, table bookings, and events — all from one dashboard.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={450}>
                        <a
                            href={MEETING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-base sm:text-lg font-bold rounded-2xl border border-purple-400/40 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/25"
                        >
                            <CalendarCheck className="w-5 h-5 text-white/90" strokeWidth={2.5} />
                            Schedule a Meeting
                        </a>
                    </ScrollReveal>

                    {/* Scroll hint aligned with landing page */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-pulse">
                        <span className="text-[11px] uppercase tracking-[0.2em] font-bold font-manrope">Scroll to explore</span>
                        <svg className="w-4 h-4 text-white/60" viewBox="0 0 16 16" fill="none"><path d="M8 2v10m0 0l4-4m-4 4L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                </section>

                {/* ── How It Works ─────────────────────────────────────── */}
                <section className="relative px-6 py-24 md:py-32">
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-20">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#f87b52] font-manrope">How It Works</span>
                                {/* Exact typography match for sections */}
                                <h2 className="text-4xl md:text-6xl font-inter font-bold tracking-tight mt-4">
                                    Three steps to <span className="font-instrument italic font-normal text-[#f87b52]">go live.</span>
                                </h2>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {STEPS.map((step, i) => (
                                <ScrollReveal key={i} delay={i * 150} className="h-full">
                                    <div className="relative group h-full">
                                        {/* Desktop connector line */}
                                        {i < STEPS.length - 1 && (
                                            <div className="hidden md:block absolute top-[5rem] -right-4 w-8 h-px bg-gradient-to-r from-white/20 to-transparent z-10" />
                                        )}
                                        <div className={`relative h-full p-8 rounded-[2.5rem] ${glass} ${glassHover} overflow-hidden group`}>
                                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            {/* Accent glow on hover */}
                                            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" style={{ backgroundColor: `${step.accent}25` }} />

                                            <div className="relative flex items-center gap-4 mb-6">
                                                <span className="flex items-center justify-center w-10 h-10 rounded-full text-base font-extrabold font-inter shrink-0 bg-white/5 border border-white/10" style={{ color: step.accent }}>
                                                    {i + 1}
                                                </span>
                                            </div>

                                            <AnimatedIcon Icon={step.Icon} color={step.accent} />

                                            <h3 className="text-2xl font-bold font-inter mb-3 leading-tight">{step.title}</h3>
                                            <p className="text-white/50 text-base leading-relaxed font-manrope font-light">{step.desc}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Dashboard Features ───────────────────────────────── */}
                <section className="relative px-6 py-24 md:py-32 bg-gradient-to-b from-transparent via-[#0a0812]/50 to-transparent">
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-20">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#a484d7] font-manrope">Your Dashboard</span>
                                <h2 className="text-4xl md:text-6xl font-inter font-bold tracking-tight mt-4">
                                    Everything you need to{' '}
                                    <span className="font-instrument italic font-normal text-[#a484d7]">run your club.</span>
                                </h2>
                                <p className="text-xl font-manrope text-white/50 max-w-2xl mx-auto mt-6 leading-relaxed font-light">
                                    A powerful promoter panel to manage events, pricing, guestlists, and more — all from one place.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {FEATURES.map((feat, i) => (
                                <ScrollReveal key={i} delay={(i % 3) * 100} className="h-full">
                                    <div className={`group h-full p-8 rounded-[2rem] ${glass} ${glassHover} relative overflow-hidden flex flex-col`}>
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: `${feat.accent}20` }} />

                                        <AnimatedIcon Icon={feat.Icon} color={feat.accent} />

                                        <h3 className="text-xl font-bold font-inter mb-3 mt-auto group-hover:text-white transition-colors duration-300 relative z-10">{feat.title}</h3>
                                        <p className="text-white/50 text-sm leading-relaxed font-manrope font-light relative z-10">{feat.desc}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing / Fees ───────────────────────────────────── */}
                <section className="relative px-6 py-24 md:py-32">
                    <div className="max-w-5xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-20">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#22c55e] font-manrope">Transparent Pricing</span>
                                <h2 className="text-4xl md:text-6xl font-inter font-bold tracking-tight mt-4">
                                    Lowest fees. <span className="font-instrument italic font-normal text-[#22c55e]">Your revenue.</span>
                                </h2>
                                <p className="text-xl font-manrope text-white/50 max-w-2xl mx-auto mt-6 leading-relaxed font-light">
                                    We use a reliable payment aggregator so bookings hit your account instantly. Our cut is the lowest in the industry.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ScrollReveal delay={0}>
                                <div className={`relative overflow-hidden p-10 md:p-12 rounded-[2.5rem] bg-gradient-to-b from-[rgba(12,10,22,0.8)] to-[rgba(18,15,30,0.9)] backdrop-blur-3xl border border-white/[0.08] hover:border-[#a484d7]/30 transition-all duration-700 hover:shadow-2xl hover:shadow-[#a484d7]/10 hover:-translate-y-2`}>
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a484d7]/50 to-transparent" />
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b39fc]/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                                    <div className="relative z-10">
                                        <span className="inline-block px-4 py-2 rounded-full border border-[#a484d7]/30 bg-[#a484d7]/10 text-xs font-bold uppercase tracking-widest text-[#a484d7] font-manrope mb-8">Guest List</span>
                                        <div className="flex items-baseline gap-2 mb-6">
                                            <span className="font-inter font-extrabold text-6xl tracking-tighter text-white">₹50</span>
                                            <span className="text-white/40 text-base font-medium font-manrope">per booking</span>
                                        </div>
                                        <p className="text-white/60 text-base leading-relaxed mb-8 font-manrope font-light">
                                            A flat ₹50 convenience fee per guestlist booking. The rest goes directly to your account. No hidden charges.
                                        </p>
                                        <ul className="space-y-4">
                                            {[
                                                'Instant payout to your account',
                                                'Unlimited events & guests',
                                                'Free scanner app included'
                                            ].map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-3 text-white/80 text-sm font-medium font-manrope">
                                                    <div className="w-6 h-6 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                                                        <svg className="w-3.5 h-3.5 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </ScrollReveal>

                            <ScrollReveal delay={150}>
                                <div className={`relative overflow-hidden p-10 md:p-12 rounded-[2.5rem] bg-gradient-to-b from-[rgba(12,10,22,0.8)] to-[rgba(18,15,30,0.9)] backdrop-blur-3xl border border-white/[0.08] hover:border-[#f87b52]/30 transition-all duration-700 hover:shadow-2xl hover:shadow-[#f87b52]/10 hover:-translate-y-2`}>
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f87b52]/50 to-transparent" />
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#f87b52]/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

                                    <div className="relative z-10">
                                        <span className="inline-block px-4 py-2 rounded-full border border-[#f87b52]/30 bg-[#f87b52]/10 text-xs font-bold uppercase tracking-widest text-[#f87b52] font-manrope mb-8">Table Bookings</span>
                                        <div className="flex items-baseline gap-2 mb-6">
                                            <span className="font-inter font-extrabold text-6xl tracking-tighter text-white">5%</span>
                                            <span className="text-white/40 text-base font-medium font-manrope">per booking</span>
                                        </div>
                                        <p className="text-white/60 text-base leading-relaxed mb-8 font-manrope font-light">
                                            Just 5% on table bookings. Our dynamic pricing algorithm maximises your table revenue — you earn more than you pay.
                                        </p>
                                        <ul className="space-y-4">
                                            {[
                                                'Dynamic pricing included free',
                                                'Automated inventory tracking',
                                                'Direct VIP customer support'
                                            ].map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-3 text-white/80 text-sm font-medium font-manrope">
                                                    <div className="w-6 h-6 rounded-full bg-[#f87b52]/10 flex items-center justify-center">
                                                        <svg className="w-3.5 h-3.5 text-[#f87b52]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>

                        <ScrollReveal delay={300}>
                            <div className="mt-8 p-6 md:p-8 rounded-[2rem] bg-gradient-to-r from-white/[0.03] to-white/[0.01] backdrop-blur-xl border border-white/[0.06] text-center flex flex-col md:flex-row items-center justify-center gap-4">
                                <div className="p-3 rounded-full bg-white/5 border border-white/10 shrink-0">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-white/60 text-base font-manrope font-light md:text-left">
                                    <span className="text-white font-semibold">Lowest platform fees in India.</span>{' '}
                                    Competitors charge 10–15% on every booking. We believe in growing together.
                                </p>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* ── Why Clubin ───────────────────────────────────────── */}
                <section className="relative px-6 py-24 md:py-32" ref={statsRef}>
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-20">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 font-manrope">Growth Partner</span>
                                <h2 className="text-4xl md:text-6xl font-inter font-bold tracking-tight mt-4">
                                    Boost your club's <span className="font-instrument italic font-normal text-white">potential.</span>
                                </h2>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {WHY.map((item, i) => (
                                <ScrollReveal key={i} delay={i * 150} className="h-full">
                                    <div className={`group h-full p-8 rounded-[2rem] ${glass} ${glassHover} relative overflow-hidden flex flex-col`}>
                                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ backgroundColor: `${item.accent}20` }} />

                                        <AnimatedIcon Icon={item.Icon} color={item.accent} />

                                        <h3 className="text-2xl font-bold font-inter mb-3 mt-auto" style={{ color: item.accent }}>{item.title}</h3>
                                        <p className="text-white/50 text-base leading-relaxed font-manrope font-light relative z-10">{item.desc}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* Stats row */}
                        <ScrollReveal delay={300}>
                            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { value: '9', label: 'Cities Live', suffix: '+', prefix: false },
                                    { value: '50', label: 'Flat Booking Fee', suffix: '₹', prefix: true },
                                    { value: '5', label: 'Max Table Fee', suffix: '%', prefix: false },
                                ].map((stat, i) => (
                                    <div key={i} className={`p-8 rounded-[2rem] ${glass} text-center flex flex-col items-center justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform`}>
                                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="font-inter font-extrabold text-5xl md:text-6xl tracking-tighter text-white mb-2">
                                            {countUp ? (
                                                <>
                                                    {stat.prefix && <span className="text-3xl font-bold text-white/50 mr-1">{stat.suffix}</span>}
                                                    <CountUpNumber target={parseInt(stat.value)} duration={2000} />
                                                    {!stat.prefix && <span className="text-3xl font-bold text-[#f87b52] ml-1">{stat.suffix}</span>}
                                                </>
                                            ) : (
                                                <span className="text-white/10">—</span>
                                            )}
                                        </div>
                                        <span className="text-white/50 text-sm font-semibold uppercase tracking-wider font-manrope">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* ── Final CTA ────────────────────────────────────────── */}
                <section className="relative px-6 py-24 md:py-32 mb-10">
                    <ScrollReveal>
                        <div className="max-w-4xl mx-auto text-center relative overflow-hidden py-16 px-8 sm:p-20 rounded-[3rem] bg-gradient-to-b from-[#1b152e]/80 to-[rgba(8,6,18,0.95)] border border-[rgba(164,132,215,0.2)] backdrop-blur-3xl shadow-2xl">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a484d7]/50 to-transparent" />
                            {/* Inner ambient glows purely for the CTA */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative z-10">
                                <h2 className="text-5xl md:text-7xl font-inter font-extrabold tracking-tighter mb-6 text-white drop-shadow-lg">
                                    Let's <span className="font-instrument italic font-normal text-[#a484d7]">grow</span> together.
                                </h2>
                                <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed font-manrope font-light">
                                    Join the premium network of clubs on Clubin. Schedule a quick meeting and we'll have you live within 48 hours.
                                </p>
                                <a
                                    href={MEETING_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-3 px-10 py-5 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-lg font-bold rounded-2xl border border-purple-400/40 transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-purple-500/30"
                                >
                                    <CalendarCheck className="w-6 h-6 text-white/90" strokeWidth={2.5} />
                                    Schedule a Meeting
                                </a>
                                <p className="text-white/40 text-sm mt-8 font-manrope flex items-center justify-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                                    Free to get started. No commitment required.
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>
                </section>

                {/* ── Footer ───────────────────────────────────────────── */}
                <Footer />
            </div>
        </>
    );
}

// ─── Count-Up Number Animation ────────────────────────────────────────────────

function CountUpNumber({ target, duration }: { target: number; duration: number }) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let frame: number;
        const start = performance.now();
        function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            // ease-out expo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setValue(Math.round(eased * target));
            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        }
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);
    return <>{value}</>;
}
