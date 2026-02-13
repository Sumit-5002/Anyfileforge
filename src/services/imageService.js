/**
 * Service to handle image manipulations using Canvas API
 */
const imageService = {
    /**
     * Converts an image to a different format
     * @param {File} file - Image file to convert
     * @param {string} targetFormat - Target format (e.g., 'image/jpeg', 'image/png', 'image/webp')
     * @param {number} quality - Quality for lossy formats (0 to 1)
     * @returns {Promise<Blob>} - Converted image Blob
     */
    async convertImage(file, targetFormat = 'image/jpeg', quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Canvas toBlob failed'));
                            }
                        },
                        targetFormat,
                        quality
                    );
                };
                img.onerror = () => reject(new Error('Image loading failed'));
                img.src = event.target.result;
            };
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsDataURL(file);
        });
    },

    /**
     * Resizes an image
     * @param {File} file - Image file to resize
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {Promise<Blob>} - Resized image Blob
     */
    async resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * Downloads a Blob as a file
     * @param {Blob} blob - Data to download
     * @param {string} filename - Desired filename
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export default imageService;
