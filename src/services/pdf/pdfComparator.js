import * as pdfjs from 'pdfjs-dist';

const getDiff = (textA, textB) => {
    const wordsA = textA.split(/\s+/).filter(Boolean); // Filter(Boolean) to remove empty strings from split
    const wordsB = textB.split(/\s+/).filter(Boolean);
    const added = wordsB.filter(w => !wordsA.includes(w));
    const removed = wordsA.filter(w => !wordsB.includes(w));
    return { added, removed };
};

/**
 * Compares two PDF documents textually
 */
export const comparePDFs = async (fileA, fileB, onProgress) => {
    const [pdfA, pdfB] = await Promise.all([
        pdfjs.getDocument({ data: await fileA.arrayBuffer() }).promise,
        pdfjs.getDocument({ data: await fileB.arrayBuffer() }).promise
    ]);

    const results = {
        samePageCount: pdfA.numPages === pdfB.numPages,
        totalDifferingWords: 0,
        pages: [],
        differingPages: []
    };

    const maxPages = Math.max(pdfA.numPages, pdfB.numPages);

    for (let i = 1; i <= maxPages; i++) {
        if (onProgress) onProgress((i / maxPages) * 100);
        let textA = '', textB = '';

        if (i <= pdfA.numPages) {
            const pageA = await pdfA.getPage(i);
            const contentA = await pageA.getTextContent();
            textA = contentA.items.map(it => it.str).join(' ');
        }

        if (i <= pdfB.numPages) {
            const pageB = await pdfB.getPage(i);
            const contentB = await pageB.getTextContent();
            textB = contentB.items.map(it => it.str).join(' ');
        }

        const diff = getDiff(textA.trim(), textB.trim());
        const isSame = diff.added.length === 0 && diff.removed.length === 0;

        results.totalDifferingWords += (diff.added.length + diff.removed.length);

        results.pages.push({
            pageNumber: i,
            isSame,
            addedCount: diff.added.length,
            removedCount: diff.removed.length,
            diff
        });

        if (!isSame) {
            results.differingPages.push(i);
        }
    }

    results.identicalContent = results.differingPages.length === 0 && results.samePageCount;
    return results;
};
