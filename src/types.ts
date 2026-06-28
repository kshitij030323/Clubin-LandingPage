// Club and Event types matching the API response format

export interface Promoter {
    id: string;
    name: string;
    logoUrl?: string | null;
    instagramUrl?: string | null;
    region?: string;
}

export interface PromoterClub {
    id: string;
    promoterId: string;
    clubId: string;
    promoter: Promoter;
}

export interface Club {
    id: string;
    name: string;
    location: string;
    address?: string;
    mapUrl?: string;
    description?: string;
    imageUrl: string;
    venueImages?: string[];
    instagramUrl?: string | null;
    floorplanUrl?: string;
    createdAt: string;
    updatedAt: string;
    events?: Event[];
    tables?: ClubTable[];
    promoterClubs?: PromoterClub[];
    _count?: {
        events: number;
        promoterClubs?: number;
        scannerUsers?: number;
    };
}

export interface Event {
    id: string;
    title: string;
    club: string;
    clubId?: string;
    promoterId?: string | null;
    location: string;
    description: string;
    rules?: string;
    genre: string;
    imageUrl: string;
    bannerUrl?: string | null;
    videoUrl?: string;
    gallery?: string[];
    price: number;
    priceLabel: string;
    stagPrice: number;
    couplePrice: number;
    ladiesPrice: number;
    originalStagPrice?: number | null;
    originalCouplePrice?: number | null;
    originalLadiesPrice?: number | null;
    stagDescription?: string;
    coupleDescription?: string;
    ladiesDescription?: string;
    date: string;
    startTime: string;
    endTime: string;
    guestlistStatus: 'open' | 'closing' | 'closed';
    guestlistLimit?: number | null;
    closingThreshold?: number | null;
    guestlistCloseTime?: string | null;
    guestlistCloseOnStart?: boolean;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
    clubRef?: {
        id: string;
        name: string;
        address?: string;
        mapUrl?: string;
        floorplanUrl?: string;
        imageUrl?: string;
        venueImages?: string[];
        instagramUrl?: string | null;
    };
    promoterRef?: Promoter | null;
    eventTables?: EventTable[];
    spotsRemaining?: number;

    _count?: {
        bookings: number;
    };
}

export interface ClubTable {
    id: string;
    clubId: string;
    name: string;
    capacity: number;
    basePrice: number;
    description?: string;
}

export interface EventTable {
    id: string;
    eventId: string;
    clubTableId: string;
    price: number;
    originalPrice?: number | null;
    available: boolean;
    clubTable?: ClubTable;
}

export interface PromoterPublicResponse {
    promoter: Promoter;
    events: Pick<Event, 'id' | 'title' | 'club' | 'location' | 'imageUrl' | 'date' | 'startTime' | 'endTime' | 'genre' | 'price' | 'priceLabel' | 'guestlistStatus'>[];
}

export interface ShortLinkResponse {
    type: 'event' | 'club';
    targetId: string;
    data: Event | Club;
}

export interface ShortLinkCreateResponse {
    code: string;
    shortUrl: string;
}

// City type for location selection
export interface City {
    id: string;
    label: string;
    icon: string; // Icon name for Lucide
    searchKey?: string; // Override for API city filter when it differs from id
}

export const CITIES: City[] = [
    { id: 'Bengaluru', label: 'Bengaluru', icon: 'building-2' },
    { id: 'Delhi NCR', label: 'Delhi/NCR', icon: 'landmark', searchKey: 'Delhi' },
    { id: 'Goa', label: 'Goa', icon: 'palmtree' },
    { id: 'Mumbai', label: 'Mumbai', icon: 'building' },
    { id: 'Pune', label: 'Pune', icon: 'castle' },
    { id: 'Hyderabad', label: 'Hyderabad', icon: 'circle-dot' },
    { id: 'Chandigarh', label: 'Chandigarh', icon: 'tree-pine' },
    { id: 'Jaipur', label: 'Jaipur', icon: 'crown' },
    { id: 'Chennai', label: 'Chennai', icon: 'waves' },
];

// Web guestlist booking + auth types
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

// ───────────── PayU payment integration ─────────────

export type BookingPaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

/**
 * The PayU hosted-checkout form body. This is built and SHA-512–signed entirely
 * on the backend (the salt key never reaches the browser); the client posts it
 * verbatim. Keys are PayU field names (key, txnid, amount, hash, firstname, …).
 */
export type PayuParams = Record<string, string>;

export interface PaymentBreakdown {
    /** Sum of guest prices (couples/ladies/stags) for the booking. */
    subtotal: number;
    /** Platform/convenience fee — admin-controlled, always > 0 so nothing is free. */
    convenienceFee: number;
    /** Central GST (9%) on the ticket subtotal. */
    cgst: number;
    /** State GST (9%) on the ticket subtotal. */
    sgst: number;
    /** Amount actually charged via PayU = subtotal + convenienceFee + cgst + sgst. */
    total: number;
}

/** Response from POST /api/payments/initiate — a pending booking + signed PayU params. */
export interface PaymentInitiateResponse {
    bookingId: string;
    txnid: string;
    /** Total amount as a 2-dp string, matching `params.amount`. */
    amount: string;
    breakdown: PaymentBreakdown;
    /** PayU hosted-checkout URL to POST `params` to (test or production). */
    action: string;
    /** Complete, server-signed form body to post to `action`. */
    params: PayuParams;
}

/** Response from GET /api/payments/status — authoritative payment + booking state. */
export interface PaymentStatusResponse {
    bookingId: string;
    paymentStatus: BookingPaymentStatus;
    /** Full booking (incl. event + guests) so the ticket can be rendered after payment. */
    booking: Booking;
    breakdown?: PaymentBreakdown;
}
