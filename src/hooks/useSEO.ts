import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    structuredData?: object | object[];
}

/**
 * SEO hook for React 19 — updates document title, meta tags,
 * Open Graph, Twitter Cards, canonical URL, and JSON-LD structured data.
 */
export function useSEO({ title, description, image, url, type = 'website', structuredData }: SEOProps) {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title;

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

        // Description
        if (description) {
            setMetaTag('description', description);
            setMetaTag('og:description', description, true);
            setMetaTag('twitter:description', description);
        }

        // Open Graph
        setMetaTag('og:title', title, true);
        setMetaTag('og:type', type, true);
        setMetaTag('og:site_name', 'Clubin', true);
        if (image) {
            setMetaTag('og:image', image, true);
            setMetaTag('twitter:image', image);
        }

        // Twitter Cards
        setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary');
        setMetaTag('twitter:title', title);

        // Canonical URL & OG URL
        const pageUrl = url || `https://clubin.co.in${window.location.pathname}`;
        setMetaTag('og:url', pageUrl, true);
        setMetaTag('twitter:url', pageUrl);

        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.href = pageUrl;

        // Structured data (JSON-LD) — supports single object or array of objects
        const scriptTags: HTMLScriptElement[] = [];
        if (structuredData) {
            const items = Array.isArray(structuredData) ? structuredData : [structuredData];
            for (const item of items) {
                const scriptTag = document.createElement('script');
                scriptTag.type = 'application/ld+json';
                scriptTag.text = JSON.stringify(item);
                scriptTag.setAttribute('data-seo-hook', 'true');
                document.head.appendChild(scriptTag);
                scriptTags.push(scriptTag);
            }
        }

        // Cleanup
        return () => {
            document.title = previousTitle;
            for (const tag of scriptTags) {
                document.head.removeChild(tag);
            }
        };
    }, [title, description, image, url, type, structuredData]);
}
