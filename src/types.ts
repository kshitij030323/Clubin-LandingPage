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
        imageUrl?: string;
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
    icon: string; // Emoji or icon name
}

export const CITIES: City[] = [
    { id: 'Bengaluru', label: 'Bengaluru', icon: '🏛️' },
    { id: 'Delhi NCR', label: 'Delhi/NCR', icon: '🏢' },
    { id: 'Goa', label: 'Goa', icon: '🏖️' },
    { id: 'Mumbai', label: 'Mumbai', icon: '🌆' },
    { id: 'Pune', label: 'Pune', icon: '🏰' },
    { id: 'Hyderabad', label: 'Hyderabad', icon: '🕌' },
    { id: 'Chandigarh', label: 'Chandigarh', icon: '🌳' },
    { id: 'Jaipur', label: 'Jaipur', icon: '👑' },
    { id: 'Chennai', label: 'Chennai', icon: '🛕' },
];
