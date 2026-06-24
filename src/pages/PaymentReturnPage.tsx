import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Download, PartyPopper, XCircle, ArrowLeft, Home } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useAuth } from '../lib/auth';
import { fetchPaymentStatus } from '../api';
import type { PaymentStatusResponse } from '../types';
import { TicketCard } from '../components/booking/Ticket';
import { AccountButton } from '../components/AccountButton';
import { useSEO } from '../hooks/useSEO';
import { eventPath } from '../lib/urls';

type ViewState = 'loading' | 'paid' | 'failed' | 'error';

// How long to keep polling while the payment is still 'pending' — PayU's
// server-to-server callback can land a beat after the user is redirected back.
const MAX_POLLS = 6;
const POLL_INTERVAL_MS = 2000;

export function PaymentReturnPage() {
    useSEO({ title: 'Payment · Clubin', description: 'Your Clubin guestlist booking status.' });

    const [params] = useSearchParams();
    const { token } = useAuth();
    const bookingId = params.get('bookingId') || '';
    // Advisory only — we always confirm against the backend before trusting it.
    const statusHint = params.get('status');

    const [view, setView] = useState<ViewState>('loading');
    const [data, setData] = useState<PaymentStatusResponse | null>(null);
    const [error, setError] = useState('');
    const ticketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!bookingId) { setView('error'); setError('Missing booking reference in the link.'); return; }
        if (!token) {
            // AuthProvider hydrates the token from localStorage just after mount,
            // so `token` is briefly null here. Don't conclude "no session" yet —
            // wait a beat; if it's still missing, the user really isn't signed in.
            const t = setTimeout(() => {
                setView('error');
                setError('We could not find your session. Re-open the event and verify your number to view this booking.');
            }, 2500);
            return () => clearTimeout(t);
        }

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let polls = 0;

        const poll = async () => {
            try {
                const res = await fetchPaymentStatus(token, bookingId);
                if (cancelled) return;
                setData(res); setError('');
                if (res.paymentStatus === 'paid') { setView('paid'); return; }
                if (res.paymentStatus === 'failed' || res.paymentStatus === 'cancelled') { setView('failed'); return; }
                // Still pending — retry a few times before giving up.
                if (polls++ < MAX_POLLS) { timer = setTimeout(poll, POLL_INTERVAL_MS); }
                else { setView(statusHint === 'success' ? 'loading' : 'failed'); }
            } catch (e) {
                if (cancelled) return;
                setView('error');
                setError(e instanceof Error ? e.message : 'Could not load your booking status.');
            }
        };
        poll();

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [bookingId, token, statusHint]);

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        try {
            const dataUrl = await toPng(ticketRef.current, { pixelRatio: 2, backgroundColor: '#0a0a0a', cacheBust: true });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `clubin-ticket-${(data?.booking?.qrCode || data?.booking?.id || 'ticket').slice(-8)}.png`;
            a.click();
        } catch { setError('Could not download. Please screenshot the ticket instead.'); }
    };

    const ev = data?.booking?.event;
    const eventHref = ev ? eventPath(ev) : null;
    const primaryBtn = 'w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 transition-all';
    const ghostBtn = 'w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-4 pt-24 pb-12">
            <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] z-[60] flex justify-between items-center px-4 py-2 safe-top border-b border-white/10">
                <Link to="/" className="p-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95">
                    <Home className="w-5 h-5" />
                </Link>
                <img src="/clubin-logo-header.webp" alt="Clubin" className="h-14 w-auto object-contain" width="192" height="128" />
                <AccountButton />
            </div>
            <div className="w-full max-w-md">
                {view === 'loading' && (
                    <div className="flex flex-col items-center text-center gap-4 py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                        <div>
                            <p className="font-bold text-lg">Confirming your payment…</p>
                            <p className="text-sm text-white/50 mt-1">This takes just a moment. Please don't close this page.</p>
                        </div>
                    </div>
                )}

                {view === 'paid' && data && (
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mb-3">
                            <PartyPopper className="w-7 h-7 text-white" />
                        </div>
                        <p className="font-bold text-xl">You're on the list!</p>
                        <p className="text-sm text-white/60 text-center mb-4">Payment successful. Show this QR at the venue — government ID is mandatory at entry.</p>
                        <div className="w-full rounded-2xl overflow-hidden">
                            <TicketCard ref={ticketRef} booking={data.booking} amount={data.breakdown?.total ?? 0} />
                        </div>
                        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                        <div className="w-full mt-4 space-y-2">
                            <button className={primaryBtn} onClick={handleDownload}><Download className="w-5 h-5" /> Download Ticket</button>
                            <Link to="/" className={ghostBtn}><Home className="w-4 h-4" /> Back to home</Link>
                        </div>
                    </div>
                )}

                {view === 'failed' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="font-bold text-xl">Payment didn't go through</p>
                        <p className="text-sm text-white/60 mt-1 mb-6">
                            Your booking wasn't confirmed and you haven't been charged. If money was deducted, it will be refunded automatically.
                        </p>
                        <div className="w-full space-y-2">
                            {eventHref
                                ? <Link to={eventHref} className={primaryBtn}><ArrowLeft className="w-4 h-4" /> Try again</Link>
                                : <Link to="/explore" className={primaryBtn}><ArrowLeft className="w-4 h-4" /> Browse events</Link>}
                            <Link to="/" className={ghostBtn}><Home className="w-4 h-4" /> Back to home</Link>
                        </div>
                    </div>
                )}

                {view === 'error' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                            <XCircle className="w-8 h-8 text-white/50" />
                        </div>
                        <p className="font-bold text-xl">Something went wrong</p>
                        <p className="text-sm text-white/60 mt-1 mb-6">{error || 'We could not load your booking status.'}</p>
                        <Link to="/explore" className={primaryBtn}>Browse events</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
