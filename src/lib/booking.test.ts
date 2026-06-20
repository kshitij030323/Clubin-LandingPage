import { describe, it, expect } from 'vitest';
import {
    totalGuests, calcAmountAtVenue, descriptionLines,
    buildNameSlots, buildGuestPayload, buildBookingCode, buildQrData,
} from './booking';

describe('totalGuests', () => {
    it('counts each couple as two people', () => {
        expect(totalGuests({ couples: 2, ladies: 1, stags: 3 })).toBe(8);
    });
});

describe('calcAmountAtVenue', () => {
    it('sums entry prices only (no fees)', () => {
        const ev = { couplePrice: 1000, ladiesPrice: 0, stagPrice: 500 } as never;
        expect(calcAmountAtVenue({ couples: 2, ladies: 3, stags: 1 }, ev)).toBe(2500);
    });
});

describe('descriptionLines', () => {
    it('splits on newline, trims, drops empties', () => {
        expect(descriptionLines('a\n  b  \n\n c')).toEqual(['a', 'b', 'c']);
        expect(descriptionLines(undefined)).toEqual([]);
    });
});

describe('buildNameSlots', () => {
    it('orders couples, ladies, then stags with 1-based labels', () => {
        expect(buildNameSlots({ couples: 1, ladies: 2, stags: 1 })).toEqual([
            { label: 'Couple 1', type: 'couple' },
            { label: 'Lady 1', type: 'lady' },
            { label: 'Lady 2', type: 'lady' },
            { label: 'Stag 1', type: 'stag' },
        ]);
    });
});

describe('buildGuestPayload', () => {
    it('maps gender by type and trims names in slot order', () => {
        expect(buildGuestPayload({ couples: 1, ladies: 1, stags: 1 }, ['  A & B ', 'Lady', 'Stag'])).toEqual([
            { name: 'A & B', gender: 'couple', type: 'couple' },
            { name: 'Lady', gender: 'female', type: 'lady' },
            { name: 'Stag', gender: 'male', type: 'stag' },
        ]);
    });
});

describe('buildBookingCode', () => {
    it('uppercases the last 8 alphanumerics of qrCode', () => {
        expect(buildBookingCode({ qrCode: 'abcd1234-ef56-7890', id: 'x' })).toBe('EF567890');
    });
    it('falls back to id when qrCode missing', () => {
        expect(buildBookingCode({ qrCode: '', id: 'zzzz9999' })).toBe('ZZZZ9999');
    });
});

describe('buildQrData', () => {
    it('produces the app-compatible JSON shape', () => {
        const data = buildQrData({ id: 'bid', eventId: 'eid', qrCode: 'aaaaaaaa1234' }, 5);
        expect(JSON.parse(data)).toEqual({ bookingId: 'bid', code: 'AAAA1234', eventId: 'eid', guests: 5 });
    });
});
