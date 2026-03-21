import React, { createContext, useContext, useState, useEffect } from 'react';

const ModeContext = createContext();

export const ModeProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isPwa, setIsPwa] = useState(false);

    useEffect(() => {
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);

        // Detect PWA / Installed mode
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsPwa(true);
        }

        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
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

export const useMode = () => useContext(ModeContext);
