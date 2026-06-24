import { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Booking, BookingGuest, Event } from '../../types';
import { buildBookingCode, buildQrData, totalGuests, descriptionLines } from '../../lib/booking';
import { formatDate, formatTime } from '../../api';

interface TicketProps {
    booking: Booking;
    amount: number;
}

const TYPE_GROUPS: {
    type: BookingGuest['type'];
    label: string;
    descKey: keyof Pick<Event, 'coupleDescription' | 'ladiesDescription' | 'stagDescription'>;
}[] = [
    { type: 'couple', label: 'Couples', descKey: 'coupleDescription' },
    { type: 'lady', label: 'Ladies', descKey: 'ladiesDescription' },
    { type: 'stag', label: 'Stags', descKey: 'stagDescription' },
];

/** The exportable ticket card. Uses only same-origin assets so PNG export is clean. */
export const TicketCard = forwardRef<HTMLDivElement, TicketProps>(function TicketCard({ booking, amount }, ref) {
    const ev = booking.event;
    const guests = totalGuests({ couples: booking.couples, ladies: booking.ladies, stags: booking.stags });
    const code = buildBookingCode(booking);
    const qrData = buildQrData(booking, guests);
    const allGuests = booking.guests ?? [];

    const namesByType = (type: BookingGuest['type']) =>
        allGuests.filter((g) => g.type === type).map((g) => g.name).filter(Boolean);

    const hasNames = allGuests.some((g) => g.name);
    const hasEntryInfo = !!ev && TYPE_GROUPS.some(
        (g) => namesByType(g.type).length > 0 && descriptionLines(ev[g.descKey]).length > 0,
    );
    const divider = 'border-t-2 border-dashed border-neutral-200 my-3';

    return (
        <div ref={ref} className="bg-[#0a0a0a] p-5 flex flex-col items-center">
            <img src="/clubin-logo-header.webp" alt="Clubin" className="h-12 w-auto object-contain mb-3" width="192" height="128" />
            <div className="relative bg-white text-black rounded-2xl w-full max-w-[340px] p-6">
                <div className="text-center mb-3">
                    <p className="text-xl font-extrabold leading-tight">{ev?.title ?? 'Your Event'}</p>
                    <p className="text-xs font-semibold tracking-widest uppercase text-purple-600 mt-1">{ev?.club ?? ''}</p>
                    {ev && (
                        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-neutral-500 font-medium">
                            <span>{formatDate(ev.date)}</span>
                            <span>{formatTime(ev.startTime)}</span>
                        </div>
                    )}
                </div>

                <div className={divider} />

                <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg">
                        <QRCodeCanvas value={qrData} size={150} bgColor="#ffffff" fgColor="#000000" level="M" />
                    </div>
                    <p className="font-mono text-xs text-neutral-500 mt-2">{code}</p>
                </div>

                <div className={divider} />

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-[9px] font-bold tracking-wide text-neutral-500">GUESTS</p>
                        <p className="text-base font-extrabold">{guests}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold tracking-wide text-neutral-500">PAID</p>
                        <p className="text-base font-extrabold">{amount > 0 ? `₹${amount}` : '—'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold tracking-wide text-neutral-500">BOOKING</p>
                        <p className="text-base font-extrabold">#{code.slice(0, 4)}</p>
                    </div>
                </div>

                {hasNames && (
                    <>
                        <div className={divider} />
                        <div className="text-left">
                            <p className="text-[10px] font-bold tracking-widest text-neutral-500 mb-2">GUEST NAMES</p>
                            {TYPE_GROUPS.map((group) => {
                                const names = namesByType(group.type);
                                if (names.length === 0) return null;
                                return (
                                    <div key={group.type} className="mb-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-purple-600">{group.label}</p>
                                        <ul className="mt-0.5">
                                            {names.map((n, i) => (
                                                <li key={i} className="text-xs text-neutral-800 leading-relaxed">{n}</li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {hasEntryInfo && ev && (
                    <>
                        <div className={divider} />
                        <div className="text-left">
                            <p className="text-[10px] font-bold tracking-widest text-neutral-500 mb-2">ENTRY INFO — PLEASE FOLLOW</p>
                            {TYPE_GROUPS.map((group) => {
                                const lines = descriptionLines(ev[group.descKey]);
                                if (namesByType(group.type).length === 0 || lines.length === 0) return null;
                                return (
                                    <div key={group.type} className="mb-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-700">{group.label}</p>
                                        <ul className="mt-0.5 space-y-0.5">
                                            {lines.map((line, i) => (
                                                <li key={i} className="text-[11px] text-neutral-600 leading-snug">• {line}</li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});
