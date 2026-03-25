import React, { useState, useEffect } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Type, MousePointer2, FileText, ImageIcon } from 'lucide-react';
import PageGrid from '../common/PageGrid';
import '../common/ToolWorkspace.css';

function PdfSignTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [x, setX] = useState(50);
    const [y, setY] = useState(50);
    const [width, setWidth] = useState(160);
    const [processing, setProcessing] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const pdfFile = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const imageFile = files.find(f => f.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(f.name));

    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImagePreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setImagePreview(null);
        }
    }, [imageFile]);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (!pdfFile || !imageFile) {
            alert('Please upload exactly 1 PDF and 1 signature image (PNG/JPG).');
            return;
        }

        setProcessing(true);
        try {
            const data = await pdfService.addSignatureImage(pdfFile, imageFile, {
                pageNumber: Number(pageNumber),
                x: Number(x),
                y: Number(y),
                width: Number(width)
            });
            pdfService.downloadPDF(data, 'signed_document.pdf');
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept="application/pdf,image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFiles([])}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Sign PDF"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label><FileText size={14} /> Page Number</label>
                        <input type="number" min="1" value={pageNumber} onChange={e => setPageNumber(e.target.value)} />
                    </div>

                    <div className="tool-inline">
                        <div className="tool-field">
                            <label><MousePointer2 size={14} /> X Pos (pt)</label>
                            <input type="number" value={x} onChange={e => setX(e.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label><MousePointer2 size={14} /> Y Pos (pt)</label>
                            <input type="number" value={y} onChange={e => setY(e.target.value)} />
                        </div>
                    </div>

                    <div className="tool-field">
                        <label><Type size={14} /> Signature Width (pt)</label>
                        <input type="number" min="10" value={width} onChange={e => setWidth(e.target.value)} />
                    </div>

                    <p className="tool-help">Coordinates start from the bottom-left corner of the page. Select a page from the preview.</p>
                </div>
            }
        >
            <div className="files-list-view mb-4" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal shadow-sm" style={{flex: '1 1 min-content'}}>
                        {file.type === 'application/pdf' || file.name.endsWith('.pdf') ? <FileText size={20} className="text-danger" /> : <ImageIcon size={20} className="text-primary" />}
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                        </div>
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                ))}
            </div>

            {pdfFile && (
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <h5 className="mb-3 text-muted" style={{fontSize: '14px', fontWeight: 600}}>Select Page to Sign</h5>
                    <PageGrid 
                        file={pdfFile} 
                        selectedPages={new Set([Number(pageNumber)])}
                        onTogglePage={(p) => setPageNumber(p)}
                        renderOverlay={(page) => (
                            page.pageNumber === Number(pageNumber) ? (
                                <div style={{
                                    position: 'absolute',
                                    bottom: `${Number(y) * 0.25}px`, 
                                    left: `${Number(x) * 0.25}px`,
                                    width: `${Number(width) * 0.25}px`,
                                    minHeight: '20px',
                                    border: '1.5px dashed blue',
                                    backgroundColor: 'rgba(0,0,255,0.15)',
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 20
                                }}>
                                    {imagePreview ? (
                                        <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="sig" />
                                    ) : (
                                        <span style={{ fontSize: '8px', color: 'blue', fontWeight: 'bold' }}>SIGNBOX</span>
                                    )}
                                </div>
                            ) : null
                        )}
                    />
                </div>
            )}
        </ToolWorkspace>
    );
}

export default PdfSignTool;
