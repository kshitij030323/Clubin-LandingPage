import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article';
    structuredData?: object;
}

/**
 * Simple SEO hook for React 19 (replaces react-helmet-async)
 * Updates document title and meta tags
 */
export function useSEO({ title, description, image, type = 'website', structuredData }: SEOProps) {
    useEffect(() => {
        // Update title
        const previousTitle = document.title;
        document.title = title;

        // Helper to update or create meta tag
        const setMetaTag = (property: string, content: string, isOG = false) => {
            const attr = isOG ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, property);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        // Set description
        if (description) {
            setMetaTag('description', description);
            setMetaTag('og:description', description, true);
        }

        // Set Open Graph tags
        setMetaTag('og:title', title, true);
        setMetaTag('og:type', type, true);
        if (image) {
            setMetaTag('og:image', image, true);
        }

        // Add structured data
        let scriptTag: HTMLScriptElement | null = null;
        if (structuredData) {
            scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            scriptTag.text = JSON.stringify(structuredData);
            document.head.appendChild(scriptTag);
        }

        // Cleanup
        return () => {
            document.title = previousTitle;
            if (scriptTag) {
                document.head.removeChild(scriptTag);
            }
        };
    }, [title, description, image, type, structuredData]);
}
