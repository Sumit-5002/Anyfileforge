import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader2, FileCode } from 'lucide-react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseIpynb } from '../../../../services/researcher/ipynbService';
import ToolWorkspace from '../common/ToolWorkspace';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'highlight.js/styles/github.css';
import './IpynbToPdfTool.css';

const IpynbToPdfTool = () => {
    const { files, addFiles } = useFileList();
    const [notebookData, setNotebookData] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');
    const previewRef = useRef(null);

    useEffect(() => {
        if (files.length > 0) {
            loadFile(files[0].file);
        } else {
            setNotebookData(null);
            setError('');
        }
    }, [files]);

    const loadFile = async (fileObj) => {
        try {
            setError('');
            const data = await parseIpynb(fileObj);
            setNotebookData(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleExportPdf = async () => {
        if (!previewRef.current || !notebookData) return;
        setIsExporting(true);
        setError('');

        try {
            await new Promise(r => setTimeout(r, 100));
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: previewRef.current.scrollWidth
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / pdfWidth;
            const scaledHeight = imgHeight / ratio;
            let heightLeft = scaledHeight;
            let position = 0;
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdfHeight;
            while (heightLeft > 0) {
                position = heightLeft - scaledHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaledHeight);
                heightLeft -= pdfHeight;
            }
            pdf.save(`${files[0].file.name.replace('.ipynb', '')}.pdf`);
        } catch (err) {
            setError('Failed to generate PDF: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ToolWorkspace
            tool={{ name: 'IPYNB to PDF' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".ipynb"
            dropzoneLabel="Drop your .ipynb notebook here"
            dropzoneHint="Convert Jupyter Notebooks to high-quality PDF"
            onReset={() => { setParsedCells(null); setError(''); }}
            sidebar={
                <div className="sidebar-info">
                    {notebookData && (
                        <div className="export-panel mt-4">
                            <h4 style={{ color: 'var(--primary-500)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Notebook Stats</h4>
                            <div className="stats-list" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '12px 0' }}>
                                <div className="stat-item d-flex justify-content-between mb-2">
                                    <span>Cells:</span>
                                    <span className="text-primary">{notebookData.cells.length}</span>
                                </div>
                                <div className="stat-item d-flex justify-content-between mb-2">
                                    <span>Kernel:</span>
                                    <span className="text-primary">{notebookData.metadata?.kernelspec?.display_name || 'Generic'}</span>
                                </div>
                                <div className="stat-item d-flex justify-content-between mb-2">
                                    <span>Language:</span>
                                    <span className="text-primary text-uppercase">{notebookData.metadata?.language_info?.name || 'python'}</span>
                                </div>
                            </div>
                            
                            <h4 style={{ color: 'var(--primary-500)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginTop: '20px' }}>Actions</h4>
                            <button 
                                className={`btn-primary w-full mt-3 ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                onClick={handleExportPdf}
                                disabled={isExporting}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {isExporting ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
                                {isExporting ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    )}
                    {error && <div className="error-message mt-4" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
                </div>
            }
        >
            <div className="ipynb-main" style={{ minHeight: '600px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px' }}>
                {!notebookData ? (
                    <div className="text-center p-8">
                        <FileCode size={64} style={{ opacity: 0.1, margin: '0 auto 16px' }} />
                        <h3>Jupyter Notebook Reader</h3>
                        <p className="text-muted">Convert .ipynb to high-quality PDF in your browser.</p>
                    </div>
                ) : (
                    <div className="preview-container">
                        <div className="preview-document" ref={previewRef} style={{ background: 'var(--bg-surface)', padding: '40px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {notebookData.cells.map((cell, idx) => (
                                <div 
                                    key={idx} 
                                    className={`ipynb-cell cell-${cell.type}`}
                                    dangerouslySetInnerHTML={{ __html: cell.html }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};
export default IpynbToPdfTool;
