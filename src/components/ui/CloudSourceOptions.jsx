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

import cloudService from '../../services/cloudService';

function CloudSourceOptions({ layout = 'side', onFilesSelected }) {
    const handleCloudPick = async (key) => {
        try {
            let files = [];
            if (key === 'gdrive') {
                files = await cloudService.pickFromGoogleDrive();
            } else if (key === 'dropbox') {
                files = await cloudService.pickFromDropbox();
            } else {
                alert('Integration coming soon!');
                return;
            }

            if (files && files.length > 0) {
                onFilesSelected(files);
            }
        } catch (error) {
            console.error('Cloud selection error:', error);
            if (error.message !== 'Picker cancelled' && error.message !== 'Dropbox cancelled') {
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className={`cloud-options ${layout === 'inline' ? 'inline' : 'side'}`}>
            {CLOUD_SOURCES.map((source) => (
                <button
                    key={source.key}
                    type="button"
                    className={`cloud-btn-circle ${source.text ? 'cloud-btn-circle--text' : ''}`}
                    title={`${source.name} (Online mode - Paid)`}
                    aria-label={`Upload from ${source.name} (Online mode - Paid)`}
                    onClick={() => handleCloudPick(source.key)}
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
