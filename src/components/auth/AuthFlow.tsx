import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { sendOtp, verifyOtp, phoneAuth } from '../../api';

type Step = 'phone' | 'otp' | 'name';

const inputBase =
    'w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60 transition-colors';
const primaryBtn =
    'w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 transition-all';

/**
 * Self-contained phone → OTP → name auth flow. Calls `onAuthenticated` once the
 * user has a valid session (existing users after OTP, new users after name).
 * Reusable across the booking modal context and standalone pages (My Tickets).
 */
export function AuthFlow({ onAuthenticated }: { onAuthenticated?: () => void }) {
    const { login } = useAuth();
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fullPhone = `+91${phone}`;

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
            if (res.user && res.token) { login(res.token, res.user); onAuthenticated?.(); }
            else if (res.isNewUser) { setStep('name'); }
            else { setError('Verification failed. Please try again.'); }
        } catch (e) { setError(e instanceof Error ? e.message : 'Invalid OTP'); }
        finally { setLoading(false); }
    };

    const handleName = async () => {
        if (name.trim().length < 2) { setError('Please enter your name'); return; }
        setLoading(true); setError('');
        try { const res = await phoneAuth(fullPhone, name.trim()); login(res.token, res.user); onAuthenticated?.(); }
        catch (e) { setError(e instanceof Error ? e.message : 'Could not complete sign-up'); }
        finally { setLoading(false); }
    };

    const back = (to: Step) => { setError(''); setStep(to); };

    return (
        <div className="space-y-4">
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            {step === 'phone' && (
                <>
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
                </>
            )}

            {step === 'otp' && (
                <>
                    <button onClick={() => back('phone')} className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
                        <ArrowLeft className="w-4 h-4" /> Change number
                    </button>
                    <p className="text-sm text-white/60">Enter the 6-digit code sent on WhatsApp to +91 {phone}.</p>
                    <input
                        className={`${inputBase} text-center tracking-[0.5em] text-lg`} inputMode="numeric" placeholder="••••••" value={otp}
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    />
                    <button className={primaryBtn} disabled={loading || otp.length !== 6} onClick={handleVerifyOtp}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                    </button>
                    <button className="w-full text-sm text-purple-400 hover:text-purple-300" disabled={loading} onClick={handleSendOtp}>Resend OTP</button>
                </>
            )}

            {step === 'name' && (
                <>
                    <p className="text-sm text-white/60">This name is used for your guestlist entry.</p>
                    <input className={inputBase} placeholder="Full name" value={name} maxLength={30}
                        onChange={(e) => { setName(e.target.value); setError(''); }} />
                    <button className={primaryBtn} disabled={loading || name.trim().length < 2} onClick={handleName}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                    </button>
                </>
            )}
        </div>
    );
}
