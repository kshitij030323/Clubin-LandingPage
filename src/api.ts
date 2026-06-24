// API client for fetching clubs and events from the backend

import type { Club, Event, ShortLinkResponse, ShortLinkCreateResponse, PromoterPublicResponse, Booking, AuthUser, BookingGuest, PaymentInitiateResponse, PaymentStatusResponse } from './types';

const API_BASE = 'https://api.clubin.info/api';

// Payments base URL. In dev only, VITE_PAYMENTS_API_BASE can repoint the PayU
// initiate/status calls at a local mock backend (see scripts/dev/mock-payu-server.mjs)
// so the full pay flow is testable before the real endpoints ship. Production
// always uses API_BASE.
const ENV = import.meta.env as unknown as { DEV?: boolean; VITE_PAYMENTS_API_BASE?: string };
const PAYMENTS_API_BASE = ENV.DEV && ENV.VITE_PAYMENTS_API_BASE ? ENV.VITE_PAYMENTS_API_BASE : API_BASE;

/**
 * Fetch all clubs, optionally filtered by city
 */
export async function fetchClubs(city?: string): Promise<Club[]> {
    const url = city
        ? `${API_BASE}/clubs?city=${encodeURIComponent(city)}`
        : `${API_BASE}/clubs`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch clubs');
    }
    return response.json();
}

/**
 * Fetch a single club by ID
 */
export async function fetchClubDetails(id: string): Promise<Club> {
    const response = await fetch(`${API_BASE}/clubs/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch club details');
    }
    return response.json();
}

/**
 * Fetch events for a specific club by fetching all events and filtering by clubId.
 * The /api/clubs/:id endpoint does not reliably include events.
 */
export async function fetchEventsByClubId(clubId: string): Promise<Event[]> {
    const response = await fetch(`${API_BASE}/events`);
    if (!response.ok) {
        throw new Error('Failed to fetch events');
    }
    const allEvents: Event[] = await response.json();
    return allEvents.filter((e) => e.clubId === clubId);
}

/**
 * Fetch all events, optionally filtered by city
 */
export async function fetchEvents(city?: string, upcoming: boolean = true): Promise<Event[]> {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (upcoming) params.set('upcoming', 'true');

    const url = `${API_BASE}/events?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch events');
    }
    return response.json();
}

/**
 * Fetch a single event by ID
 */
export async function fetchEventDetails(id: string): Promise<Event> {
    const response = await fetch(`${API_BASE}/events/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch event details');
    }
    return response.json();
}

/**
 * Fetch public promoter info + upcoming events
 */
export async function fetchPromoterPublic(promoterId: string): Promise<PromoterPublicResponse> {
    const response = await fetch(`${API_BASE}/promoter/public/${promoterId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch promoter info');
    }
    return response.json();
}

/**
 * Create a short link for an event or club (for social sharing)
 */
export async function createShortLink(
    type: 'event' | 'club',
    targetId: string
): Promise<ShortLinkCreateResponse> {
    const response = await fetch(`${API_BASE}/shortlinks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetId }),
    });
    if (!response.ok) {
        throw new Error('Failed to create short link');
    }
    return response.json();
}

/**
 * Resolve a short link code to get the full event/club data
 */
export async function resolveShortLink(code: string): Promise<ShortLinkResponse> {
    const response = await fetch(`${API_BASE}/shortlinks/${code}`);
    if (!response.ok) {
        throw new Error('Failed to resolve short link');
    }
    return response.json();
}

/**
 * Format date for display (e.g., "Sat, Feb 15")
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format time for display (e.g., "9:00 PM")
 */
export function formatTime(timeString: string): string {
    // Handle both ISO datetime and time-only strings
    const time = timeString.includes('T')
        ? new Date(timeString)
        : new Date(`1970-01-01T${timeString}`);

    return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Get the deep link URL for opening in the app
 */
export function getAppDeepLink(type: 'event' | 'club', id: string): string {
    return `clubin://${type}/${id}`;
}

/**
 * Get app store URLs for fallback
 */
// iOS app is in TestFlight beta for now — point downloads at the public TestFlight invite.
export const APP_STORE_URL = 'https://testflight.apple.com/join/5V54xug2';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kshitijdev02.afterhour';

/**
 * Check if user is on mobile device
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent
    );
}

/**
 * Try to open the app, fall back to store
 */
export function openInApp(type: 'event' | 'club', id: string): void {
    const deepLink = getAppDeepLink(type, id);
    const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    const storeUrl = isIOS ? APP_STORE_URL : PLAY_STORE_URL;

    // Try to open the app
    const start = Date.now();
    window.location.href = deepLink;

    // If app doesn't open within 2 seconds, redirect to store
    setTimeout(() => {
        if (Date.now() - start < 2500) {
            window.location.href = storeUrl;
        }
    }, 2000);
}

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

/** Fetch the signed-in user's bookings (for the "My Tickets" page). */
export async function fetchMyBookings(token: string): Promise<Booking[]> {
    const res = await fetch(`${API_BASE}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(extractApiError(data, 'Failed to load your tickets'));
    // Backend may return a bare array or a { bookings } wrapper.
    if (Array.isArray(data)) return data as Booking[];
    const wrapped = (data as { bookings?: Booking[] } | null)?.bookings;
    return Array.isArray(wrapped) ? wrapped : [];
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

/* ───────────── PayU payments (web) ───────────── */

export type InitiatePaymentPayload = CreateBookingPayload;

/**
 * Create a *pending* booking and get server-signed PayU hosted-checkout params.
 *
 * The backend creates the booking in a `pending` payment state, computes the
 * authoritative amount (guest subtotal + convenience fee — never trusts a
 * client-sent amount), generates the txnid + SHA-512 hash with the salt key,
 * and returns the complete form body to POST to PayU. The booking only becomes
 * confirmed once PayU's verified callback marks the payment `paid`.
 */
export async function initiatePayment(token: string, payload: InitiatePaymentPayload): Promise<PaymentInitiateResponse> {
    const res = await fetch(`${PAYMENTS_API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(extractApiError(data, 'Could not start payment'));
    return data as PaymentInitiateResponse;
}

/**
 * Fetch the authoritative payment + booking status for the return page.
 * We trust this — not the `status` query param PayU/our backend put in the
 * return URL — before showing a ticket.
 */
export async function fetchPaymentStatus(token: string, bookingId: string): Promise<PaymentStatusResponse> {
    const res = await fetch(`${PAYMENTS_API_BASE}/payments/status?bookingId=${encodeURIComponent(bookingId)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(extractApiError(data, 'Could not fetch payment status'));
    return data as PaymentStatusResponse;
}
