import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Download, Ticket, LogOut, ArrowLeft, ChevronDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { Booking } from '../types';
import { useAuth } from '../lib/auth';
import { fetchMyBookings, fetchEventDetails, formatDate, formatTime } from '../api';
import { calcAmountAtVenue, totalGuests, buildBookingCode } from '../lib/booking';
import { TicketCard } from '../components/booking/Ticket';
import { AuthFlow } from '../components/auth/AuthFlow';
import { useSEO } from '../hooks/useSEO';

/** A collapsed, event-wise ticket row. Click to expand the QR + download. */
function TicketRow({ booking, amount }: { booking: Booking; amount: number }) {
    const [open, setOpen] = useState(false);
    const [err, setErr] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const ev = booking.event;
    const guests = totalGuests({ couples: booking.couples, ladies: booking.ladies, stags: booking.stags });
    const code = buildBookingCode(booking);
    const subtitle = [ev?.club, ev && formatDate(ev.date), ev && formatTime(ev.startTime)].filter(Boolean).join(' · ');

    const download = async () => {
        if (!ref.current) return;
        try {
            const dataUrl = await toPng(ref.current, { pixelRatio: 2, backgroundColor: '#0a0a0a', cacheBust: true });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `clubin-ticket-${(booking.qrCode || booking.id).slice(-8)}.png`;
            a.click();
        } catch { setErr('Could not download. Please screenshot the ticket instead.'); }
    };

    return (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
            <button
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.03] transition-colors"
            >
                {ev?.imageUrl && (
                    <img src={ev.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{ev?.title ?? 'Your Event'}</p>
                    {subtitle && <p className="text-xs text-white/50 truncate">{subtitle}</p>}
                    <p className="text-[11px] text-white/40 mt-0.5">
                        {guests} {guests === 1 ? 'guest' : 'guests'} · #{code.slice(0, 4)}
                        {booking.status ? ` · ${booking.status}` : ''}
                    </p>
                </div>
                <ChevronDown className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="border-t border-white/10">
                    <div className="rounded-2xl overflow-hidden">
                        <TicketCard ref={ref} booking={booking} amount={amount} />
                    </div>
                    {err && <p className="text-xs text-red-400 px-4 text-center">{err}</p>}
                    <div className="p-4 pt-0">
                        <button
                            onClick={download}
                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 transition-all"
                        >
                            <Download className="w-5 h-5" /> Download Ticket
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function TicketsPage() {
    useSEO({ title: 'My Tickets · Clubin', description: 'View and download your Clubin guestlist tickets.' });

    const { token, user, logout } = useAuth();
    const [bookings, setBookings] = useState<Booking[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        fetchMyBookings(token)
            .then(async (list) => {
                // Enrich any booking missing its event so the ticket renders fully.
                const enriched = await Promise.all(list.map(async (b) => {
                    if (b.event || !b.eventId) return b;
                    try { return { ...b, event: await fetchEventDetails(b.eventId) }; } catch { return b; }
                }));
                if (!cancelled) { setError(''); setBookings(enriched); }
            })
            .catch((e) => {
                if (cancelled) return;
                const msg = e instanceof Error ? e.message : 'Failed to load your tickets';
                if (msg.toLowerCase().includes('token')) { logout(); }
                else setError(msg);
            });
        return () => { cancelled = true; };
    }, [token, logout]);

    const loggedIn = Boolean(token && user);
    const loading = loggedIn && bookings === null && !error;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] z-[60] flex justify-between items-center px-4 py-2 safe-top border-b border-white/10">
                <Link to="/explore" className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <img src="/clubin-logo-header.webp" alt="Clubin" className="h-14 w-auto object-contain" width="192" height="128" />
                {loggedIn ? (
                    <button onClick={logout} title="Log out" className="p-2.5 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-all active:scale-95">
                        <LogOut className="w-5 h-5" />
                    </button>
                ) : <div className="w-10" />}
            </div>

            <main className="max-w-2xl mx-auto px-4 py-6 pt-28">
                {!loggedIn ? (
                    <div className="max-w-md mx-auto">
                        <h1 className="text-2xl font-extrabold mb-1">Log in to Clubin</h1>
                        <p className="text-sm text-white/50 mb-6">View and download your guestlist tickets.</p>
                        <AuthFlow />
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h1 className="text-2xl font-extrabold">My Tickets</h1>
                            <p className="text-sm text-white/50">Signed in as {user?.name} · +91 {user?.phone?.replace(/^\+?91/, '')}</p>
                        </div>

                        {loading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>}
                        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                        {!loading && !error && bookings && bookings.length === 0 && (
                            <div className="text-center py-16">
                                <Ticket className="w-10 h-10 mx-auto text-white/30 mb-3" />
                                <p className="text-white/60">No tickets yet.</p>
                                <Link to="/explore" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-white text-black font-bold">Browse events</Link>
                            </div>
                        )}

                        {!loading && bookings && bookings.length > 0 && (
                            <div className="space-y-3">
                                {bookings.map((b) => (
                                    <TicketRow
                                        key={b.id}
                                        booking={b}
                                        amount={b.event ? calcAmountAtVenue({ couples: b.couples, ladies: b.ladies, stags: b.stags }, b.event) : 0}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
