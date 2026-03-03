import React, { useEffect, useState } from 'react';
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
    const isIosInstallable = detectIosSafari() && !isStandalone();
    const canUseServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;
    const shouldShowManualInstall = canUseServiceWorker && !isStandalone();

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            window[DEFERRED_PROMPT_KEY] = e;
            setPromptInstall(e);
        };

        const onInstalled = () => {
            window[DEFERRED_PROMPT_KEY] = null;
            setPromptInstall(null);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const onClick = async (evt) => {
        evt.preventDefault();

        if (isIosInstallable && !promptInstall) {
            alert('On iPhone/iPad, tap Share and then "Add to Home Screen" to install this app.');
            return;
        }

        if (!promptInstall) {
            alert('Install prompt is not ready yet. Use your browser menu and choose "Install app" or "Add to Home screen". In Chrome this appears in the address bar or 3-dot menu.');
            return;
        }

        promptInstall.prompt();
        await promptInstall.userChoice;
        window[DEFERRED_PROMPT_KEY] = null;
        setPromptInstall(null);
    };

    const shouldRenderButton = !isInstalled && (Boolean(promptInstall) || isIosInstallable || shouldShowManualInstall);

    if (!shouldRenderButton) {
        return null;
    }

    return (
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
    );
};

export default InstallPwa;
