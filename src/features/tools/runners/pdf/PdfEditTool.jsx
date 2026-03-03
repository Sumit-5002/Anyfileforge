import React, { useState } from 'react';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import serverProcessingService from '../../../../services/serverProcessingService';
import pdfService from '../../../../services/pdfService';
import { FileEdit, CircleCheck, Type } from 'lucide-react';

function PdfEditTool({ tool, onFilesAdded }) {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const [text, setText] = useState('Edited with AnyFileForge');
    const [page, setPage] = useState('1');
    const [x, setX] = useState('48');
    const [y, setY] = useState('760');
    const [size, setSize] = useState('18');

    const handleFilesSelected = (files) => {
        setFile(files[0] || null);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!file) return;
        if (!text.trim()) {
            alert('Please enter text to add.');
            return;
        }

        setProcessing(true);
        try {
            const blob = await serverProcessingService.editPDF(file, {
                text,
                page: Number(page) || 1,
                x: Number(x) || 48,
                y: Number(y) || 760,
                size: Number(size) || 18
            });
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            pdfService.downloadBlob(blob, `${baseName}_edited.pdf`);
            setDone(true);
        } catch (error) {
            console.error('Edit PDF error:', error);
            alert(error.message || 'Failed to edit PDF.');
        } finally {
            setProcessing(false);
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept="application/pdf" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            onFilesSelected={handleFilesSelected}
            onReset={() => {
                setFile(null);
                setDone(false);
            }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Apply Edit"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label><Type size={14} /> Text</label>
                        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Type text to place on PDF" />
                    </div>
                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>Page</label>
                            <input type="number" min="1" value={page} onChange={(event) => setPage(event.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label>Size</label>
                            <input type="number" min="8" max="96" value={size} onChange={(event) => setSize(event.target.value)} />
                        </div>
                    </div>
                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>X</label>
                            <input type="number" value={x} onChange={(event) => setX(event.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label>Y</label>
                            <input type="number" value={y} onChange={(event) => setY(event.target.value)} />
                        </div>
                    </div>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CircleCheck size={64} className="text-success mb-3" />
                        <h3>Edit Applied</h3>
                        <p className="text-muted">Edited PDF has been downloaded.</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '520px' }}>
                        <FileEdit size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfEditTool;

