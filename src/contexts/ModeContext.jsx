import React, { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

const detectStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const ModeProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isPwa, setIsPwa] = useState(() => detectStandalone());

    useEffect(() => {
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = () => setIsPwa(detectStandalone());

        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        mediaQuery.addEventListener?.('change', handleDisplayModeChange);

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
            mediaQuery.removeEventListener?.('change', handleDisplayModeChange);
        };
    }, []);

    // Logic: Default to Offline if PWA or actually offline. 
    // Otherwise, if online, allow server-mode for high-performance tasks.
    const effectiveMode = (isOnline && !isPwa) ? 'online' : 'offline';

    return (
        <ModeContext.Provider value={{ isOnline, isPwa, effectiveMode }}>
            {children}
        </ModeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMode = () => useContext(ModeContext);
