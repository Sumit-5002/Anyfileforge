import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import PageGrid from '../common/PageGrid';
import { LayoutGrid, ArrowDown10, ArrowDown01 } from 'lucide-react';

function PdfOrganizeTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [order, setOrder] = useState([]);
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = async (files) => {
        if (!files[0]) return;
        setFile(files[0]);
        const count = await pdfService.getPageCount(files[0]);
        setOrder(Array.from({ length: count }, (_, i) => i + 1));
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleDeletePage = (pageNum) => {
        setOrder(prev => prev.filter(n => n !== pageNum));
    };

    const handleReorder = (draggedNum, targetNum) => {
        setOrder(prev => {
            const newOrder = [...prev];
            const draggedIdx = newOrder.indexOf(draggedNum);
            const targetIdx = newOrder.indexOf(targetNum);

            newOrder.splice(draggedIdx, 1);
            newOrder.splice(targetIdx, 0, draggedNum);
            return newOrder;
        });
    };

    const handleSortPages = (direction) => {
        setOrder(prev => [...prev].sort((a, b) => direction === 'asc' ? a - b : b - a));
    };

    const handleProcess = async () => {
        if (order.length === 0) {
            alert('No pages left to organize.');
            return;
        }
        setProcessing(true);
        try {
            const indices = order.map(n => n - 1);
            const data = await pdfService.reorderPages(file, indices);
            pdfService.downloadPDF(data, 'organized_document.pdf');
        } finally {
            setProcessing(false);
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Organize PDF"
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">
                        Drag pages to reorder them. Click <strong>×</strong> to remove a page.
                    </p>
                    <div className="order-summary mt-3">
                        <LayoutGrid size={16} className="text-primary" />
                        <span><strong>{order.length}</strong> pages remaining</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Auto Sort Pages</div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                onClick={() => handleSortPages('asc')}
                                title="Sort Pages 1 to N"
                            >
                                <ArrowDown10 size={14} className="text-primary-400" />
                                <span>1 → {order.length}</span>
                            </button>
                            <button
                                type="button"
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                                onClick={() => handleSortPages('desc')}
                                title="Sort Pages N to 1 (Reverse)"
                            >
                                <ArrowDown01 size={14} className="text-primary-400" />
                                <span>{order.length} → 1</span>
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <PageGrid
                file={file}
                order={order}
                onDeletePage={handleDeletePage}
                onReorder={handleReorder}
            />
        </ToolWorkspace>
    );
}

export default PdfOrganizeTool;
