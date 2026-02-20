import { useState, useCallback, useMemo } from 'react';

/**
 * Hook to handle parallel file processing with concurrency limits
 * @param {Function} processFn - Function that processes a single file: (file) => Promise<Blob | void>
 * @param {number} concurrencyLimit - Number of files to process at once
 * @returns {Object} - State and handlers for file processing
 */
export function useParallelFileProcessor(processFn, concurrencyLimit = 5) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [failedIds, setFailedIds] = useState(new Set());

    const handleFilesSelected = useCallback((newFiles) => {
        const wrapped = newFiles.map(f => ({
            id: crypto.randomUUID(),
            file: f
        }));
        setFiles(prev => [...prev, ...wrapped]);
    }, []);

    const removeFile = useCallback((id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    const reset = useCallback(() => {
        setFiles([]);
        setCompletedIds(new Set());
        setFailedIds(new Set());
    }, []);

    const processFiles = useCallback(async () => {
        if (!files.length) return;

        setProcessing(true);
        setCompletedIds(new Set());
        setFailedIds(new Set());

        try {
            for (let i = 0; i < files.length; i += concurrencyLimit) {
                const chunk = files.slice(i, i + concurrencyLimit);
                await Promise.allSettled(chunk.map(async ({ id, file }) => {
                    try {
                        await processFn({ id, file });
                        setCompletedIds(prev => new Set(prev).add(id));
                    } catch (error) {
                        console.error(`Failed to process ${file.name}:`, error);
                        setFailedIds(prev => new Set(prev).add(id));
                    }
                }));
            }
        } finally {
            setProcessing(false);
        }
    }, [files, processFn, concurrencyLimit]);

    const toolFiles = useMemo(() => files.map(f => f.file), [files]);

    return {
        files,
        toolFiles,
        processing,
        completedIds,
        failedIds,
        handleFilesSelected,
        removeFile,
        reset,
        processFiles,
        setFiles
    };
}

export default useParallelFileProcessor;
