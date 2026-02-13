import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile devices.
 * Uses both window width and userAgent for reliable detection.
 */
export const useDeviceType = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const ua = navigator.userAgent;
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

            // Mobile if width is less than 768px OR user agent matches a mobile device
            setIsMobile(width < 768 || isMobileUA);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);

        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return { isMobile };
};
