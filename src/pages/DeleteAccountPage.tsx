import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { Footer } from '../components/Footer';

// ─── Shared Background Video with Scratch-Built Fluted Glass ────────────────

const VIDEO_SRC = 'https://pub-8cd3bcf3be92492690608c810aba8e95.r2.dev/AI%20Upscaler-2K-abstract_objects_new.mp4';
const FLUTE_COUNT_DESKTOP = 24;
const FLUTE_COUNT_MOBILE = 8;

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
            <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] bg-red-900/15 rounded-full blur-[160px] pointer-events-none z-30" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[800px] h-[800px] bg-purple-900/15 rounded-full blur-[160px] pointer-events-none z-30" />
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

// ─── Confirmation Modal ──────────────────────────────────────────────────────

function ConfirmationModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 backdrop-blur-md bg-black/60 animate-[fadeIn_0.25s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={onClose}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(20px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            `}</style>
            <div
                className="relative max-w-md w-full bg-[rgba(12,10,22,0.92)] backdrop-blur-[40px] border border-white/[0.08] rounded-[2rem] p-8 md:p-10 shadow-2xl overflow-hidden animate-[popIn_0.35s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#a484d7]/15 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>

                    <h2 id="confirm-title" className="text-2xl md:text-3xl font-inter font-bold mb-3 text-white">
                        Request <span className="font-instrument italic font-normal text-[#a484d7]">received.</span>
                    </h2>

                    <p className="text-white/70 font-manrope font-light text-base leading-relaxed mb-8">
                        Your data will be deleted within <span className="text-white font-semibold">30 days</span> in line with our data retention policy. You'll get a confirmation once it's done.
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-[#7b39fc] hover:bg-[#8b4afc] text-white text-sm font-bold rounded-xl border border-purple-400/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function DeleteAccountPage() {
    useSEO({
        title: 'Delete Your Account | Clubin',
        description: 'Request deletion of your Clubin account and personal data. We will process your request within 30 days as per our data retention policy.',
        url: 'https://clubin.co.in/delete-account',
    });

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const digits = phone.replace(/\D/g, '');

        if (!trimmedName) {
            setError('Please enter your name.');
            return;
        }
        if (digits.length < 10) {
            setError('Please enter a valid phone number.');
            return;
        }

        setError(null);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setName('');
        setPhone('');
    };

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
                        <Link to="/terms" className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm hidden sm:block">
                            Back to Terms
                        </Link>
                    </div>
                </nav>

                <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-2xl mx-auto w-full">
                    <ScrollReveal>
                        <div className="mb-10">
                            <h1 className="text-4xl md:text-6xl font-inter font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
                                Delete your <span className="font-instrument italic font-normal text-[#f87b52]">account.</span>
                            </h1>
                            <p className="text-white/60 text-base md:text-lg font-manrope font-light leading-relaxed">
                                Submit your details below and we'll permanently remove your account and associated data within 30 days, in line with our data retention policy.
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={150}>
                        <form
                            onSubmit={handleSubmit}
                            className="relative bg-[rgba(12,10,22,0.65)] backdrop-blur-[40px] border border-white/[0.06] p-8 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                            noValidate
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f87b52]/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="delete-name" className="text-sm font-semibold text-white/80 font-manrope">
                                        Full name
                                    </label>
                                    <input
                                        id="delete-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                        autoComplete="name"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-manrope text-base focus:outline-none focus:border-[#a484d7]/60 focus:bg-white/[0.07] transition-all duration-300"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="delete-phone" className="text-sm font-semibold text-white/80 font-manrope">
                                        Phone number
                                    </label>
                                    <input
                                        id="delete-phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="10-digit phone number"
                                        autoComplete="tel"
                                        inputMode="tel"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 font-manrope text-base focus:outline-none focus:border-[#a484d7]/60 focus:bg-white/[0.07] transition-all duration-300"
                                    />
                                    <p className="text-xs text-white/40 font-manrope mt-1">
                                        Use the same phone number linked to your Clubin account.
                                    </p>
                                </div>

                                {error && (
                                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm font-manrope">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="mt-2 w-full px-6 py-4 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] text-white text-sm md:text-base font-bold rounded-xl border border-red-400/30 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-900/30"
                                >
                                    Request Account Deletion
                                </button>

                                <p className="text-xs text-white/40 font-manrope leading-relaxed text-center">
                                    By submitting, you confirm you want your Clubin account and personal data permanently removed.
                                </p>
                            </div>
                        </form>
                    </ScrollReveal>
                </main>

                <Footer />
            </div>

            {showModal && <ConfirmationModal onClose={handleClose} />}
        </>
    );
}
