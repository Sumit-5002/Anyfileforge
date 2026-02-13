import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SeoHead = ({
    title = 'AnyFileForge - The Ultimate Free File Processing Platform',
    description = 'Merge, split, compress, and edit PDFs and images completely client-side. Fast, secure, and 100% private. No uploads, no waiting.',
    path,
    type = 'website'
}) => {
    const location = useLocation();
    const currentPath = path || location.pathname;
    const url = `https://anyfileforge.com${currentPath}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content="https://anyfileforge.com/og-image.jpg" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content="https://anyfileforge.com/og-image.jpg" />
        </Helmet>
    );
};

export default SeoHead;
