import React, { useState, useEffect, useCallback } from 'react';
import { Loader, Check, RotateCw, X } from 'lucide-react';
import './ToolWorkspace.css';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js Worker using local bundle for reliability (Bolt ⚡)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function PageGrid({
    file,
    selectedPages,
    onTogglePage,
    rotations = {}, // pageNumber -> angle
    onRotatePage,
    onDeletePage,
    onReorder,
    order = null // Optional custom order [3, 1, 2]
}) {
    const [pageData, setPageData] = useState([]); // Array of { pageNumber, thumbnail }
    const [loading, setLoading] = useState(false);

    const loadPages = useCallback(async (abortController) => {
        if (!file) return;
        setLoading(true);
        setPageData([]); // Reset for new file selection
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });

            // Allow cancelling the loading task itself
            abortController.signal.addEventListener('abort', () => {
                loadingTask.destroy();
            });

            const pdf = await loadingTask.promise;
            const pageCount = pdf.numPages;

            // Render pages in parallel chunks for better speed and incremental UX (Bolt ⚡)
            const CHUNK_SIZE = 4;
            for (let i = 1; i <= pageCount; i += CHUNK_SIZE) {
                if (abortController.signal.aborted) return;

                const chunkIndices = [];
                for (let j = i; j < i + CHUNK_SIZE && j <= pageCount; j++) {
                    chunkIndices.push(j);
                }

                const chunkThumbnails = await Promise.all(chunkIndices.map(async (pageNum) => {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 0.25 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    return {
                        pageNumber: pageNum,
                        thumbnail: canvas.toDataURL('image/webp', 0.8)
                    };
                }));

                if (abortController.signal.aborted) return;

                // Append chunk results incrementally
                setPageData(prev => [...prev, ...chunkThumbnails]);

                // Hide main loader after the first chunk to show progress
                if (i === 1) setLoading(false);
            }
        } catch (err) {
            if (err.name === 'AbortError' || err.message?.includes('cancelled')) return;
            console.error('Failed to load PDF pages:', err);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }, [file]);

    useEffect(() => {
        const abortController = new AbortController();
        loadPages(abortController);
        return () => abortController.abort();
    }, [loadPages]);

    const [draggedItem, setDraggedItem] = useState(null);

    // Native Drag and Drop Handlers
    const handleDragStart = (e, pageNum) => {
        setDraggedItem(pageNum);
        e.dataTransfer.effectAllowed = 'move';
        // Add a ghost image or simple styling if needed
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetPageNum) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === targetPageNum) return;

        if (onReorder) {
            onReorder(draggedItem, targetPageNum);
        }
        setDraggedItem(null);
    };

    if (loading) return (
        <div className="loader-center">
            <Loader className="spinning" size={32} />
            <p className="mt-2">Loading pages...</p>
        </div>
    );

    // Filter and sort pages based on current order
    const displayPages = order
        ? order.map(num => pageData.find(p => p.pageNumber === num)).filter(Boolean)
        : pageData;

    return (
        <div className="pages-grid">
            {displayPages.map(page => (
                <div
                    key={page.pageNumber}
                    className={`page-item-card ${selectedPages?.has(page.pageNumber) ? 'selected' : ''}`}
                    onClick={() => onTogglePage && onTogglePage(page.pageNumber)}
                    onKeyDown={(e) => onTogglePage && (e.key === 'Enter' || e.key === ' ') && onTogglePage(page.pageNumber)}
                    role={onTogglePage ? "button" : undefined}
                    tabIndex={onTogglePage ? "0" : undefined}
                    aria-label={`Page ${page.pageNumber}${selectedPages?.has(page.pageNumber) ? ', selected' : ''}`}
                    draggable={!!onReorder}
                    onDragStart={(e) => handleDragStart(e, page.pageNumber)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, page.pageNumber)}
                >
                    <div className="page-item-preview" style={{ transform: `rotate(${rotations[page.pageNumber] || 0}deg)` }}>
                        {page.thumbnail ? <img src={page.thumbnail} alt="" /> : <div className="page-skeleton" />}

                        {selectedPages?.has(page.pageNumber) && (
                            <div className="selection-badge"><Check size={14} /></div>
                        )}

                        {onRotatePage && (
                            <button
                                className="page-rotate-btn"
                                title="Rotate Page"
                                aria-label={`Rotate Page ${page.pageNumber}`}
                                onClick={(e) => { e.stopPropagation(); onRotatePage(page.pageNumber); }}
                            >
                                <RotateCw size={14} />
                            </button>
                        )}

                        {onDeletePage && (
                            <button
                                className="page-remove-btn"
                                title="Remove Page"
                                aria-label={`Remove Page ${page.pageNumber}`}
                                onClick={(e) => { e.stopPropagation(); onDeletePage(page.pageNumber); }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="page-item-label">Page {page.pageNumber}</div>
                </div>
            ))}
        </div>
    );
}

export default PageGrid;
