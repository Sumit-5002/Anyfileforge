import React, { useEffect, useState } from 'react';
import { FileText, ImageIcon, Music, Video, Archive, Code, Download, X, Layers } from 'lucide-react';
import JSZip from 'jszip';
import pdfService from '../../../../services/pdfService';
import imageService from '../../../../services/imageService';
import FileUploader from '../../../../components/ui/FileUploader';
import FileThumbnail from '../../../../components/tools/shared/FileThumbnail';
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
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return <ImageIcon size={24} className="text-primary-400" />;
    if (['pdf'].includes(ext)) return <FileText size={24} className="text-red-400" />;
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music size={24} className="text-yellow-400" />;
    if (['mp4', 'webm', 'mov'].includes(ext)) return <Video size={24} className="text-sky-400" />;
    if (['zip', 'rar', '7z'].includes(ext)) return <Archive size={24} className="text-slate-500" />;
    if (['js', 'css', 'html', 'json', 'py', 'java'].includes(ext)) return <Code size={24} className="text-emerald-400" />;
    return <FileText size={24} className="text-slate-600" />;
};

const isImageFile = (file) => {
    if (!file) return false;
    if (file.type?.startsWith('image/')) return true;
    return /\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff|avif)$/i.test(file.name || '');
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
    const [fullscreenPreview, setFullscreenPreview] = useState(null);
    const allImages = files.length > 0 && files.every(isImageFile);

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
            if (!files.length) throw new Error('Source context empty.');
            const res = await onProcess({ files, items: files.map(f => ({ file: f, name: f.name })) });
            if (res) {
                setResults(Array.isArray(res) ? res : [res]);
            }
        } catch (err) {
            setError(err?.message || 'Transformation failure.');
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
        downloadBlob(blob, `${tool.id || 'forge_artifacts'}.zip`);
    };

    const previewUploadedImage = (file) => {
        if (!file || !isImageFile(file)) return;
        const url = URL.createObjectURL(file);
        setFullscreenPreview((prev) => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return { url, name: file.name };
        });
    };

    const closeFullscreenPreview = () => {
        setFullscreenPreview((prev) => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return null;
        });
    };

    useEffect(() => {
        if (!fullscreenPreview) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') closeFullscreenPreview();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [fullscreenPreview]);

    useEffect(() => () => {
        if (fullscreenPreview?.url) URL.revokeObjectURL(fullscreenPreview.url);
    }, [fullscreenPreview]);

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFiles} multiple={multiple} accept={accept} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            results={results}
            onFilesSelected={handleFiles}
            onReset={() => { setFiles([]); setResults([]); setError(''); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel={actionLabel}
            sidebar={
                <div className="sidebar-inner flex flex-col gap-4">
                    {children}
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] uppercase font-black tracking-widest leading-none">{error}</div>}
                    {results.length > 0 && (
                        <button className="btn-primary-gradient py-4 rounded-2xl flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-xl" onClick={downloadAll}>
                            <Download size={18} /> 
                            <span className="font-black italic tracking-tighter uppercase text-xs">Commit_Sync</span>
                        </button>
                    )}
                </div>
            }
        >
            <div className="tool-contents-layout flex flex-col gap-10">
                <div className="files-list-view max-w-2xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-8 px-2">
                        <div className="p-2.5 bg-white/5 rounded-xl"><Layers size={20} className="text-slate-500"/></div>
                        <div>
                            <h3 className="text-sm font-black italic uppercase tracking-widest text-white">Source_Sequence</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active Buffer Registry</p>
                        </div>
                    </div>
                    
                    <div className={allImages ? 'pages-grid image-pages-grid' : 'space-y-4'}>
                        {files.map((file, i) => {
                            const hasResult = results.some(r => r.name && r.name.includes(file.name.split('.')[0]));
                            if (allImages) {
                                return (
                                    <div key={i} className={`page-item-card ${hasResult ? 'selected' : ''}`}>
                                        <div className="page-item-preview image-page-preview">
                                            <FileThumbnail file={file} className="w-full h-full rounded-none border-0 shadow-none" />
                                            <button
                                                className="page-view-btn"
                                                onClick={() => previewUploadedImage(file)}
                                                type="button"
                                                title="View Full"
                                                aria-label={`View ${file.name} full screen`}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="page-remove-btn"
                                                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                                type="button"
                                                title="Remove Image"
                                                aria-label={`Remove ${file.name}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="page-item-label image-page-label" title={file.name}>
                                            <div className="image-page-index">Image {i + 1}</div>
                                            <div className="image-page-name">{file.name}</div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="file-item-horizontal bg-slate-900/40 border border-white/5 rounded-[24px] p-6 flex items-center gap-6 hover:border-primary-500/20 transition-all shadow-sm group">
                                    {isImageFile(file) ? (
                                        <FileThumbnail file={file} className="w-14 h-14 rounded-2xl border-white/20" />
                                    ) : (
                                        <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary-500/10 transition-colors">
                                            {getFileIcon(file.name)}
                                        </div>
                                    )}
                                    <div className="file-item-info flex-grow min-w-0">
                                        <div className="file-item-name font-mono text-sm font-bold text-slate-200 mb-1 truncate" title={file.name}>{file.name}</div>
                                        <div className="file-item-size text-[10px] font-black uppercase tracking-widest text-slate-600">{(file.size / 1024).toFixed(1)} KB Buffer</div>
                                    </div>
                                    {isImageFile(file) && (
                                        <button
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
                                            onClick={() => previewUploadedImage(file)}
                                        >
                                            View Full
                                        </button>
                                    )}
                                    {hasResult && (
                                        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black italic tracking-tighter">
                                            RESOLVED
                                        </div>
                                    )}
                                    <button 
                                        className="p-3 bg-red-500/5 hover:bg-red-500 text-slate-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100" 
                                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                    >
                                        <X size={16}/>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {fullscreenPreview && (
                <div className="image-fullscreen-modal" role="dialog" aria-modal="true" aria-label="Image preview">
                    <button className="image-fullscreen-backdrop" type="button" onClick={closeFullscreenPreview} aria-label="Close full screen preview" />
                    <div className="image-fullscreen-content">
                        <div className="image-fullscreen-header">
                            <span className="image-fullscreen-name" title={fullscreenPreview.name}>{fullscreenPreview.name}</span>
                            <button className="image-fullscreen-close" type="button" onClick={closeFullscreenPreview}>Close</button>
                        </div>
                        <img src={fullscreenPreview.url} alt={fullscreenPreview.name} className="image-fullscreen-image" />
                    </div>
                </div>
            )}
        </ToolWorkspace>
    );
}

export default GenericFileTool;
