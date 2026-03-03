import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import './InstallPwa.css';

const DEFERRED_PROMPT_KEY = '__anyfileforgeDeferredInstallPrompt';

const InstallPwa = () => {
    const [promptInstall, setPromptInstall] = useState(() => window[DEFERRED_PROMPT_KEY] || null);
    const [supportsPWA, setSupportsPWA] = useState(() => Boolean(window[DEFERRED_PROMPT_KEY]));

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
