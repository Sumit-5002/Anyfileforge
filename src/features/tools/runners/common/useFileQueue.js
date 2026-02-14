import { useCallback, useState } from 'react';

const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes)) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
};

const buildFileRecord = (file) => ({
    id: (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    file,
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type
});

export function useFileQueue() {
    const [files, setFiles] = useState([]);

    const addFiles = useCallback((fileList) => {
        const incoming = Array.from(fileList || []).map(buildFileRecord);
        setFiles((prev) => [...prev, ...incoming]);
    }, []);

    const replaceFiles = useCallback((fileList) => {
        const incoming = Array.from(fileList || []).map(buildFileRecord);
        setFiles(incoming);
    }, []);

    const removeFile = useCallback((id) => {
        setFiles((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
    }, []);

    const moveFile = useCallback((fromIndex, toIndex) => {
        setFiles((prev) => {
            if (fromIndex === toIndex) return prev;
            const next = [...prev];
            const [item] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, item);
            return next;
        });
    }, []);

    return {
        files,
        addFiles,
        replaceFiles,
        removeFile,
        clearFiles,
        moveFile
    };
}
