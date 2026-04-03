import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';
import { useDeviceType } from '../../hooks/useDeviceType';
import './InstallPwa.css';

const DEFERRED_PROMPT_KEY = '__anyfileforgeDeferredInstallPrompt';

const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const InstallPwa = () => {
    const { isMobile } = useDeviceType();
    const [promptInstall, setPromptInstall] = useState(() => window[DEFERRED_PROMPT_KEY] || null);
    const [isInstalled, setIsInstalled] = useState(() => (typeof window !== 'undefined' ? isStandalone() : false));
    const [isBannerVisible, setIsBannerVisible] = useState(false);
    const [notification, setNotification] = useState(null);
    
    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 5000);
    };

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            window[DEFERRED_PROMPT_KEY] = e;
            setPromptInstall(e);
            
            // Only auto-show the banner on MOBILE to avoid "sucking" on laptops
            const dismissed = localStorage.getItem('pwa_banner_dismissed');
            if (!dismissed && !isStandalone()) {
                setIsBannerVisible(true);
            }
        };

        const onInstalled = () => {
            window[DEFERRED_PROMPT_KEY] = null;
            setPromptInstall(null);
            setIsInstalled(true);
            setIsBannerVisible(false);
            showNotification('AnyFileForge installed successfully!');
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, [isMobile]);

    const onDismiss = () => {
        setIsBannerVisible(false);
        localStorage.setItem('pwa_banner_dismissed', 'true');
    };

    const onClick = async (evt) => {
        evt?.preventDefault();
        if (!promptInstall) {
            showNotification('Install prompt is currently unavailable.');
            return;
        }

        promptInstall.prompt();
        const { outcome } = await promptInstall.userChoice;
        if (outcome === 'accepted') {
             setIsBannerVisible(false);
             window[DEFERRED_PROMPT_KEY] = null;
             setPromptInstall(null);
             setIsInstalled(true);
        }
    };

    if (isInstalled) return null;

    return (
        <div className="pwa-install-wrapper">
            <button
                className="install-pwa-btn"
                aria-label="Install for offline use"
                onClick={onClick}
            >
                <Download size={16} />
                <span className="desktop-only text-xs">Install</span>
            </button>

            {isBannerVisible && createPortal(
                <div className="pwa-auto-banner">
                    <div className="banner-content">
                        <div className="banner-text">
                            <h3>Install AnyFileForge</h3>
                            <p>Fast, offline, and secure.</p>
                        </div>
                        <div className="banner-actions">
                            <button className="banner-btn-secondary" onClick={onDismiss}>Later</button>
                            <button className="banner-btn-primary" onClick={onClick}>Install</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {notification && createPortal(
                <div className="pwa-notification-toast">
                    {notification}
                </div>,
                document.body
            )}
        </div>
    );
};

export default InstallPwa;
