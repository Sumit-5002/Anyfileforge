/**
 * Service to handle Cloud Storage Integrations (Google Drive, Dropbox, OneDrive)
 * Requires API keys in .env
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY;

const cloudService = {
    /**
     * Loads the Google Drive Picker
     * @returns {Promise<File[]>} - Selected files as File objects
     */
    async pickFromGoogleDrive() {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
            throw new Error('Google Drive API keys are not configured.');
        }

        return new Promise((resolve, reject) => {
            // Logic to load gapi, authenticate, and open picker
            // This is a complex flow that requires loading scripts
            this._loadGoogleScripts()
                .then(() => this._authenticateGoogle())
                .then((accessToken) => this._openGooglePicker(accessToken))
                .then((files) => resolve(files))
                .catch((err) => reject(err));
        });
    },

    /**
     * Loads Dropbox Chooser
     */
    async pickFromDropbox() {
        if (!DROPBOX_APP_KEY) {
            throw new Error('Dropbox API key is not configured.');
        }

        return new Promise((resolve, reject) => {
            if (!window.Dropbox) {
                const script = document.createElement('script');
                script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
                script.id = 'dropboxjs';
                script.setAttribute('data-app-key', DROPBOX_APP_KEY);
                script.onload = () => this._openDropboxChooser(resolve, reject);
                script.onerror = () => reject(new Error('Failed to load Dropbox script'));
                document.body.appendChild(script);
            } else {
                this._openDropboxChooser(resolve, reject);
            }
        });
    },

    // --- Private Helpers ---

    _loadGoogleScripts() {
        return new Promise((resolve, reject) => {
            if (window.gapi && window.google) {
                return resolve();
            }

            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.onload = () => {
                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                gisScript.onload = resolve;
                gisScript.onerror = reject;
                document.body.appendChild(gisScript);
            };
            gapiScript.onerror = reject;
            document.body.appendChild(gapiScript);
        });
    },

    _authenticateGoogle() {
        return new Promise((resolve, reject) => {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (response) => {
                    if (response.error !== undefined) {
                        reject(response);
                    }
                    resolve(response.access_token);
                },
            });
            tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    },

    _openGooglePicker(accessToken) {
        return new Promise((resolve, reject) => {
            window.gapi.load('picker', {
                callback: () => {
                    const picker = new window.google.picker.PickerBuilder()
                        .addView(window.google.picker.ViewId.DOCS)
                        .setOAuthToken(accessToken)
                        .setDeveloperKey(GOOGLE_API_KEY)
                        .setCallback(async (data) => {
                            if (data.action === window.google.picker.Action.PICKED) {
                                const doc = data.docs[0];
                                const url = `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;

                                try {
                                    const response = await fetch(url, {
                                        headers: { Authorization: `Bearer ${accessToken}` }
                                    });
                                    const blob = await response.blob();
                                    const file = new File([blob], doc.name, { type: doc.mimeType });
                                    resolve([file]);
                                } catch (err) {
                                    reject(err);
                                }
                            } else if (data.action === window.google.picker.Action.CANCEL) {
                                reject(new Error('Picker cancelled'));
                            }
                        })
                        .build();
                    picker.setVisible(true);
                }
            });
        });
    },

    _openDropboxChooser(resolve, reject) {
        window.Dropbox.choose({
            success: async (files) => {
                try {
                    const results = await Promise.all(files.map(async (f) => {
                        const response = await fetch(f.link);
                        const blob = await response.blob();
                        return new File([blob], f.name, { type: 'application/octet-stream' });
                    }));
                    resolve(results);
                } catch (err) {
                    reject(err);
                }
            },
            cancel: () => reject(new Error('Dropbox cancelled')),
            linkType: 'direct',
            multiselect: true,
        });
    }
};

export default cloudService;
