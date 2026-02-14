import { useCallback, useState } from 'react';
import { formatFileSize } from '../../../utils/fileUtils';

export const useFileList = () => {
    const [files, setFiles] = useState([]);

    const addFiles = useCallback((newFiles) => {
        const fileObjects = newFiles.map((file) => ({
            id: Math.random().toString(36).slice(2),
            file,
            name: file.name,
            size: formatFileSize(file.size)
        }));
        setFiles((prev) => [...prev, ...fileObjects]);
    }, []);

    const removeFile = useCallback((id) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const clearFiles = useCallback(() => setFiles([]), []);

    const moveFile = useCallback((index, direction) => {
        setFiles((prev) => {
            const next = [...prev];
            const target = index + direction;
            if (target < 0 || target >= next.length) return prev;
            const [item] = next.splice(index, 1);
            next.splice(target, 0, item);
            return next;
        });
    }, []);

    return { files, addFiles, removeFile, clearFiles, moveFile, setFiles };
};
