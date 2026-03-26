import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileText, ArrowUpDown, ChevronUp, ChevronDown, Eye, X } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfMergeTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [draggedIdx, setDraggedIdx] = useState(null);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };


    const handleReorder = (dragIdx, targetIdx) => {
        if (dragIdx === targetIdx) return;
        setFiles(prev => {
            const newFiles = [...prev];
            const [moved] = newFiles.splice(dragIdx, 1);
            newFiles.splice(targetIdx, 0, moved);
            return newFiles;
        });
    };

    const handleMove = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= files.length) return;
        const newFiles = [...files];
        const [moved] = newFiles.splice(index, 1);
        newFiles.splice(newIndex, 0, moved);
        setFiles(newFiles);
    };

    const handlePreview = (file) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        // Note: URL.revokeObjectURL(url) should ideally be called later, 
        // but for a preview in a new tab, it's safer to let browser gc it or just leave it.
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to merge.');
            return;
        }
        setProcessing(true);
        try {
            const data = tool.mode === 'server'
                ? await serverProcessingService.mergePDFs(files)
                : await pdfService.mergePDFs(files);

            pdfService.downloadPDF(data, 'merged_document.pdf');
        } catch (error) {
            console.error('Merge error:', error);
            alert('Failed to merge PDFs.');
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFiles([])}
            processing={processing}
            onProcess={handleMerge}
            actionLabel="Merge PDF"
            sidebarTitle="Merge Settings"
            sidebar={
                <div className="sidebar-settings">
                    <div className="order-summary mt-2">
                        <ArrowUpDown size={16} />
                        <span>{files.length} PDFs Selected</span>
                    </div>
                    <p className="tool-help mt-3">
                        PDFs will be merged in the order shown in the list. Drag items to reorder, or remove items before processing.
                    </p>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div
                        key={`${file.name}-${i}`}
                        className="file-item-horizontal draggable"
                        draggable
                        onDragStart={() => setDraggedIdx(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                            handleReorder(draggedIdx, i);
                            setDraggedIdx(null);
                        }}
                    >
                        <span className="file-index">{i + 1}</span>
                        <FileText size={24} className="text-danger" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <div className="file-item-actions" style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn-icon"
                                onClick={() => handlePreview(file)}
                                title={`Preview ${file.name}`}
                                aria-label={`Preview ${file.name}`}
                            >
                                <Eye size={16} />
                            </button>
                            <div className="reorder-buttons" style={{ display: 'flex', flexDirection: 'column' }}>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleMove(i, -1)}
                                    disabled={i === 0}
                                    title={`Move ${file.name} Up`}
                                    aria-label={`Move ${file.name} Up`}
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleMove(i, 1)}
                                    disabled={i === files.length - 1}
                                    title={`Move ${file.name} Down`}
                                    aria-label={`Move ${file.name} Down`}
                                >
                                    <ChevronDown size={14} />
                                </button>
                            </div>
                            <button
                                className="btn-icon-danger"
                                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                title={`Remove ${file.name}`}
                                aria-label={`Remove ${file.name}`}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default PdfMergeTool;
