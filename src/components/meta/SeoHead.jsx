import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SeoHead = ({
    title = 'AnyFileForge - The Ultimate Free File Processing Platform',
    description = 'Merge, split, compress, and edit PDFs and images completely client-side. Fast, secure, and 100% private. No uploads, no waiting.',
    path,
    type = 'website'
}) => {
    const location = useLocation();
    const currentPath = path || location.pathname;
    const url = `https://anyfileforge.web.app${currentPath}`;

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const setMeta = (selector, attrs) => {
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('meta');
                document.head.appendChild(el);
            }
            Object.entries(attrs).forEach(([key, value]) => {
                el.setAttribute(key, value);
            });
        };

        const setLink = (selector, attrs) => {
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('link');
                document.head.appendChild(el);
            }
            Object.entries(attrs).forEach(([key, value]) => {
                el.setAttribute(key, value);
            });
        };

        document.title = title;

        setMeta('meta[name="description"]', { name: 'description', content: description });
        setLink('link[rel="canonical"]', { rel: 'canonical', href: url });

        setMeta('meta[property="og:type"]', { property: 'og:type', content: type });
        setMeta('meta[property="og:url"]', { property: 'og:url', content: url });
        setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
        setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
        setMeta('meta[property="og:image"]', { property: 'og:image', content: 'https://anyfileforge.web.app/og-image.jpg' });

        setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
        setMeta('meta[name="twitter:url"]', { name: 'twitter:url', content: url });
        setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
        setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
        setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: 'https://anyfileforge.web.app/og-image.jpg' });
    }, [title, description, url, type]);

    return null;
};

export default SeoHead;
