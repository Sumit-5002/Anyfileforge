import React, { useState } from 'react';
import { Loader, FileText, ImageIcon, Music, Video, Archive, Code, Download, X } from 'lucide-react';
import JSZip from 'jszip';
import pdfService from '../../../../services/pdfService';
import imageService from '../../../../services/imageService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from './ToolWorkspace';
import '../common/ToolWorkspace.css';

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return <ImageIcon size={24} className="text-primary" />;
    if (['pdf'].includes(ext)) return <FileText size={24} className="text-danger" />;
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music size={24} className="text-warning" />;
    if (['mp4', 'webm', 'mov'].includes(ext)) return <Video size={24} className="text-info" />;
    if (['zip', 'rar', '7z'].includes(ext)) return <Archive size={24} className="text-muted" />;
    if (['js', 'css', 'html', 'json', 'py', 'java'].includes(ext)) return <Code size={24} className="text-success" />;
    return <FileText size={24} className="text-muted" />;
};

function GenericFileTool({
    tool,
    accept = '*/*',
    multiple = true,
    actionLabel,
    onProcess,
    children,
    onFilesAdded: parentOnFilesAdded
}) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const handleFiles = (fileList) => {
        const newFiles = Array.from(fileList);
        if (multiple) {
            setFiles(prev => [...prev, ...newFiles]);
        } else {
            setFiles(newFiles);
        }
        setResults([]);
        setError('');
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        setError('');
        setProcessing(true);
        try {
            if (!files.length) throw new Error('Please add at least one file.');
            const res = await onProcess({ files, items: files.map(f => ({ file: f, name: f.name })) });
            setResults(Array.isArray(res) ? res : [res]);
        } catch (err) {
            setError(err?.message || 'Processing failed.');
        } finally {
            setProcessing(false);
        }
    };

    const downloadResult = (result) => {
        if (result?.type === 'pdf') pdfService.downloadPDF(result.data, result.name || 'output.pdf');
        else if (result?.type === 'image') imageService.downloadBlob(result.data, result.name || 'output.png');
        else if (result?.data instanceof Blob) downloadBlob(result.data, result.name || 'output.bin');
        else if (result?.data) downloadBlob(new Blob([result.data]), result.name || 'output.txt');
    };

    const downloadAll = async () => {
        if (results.length === 1) return downloadResult(results[0]);
        const zip = new JSZip();
        results.forEach(r => zip.file(r.name || 'output', r.data));
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, `${tool.id || 'results'}.zip`);
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFiles} multiple={multiple} accept={accept} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFiles}
            onReset={() => { setFiles([]); setResults([]); setError(''); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel={actionLabel}
            sidebar={
                <div className="sidebar-inner">
                    {children}
                    {error && <div className="text-danger small mt-2">{error}</div>}
                    {results.length > 0 && (
                        <button className="btn btn-success btn-full" onClick={downloadAll}>
                            <Download size={18} /> Download Results
                        </button>
                    )}
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => {
                    const hasResult = results.some(r => r.name && r.name.includes(file.name.split('.')[0]));
                    return (
                        <div key={i} className="file-item-horizontal">
                            {getFileIcon(file.name)}
                            <div className="file-item-info">
                                <div className="file-item-name">{file.name}</div>
                                <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                            {hasResult && <div className="status-badge">Done!</div>}
                            <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} aria-label={`Remove ${file.name}`}>×</button>
                        </div>
                    );
                })}
            </div>
        </ToolWorkspace>
    );
}

export default GenericFileTool;
