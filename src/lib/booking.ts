import type { Event, BookingGuest } from '../types';

export interface GuestCounts {
    couples: number;
    ladies: number;
    stags: number;
}

export function totalGuests(counts: GuestCounts): number {
    return counts.couples * 2 + counts.ladies + counts.stags;
}

export function calcAmountAtVenue(
    counts: GuestCounts,
    event: Pick<Event, 'couplePrice' | 'ladiesPrice' | 'stagPrice'>,
): number {
    return (
        counts.couples * (event.couplePrice ?? 0) +
        counts.ladies * (event.ladiesPrice ?? 0) +
        counts.stags * (event.stagPrice ?? 0)
    );
}

export function descriptionLines(desc?: string | null): string[] {
    if (!desc) return [];
    return desc.split('\n').map((l) => l.trim()).filter(Boolean);
}

export interface NameSlot {
    label: string;
    type: 'couple' | 'lady' | 'stag';
}

export function buildNameSlots(counts: GuestCounts): NameSlot[] {
    const slots: NameSlot[] = [];
    for (let i = 0; i < counts.couples; i++) slots.push({ label: `Couple ${i + 1}`, type: 'couple' });
    for (let i = 0; i < counts.ladies; i++) slots.push({ label: `Lady ${i + 1}`, type: 'lady' });
    for (let i = 0; i < counts.stags; i++) slots.push({ label: `Stag ${i + 1}`, type: 'stag' });
    return slots;
}

export function buildGuestPayload(counts: GuestCounts, names: string[]): BookingGuest[] {
    return buildNameSlots(counts).map((slot, i) => ({
        name: (names[i] ?? '').trim(),
        type: slot.type,
        gender: slot.type === 'couple' ? 'couple' : slot.type === 'lady' ? 'female' : 'male',
    }));
}

export function buildBookingCode(b: { qrCode?: string | null; id: string }): string {
    return (b.qrCode || b.id).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
}

export function buildQrData(b: { id: string; eventId: string; qrCode?: string | null }, guests: number): string {
    return JSON.stringify({
        bookingId: b.id,
        code: buildBookingCode(b),
        eventId: b.eventId,
        guests,
    });
}
