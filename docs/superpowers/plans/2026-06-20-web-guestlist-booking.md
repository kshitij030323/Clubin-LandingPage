# Web Guestlist Booking + Entry Descriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show stag/couple/ladies entry descriptions on the event page and let users book a guestlist spot on the website via WhatsApp OTP, pay-at-venue, with a downloadable scanner-compatible QR ticket.

**Architecture:** Pure helpers (`src/lib/booking.ts`) are unit-tested with Vitest. Thin API wrappers (`src/api.ts`) hit the existing backend unchanged. A small `AuthProvider` persists the JWT in `localStorage`. A single `BookingModal` orchestrates the OTP → quantity → names → ticket steps; a `Ticket` component renders/export the QR ticket. `EventDetailPage` renders descriptions and opens the modal.

**Tech Stack:** React 19, react-router-dom 7, Tailwind 4, TypeScript (strict), Vitest (new dev dep), `qrcode.react` + `html-to-image` (new deps).

## Global Constraints

- Backend base URL: `https://api.clubin.info/api` (reuse `API_BASE` in `src/api.ts`). **No backend changes.**
- Auth header format: `Authorization: Bearer <token>`.
- Phone format sent to backend: `+91` + 10 digits (e.g. `+919876543210`).
- QR payload JSON shape (must match the app exactly so the existing scanner validates it):
  `{ bookingId: booking.id, code: <last 8 alphanumerics of qrCode, uppercased>, eventId: booking.eventId, guests: <couples*2+ladies+stags> }`.
- Pay-at-venue amount = entry prices only: `couples*couplePrice + ladies*ladiesPrice + stags*stagPrice`. No convenience fee / GST.
- `guests[]` element shape: `{ name, gender: 'male'|'female'|'couple', type: 'couple'|'lady'|'stag' }`; order is couples, then ladies, then stags.
- New deps limited to: `qrcode.react`, `html-to-image` (runtime), `vitest` (dev). No others.
- Copy: primary CTA reads "Get Tickets" (desktop) / "Get on Guestlist" (mobile); venue line reads "Pay ₹X at the venue" (or "Free entry" when amount is 0).
- localStorage access guarded with try/catch (prerender runs in a headless browser).

---

## Task 1: Booking types

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `Event.stagDescription?/coupleDescription?/ladiesDescription?: string`; `BookingGuest`, `Booking`, `AuthUser` interfaces.

- [ ] **Step 1: Add description fields to `Event`** (inside the `Event` interface, after `ladiesPrice` block):

```ts
    stagDescription?: string;
    coupleDescription?: string;
    ladiesDescription?: string;
```

- [ ] **Step 2: Add new exported types** at the end of `src/types.ts`:

```ts
export interface BookingGuest {
    name: string;
    gender: 'male' | 'female' | 'couple';
    type: 'couple' | 'lady' | 'stag';
}

export interface Booking {
    id: string;
    eventId: string;
    couples: number;
    ladies: number;
    stags: number;
    guests?: BookingGuest[] | null;
    status: string;
    qrCode: string;
    createdAt: string;
    event?: Event;
}

export interface AuthUser {
    id: string;
    phone: string;
    name: string;
    isAdmin?: boolean;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: add booking + entry description types"
```

---

## Task 2: Pure booking helpers (TDD)

**Files:**
- Create: `src/lib/booking.ts`
- Create: `src/lib/booking.test.ts`
- Modify: `package.json` (add `vitest` dev dep + `test` script)

**Interfaces:**
- Consumes: `Event`, `BookingGuest` from `../types`.
- Produces:
  - `GuestCounts = { couples: number; ladies: number; stags: number }`
  - `totalGuests(counts): number`
  - `calcAmountAtVenue(counts, event): number`
  - `descriptionLines(desc?): string[]`
  - `NameSlot = { label: string; type: 'couple'|'lady'|'stag' }`
  - `buildNameSlots(counts): NameSlot[]`
  - `buildGuestPayload(counts, names): BookingGuest[]`
  - `buildBookingCode(b): string`
  - `buildQrData(b, guests): string`

- [ ] **Step 1: Install Vitest and add script**

Run: `npm i -D vitest`
Then add to `package.json` `"scripts"`: `"test": "vitest run"`.

- [ ] **Step 2: Write the failing tests** — create `src/lib/booking.test.ts`:

```ts
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
        const ev = { couplePrice: 1000, ladiesPrice: 0, stagPrice: 500 } as any;
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './booking'` / functions not defined.

- [ ] **Step 4: Implement** — create `src/lib/booking.ts`:

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all in `booking.test.ts`).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/booking.ts src/lib/booking.test.ts
git commit -m "feat: add tested booking helpers + vitest"
```

---

## Task 3: Auth + booking API functions (TDD with mocked fetch)

**Files:**
- Modify: `src/api.ts`
- Create: `src/api.test.ts`

**Interfaces:**
- Consumes: `Booking`, `AuthUser`, `BookingGuest` from `./types`.
- Produces:
  - `sendOtp(phone): Promise<void>`
  - `VerifyOtpResult = { verified: boolean; isNewUser: boolean; user?: AuthUser; token?: string; message?: string }`
  - `verifyOtp(phone, otp): Promise<VerifyOtpResult>`
  - `AuthResult = { user: AuthUser; token: string }`
  - `phoneAuth(phone, name): Promise<AuthResult>`
  - `CreateBookingPayload = { eventId; couples; ladies; stags; guests: BookingGuest[] }`
  - `createBooking(token, payload): Promise<Booking>`

- [ ] **Step 1: Write the failing tests** — create `src/api.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendOtp, verifyOtp, phoneAuth, createBooking } from './api';

function mockFetch(status: number, body: unknown) {
    const fn = vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    });
    (globalThis as any).fetch = fn;
    return fn;
}

afterEach(() => vi.restoreAllMocks());

describe('sendOtp', () => {
    it('resolves on 2xx', async () => {
        mockFetch(200, { message: 'sent' });
        await expect(sendOtp('+919876543210')).resolves.toBeUndefined();
    });
    it('throws the API error message on failure', async () => {
        mockFetch(429, { error: 'Please wait 30 seconds before requesting a new OTP' });
        await expect(sendOtp('+919876543210')).rejects.toThrow('Please wait 30 seconds');
    });
});

describe('verifyOtp', () => {
    it('returns the parsed result for an existing user', async () => {
        mockFetch(200, { verified: true, isNewUser: false, user: { id: 'u1', phone: '+919876543210', name: 'A' }, token: 't' });
        const r = await verifyOtp('+919876543210', '123456');
        expect(r.token).toBe('t');
        expect(r.user?.name).toBe('A');
    });
    it('throws on invalid OTP', async () => {
        mockFetch(400, { error: 'Invalid OTP. Please try again.' });
        await expect(verifyOtp('+919876543210', '000000')).rejects.toThrow('Invalid OTP');
    });
});

describe('createBooking', () => {
    it('sends a Bearer token and returns the booking', async () => {
        const fn = mockFetch(201, { id: 'b1', qrCode: 'q', eventId: 'e1' });
        const b = await createBooking('tok', { eventId: 'e1', couples: 1, ladies: 0, stags: 0, guests: [] });
        expect(b.id).toBe('b1');
        const opts = fn.mock.calls[0][1];
        expect(opts.headers.Authorization).toBe('Bearer tok');
        expect(opts.method).toBe('POST');
    });
    it('throws the API error on 400', async () => {
        mockFetch(400, { error: 'Guestlist is closed for this event' });
        await expect(createBooking('tok', { eventId: 'e1', couples: 1, ladies: 0, stags: 0, guests: [] }))
            .rejects.toThrow('Guestlist is closed');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test src/api.test.ts`
Expected: FAIL — `sendOtp` etc. not exported.

- [ ] **Step 3: Implement** — add to the top of `src/api.ts` after the existing imports, update the import line to include the new types, and append the functions.

Update the import at the top:

```ts
import type { Club, Event, ShortLinkResponse, ShortLinkCreateResponse, PromoterPublicResponse, Booking, AuthUser, BookingGuest } from './types';
```

Append at the end of `src/api.ts`:

```ts
/* ───────────── Auth + Guestlist booking (web) ───────────── */

function extractApiError(data: unknown, fallback: string): string {
    const d = data as { error?: unknown; message?: string } | null;
    if (!d) return fallback;
    if (typeof d.error === 'string') return d.error;
    if (Array.isArray(d.error) && d.error.length) {
        return d.error.map((e: { message?: string }) => e?.message).filter(Boolean).join(', ') || fallback;
    }
    return d.message || fallback;
}

export interface VerifyOtpResult {
    verified: boolean;
    isNewUser: boolean;
    user?: AuthUser;
    token?: string;
    message?: string;
}

export interface AuthResult {
    user: AuthUser;
    token: string;
}

export interface CreateBookingPayload {
    eventId: string;
    couples: number;
    ladies: number;
    stags: number;
    guests: BookingGuest[];
}

/** Send a WhatsApp OTP to a phone in `+91XXXXXXXXXX` format. */
export async function sendOtp(phone: string): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
        throw new Error(extractApiError(await res.json().catch(() => null), 'Failed to send OTP'));
    }
}

/** Verify an OTP. Existing users get { user, token }; new users get { isNewUser: true }. */
export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(extractApiError(data, 'Invalid OTP'));
    return data as VerifyOtpResult;
}

/** Complete sign-up for a new user (after OTP verified) and get a token. */
export async function phoneAuth(phone: string, name: string): Promise<AuthResult> {
    const res = await fetch(`${API_BASE}/auth/phone-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(extractApiError(data, 'Could not complete sign-up'));
    return data as AuthResult;
}

/** Create a pay-at-venue guestlist booking. Requires a Bearer token. */
export async function createBooking(token: string, payload: CreateBookingPayload): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(extractApiError(data, 'Failed to create booking'));
    return data as Booking;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (booking + api suites).

- [ ] **Step 5: Commit**

```bash
git add src/api.ts src/api.test.ts
git commit -m "feat: add OTP auth + guestlist booking API functions"
```

---

## Task 4: Auth context + provider

**Files:**
- Create: `src/lib/auth.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `AuthUser` from `../types`.
- Produces: `useAuth(): { token: string|null; user: AuthUser|null; login(token, user): void; logout(): void }`; `AuthProvider`.

- [ ] **Step 1: Implement** — create `src/lib/auth.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';

const TOKEN_KEY = 'clubin_token';
const USER_KEY = 'clubin_user';

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

function readStored(): { token: string | null; user: AuthUser | null } {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const rawUser = localStorage.getItem(USER_KEY);
        return { token, user: rawUser ? (JSON.parse(rawUser) as AuthUser) : null };
    } catch {
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const stored = readStored();
        setToken(stored.token);
        setUser(stored.user);
    }, []);

    const login = (newToken: string, newUser: AuthUser) => {
        setToken(newToken);
        setUser(newUser);
        try {
            localStorage.setItem(TOKEN_KEY, newToken);
            localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        } catch { /* storage unavailable — keep in-memory */ }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } catch { /* ignore */ }
    };

    return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}
```

- [ ] **Step 2: Wire `AuthProvider` into `src/main.tsx`**

Add import:

```tsx
import { AuthProvider } from './lib/auth'
```

Wrap the router contents — replace the `<BrowserRouter>...</BrowserRouter>` block so it reads:

```tsx
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* ...all existing routes unchanged... */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.tsx src/main.tsx
git commit -m "feat: add auth provider with localStorage session"
```

---

## Task 5: Ticket component (QR + PNG export)

**Files:**
- Create: `src/components/booking/Ticket.tsx`
- Modify: `package.json` (add `qrcode.react`, `html-to-image`)

**Interfaces:**
- Consumes: `Booking` from `../../types`; `buildBookingCode`, `buildQrData`, `totalGuests` from `../../lib/booking`; `formatDate`, `formatTime` from `../../api`.
- Produces: `TicketCard` (forwardRef to the exportable card `div`), props `{ booking: Booking; amount: number }`.

- [ ] **Step 1: Install deps**

Run: `npm i qrcode.react html-to-image`

- [ ] **Step 2: Implement** — create `src/components/booking/Ticket.tsx`:

```tsx
import { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Booking } from '../../types';
import { buildBookingCode, buildQrData, totalGuests } from '../../lib/booking';
import { formatDate, formatTime } from '../../api';

interface TicketProps {
    booking: Booking;
    amount: number;
}

/** The exportable ticket card. Uses only same-origin assets so PNG export is clean. */
export const TicketCard = forwardRef<HTMLDivElement, TicketProps>(function TicketCard({ booking, amount }, ref) {
    const ev = booking.event;
    const guests = totalGuests({ couples: booking.couples, ladies: booking.ladies, stags: booking.stags });
    const code = buildBookingCode(booking);
    const qrData = buildQrData(booking, guests);

    return (
        <div ref={ref} className="bg-[#0a0a0a] p-5 flex flex-col items-center">
            <img src="/clubin-logo-header.webp" alt="Clubin" className="h-12 w-auto object-contain mb-3" width="192" height="128" />
            <div className="relative bg-white text-black rounded-2xl w-full max-w-[320px] p-6">
                <div className="text-center mb-4">
                    <p className="text-xl font-extrabold leading-tight">{ev?.title ?? 'Your Event'}</p>
                    <p className="text-xs font-semibold tracking-widest uppercase text-purple-600 mt-1">{ev?.club ?? ''}</p>
                    {ev && (
                        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-neutral-500 font-medium">
                            <span>{formatDate(ev.date)}</span>
                            <span>{formatTime(ev.startTime)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t-2 border-dashed border-neutral-200 my-4" />

                <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg">
                        <QRCodeCanvas value={qrData} size={150} bgColor="#ffffff" fgColor="#000000" level="M" />
                    </div>
                    <p className="font-mono text-xs text-neutral-500 mt-2">{code}</p>
                </div>

                <div className="border-t-2 border-dashed border-neutral-200 my-4" />

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-[9px] font-bold tracking-wide text-neutral-500">GUESTS</p>
                        <p className="text-base font-extrabold">{guests}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold tracking-wide text-neutral-500">PAY AT VENUE</p>
                        <p className="text-base font-extrabold">{amount > 0 ? `₹${amount}` : 'FREE'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold tracking-wide text-neutral-500">BOOKING</p>
                        <p className="text-base font-extrabold">#{code.slice(0, 4)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/booking/Ticket.tsx
git commit -m "feat: add downloadable QR ticket component"
```

---

## Task 6: Booking modal (OTP → quantity → names → ticket)

**Files:**
- Create: `src/components/booking/BookingModal.tsx`

**Interfaces:**
- Consumes: `useAuth`; `sendOtp`, `verifyOtp`, `phoneAuth`, `createBooking` from `../../api`; helpers from `../../lib/booking`; `TicketCard`.
- Produces: `BookingModal` with props `{ event: Event; open: boolean; onClose: () => void }`.

- [ ] **Step 1: Implement** — create `src/components/booking/BookingModal.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, Minus, Plus, Loader2, Download, Check, PartyPopper } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { Event, Booking } from '../../types';
import { useAuth } from '../../lib/auth';
import { sendOtp, verifyOtp, phoneAuth, createBooking } from '../../api';
import { TicketCard } from './Ticket';
import {
    totalGuests, calcAmountAtVenue, descriptionLines, buildNameSlots, buildGuestPayload,
    type GuestCounts,
} from '../../lib/booking';

type Step = 'phone' | 'otp' | 'name' | 'quantity' | 'names' | 'ticket';

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
    ticket: "You're on the list!",
};

export function BookingModal({ event, open, onClose }: { event: Event; open: boolean; onClose: () => void }) {
    const { token, user, login, logout } = useAuth();
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [counts, setCounts] = useState<GuestCounts>({ couples: 0, ladies: 0, stags: 0 });
    const [names, setNames] = useState<string[]>([]);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ticketRef = useRef<HTMLDivElement>(null);

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

    const handleConfirm = async () => {
        if (names.some((n) => !n.trim())) { setError('Please enter names for all guests'); return; }
        if (!token) { logout(); setStep('phone'); setError('Session expired, please verify your number again'); return; }
        setLoading(true); setError('');
        try {
            const guests = buildGuestPayload(counts, names);
            const b = await createBooking(token, {
                eventId: event.id, couples: counts.couples, ladies: counts.ladies, stags: counts.stags, guests,
            });
            setBooking(b); setStep('ticket');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to create booking';
            if (msg.toLowerCase().includes('token')) { logout(); setStep('phone'); setError('Session expired, please verify your number again'); }
            else setError(msg);
        } finally { setLoading(false); }
    };

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        try {
            const dataUrl = await toPng(ticketRef.current, { pixelRatio: 2, backgroundColor: '#0a0a0a', cacheBust: true });
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `clubin-ticket-${(booking?.qrCode || booking?.id || 'ticket').slice(-8)}.png`;
            a.click();
        } catch { setError('Could not download. Please screenshot the ticket instead.'); }
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
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget && step !== 'ticket') onClose(); }}
        >
            <div className="bg-[#120f1d] border border-purple-500/20 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300 text-white">
                <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {(step === 'otp' || step === 'name' || step === 'names') && (
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

                    {step === 'ticket' && booking && (
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mb-3">
                                <PartyPopper className="w-7 h-7 text-white" />
                            </div>
                            <p className="text-sm text-white/60 text-center mb-4">Show this QR at the venue. Pay {amount > 0 ? `₹${amount}` : 'nothing — free entry'} at the door.</p>
                            <div className="w-full rounded-2xl overflow-hidden">
                                <TicketCard ref={ticketRef} booking={booking} amount={amount} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer CTA (per step) */}
                {step === 'quantity' && (
                    <div className="p-4 border-t border-white/10 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-white/60">Pay at the venue</span>
                            <span className="text-lg font-bold text-purple-300">{amount > 0 ? `₹${amount}` : 'Free entry'}</span>
                        </div>
                        <button className={primaryBtn} disabled={total === 0} onClick={goToNames}>
                            Continue{total > 0 ? ` · ${total} ${total === 1 ? 'guest' : 'guests'}` : ''}
                        </button>
                    </div>
                )}
                {step === 'names' && (
                    <div className="p-4 border-t border-white/10 flex-shrink-0">
                        <button className={primaryBtn} disabled={loading} onClick={handleConfirm}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Get on Guestlist</>}
                        </button>
                    </div>
                )}
                {step === 'ticket' && (
                    <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-2">
                        <button className={primaryBtn} onClick={handleDownload}><Download className="w-5 h-5" /> Download Ticket</button>
                        <button className="w-full py-3 text-white/60 hover:text-white text-sm" onClick={onClose}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no errors. (If `event[row.priceKey]` indexing complains, the casts shown above resolve it.)

- [ ] **Step 3: Commit**

```bash
git add src/components/booking/BookingModal.tsx
git commit -m "feat: add web guestlist booking modal"
```

---

## Task 7: Wire into EventDetailPage (descriptions + open modal)

**Files:**
- Modify: `src/pages/EventDetailPage.tsx`

**Interfaces:**
- Consumes: `BookingModal`, `descriptionLines`.

- [ ] **Step 1: Add imports** near the top of `src/pages/EventDetailPage.tsx`:

```tsx
import { BookingModal } from '../components/booking/BookingModal';
import { descriptionLines } from '../lib/booking';
```

- [ ] **Step 2: Add modal state** — next to the other `useState` calls in the component:

```tsx
    const [showBooking, setShowBooking] = useState(false);
```

- [ ] **Step 3: Repoint `handleGetTickets`** — replace the existing `handleGetTickets` function body with:

```tsx
    const handleGetTickets = () => {
        if (!event) return;
        setShowBooking(true);
    };
```

- [ ] **Step 4: Show descriptions under the DESKTOP price cards.** In the desktop "Entry & Pricing" block, replace each of the three price cards so each shows its description bullets. Replace the Stags card with:

```tsx
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Stags</p>
                                            <p className="text-2xl font-bold text-green-400">₹{event.stagPrice}</p>
                                            {descriptionLines(event.stagDescription).length > 0 && (
                                                <ul className="mt-2 space-y-0.5 text-left">
                                                    {descriptionLines(event.stagDescription).map((line, i) => (
                                                        <li key={i} className="text-[11px] text-white/50">• {line}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
```

Apply the same pattern to the Couples card (`event.couplePrice`, `event.coupleDescription`) and Ladies card (`event.ladiesPrice`, `event.ladiesDescription`).

- [ ] **Step 5: Show descriptions under the MOBILE price cards.** In the mobile "Entry & Cover" block, add the same bullet list inside each of the three cards, after the existing `FREE` line. For the Stags card add:

```tsx
                                    {descriptionLines(event.stagDescription).length > 0 && (
                                        <ul className="mt-1.5 space-y-0.5 text-left">
                                            {descriptionLines(event.stagDescription).map((line, i) => (
                                                <li key={i} className="text-[9px] text-white/40 leading-snug">• {line}</li>
                                            ))}
                                        </ul>
                                    )}
```

Apply the same to Couples (`event.coupleDescription`) and Ladies (`event.ladiesDescription`).

- [ ] **Step 6: Change desktop button label** — in the desktop fixed footer button, change the open state text from `'Get Tickets on App'` to `'Get Tickets'`:

```tsx
                                {isGuestlistOpen ? 'Get Tickets' : 'Guestlist Closed'}
```

(The mobile button already reads "Get on Guestlist" — leave it.)

- [ ] **Step 7: Render the modal** — just before the closing `</div>` of the top-level returned element (next to the Share modal), add:

```tsx
            <BookingModal event={event} open={showBooking} onClose={() => setShowBooking(false)} />
```

- [ ] **Step 8: Typecheck + build**

Run: `npx tsc -b && npm run build:no-prerender`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/pages/EventDetailPage.tsx
git commit -m "feat: show entry descriptions and open web booking from event page"
```

---

## Task 8: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all booking + api tests PASS.

- [ ] **Step 2: Run the dev server and walk the flow**

Run: `npm run dev`, open an event page (`/events/<id>`).
Verify:
- Stag/Couple/Ladies descriptions render under the prices (desktop and a narrow viewport).
- "Get Tickets" opens the modal → phone → real WhatsApp OTP → quantity (descriptions shown) → names → "Get on Guestlist" → ticket with QR and "Pay ₹X at venue".
- "Download Ticket" saves a PNG.

- [ ] **Step 3: Confirm the booking is real**

Verify the new booking appears in the admin panel / club panel for that event, and (if possible) that the downloaded QR scans in the scanner app and shows the guest names.

- [ ] **Step 4: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "test: verify web guestlist booking end-to-end"
```

---

## Self-Review

**Spec coverage:**
- Entry descriptions on website → Task 1 (type) + Task 7 (render desktop+mobile). ✅
- WhatsApp OTP login → Task 3 (`sendOtp`/`verifyOtp`/`phoneAuth`) + Task 4 (session) + Task 6 (phone/otp/name steps). ✅
- Select couples/ladies/stags with descriptions → Task 6 (quantity step). ✅
- Pay-at-venue, entry-only amount → Task 2 (`calcAmountAtVenue`) + Task 6 footer/ticket. ✅
- Names + downloadable QR ticket → Task 6 (names step, download) + Task 5 (`TicketCard`). ✅
- Scanner-compatible QR → Task 2 (`buildQrData` exact JSON) + Task 5 (QR canvas), unit-tested. ✅
- Shows in admin/club panels → uses real `POST /bookings` (Task 3), verified Task 8. ✅
- Replace "Get Tickets on App" button → Task 7 step 3 + 6. ✅
- Error handling (429/400/401/network) → Task 3 (`extractApiError`, throws) + Task 6 (per-step catch, 401→re-auth). ✅

**Placeholder scan:** No TBD/TODO; every code step has full code. ✅

**Type consistency:** `GuestCounts`, `NameSlot`, `BookingGuest`, `Booking`, `AuthUser`, `VerifyOtpResult`, `AuthResult`, `CreateBookingPayload` used consistently across tasks; `buildQrData`/`buildBookingCode`/`calcAmountAtVenue`/`buildGuestPayload` signatures match call sites in Tasks 5–7. ✅
