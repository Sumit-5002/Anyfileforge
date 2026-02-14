import React from 'react';
import './CloudSourceOptions.css';

const CLOUD_SOURCES = [
    {
        key: 'gdrive',
        name: 'Google Drive',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg'
    },
    {
        key: 'dropbox',
        name: 'Dropbox',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg'
    },
    {
        key: 'onedrive',
        name: 'OneDrive',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Microsoft_Office_OneDrive_%282019-present%29.svg'
    },
    {
        key: 'ilovepdf',
        name: 'iLovePDF',
        text: 'iLPDF'
    }
];

function CloudSourceOptions({ layout = 'side' }) {
    return (
        <div className={`cloud-options ${layout === 'inline' ? 'inline' : 'side'}`}>
            {CLOUD_SOURCES.map((source) => (
                <button
                    key={source.key}
                    type="button"
                    className={`cloud-btn-circle ${source.text ? 'cloud-btn-circle--text' : ''}`}
                    title={`${source.name} (Online mode - Paid)`}
                    aria-label={`Upload from ${source.name} (Online mode - Paid)`}
                >
                    {source.icon ? (
                        <img src={source.icon} alt="" aria-hidden="true" />
                    ) : (
                        <span className="cloud-btn-text" aria-hidden="true">{source.text}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default CloudSourceOptions;
