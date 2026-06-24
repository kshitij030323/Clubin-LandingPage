import { useEffect, useState } from 'react';
import { X, ArrowLeft, Minus, Plus, Loader2, ShieldCheck, Lock } from 'lucide-react';
import type { Event, PaymentInitiateResponse } from '../../types';
import { useAuth } from '../../lib/auth';
import { sendOtp, verifyOtp, phoneAuth, initiatePayment } from '../../api';
import { submitPayuForm } from '../../lib/payu';
import {
    totalGuests, calcAmountAtVenue, descriptionLines, buildNameSlots, buildGuestPayload,
    type GuestCounts,
} from '../../lib/booking';

type Step = 'phone' | 'otp' | 'name' | 'quantity' | 'names' | 'review';

const GUEST_ROWS = [
    { key: 'couples', label: 'Couples', priceKey: 'couplePrice', origKey: 'originalCouplePrice', descKey: 'coupleDescription', unit: 'per couple' },
    { key: 'ladies', label: 'Ladies', priceKey: 'ladiesPrice', origKey: 'originalLadiesPrice', descKey: 'ladiesDescription', unit: 'per person' },
    { key: 'stags', label: 'Stags', priceKey: 'stagPrice', origKey: 'originalStagPrice', descKey: 'stagDescription', unit: 'per person' },
] as const;

const HEADERS: Record<Step, string> = {
    phone: 'Enter your number',
    otp: 'Verify OTP',
    name: 'Almost there',
    quantity: 'Select Guests',
    names: 'Guest Names',
    review: 'Review & Pay',
};

export function BookingModal({ event, open, onClose }: { event: Event; open: boolean; onClose: () => void }) {
    const { token, user, login, logout } = useAuth();
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [counts, setCounts] = useState<GuestCounts>({ couples: 0, ladies: 0, stags: 0 });
    const [names, setNames] = useState<string[]>([]);
    const [payment, setPayment] = useState<PaymentInitiateResponse | null>(null);
    const [redirecting, setRedirecting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        setStep(token && user ? 'quantity' : 'phone');
    }, [open, token, user]);

    if (!open) return null;

    const total = totalGuests(counts);
    const amount = calcAmountAtVenue(counts, event);
    const fullPhone = `+91${phone}`;
    const slots = buildNameSlots(counts);

    const handleSendOtp = async () => {
        if (phone.length !== 10) { setError('Enter a valid 10-digit number'); return; }
        setLoading(true); setError('');
        try { await sendOtp(fullPhone); setOtp(''); setStep('otp'); }
        catch (e) { setError(e instanceof Error ? e.message : 'Failed to send OTP'); }
        finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { setError('Enter the 6-digit code'); return; }
        setLoading(true); setError('');
        try {
            const res = await verifyOtp(fullPhone, otp);
            if (res.user && res.token) { login(res.token, res.user); setStep('quantity'); }
            else if (res.isNewUser) { setStep('name'); }
            else { setError('Verification failed. Please try again.'); }
        } catch (e) { setError(e instanceof Error ? e.message : 'Invalid OTP'); }
        finally { setLoading(false); }
    };

    const handleName = async () => {
        if (name.trim().length < 2) { setError('Please enter your name'); return; }
        setLoading(true); setError('');
        try { const res = await phoneAuth(fullPhone, name.trim()); login(res.token, res.user); setStep('quantity'); }
        catch (e) { setError(e instanceof Error ? e.message : 'Could not complete sign-up'); }
        finally { setLoading(false); }
    };

    const goToNames = () => {
        if (total === 0) return;
        setNames(Array(slots.length).fill(''));
        setError('');
        setStep('names');
    };

    // Create a pending booking + fetch server-signed PayU params, then show the
    // payment summary. The ticket is issued on /payment/return after PayU's
    // verified callback marks the payment as paid.
    const handleProceedToPayment = async () => {
        if (names.some((n) => !n.trim())) { setError('Please enter names for all guests'); return; }
        if (!token) { logout(); setStep('phone'); setError('Session expired, please verify your number again'); return; }
        setLoading(true); setError('');
        try {
            const guests = buildGuestPayload(counts, names);
            const p = await initiatePayment(token, {
                eventId: event.id, couples: counts.couples, ladies: counts.ladies, stags: counts.stags, guests,
            });
            setPayment(p); setStep('review');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Could not start payment';
            if (msg.toLowerCase().includes('token')) { logout(); setStep('phone'); setError('Session expired, please verify your number again'); }
            else setError(msg);
        } finally { setLoading(false); }
    };

    // Hand off to PayU's hosted checkout. This navigates the whole tab away, so
    // we show a "redirecting" state rather than resetting it.
    const handlePay = () => {
        if (!payment) return;
        setRedirecting(true); setError('');
        submitPayuForm(payment.action, payment.params);
    };

    const updateCount = (key: keyof GuestCounts, delta: number) =>
        setCounts((p) => ({ ...p, [key]: Math.max(0, p[key] + delta) }));

    const inputBase = 'w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60 transition-colors';
    const primaryBtn = 'w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 transition-all';

    const handleBack = () => {
        setError('');
        if (step === 'otp') setStep('phone');
        else if (step === 'name') setStep('otp');
        else if (step === 'names') setStep('quantity');
        else if (step === 'review') { setPayment(null); setStep('names'); }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget && !redirecting) onClose(); }}
        >
            <div className="bg-[#120f1d] border border-purple-500/20 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300 text-white">
                <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {(step === 'otp' || step === 'name' || step === 'names' || step === 'review') && !redirecting && (
                            <button onClick={handleBack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                        )}
                        <h3 className="font-bold text-base">{HEADERS[step]}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {error && <p className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                    {step === 'phone' && (
                        <div className="space-y-4">
                            <p className="text-sm text-white/60">We'll send a verification code on WhatsApp.</p>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-3 rounded-xl bg-black/30 border border-white/10 text-white/70 font-semibold">+91</span>
                                <input
                                    className={inputBase} inputMode="numeric" placeholder="98765 43210" value={phone}
                                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                                />
                            </div>
                            <button className={primaryBtn} disabled={loading || phone.length !== 10} onClick={handleSendOtp}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get OTP'}
                            </button>
                        </div>
                    )}

                    {step === 'otp' && (
                        <div className="space-y-4">
                            <p className="text-sm text-white/60">Enter the 6-digit code sent on WhatsApp to +91 {phone}.</p>
                            <input
                                className={`${inputBase} text-center tracking-[0.5em] text-lg`} inputMode="numeric" placeholder="••••••" value={otp}
                                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                            />
                            <button className={primaryBtn} disabled={loading || otp.length !== 6} onClick={handleVerifyOtp}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                            </button>
                            <button className="w-full text-sm text-purple-400 hover:text-purple-300" disabled={loading} onClick={handleSendOtp}>Resend OTP</button>
                        </div>
                    )}

                    {step === 'name' && (
                        <div className="space-y-4">
                            <p className="text-sm text-white/60">This name is used for your guestlist entry.</p>
                            <input className={inputBase} placeholder="Full name" value={name} maxLength={30}
                                onChange={(e) => { setName(e.target.value); setError(''); }} />
                            <button className={primaryBtn} disabled={loading || name.trim().length < 2} onClick={handleName}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                            </button>
                        </div>
                    )}

                    {step === 'quantity' && (
                        <div className="space-y-3">
                            {GUEST_ROWS.map((row) => {
                                const price = (event[row.priceKey] as number) ?? 0;
                                const orig = (event[row.origKey as keyof Event] as number | null | undefined) ?? null;
                                const lines = descriptionLines(event[row.descKey as keyof Event] as string | undefined);
                                const hasDiscount = orig != null && orig > price;
                                return (
                                    <div key={row.key} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold">{row.label}</p>
                                                <div className="flex items-baseline gap-2 mt-0.5">
                                                    {hasDiscount && <span className="text-xs text-white/40 line-through">₹{orig}</span>}
                                                    <span className="text-sm font-bold text-purple-300">{price > 0 ? `₹${price}` : 'Free'}</span>
                                                    <span className="text-xs text-white/40">{price > 0 ? row.unit : 'entry'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/10 flex-shrink-0">
                                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10" onClick={() => updateCount(row.key, -1)}><Minus className="w-4 h-4" /></button>
                                                <span className="w-6 text-center font-bold">{counts[row.key]}</span>
                                                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-purple-400" onClick={() => updateCount(row.key, 1)}><Plus className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        {lines.length > 0 && (
                                            <ul className="mt-2 space-y-0.5">
                                                {lines.map((line, i) => <li key={i} className="text-xs text-white/50">• {line}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {step === 'names' && (
                        <div className="space-y-3">
                            <p className="text-sm text-white/60">Enter names for all {total} guests. Government ID is mandatory at entry.</p>
                            {slots.map((slot, i) => (
                                <div key={i}>
                                    <label className="text-[11px] font-bold uppercase tracking-wide text-white/50">{slot.label}</label>
                                    <input
                                        className={inputBase}
                                        placeholder={slot.type === 'couple' ? 'Both names (e.g. John & Jane)' : 'Enter name'}
                                        value={names[i] ?? ''}
                                        onChange={(e) => { setNames((p) => p.map((n, idx) => (idx === i ? e.target.value : n))); setError(''); }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 'review' && payment && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">Guestlist ({total} {total === 1 ? 'guest' : 'guests'})</span>
                                    <span className="font-semibold">{payment.breakdown.subtotal > 0 ? `₹${payment.breakdown.subtotal}` : '₹0'}</span>
                                </div>
                                {payment.breakdown.convenienceFee > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60">Convenience fee</span>
                                        <span className="font-semibold">₹{payment.breakdown.convenienceFee}</span>
                                    </div>
                                )}
                                {payment.breakdown.cgst > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60">CGST (9%)</span>
                                        <span className="font-semibold">₹{payment.breakdown.cgst}</span>
                                    </div>
                                )}
                                {payment.breakdown.sgst > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/60">SGST (9%)</span>
                                        <span className="font-semibold">₹{payment.breakdown.sgst}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
                                    <span className="font-bold">Total payable</span>
                                    <span className="text-lg font-bold text-purple-300">₹{payment.breakdown.total}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-white/50">
                                <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <p>You'll be redirected to PayU's secure checkout to pay. Your ticket with QR code is issued instantly after a successful payment.</p>
                            </div>
                        </div>
                    )}
                </div>

                {step === 'quantity' && (
                    <div className="p-4 border-t border-white/10 flex-shrink-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white/60">{total > 0 ? 'Subtotal' : 'Select guests to continue'}</span>
                            {total > 0 && (
                                <span className="text-lg font-bold text-purple-300">{amount > 0 ? `₹${amount}` : '₹0'}</span>
                            )}
                        </div>
                        {total > 0 && <p className="text-[11px] text-white/40 mb-3">+ convenience fee, shown before you pay</p>}
                        <button className={primaryBtn} disabled={total === 0} onClick={goToNames}>
                            {total === 0 ? 'Select guests' : `Continue · ${total} ${total === 1 ? 'guest' : 'guests'}`}
                        </button>
                    </div>
                )}
                {step === 'names' && (
                    <div className="p-4 border-t border-white/10 flex-shrink-0">
                        <button className={primaryBtn} disabled={loading} onClick={handleProceedToPayment}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue to payment'}
                        </button>
                    </div>
                )}
                {step === 'review' && payment && (
                    <div className="p-4 border-t border-white/10 flex-shrink-0">
                        <button className={primaryBtn} disabled={redirecting} onClick={handlePay}>
                            {redirecting
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to PayU…</>
                                : <><Lock className="w-5 h-5" /> Pay ₹{payment.breakdown.total} securely</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
