import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { Footer } from '../components/Footer';

// ─── Shared Background Video with Scratch-Built Fluted Glass ────────────────

const VIDEO_SRC = 'https://pub-8cd3bcf3be92492690608c810aba8e95.r2.dev/AI%20Upscaler-2K-abstract_objects_new.mp4';
const FLUTE_COUNT_DESKTOP = 24;
const FLUTE_COUNT_MOBILE = 8;

export function PageVideo() {
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

// ─── ScrollReveal ─────────────────────────────────────────────────────────────

export function ScrollReveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
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

// ─── Page Component ───────────────────────────────────────────────────────────

export function TermsOfServicePage() {
    useSEO({
        title: 'Terms of Service | Clubin',
        description: 'Read the Terms of Service for Clubin. Learn about our guidelines, rules, and user agreements for the ultimate nightlife platform.',
        url: 'https://clubin.co.in/terms',
    });

    return (
        <>
            <style>{`
                .font-manrope { font-family: 'Manrope', sans-serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                .font-instrument { font-family: 'Instrument Serif', serif; }
            `}</style>

            <PageVideo />

            <div className="relative z-10 min-h-screen text-white font-manrope selection:bg-[#7b39fc] selection:text-white flex flex-col">

                {/* Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                    <Link to="/" className="relative z-10 flex items-center gap-3">
                        <img src="/clubin-logo-header.webp" alt="Clubin" className="h-10 md:h-12 w-auto drop-shadow-lg opacity-90 hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="relative z-10 flex items-center gap-2 sm:gap-4">
                        <Link to="/clubs" className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm hidden sm:block">
                            Browse Clubs
                        </Link>
                    </div>
                </nav>

                <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto w-full">
                    <ScrollReveal>
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-6xl font-inter font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
                                Terms of <span className="font-instrument italic font-normal text-[#a484d7]">Service.</span>
                            </h1>
                            <p className="text-white/50 text-base md:text-lg font-manrope">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={150}>
                        <div className="prose prose-invert prose-lg max-w-none font-manrope font-light text-white/70 prose-headings:font-inter prose-headings:font-bold prose-headings:text-white prose-a:text-[#a484d7] hover:prose-a:text-[#8b4afc] prose-a:transition-colors bg-[rgba(12,10,22,0.65)] backdrop-blur-[40px] border border-white/[0.06] p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b39fc]/10 rounded-full blur-[80px] pointer-events-none" />

                            <h2 className="text-2xl mt-0">1. Introduction</h2>
                            <p>Welcome to Clubin ("we", "our", or "us"). These Terms of Service ("Terms") govern your use of our website located at <a href="https://clubin.co.in">clubin.co.in</a> and our mobile applications (collectively, the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms.</p>

                            <h2 className="text-2xl">2. Eligibility</h2>
                            <p>You must be at least 18 years old to use the Platform. By agreeing to these Terms, you represent and warrant to us that you are at least 18 years of age and that your registration and your use of the Platform is in compliance with all applicable laws and regulations.</p>

                            <h2 className="text-2xl">3. User Accounts</h2>
                            <p>When you create an account, you must provide us with accurate and complete information. You are solely responsible for managing and maintaining the security of your account and password. We are not liable for any acts or omissions by you in connection with your account.</p>

                            <h2 className="text-2xl">4. Bookings and Payments</h2>
                            <p>Clubin acts as a platform connecting users with nightclubs and event organizers. All guestlist entries, table bookings, and ticket purchases are subject to availability and the specific terms set by the respective venue. We process payments securely via third-party aggregators. All fees, including convenience fees, are non-refundable unless specifically stated or mandated by the venue.</p>

                            <h2 className="text-2xl">5. Venue Rules and Right of Admission</h2>
                            <p>Booking through Clubin does not guarantee entry. The partner venues reserve the right of admission. You must comply with the venue's dress code, age restrictions, and behavioral guidelines. Clubin is not responsible if you are denied entry by a venue.</p>

                            <h2 className="text-2xl">6. Limitation of Liability</h2>
                            <p>To the maximum extent permitted by law, Clubin shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Platform.</p>

                            <h2 className="text-2xl">7. Changes to Terms</h2>
                            <p>We may modify these Terms at any time, in our sole discretion. If we do so, we will let you know either by posting the modified Terms on the Site or through other communications. It's important that you review the Terms whenever we modify them because if you continue to use the Platform after we have posted modified Terms, you are indicating to us that you agree to be bound by the modified Terms.</p>

                            <h2 className="text-2xl">8. Contact Information</h2>
                            <p>If you have any questions about these Terms, please contact us at <a href="mailto:hello@clubin.in">hello@clubin.in</a>.</p>
                        </div>
                    </ScrollReveal>
                </main>

                <Footer />
            </div>
        </>
    );
}
