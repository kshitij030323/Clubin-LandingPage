import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Club, Event } from '../types';
import { fetchClubDetails, formatDate, formatTime } from '../api';
import { useSEO } from '../hooks/useSEO';
import { MapPin, ArrowLeft, Calendar, Clock, Loader2, ExternalLink } from 'lucide-react';

export function ClubDetailPage() {
    const { clubId } = useParams<{ city: string; clubId: string }>();
    const navigate = useNavigate();
    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadClub() {
            if (!clubId) return;
            try {
                setLoading(true);
                setError(null);
                const data = await fetchClubDetails(clubId);
                setClub(data);
            } catch (err) {
                setError('Failed to load club details. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadClub();
    }, [clubId]);

    // SEO
    useSEO({
        title: club ? `${club.name} - Nightclub in ${club.location} | Clubin` : 'Club | Clubin',
        description: club ? `${club.name} in ${club.location}. ${club.description || 'Book guestlists and VIP tables on Clubin.'}` : undefined,
        image: club?.imageUrl,
        structuredData: club ? {
            '@context': 'https://schema.org',
            '@type': 'NightClub',
            name: club.name,
            address: club.address || club.location,
            image: club.imageUrl,
            description: club.description,
        } : undefined,
    });

    // Filter upcoming events
    const upcomingEvents = club?.events?.filter(
        (e) => new Date(e.date) >= new Date()
    ) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error || !club) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
                <p className="text-red-400 mb-4">{error || 'Club not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-manrope">

            {/* Hero Image */}
            <div className="relative h-64 md:h-96">
                <img
                    src={club.imageUrl}
                    alt={club.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Club Info */}
            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-[#120f1d]/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{club.name}</h1>
                    <div className="flex items-center gap-2 text-white/70 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{club.location}</span>
                        {club.address && (
                            <>
                                <span className="text-white/30">•</span>
                                <span className="text-sm">{club.address}</span>
                            </>
                        )}
                    </div>
                    {club.description && (
                        <p className="text-white/60 leading-relaxed">{club.description}</p>
                    )}

                    {club.mapUrl && (
                        <a
                            href={club.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 text-sm"
                        >
                            View on Map <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {/* Upcoming Events */}
                <section className="pb-16">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        Upcoming Events
                        {upcomingEvents.length > 0 && (
                            <span className="text-sm text-white/60 font-normal">
                                ({upcomingEvents.length})
                            </span>
                        )}
                    </h2>

                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-12 text-white/50 bg-[#120f1d]/50 rounded-2xl border border-purple-500/10">
                            No upcoming events at this club
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingEvents.map((event: Event) => (
                                <Link
                                    key={event.id}
                                    to={`/events/${event.id}`}
                                    className="group block overflow-hidden rounded-2xl bg-[#120f1d]/80 backdrop-blur-xl border border-purple-500/20 transition-all duration-300 hover:border-purple-500/50"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        {/* Event Image */}
                                        <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0 overflow-hidden">
                                            <img
                                                src={event.imageUrl}
                                                alt={event.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        {/* Event Info */}
                                        <div className="flex-1 p-4">
                                            <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                                                {event.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-3 text-sm text-white/60">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(event.date)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatTime(event.startTime)}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-sm text-purple-400">
                                                    {event.priceLabel || `₹${event.price}`}
                                                </span>
                                                {event.guestlistStatus === 'open' && (
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                        Guestlist Open
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-40 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
