import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import './InstallPwa.css';

const InstallPwa = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            console.log("we are being triggered :D");
            setSupportsPWA(true);
            setPromptInstall(e);
        };
        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("transitionend", handler);
    }, []);

    const onClick = (evt) => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        promptInstall.prompt();
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
