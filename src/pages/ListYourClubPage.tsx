import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

// ─── ScrollReveal (same pattern as App.tsx) ──────────────────────────────────

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

// ─── Animated SVG Icons ──────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none">
                <animate attributeName="stroke-dasharray" from="0 200" to="200 0" dur="1.2s" fill="freeze" />
            </rect>
            <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2.5">
                <animate attributeName="x2" from="6" to="42" dur="0.8s" begin="0.4s" fill="freeze" />
            </line>
            <line x1="16" y1="6" x2="16" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="32" y1="6" x2="32" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="28" r="2" fill="currentColor"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.8s" fill="freeze" /></circle>
            <circle cx="24" cy="28" r="2" fill="currentColor"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.9s" fill="freeze" /></circle>
            <circle cx="32" cy="28" r="2" fill="currentColor"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.0s" fill="freeze" /></circle>
            <circle cx="16" cy="36" r="2" fill="currentColor"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.1s" fill="freeze" /></circle>
            <circle cx="24" cy="36" r="2" fill="currentColor"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.2s" fill="freeze" /></circle>
        </svg>
    );
}

function OnboardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="4" width="32" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <line x1="16" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="x2" from="16" to="32" dur="0.5s" begin="0.3s" fill="freeze" />
            </line>
            <line x1="16" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="x2" from="16" to="28" dur="0.5s" begin="0.5s" fill="freeze" />
            </line>
            <line x1="16" y1="28" x2="24" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="x2" from="16" to="24" dur="0.5s" begin="0.7s" fill="freeze" />
            </line>
            <polyline points="16,36 20,40 32,28" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur="0.6s" begin="1s" fill="freeze" />
            </polyline>
        </svg>
    );
}

function RocketIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C24 4 14 14 14 28L20 34L28 34L34 28C34 14 24 4 24 4Z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round">
                <animateTransform attributeName="transform" type="translate" from="0 8" to="0 0" dur="0.8s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" />
            </path>
            <circle cx="24" cy="20" r="3" fill="currentColor">
                <animate attributeName="r" from="0" to="3" dur="0.4s" begin="0.6s" fill="freeze" />
            </circle>
            <line x1="14" y1="36" x2="20" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.9s" fill="freeze" />
            </line>
            <line x1="34" y1="36" x2="28" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.9s" fill="freeze" />
            </line>
            {/* Exhaust flames */}
            <path d="M20 34 L24 44 L28 34" stroke="#f87b52" strokeWidth="2" fill="none" strokeLinejoin="round">
                <animate attributeName="opacity" values="0;1;0.5;1" dur="1.5s" begin="1s" repeatCount="indefinite" />
            </path>
        </svg>
    );
}

function ChartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="12" y="28" width="5" height="10" rx="1" fill="#7b39fc"><animate attributeName="height" from="0" to="10" dur="0.5s" begin="0.3s" fill="freeze" /><animate attributeName="y" from="38" to="28" dur="0.5s" begin="0.3s" fill="freeze" /></rect>
            <rect x="21.5" y="20" width="5" height="18" rx="1" fill="#a484d7"><animate attributeName="height" from="0" to="18" dur="0.5s" begin="0.5s" fill="freeze" /><animate attributeName="y" from="38" to="20" dur="0.5s" begin="0.5s" fill="freeze" /></rect>
            <rect x="31" y="14" width="5" height="24" rx="1" fill="#f87b52"><animate attributeName="height" from="0" to="24" dur="0.5s" begin="0.7s" fill="freeze" /><animate attributeName="y" from="38" to="14" dur="0.5s" begin="0.7s" fill="freeze" /></rect>
        </svg>
    );
}

function ShareIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="12" r="5" stroke="currentColor" strokeWidth="2.5" fill="none"><animate attributeName="r" from="0" to="5" dur="0.4s" fill="freeze" /></circle>
            <circle cx="12" cy="24" r="5" stroke="currentColor" strokeWidth="2.5" fill="none"><animate attributeName="r" from="0" to="5" dur="0.4s" begin="0.2s" fill="freeze" /></circle>
            <circle cx="36" cy="36" r="5" stroke="currentColor" strokeWidth="2.5" fill="none"><animate attributeName="r" from="0" to="5" dur="0.4s" begin="0.4s" fill="freeze" /></circle>
            <line x1="16" y1="22" x2="32" y2="14" stroke="currentColor" strokeWidth="2"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.5s" fill="freeze" /></line>
            <line x1="16" y1="26" x2="32" y2="34" stroke="currentColor" strokeWidth="2"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.6s" fill="freeze" /></line>
        </svg>
    );
}

function ScanIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* QR corner brackets */}
            <path d="M6 16V10C6 7.79 7.79 6 10 6H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 6H38C40.21 6 42 7.79 42 10V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M42 32V38C42 40.21 40.21 42 38 42H32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 42H10C7.79 42 6 40.21 6 38V32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            {/* Scan line */}
            <line x1="10" y1="24" x2="38" y2="24" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                <animateTransform attributeName="transform" type="translate" values="0 -8;0 8;0 -8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
            </line>
            {/* QR dots */}
            <rect x="14" y="14" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
            <rect x="28" y="14" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
            <rect x="14" y="28" width="6" height="6" rx="1" fill="currentColor" opacity="0.3" />
            <rect x="21" y="21" width="6" height="6" rx="1" fill="currentColor" opacity="0.2" />
        </svg>
    );
}

function BellIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4C24 4 12 8 12 22V32L8 36H40L36 32V22C36 8 24 4 24 4Z" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round">
                <animateTransform attributeName="transform" type="rotate" values="0 24 4;8 24 4;-8 24 4;4 24 4;-4 24 4;0 24 4" dur="1.5s" begin="0.5s" fill="freeze" />
            </path>
            <circle cx="24" cy="42" r="3" fill="currentColor"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.8s" fill="freeze" /></circle>
            {/* Notification dot */}
            <circle cx="34" cy="10" r="4" fill="#f87b52"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" /></circle>
        </svg>
    );
}

function WalletIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="12" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none">
                <animate attributeName="stroke-dasharray" from="0 200" to="200 0" dur="0.8s" fill="freeze" />
            </rect>
            <path d="M4 16L44 16" stroke="currentColor" strokeWidth="2" />
            <rect x="30" y="24" width="10" height="8" rx="2" fill="currentColor" opacity="0.2"><animate attributeName="opacity" from="0" to="0.2" dur="0.3s" begin="0.6s" fill="freeze" /></rect>
            <circle cx="35" cy="28" r="2" fill="#22c55e"><animate attributeName="r" from="0" to="2" dur="0.3s" begin="0.8s" fill="freeze" /></circle>
            {/* Coins flowing in */}
            <circle cx="14" cy="26" r="3" stroke="#f87b52" strokeWidth="1.5" fill="none"><animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" /><animateTransform attributeName="transform" type="translate" values="0 8;0 0;0 -4" dur="2s" begin="1s" repeatCount="indefinite" /></circle>
            <circle cx="22" cy="26" r="3" stroke="#a484d7" strokeWidth="1.5" fill="none"><animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.3s" repeatCount="indefinite" /><animateTransform attributeName="transform" type="translate" values="0 8;0 0;0 -4" dur="2s" begin="1.3s" repeatCount="indefinite" /></circle>
        </svg>
    );
}

function DynamicPriceIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <text x="24" y="30" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="bold" fontFamily="Inter, sans-serif">₹</text>
            {/* Arrows indicating dynamic */}
            <path d="M38 14L42 10L46 14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M2 34L6 38L10 34" stroke="#f87b52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
            </path>
        </svg>
    );
}

function GrowthIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="4,40 16,28 24,32 44,8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <animate attributeName="stroke-dasharray" from="0 100" to="100 0" dur="1.5s" fill="freeze" />
            </polyline>
            <polyline points="34,8 44,8 44,18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.2s" fill="freeze" />
            </polyline>
            {/* Sparkle */}
            <circle cx="44" cy="8" r="3" fill="#f87b52">
                <animate attributeName="r" values="2;4;2" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" begin="1.5s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS = [
    {
        icon: CalendarIcon,
        title: 'Schedule a Meeting',
        desc: "Book a quick call with our partnerships team via Google Calendar. We'll understand your venue and goals.",
        accent: '#a484d7',
    },
    {
        icon: OnboardIcon,
        title: 'Onboard to Clubin',
        desc: 'We set up your club dashboard, configure pricing, and train your team — all within 48 hours.',
        accent: '#7b39fc',
    },
    {
        icon: RocketIcon,
        title: 'Go Live on Clubin',
        desc: 'Your club and events are live on the Clubin app, instantly visible to thousands of nightlife enthusiasts.',
        accent: '#f87b52',
    },
];

const FEATURES = [
    {
        icon: ChartIcon,
        title: 'Revenue Metrics Dashboard',
        desc: 'Track bookings, revenue, footfall, and growth trends in real time with a clean analytics dashboard.',
    },
    {
        icon: ShareIcon,
        title: 'Social Media Share Links',
        desc: 'Generate beautiful share links for your events. One tap to post on Instagram, WhatsApp, or anywhere.',
    },
    {
        icon: ScanIcon,
        title: 'Scanner Portal',
        desc: 'Secure QR-based entry system. Your door team scans tickets in seconds — no paper lists, no confusion.',
    },
    {
        icon: BellIcon,
        title: 'Push Notifications',
        desc: 'Send targeted notifications to nightlife lovers in your area. Fill your venue before doors even open.',
    },
    {
        icon: DynamicPriceIcon,
        title: 'Dynamic Table Pricing',
        desc: 'Our algorithm adjusts table prices based on demand, maximizing your revenue on peak nights.',
    },
    {
        icon: WalletIcon,
        title: 'Instant Payouts',
        desc: 'Ticket and booking payments land directly in your account via our payment aggregator. No delays.',
    },
];

const MEETING_URL = 'https://calendar.google.com/calendar/u/0/r/eventedit?text=Clubin+Club+Partnership+Meeting&details=Meeting+to+discuss+listing+your+club+on+Clubin+app.&location=Google+Meet';

// ─── Component ───────────────────────────────────────────────────────────────

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
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope selection:bg-[#7b39fc] selection:text-white">
            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 md:px-12 md:py-5">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pointer-events-none" />
                <Link to="/" className="relative z-10 flex items-center gap-3">
                    <img src="/clubin-logo-header.webp" alt="Clubin" className="h-12 md:h-14 w-auto object-contain" width="192" height="128" />
                </Link>
                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                    <Link
                        to="/clubs"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
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

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-5 pt-28 pb-16 overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7b39fc]/15 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-[#f87b52]/10 rounded-full blur-[100px]" />
                </div>

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
                        <span className="font-instrument italic font-normal text-[#a484d7]">on Clubin</span>
                    </h1>
                </ScrollReveal>

                <ScrollReveal delay={200}>
                    <p className="text-white/50 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
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
                        <CalendarIcon className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                        Schedule a Meeting
                    </a>
                </ScrollReveal>

                {/* Scroll hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 animate-pulse">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Scroll to explore</span>
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M8 2v10m0 0l4-4m-4 4L4 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
            </section>

            {/* ── How It Works ───────────────────────────────────────────── */}
            <section className="relative px-5 py-20 md:py-32 max-w-6xl mx-auto">
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">How It Works</span>
                        <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                            Three steps to <span className="text-[#f87b52]">go live</span>
                        </h2>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {STEPS.map((step, i) => (
                        <ScrollReveal key={i} delay={i * 150}>
                            <div className="relative group h-full">
                                {/* Connector line (desktop) */}
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute top-16 -right-4 md:-right-5 w-8 md:w-10 h-0.5 bg-gradient-to-r from-white/20 to-transparent z-10" />
                                )}
                                <div className="h-full p-8 rounded-[2rem] bg-[#120f1d]/80 backdrop-blur-2xl border border-white/5 hover:border-white/15 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/5 group-hover:-translate-y-1">
                                    {/* Step number */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-extrabold" style={{ backgroundColor: `${step.accent}20`, color: step.accent }}>
                                            {i + 1}
                                        </span>
                                        <step.icon className="w-10 h-10 text-white/60 group-hover:text-white transition-colors duration-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                    <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </section>

            {/* ── Club Dashboard Features ────────────────────────────────── */}
            <section className="relative px-5 py-20 md:py-32">
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#7b39fc]/8 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-6xl mx-auto">
                    <ScrollReveal>
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Your Dashboard</span>
                            <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                                Everything you need to <span className="font-instrument italic font-normal text-[#a484d7]">run your club</span>
                            </h2>
                            <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm sm:text-base">
                                A powerful promoter panel to manage events, pricing, guestlists, and more — all from one place.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {FEATURES.map((feat, i) => (
                            <ScrollReveal key={i} delay={i * 100}>
                                <div className="group h-full p-7 rounded-[1.75rem] bg-[#120f1d]/60 backdrop-blur-xl border border-white/5 hover:border-purple-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-5 group-hover:bg-white/10 group-hover:border-white/10 transition-all duration-500">
                                        <feat.icon className="w-8 h-8 text-white/50 group-hover:text-white transition-colors duration-500" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-purple-300 transition-colors">{feat.title}</h3>
                                    <p className="text-white/35 text-sm leading-relaxed">{feat.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing / Fees ─────────────────────────────────────────── */}
            <section className="relative px-5 py-20 md:py-32 max-w-5xl mx-auto">
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Transparent Pricing</span>
                        <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                            Lowest fees. <span className="text-[#22c55e]">Your revenue, your way.</span>
                        </h2>
                        <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm sm:text-base">
                            We use a payment aggregator so bookings hit your account instantly. Our cut is the lowest in the industry.
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ScrollReveal delay={0}>
                        <div className="relative overflow-hidden p-8 sm:p-10 rounded-[2rem] bg-[#120f1d]/80 backdrop-blur-2xl border border-white/5 hover:border-purple-500/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7b39fc]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="relative">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#a484d7]">Guest List</span>
                                <div className="flex items-baseline gap-2 mt-3 mb-4">
                                    <span className="font-inter font-extrabold text-5xl sm:text-6xl tracking-tight">₹50</span>
                                    <span className="text-white/30 text-sm font-medium">per booking</span>
                                </div>
                                <p className="text-white/40 text-sm leading-relaxed mb-6">
                                    A flat ₹50 convenience fee per guestlist booking. The rest goes directly to your account. No hidden charges.
                                </p>
                                <div className="flex items-center gap-2 text-[#22c55e] text-sm font-semibold">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Instant payout to your account
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={150}>
                        <div className="relative overflow-hidden p-8 sm:p-10 rounded-[2rem] bg-[#120f1d]/80 backdrop-blur-2xl border border-white/5 hover:border-purple-500/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f87b52]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="relative">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#f87b52]">Table Bookings</span>
                                <div className="flex items-baseline gap-2 mt-3 mb-4">
                                    <span className="font-inter font-extrabold text-5xl sm:text-6xl tracking-tight">5%</span>
                                    <span className="text-white/30 text-sm font-medium">per booking</span>
                                </div>
                                <p className="text-white/40 text-sm leading-relaxed mb-6">
                                    Just 5% on table bookings. Our dynamic pricing algorithm maximizes your table revenue — you earn more than you pay.
                                </p>
                                <div className="flex items-center gap-2 text-[#22c55e] text-sm font-semibold">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Dynamic pricing included free
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                <ScrollReveal delay={200}>
                    <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                        <p className="text-white/50 text-sm">
                            <span className="text-white font-semibold">Lowest platform fees in India.</span> Competitors charge 10–15% on every booking. We believe in growing together — our fees are designed so you always come out ahead.
                        </p>
                    </div>
                </ScrollReveal>
            </section>

            {/* ── Why Clubin ─────────────────────────────────────────────── */}
            <section className="relative px-5 py-20 md:py-32 max-w-6xl mx-auto" ref={statsRef}>
                <ScrollReveal>
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Why Clubin</span>
                        <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mt-3">
                            Boost your club's <span className="text-[#f87b52]">potential</span>
                        </h2>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: GrowthIcon, title: 'Reach a Young Audience', desc: 'Connect with the next generation of nightlife lovers. Our user base is 18–30, digitally native, and ready to party.', accent: '#a484d7' },
                        { icon: DynamicPriceIcon, title: 'Dynamic Table Pricing', desc: 'Our algorithm adjusts table prices based on demand, day of week, and event hype — so you never leave money on the table.', accent: '#7b39fc' },
                        { icon: WalletIcon, title: 'Instant Settlements', desc: 'No waiting for payouts. Every booking payment goes directly to your account minus our small fee. Powered by leading payment aggregators.', accent: '#f87b52' },
                    ].map((item, i) => (
                        <ScrollReveal key={i} delay={i * 150}>
                            <div className="group h-full p-8 rounded-[2rem] bg-gradient-to-b from-[#120f1d]/80 to-[#0a0a0a] backdrop-blur-2xl border border-white/5 hover:border-white/15 transition-all duration-500 hover:-translate-y-1">
                                <item.icon className="w-12 h-12 mb-6 text-white/60 group-hover:text-white transition-colors duration-500" />
                                <h3 className="text-xl font-bold mb-3" style={{ color: item.accent }}>{item.title}</h3>
                                <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Stats row */}
                <ScrollReveal delay={200}>
                    <div className="mt-16 grid grid-cols-3 gap-4">
                        {[
                            { value: '9', label: 'Cities', suffix: '+' },
                            { value: '50', label: 'Convenience Fee', suffix: '₹', prefix: true },
                            { value: '5', label: 'Table Fee', suffix: '%' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5">
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
                                <span className="text-white/30 text-xs sm:text-sm font-medium mt-1 block">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            {/* ── Final CTA ──────────────────────────────────────────────── */}
            <section className="relative px-5 py-20 md:py-32">
                <ScrollReveal>
                    <div className="max-w-3xl mx-auto text-center p-10 sm:p-14 rounded-[2.5rem] bg-gradient-to-b from-[rgba(85,80,110,0.4)] to-[#0a0a0a] border border-[rgba(164,132,215,0.3)] backdrop-blur-xl">
                        <h2 className="font-inter font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
                            Let's <span className="font-instrument italic font-normal text-[#a484d7]">grow</span> together
                        </h2>
                        <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
                            Join the growing network of clubs on Clubin. Schedule a quick meeting and we'll have you live within 48 hours.
                        </p>
                        <a
                            href={MEETING_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-base sm:text-lg font-bold rounded-2xl border border-purple-400/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/25"
                        >
                            <CalendarIcon className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                            Schedule a Meeting
                        </a>
                        <p className="text-white/20 text-xs mt-6">Free to get started. No commitment required.</p>
                    </div>
                </ScrollReveal>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="border-t border-white/5 px-5 py-8 text-center">
                <Link to="/" className="inline-block mb-4">
                    <img src="/clubin-logo-header.webp" alt="Clubin" className="h-10 w-auto mx-auto opacity-60 hover:opacity-100 transition-opacity" />
                </Link>
                <p className="text-white/20 text-xs">© {new Date().getFullYear()} Clubin. All rights reserved.</p>
            </footer>
        </div>
    );
}

// ─── Count-Up Number Animation ───────────────────────────────────────────────

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
