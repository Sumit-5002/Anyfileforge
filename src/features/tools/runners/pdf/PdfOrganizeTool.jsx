import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import PageGrid from '../common/PageGrid';
import { LayoutGrid } from 'lucide-react';

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
