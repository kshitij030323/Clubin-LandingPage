import { useEffect, type RefObject } from 'react';

/**
 * Defers loading the large background video until the page has fully loaded
 * and the browser is idle, so it never competes with the LCP poster image
 * for bandwidth. Skipped entirely for Save-Data and reduced-motion users
 * (the static poster remains as the background).
 */
export function useDeferredVideo(
    videoRef: RefObject<HTMLVideoElement | null>,
    src: string,
    onPlaying: (playing: boolean) => void,
) {
    useEffect(() => {
        if (!videoRef.current) return;

        // Respect user preferences — the poster image alone is fine
        const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
        if (conn?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let cancelled = false;
        const start = () => {
            const video = videoRef.current;
            if (cancelled || !video) return;
            video.src = src;
            video.play().then(() => { if (!cancelled) onPlaying(true); }).catch(() => { });
        };
        const whenIdle = () => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(start, { timeout: 2000 });
            } else {
                setTimeout(start, 300);
            }
        };
        if (document.readyState === 'complete') {
            whenIdle();
        } else {
            window.addEventListener('load', whenIdle, { once: true });
        }
        return () => {
            cancelled = true;
            window.removeEventListener('load', whenIdle);
        };
    }, [videoRef, src, onPlaying]);
}
