// API client for fetching clubs and events from the backend

import { Club, Event, ShortLinkResponse, ShortLinkCreateResponse } from './types';

const API_BASE = 'https://api.clubin.info/api';

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
 * Fetch a single club by ID (includes upcoming events)
 */
export async function fetchClubDetails(id: string): Promise<Club> {
    const response = await fetch(`${API_BASE}/clubs/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch club details');
    }
    return response.json();
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
export const APP_STORE_URL = 'https://apps.apple.com/app/clubin/id123456789'; // Replace with actual ID
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
