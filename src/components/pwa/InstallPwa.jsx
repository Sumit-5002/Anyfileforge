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
    const isIosInstallable = detectIosSafari() && !isStandalone();
    const [supportsPWA, setSupportsPWA] = useState(() => {
        if (typeof window === 'undefined') return false;
        if (window[DEFERRED_PROMPT_KEY]) return true;
        return detectIosSafari() && !isStandalone();
    });

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            window[DEFERRED_PROMPT_KEY] = e;
            setSupportsPWA(true);
            setPromptInstall(e);
        };

        const onInstalled = () => {
            window[DEFERRED_PROMPT_KEY] = null;
            setSupportsPWA(false);
            setPromptInstall(null);
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
            return;
        }

        promptInstall.prompt();
        await promptInstall.userChoice;
        window[DEFERRED_PROMPT_KEY] = null;
        setPromptInstall(null);
        setSupportsPWA(false);
    };

    if (!supportsPWA) {
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
