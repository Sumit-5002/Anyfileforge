import React, { useState, useEffect } from 'react';
import { Loader, Check } from 'lucide-react';
import './ToolWorkspace.css';

/**
 * Reusable Page Grid Component
 * Loads PDF and displays thumbnails
 */
function PageGrid({
    file,
    selectedPages,
    onTogglePage,
    rotations = {}, // pageNumber -> angle
    onRotatePage,
    onDeletePage,
    order = null // Optional custom order [3, 1, 2]
}) {
    const [pageData, setPageData] = useState([]); // Array of { pageNumber, thumbnail }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!file) return;
        loadPages();
    }, [file]);

    const loadPages = async () => {
        setLoading(true);
        try {
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            if (!pdfjsLib) return;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageCount = pdf.numPages;

            const thumbnails = [];
            for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                thumbnails.push({
                    pageNumber: i,
                    thumbnail: canvas.toDataURL()
                });
            }
            setPageData(thumbnails);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                >
                    <div className="page-item-preview" style={{ transform: `rotate(${rotations[page.pageNumber] || 0}deg)` }}>
                        {page.thumbnail ? <img src={page.thumbnail} alt="" /> : <div className="page-skeleton" />}

                        {selectedPages?.has(page.pageNumber) && (
                            <div className="selection-badge"><Check size={14} /></div>
                        )}

                        {onRotatePage && (
                            <button
                                className="page-rotate-btn"
                                title="Rotate"
                                onClick={(e) => { e.stopPropagation(); onRotatePage(page.pageNumber); }}
                            >
                                ⟳
                            </button>
                        )}

                        {onDeletePage && (
                            <button
                                className="page-remove-btn"
                                title="Remove"
                                onClick={(e) => { e.stopPropagation(); onDeletePage(page.pageNumber); }}
                            >
                                ×
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
