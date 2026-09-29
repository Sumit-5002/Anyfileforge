/**
 * File Sorting Utilities for AnyFileForge
 * Provides natural alphabetical (Name A-Z / Z-A) and storage size (Low-High / High-Low) sorting.
 */

export const SORT_OPTIONS = [
    {
        id: 'name-asc',
        label: 'Name (A → Z)',
        shortLabel: 'A → Z',
        group: 'name',
        order: 'asc',
        description: 'Sort by file name in ascending alphabetical order'
    },
    {
        id: 'name-desc',
        label: 'Name (Z → A)',
        shortLabel: 'Z → A',
        group: 'name',
        order: 'desc',
        description: 'Sort by file name in descending alphabetical order'
    },
    {
        id: 'size-asc',
        label: 'Storage (Smallest First)',
        shortLabel: 'Size: Low → High',
        group: 'storage',
        order: 'asc',
        description: 'Sort by file storage size from smallest to largest'
    },
    {
        id: 'size-desc',
        label: 'Storage (Largest First)',
        shortLabel: 'Size: High → Low',
        group: 'storage',
        order: 'desc',
        description: 'Sort by file storage size from largest to smallest'
    }
];

/**
 * Extracts a comparable file name from File, Blob, or object wrapper.
 */
export function getComparableFileName(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return (item.name || item.file?.name || item.filename || item.originalName || '').toString();
}

/**
 * Extracts comparable file storage size in bytes from File, Blob, or object wrapper.
 */
export function getComparableFileSize(item) {
    if (!item) return 0;
    if (typeof item.size === 'number') return item.size;
    if (typeof item.file?.size === 'number') return item.file.size;
    if (typeof item.bytes === 'number') return item.bytes;
    return 0;
}

/**
 * Sorts an array of files/items according to the specified sort criterion.
 * Supports natural number sorting (e.g. file2.pdf before file10.pdf).
 * Returns a new array.
 * 
 * @param {Array} fileList - Array of files or file wrappers
 * @param {'name-asc' | 'name-desc' | 'size-asc' | 'size-desc'} sortCriterion
 * @returns {Array} - Sorted copy of the array
 */
export function sortFiles(fileList, sortCriterion = 'name-asc') {
    if (!Array.isArray(fileList) || fileList.length <= 1) {
        return fileList ? [...fileList] : [];
    }

    const copy = [...fileList];

    switch (sortCriterion) {
        case 'name-asc':
            return copy.sort((a, b) =>
                getComparableFileName(a).localeCompare(getComparableFileName(b), undefined, {
                    numeric: true,
                    sensitivity: 'base'
                })
            );

        case 'name-desc':
            return copy.sort((a, b) =>
                getComparableFileName(b).localeCompare(getComparableFileName(a), undefined, {
                    numeric: true,
                    sensitivity: 'base'
                })
            );

        case 'size-asc':
            return copy.sort((a, b) => {
                const diff = getComparableFileSize(a) - getComparableFileSize(b);
                if (diff !== 0) return diff;
                // Secondary sort by name
                return getComparableFileName(a).localeCompare(getComparableFileName(b), undefined, {
                    numeric: true,
                    sensitivity: 'base'
                });
            });

        case 'size-desc':
            return copy.sort((a, b) => {
                const diff = getComparableFileSize(b) - getComparableFileSize(a);
                if (diff !== 0) return diff;
                // Secondary sort by name
                return getComparableFileName(a).localeCompare(getComparableFileName(b), undefined, {
                    numeric: true,
                    sensitivity: 'base'
                });
            });

        default:
            return copy;
    }
}
