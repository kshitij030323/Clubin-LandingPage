import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronDown } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { Footer } from '../components/Footer';
import { PageVideo, ScrollReveal } from './TermsOfServicePage';

// ─── Contact details ────────────────────────────────────────────────────────

const SUPPORT_EMAIL = 'admin@clubin.info';
const COMPANY_EMAIL = 'info@kauzway.com';
const PHONE_DISPLAY = '+91 99110 06848';
const PHONE_TEL = '+919911006848';
const ADDRESS = '235, Binnamangala, 2nd Floor, 13th Cross Road, Indiranagar, Bangalore North, Bangalore - 560038, Karnataka';

// ─── FAQ content (kept in sync with scripts/prerender.py for SEO) ─────────────

const FAQS: { q: string; a: React.ReactNode }[] = [
    {
        q: 'What is Clubin?',
        a: 'Clubin is a nightlife platform that lets you discover clubs and events, book free guestlist entry, party tickets and VIP tables across India — all from one app.',
    },
    {
        q: 'How do I book guestlist entry or tickets?',
        a: 'Open the club or event page in the Clubin app, choose your event, and confirm your guestlist spot or ticket in seconds. You will receive a QR code to show at the door — no queues.',
    },
    {
        q: "I didn't receive my booking confirmation or QR code. What should I do?",
        a: (
            <>
                Your booking and QR code are available under the "My Bookings" section in the app. If it's missing, email us
                at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your registered phone number and we'll help right away.
            </>
        ),
    },
    {
        q: 'Can I get a refund on my booking?',
        a: (
            <>
                Refunds are subject to the venue's policy and the terms shown at checkout. Convenience fees are non-refundable
                unless stated otherwise. For refund queries, reach out to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </>
        ),
    },
    {
        q: 'Does booking guarantee entry to the venue?',
        a: 'Booking through Clubin secures your spot, but venues reserve the right of admission. Please follow each venue’s dress code, age policy (18+) and behavioural guidelines.',
    },
    {
        q: 'How do I list my club or partner with Clubin?',
        a: (
            <>
                Head to our <Link to="/list-your-club">List Your Club</Link> page and schedule a meeting with our team. We'll get
                you set up to manage events, guestlists and reach thousands of users.
            </>
        ),
    },
    {
        q: 'How do I delete my account?',
        a: (
            <>
                You can request permanent deletion of your account and data from our <Link to="/delete-account">Delete Account</Link> page.
                We process requests within 30 days as per our data retention policy.
            </>
        ),
    },
    {
        q: 'How can I contact Clubin support?',
        a: (
            <>
                Email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>,
                or call <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>. You can also visit our office in Indiranagar, Bangalore.
            </>
        ),
    },
];

// Plain-text FAQ used for FAQPage JSON-LD (must mirror the rendered answers)
const FAQ_TEXT: Record<string, string> = {
    'What is Clubin?':
        'Clubin is a nightlife platform that lets you discover clubs and events, book free guestlist entry, party tickets and VIP tables across India — all from one app.',
    'How do I book guestlist entry or tickets?':
        'Open the club or event page in the Clubin app, choose your event, and confirm your guestlist spot or ticket in seconds. You will receive a QR code to show at the door — no queues.',
    "I didn't receive my booking confirmation or QR code. What should I do?":
        `Your booking and QR code are available under the "My Bookings" section in the app. If it's missing, email us at ${SUPPORT_EMAIL} with your registered phone number and we'll help right away.`,
    'Can I get a refund on my booking?':
        `Refunds are subject to the venue's policy and the terms shown at checkout. Convenience fees are non-refundable unless stated otherwise. For refund queries, reach out to ${SUPPORT_EMAIL}.`,
    'Does booking guarantee entry to the venue?':
        'Booking through Clubin secures your spot, but venues reserve the right of admission. Please follow each venue’s dress code, age policy (18+) and behavioural guidelines.',
    'How do I list my club or partner with Clubin?':
        "Head to our List Your Club page and schedule a meeting with our team. We'll get you set up to manage events, guestlists and reach thousands of users.",
    'How do I delete my account?':
        'You can request permanent deletion of your account and data from our Delete Account page. We process requests within 30 days as per our data retention policy.',
    'How can I contact Clubin support?':
        `Email us at ${SUPPORT_EMAIL} or ${COMPANY_EMAIL}, or call ${PHONE_DISPLAY}. You can also visit our office in Indiranagar, Bangalore.`,
};

// ─── Contact card ─────────────────────────────────────────────────────────────

function ContactCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex-1 min-w-[200px] p-6 rounded-[1.75rem] bg-[rgba(12,10,22,0.65)] backdrop-blur-[40px] border border-white/[0.06] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="w-11 h-11 rounded-2xl bg-[#7b39fc]/15 border border-[#a484d7]/20 flex items-center justify-center text-[#a484d7] mb-4">
                {icon}
            </div>
            <h3 className="text-white font-inter font-bold text-sm uppercase tracking-wider mb-2">{label}</h3>
            <div className="text-white/60 text-sm font-manrope font-light leading-relaxed [&_a]:text-[#a484d7] [&_a:hover]:text-[#8b4afc] [&_a]:transition-colors break-words">
                {children}
            </div>
        </div>
    );
}

// ─── FAQ item (accordion) ──────────────────────────────────────────────────────

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
    return (
        <div className="border-b border-white/10 last:border-b-0">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 py-5 text-left group"
            >
                <span className="text-white font-inter font-semibold text-base md:text-lg group-hover:text-[#a484d7] transition-colors">{q}</span>
                <ChevronDown className={`w-5 h-5 shrink-0 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#a484d7]' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <p className="pb-6 text-white/65 text-sm md:text-base font-manrope font-light leading-relaxed [&_a]:text-[#a484d7] [&_a:hover]:text-[#8b4afc] [&_a]:transition-colors">
                        {a}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function SupportPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    useSEO({
        title: 'Support & FAQs | Clubin',
        description: 'Need help with Clubin? Find answers to frequently asked questions about bookings, guestlists, refunds and more, or reach our support team by email and phone.',
        url: 'https://clubin.co.in/support',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(({ q }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: FAQ_TEXT[q] },
            })),
        },
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
                    {/* Hero */}
                    <ScrollReveal>
                        <div className="mb-12">
                            <h1 className="text-4xl md:text-6xl font-inter font-extrabold tracking-tight mb-4 text-white drop-shadow-lg">
                                Help &amp; <span className="font-instrument italic font-normal text-[#a484d7]">Support.</span>
                            </h1>
                            <p className="text-white/55 text-base md:text-lg font-manrope font-light max-w-2xl leading-relaxed">
                                We're here to help. Browse the FAQs below, or reach out to our team — we usually respond within one business day.
                            </p>
                        </div>
                    </ScrollReveal>

                    {/* Contact cards */}
                    <ScrollReveal delay={100}>
                        <div className="flex flex-wrap gap-4 mb-14">
                            <ContactCard icon={<Mail className="w-5 h-5" />} label="Email Us">
                                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                                <br />
                                <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
                            </ContactCard>
                            <ContactCard icon={<Phone className="w-5 h-5" />} label="Call Us">
                                <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
                                <br />
                                <span className="text-white/40 text-xs">Mon–Sat, 10am–7pm IST</span>
                            </ContactCard>
                            <ContactCard icon={<MapPin className="w-5 h-5" />} label="Visit Us">
                                {ADDRESS}
                            </ContactCard>
                        </div>
                    </ScrollReveal>

                    {/* FAQs */}
                    <ScrollReveal delay={200}>
                        <h2 className="text-2xl md:text-3xl font-inter font-bold text-white mb-2">Frequently Asked Questions</h2>
                        <p className="text-white/50 text-sm md:text-base font-manrope font-light mb-6">
                            Quick answers to the things people ask us most.
                        </p>
                        <div className="bg-[rgba(12,10,22,0.65)] backdrop-blur-[40px] border border-white/[0.06] px-6 md:px-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b39fc]/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="relative z-10">
                                {FAQS.map((faq, i) => (
                                    <FaqItem
                                        key={faq.q}
                                        q={faq.q}
                                        a={faq.a}
                                        isOpen={openIndex === i}
                                        onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                                    />
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Still need help CTA */}
                    <ScrollReveal delay={250}>
                        <div className="mt-10 p-6 md:p-8 rounded-[2rem] bg-[rgba(12,10,22,0.65)] backdrop-blur-[40px] border border-white/[0.06] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#7b39fc]/10 rounded-full blur-[80px] pointer-events-none" />
                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-inter font-bold text-white mb-1">Still need a hand?</h3>
                                <p className="text-white/60 text-sm md:text-base font-manrope font-light leading-relaxed max-w-md">
                                    Drop us a line and our team will get back to you, usually within one business day.
                                </p>
                            </div>
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7b39fc] to-[#a484d7] hover:from-[#8b4afc] hover:to-[#b596e0] text-white text-sm font-bold rounded-xl border border-[#a484d7]/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/30"
                            >
                                <Mail className="w-4 h-4" />
                                Contact Support
                            </a>
                        </div>
                    </ScrollReveal>
                </main>

                <Footer />
            </div>
        </>
    );
}
