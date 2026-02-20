import { useState, useCallback, useMemo } from 'react';

/**
 * Hook to handle parallel file processing with concurrency limits.
 *
 * @param {Function} processFn - Function that processes a single file: ({ id, file }) => Promise<Blob | void>
 * @param {number} concurrencyLimit - Number of files to process at once (default: 5)
 * @returns {Object} An object containing:
 *   - files {Array}: Array of wrapped file objects { id, file }
 *   - toolFiles {Array}: Array of raw File objects
 *   - processing {boolean}: Whether processing is currently active
 *   - completedIds {Set}: Set of successfully processed file IDs
 *   - failedIds {Set}: Set of failed file IDs
 *   - handleFilesSelected {Function}: Handler to add new files to the list
 *   - removeFile {Function}: Handler to remove a file and clean up its status
 *   - reset {Function}: Resets all state
 *   - processFiles {Function}: Starts the parallel processing of the current file list
 */
export function useParallelFileProcessor(processFn, concurrencyLimit = 5) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [failedIds, setFailedIds] = useState(new Set());

    /**
     * Wraps raw File objects with unique IDs and adds them to state.
     */
    const handleFilesSelected = useCallback((newFiles) => {
        const wrapped = newFiles.map(f => ({
            id: crypto.randomUUID(),
            file: f
        }));
        setFiles(prev => [...prev, ...wrapped]);
    }, []);

    /**
     * Removes a file by ID and cleans up its completion/failure status.
     */
    const removeFile = useCallback((id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        setCompletedIds(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setFailedIds(prev => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    /**
     * Resets the entire processor state.
     */
    const reset = useCallback(() => {
        setFiles([]);
        setCompletedIds(new Set());
        setFailedIds(new Set());
    }, []);

    /**
     * Processes all current files in parallel chunks.
     * Captures a snapshot of files at the start to ensure consistency if new files are added during processing.
     */
    const processFiles = useCallback(async () => {
        // Capture a snapshot of current files to process (Bolt ⚡)
        const filesSnapshot = [...files];
        if (!filesSnapshot.length) return;

        setProcessing(true);
        setCompletedIds(new Set());
        setFailedIds(new Set());

        try {
            for (let i = 0; i < filesSnapshot.length; i += concurrencyLimit) {
                const chunk = filesSnapshot.slice(i, i + concurrencyLimit);
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
        processFiles
    };
}

export default useParallelFileProcessor;
