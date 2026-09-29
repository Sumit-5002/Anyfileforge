import React, { useState, useEffect, useRef } from 'react';
import { 
    ArrowDownAZ, 
    ArrowDownZA, 
    ArrowDown10, 
    ArrowDown01, 
    ArrowUpDown, 
    Check 
} from 'lucide-react';
import { SORT_OPTIONS, sortFiles } from '../../../utils/fileSortUtils';
import './FileSortBar.css';

/**
 * FileSortBar - Compact Circular Icon Button for Auto Sorting PDFs.
 * Matches user's circular A-Z icon button design.
 * 
 * Takes minimal space, sits in the toolbar, and opens a quick sort dropdown.
 * 
 * @param {Array} files - The array of files to sort
 * @param {Function} onSort - Callback receiving sorted array and sortId
 * @param {string} className - Additional CSS class
 */
export default function FileSortBar({
    files = [],
    onSort,
    className = '',
    idPrefix = 'sort'
}) {
    const [activeSort, setActiveSort] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [justSorted, setJustSorted] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    if (!files || files.length <= 1) return null;

    const handleApplySort = (sortId) => {
        const sorted = sortFiles(files, sortId);
        setActiveSort(sortId);
        setJustSorted(true);
        setTimeout(() => setJustSorted(false), 600);

        if (onSort) {
            onSort(sorted, sortId);
        }
        setDropdownOpen(false);
    };

    const getActiveIcon = (size = 18) => {
        switch (activeSort) {
            case 'name-asc':
                return <ArrowDownAZ size={size} strokeWidth={2.2} />;
            case 'name-desc':
                return <ArrowDownZA size={size} strokeWidth={2.2} />;
            case 'size-asc':
                return <ArrowDown10 size={size} strokeWidth={2.2} />;
            case 'size-desc':
                return <ArrowDown01 size={size} strokeWidth={2.2} />;
            default:
                return <ArrowDownAZ size={size} strokeWidth={2.2} />;
        }
    };

    const getOptionIcon = (id, size = 15) => {
        switch (id) {
            case 'name-asc':
                return <ArrowDownAZ size={size} strokeWidth={2} />;
            case 'name-desc':
                return <ArrowDownZA size={size} strokeWidth={2} />;
            case 'size-asc':
                return <ArrowDown10 size={size} strokeWidth={2} />;
            case 'size-desc':
                return <ArrowDown01 size={size} strokeWidth={2} />;
            default:
                return <ArrowUpDown size={size} strokeWidth={2} />;
        }
    };

    return (
        <div className={`file-sort-icon-btn-wrap ${className}`} ref={dropdownRef}>
            <button
                id={`${idPrefix}-btn`}
                type="button"
                className={`file-sort-circle-btn ${dropdownOpen ? 'open' : ''} ${justSorted ? 'just-sorted' : ''}`}
                onClick={() => setDropdownOpen(prev => !prev)}
                title="Auto Sort: Name (A-Z, Z-A) or Storage Size (Low-High, High-Low)"
                aria-label="Auto Sort PDFs"
                aria-expanded={dropdownOpen}
            >
                {getActiveIcon(18)}
            </button>

            {dropdownOpen && (
                <div className="file-sort-floating-menu" role="menu">
                    <div className="file-sort-menu-header">
                        <span>Auto Sort ({files.length} PDFs)</span>
                    </div>
                    {SORT_OPTIONS.map((opt) => {
                        const isSelected = activeSort === opt.id;
                        return (
                            <button
                                key={opt.id}
                                id={`${idPrefix}-item-${opt.id}`}
                                type="button"
                                className={`file-sort-menu-item ${isSelected ? 'active' : ''}`}
                                onClick={() => handleApplySort(opt.id)}
                                role="menuitem"
                            >
                                <div className="file-sort-menu-item-left">
                                    <div className="file-sort-item-icon">
                                        {getOptionIcon(opt.id, 15)}
                                    </div>
                                    <div>
                                        <span className="file-sort-item-title">{opt.label}</span>
                                        <span className="file-sort-item-desc">{opt.description}</span>
                                    </div>
                                </div>
                                {isSelected && <Check size={14} className="text-primary-400 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
