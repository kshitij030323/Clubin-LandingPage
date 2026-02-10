// Club and Event types matching the API response format

export interface Club {
    id: string;
    name: string;
    location: string;
    address?: string;
    mapUrl?: string;
    description?: string;
    imageUrl: string;
    floorplanUrl?: string;
    createdAt: string;
    updatedAt: string;
    events?: Event[];
    tables?: ClubTable[];
    _count?: {
        events: number;
    };
}

export interface Event {
    id: string;
    title: string;
    club: string;
    clubId?: string;
    location: string;
    description: string;
    rules?: string;
    genre: string;
    imageUrl: string;
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
    };
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
}

export const CITIES: City[] = [
    { id: 'Bengaluru', label: 'Bengaluru', icon: 'building-2' },
    { id: 'Delhi NCR', label: 'Delhi/NCR', icon: 'landmark' },
    { id: 'Goa', label: 'Goa', icon: 'palmtree' },
    { id: 'Mumbai', label: 'Mumbai', icon: 'building' },
    { id: 'Pune', label: 'Pune', icon: 'castle' },
    { id: 'Hyderabad', label: 'Hyderabad', icon: 'circle-dot' },
    { id: 'Chandigarh', label: 'Chandigarh', icon: 'tree-pine' },
    { id: 'Jaipur', label: 'Jaipur', icon: 'crown' },
    { id: 'Chennai', label: 'Chennai', icon: 'waves' },
];
