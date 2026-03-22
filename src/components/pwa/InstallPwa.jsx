import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download } from 'lucide-react';
import './InstallPwa.css';

const DEFERRED_PROMPT_KEY = '__anyfileforgeDeferredInstallPrompt';

const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const detectIosSafari = () => {
    const ua = window.navigator.userAgent || '';
    const isiOS = /iPhone|iPad|iPod/i.test(ua);
    const isWebKit = /WebKit/i.test(ua);
    const isCriOS = /CriOS/i.test(ua);
    const isFxiOS = /FxiOS/i.test(ua);
    return isiOS && isWebKit && !isCriOS && !isFxiOS;
};

const InstallPwa = () => {
    const [promptInstall, setPromptInstall] = useState(() => window[DEFERRED_PROMPT_KEY] || null);
    const [isInstalled, setIsInstalled] = useState(() => (typeof window !== 'undefined' ? isStandalone() : false));
    const [isBannerVisible, setIsBannerVisible] = useState(false);
    const [notification, setNotification] = useState(null);
    
    const isIosInstallable = detectIosSafari() && !isStandalone();
    const canUseServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
    const shouldShowManualInstall = !isStandalone();

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            window[DEFERRED_PROMPT_KEY] = e;
            setPromptInstall(e);
            
            // Auto-show banner if not installed and not dismissed
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

        // Check if app is NOT installed and was not dismissed
        const dismissed = localStorage.getItem('pwa_banner_dismissed');
        if (!isStandalone() && !dismissed) {
            setIsBannerVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 5000);
    };

    const onDismiss = () => {
        setIsBannerVisible(false);
        localStorage.setItem('pwa_banner_dismissed', 'true');
    };

    const onClick = async (evt) => {
        evt?.preventDefault();

        if (isIosInstallable && !promptInstall) {
            showNotification('Tap Share and then "Add to Home Screen" to install.');
            return;
        }

        if (!promptInstall) {
            showNotification('Install prompt is preparing...');
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

    const shouldRenderButton = !isInstalled && shouldShowManualInstall;

    return (
        <>
            {shouldRenderButton && (
                <button
                    className="install-pwa-btn"
                    id="setup_button"
                    aria-label="Install app"
                    title="Install App"
                    onClick={onClick}
                >
                    <Download size={20} />
                    Install App
                </button>
            )}

            {isBannerVisible && createPortal(
                <div className="pwa-auto-banner fade-in-up">
                    <div className="banner-content">
                        <div className="banner-icon">
                            <img src="/logo.png" alt="" />
                        </div>
                        <div className="banner-text">
                            <h3>Install AnyFileForge</h3>
                            <p>Get a faster, more secure desktop experience with offline access.</p>
                        </div>
                        <div className="banner-actions">
                            <button className="banner-btn-secondary" onClick={onDismiss}>Later</button>
                            <button className="banner-btn-primary" onClick={onClick}>Install Now</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {notification && createPortal(
                <div className="pwa-notification-toast fade-in-up">
                    {notification}
                </div>,
                document.body
            )}
        </>
    );
};

export default InstallPwa;
