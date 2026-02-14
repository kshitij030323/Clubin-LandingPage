import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function VenueImageSlideshow({ images, venueName }: { images: string[]; venueName: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef(0);

    const goTo = useCallback((index: number) => {
        setCurrentIndex((index + images.length) % images.length);
    }, [images.length]);

    // Auto-advance every 4 seconds
    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => goTo(currentIndex + 1), 4000);
        return () => clearInterval(timer);
    }, [currentIndex, images.length, goTo]);

    if (images.length === 0) return null;

    return (
        <div className="relative w-full rounded-xl overflow-hidden group">
            {/* Images */}
            <div className="relative aspect-[16/9] overflow-hidden">
                {images.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`${venueName} - Photo ${idx + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                    />
                ))}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={() => goTo(currentIndex - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => goTo(currentIndex + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:bg-black/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </>
            )}

            {/* Dots */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goTo(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                        />
                    ))}
                </div>
            )}

            {/* Touch/swipe support */}
            <div
                className="absolute inset-0"
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                    const diff = touchStartX.current - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 50) {
                        goTo(currentIndex + (diff > 0 ? 1 : -1));
                    }
                }}
            />
        </div>
    );
}
