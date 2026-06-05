import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { Footer } from '../components/Footer';

// ─── Shared Background Video with Scratch-Built Fluted Glass ────────────────

const VIDEO_SRC = 'https://pub-8cd3bcf3be92492690608c810aba8e95.r2.dev/AI%20Upscaler-2K-abstract_objects_new.mp4';
const FLUTE_COUNT_DESKTOP = 24;
const FLUTE_COUNT_MOBILE = 8;

// Google Calendar appointment scheduling embed
const BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ108Z3oZ0rwdkqycYsQh62CH3P1AlHYGs34Ql2NxW8whxLOhAVax-pr3U2q2jjLlp24vMePehvG?gv=true';

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
            <div className="absolute inset-0 backdrop-blur-2xl [mask-image:linear-gradient(to_right,transparent_0%,black_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_100%)] flex-1 h-full z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.015] via-transparent to-black/[0.1] border-r border-white/5 shadow-[inset_1px_0_1px_rgba(255,255,255,0.03),inset_-1px_0_2px_rgba(0,0,0,0.2)] z-20 pointer-events-none" />
        </div>
    );

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black">
            <div
                className={`absolute inset-0 bg-cover bg-center z-10 transition-opacity duration-1000 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                style={{ backgroundImage: 'url(/poster.webp)' }}
            />
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
            <div className="absolute inset-0 bg-black/70 z-20 pointer-events-none" />
            <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[160px] pointer-events-none z-30" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none z-30" />
            <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-orange-900/10 rounded-full blur-[120px] pointer-events-none z-30" />

            <div className="absolute inset-0 z-30 hidden md:flex pointer-events-none scale-[1.01]">
                {Array.from({ length: FLUTE_COUNT_DESKTOP }).map((_, i) => <FlutedStrip key={i} i={i} />)}
            </div>
            <div className="absolute inset-0 z-30 flex md:hidden pointer-events-none scale-[1.01]">
                {Array.from({ length: FLUTE_COUNT_MOBILE }).map((_, i) => <FlutedStrip key={i} i={i} />)}
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleMeetingPage() {
    useSEO({
        title: 'Schedule a Meeting - Partner With Clubin | Clubin',
        description: 'Book a quick call with the Clubin partnerships team. Pick a slot that works for you and we\'ll help you list your club on Clubin.',
        url: 'https://clubin.co.in/list-your-club/schedule',
        structuredData: [
            {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: 'Schedule a Meeting with Clubin',
                description: 'Book a call with the Clubin partnerships team to list your club on Clubin.',
                url: 'https://clubin.co.in/list-your-club/schedule',
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://clubin.co.in/' },
                    { '@type': 'ListItem', position: 2, name: 'List Your Club', item: 'https://clubin.co.in/list-your-club' },
                    { '@type': 'ListItem', position: 3, name: 'Schedule a Meeting' },
                ],
            },
        ],
    });

    const [iframeLoaded, setIframeLoaded] = useState(false);

    return (
        <>
            {/* Global style injections to ensure fonts load exactly like the landing page */}
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
                    <Link
                        to="/list-your-club"
                        className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                </nav>

                {/* ── Header + Booking Embed ───────────────────────────── */}
                <section className="relative px-4 sm:px-6 md:px-12 pt-32 md:pt-40 pb-16 max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-[#a484d7] mb-8 backdrop-blur-md shadow-sm">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            Partnerships Team
                        </span>
                        <h1 className="text-4xl md:text-6xl font-inter font-extrabold tracking-tighter text-white mb-5 drop-shadow-2xl leading-[1.05]">
                            Schedule a{' '}
                            <span className="font-instrument italic font-normal text-[#a484d7]">meeting.</span>
                        </h1>
                        <p className="text-lg md:text-xl font-manrope text-gray-200 max-w-2xl mx-auto leading-relaxed font-light drop-shadow-md">
                            Pick a slot that works for you. We'll understand your venue and goals, and have you live on Clubin within 48 hours.
                        </p>
                    </div>

                    {/* Google Calendar Appointment Scheduling embed */}
                    <div className="relative rounded-[2rem] overflow-hidden bg-white border border-white/[0.08] shadow-2xl shadow-purple-500/10">
                        {/* Loading state while the Google Calendar iframe loads */}
                        {!iframeLoaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[rgba(12,10,22,0.95)] z-10">
                                <div className="w-10 h-10 border-2 border-[#7b39fc] border-t-transparent rounded-full animate-spin" />
                                <span className="text-white/50 text-sm font-manrope">Loading available slots…</span>
                            </div>
                        )}
                        <iframe
                            src={BOOKING_URL}
                            title="Schedule a meeting with Clubin via Google Calendar"
                            style={{ border: 0 }}
                            width="100%"
                            className="w-full h-[75vh] min-h-[600px]"
                            onLoad={() => setIframeLoaded(true)}
                        />
                    </div>

                    <p className="text-white/40 text-sm mt-8 font-manrope flex items-center justify-center gap-2 text-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                        Free to get started. No commitment required.
                    </p>
                </section>

                {/* ── Footer ───────────────────────────────────────────── */}
                <Footer />
            </div>
        </>
    );
}
