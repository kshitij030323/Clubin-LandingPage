import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Ticket, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';

const iconBtn =
    'w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95 border border-white/10';

/**
 * Top-right profile control. Logged out → a profile icon that routes to login.
 * Logged in → an avatar (first initial) that opens a dropdown with the user's
 * name + phone, "My Tickets", and "Log out".
 */
export function AccountButton() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    if (!user) {
        return (
            <button onClick={() => navigate('/tickets')} className={iconBtn} aria-label="Log in">
                <User className="w-5 h-5" />
            </button>
        );
    }

    const initial = user.name?.trim()?.[0]?.toUpperCase();
    const phone = user.phone?.replace(/^\+?91/, '');

    return (
        <div className="relative" ref={wrapRef}>
            <button onClick={() => setOpen((o) => !o)} className={iconBtn} aria-label="Account" aria-expanded={open}>
                {initial ? <span className="text-sm font-bold">{initial}</span> : <User className="w-5 h-5" />}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#15121f] border border-white/10 shadow-2xl overflow-hidden z-[70] text-white animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="font-bold truncate">{user.name}</p>
                        {phone && <p className="text-xs text-white/50">+91 {phone}</p>}
                    </div>
                    <Link
                        to="/tickets"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                    >
                        <Ticket className="w-4 h-4 text-purple-300" /> My Tickets
                    </Link>
                    <button
                        onClick={() => { setOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-300 hover:bg-white/5 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Log out
                    </button>
                </div>
            )}
        </div>
    );
}
