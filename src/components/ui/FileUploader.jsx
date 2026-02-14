import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader, Download } from 'lucide-react';
import pdfService from '../../services/pdfService';
import imageService from '../../services/imageService';
import serverProcessingService from '../../services/serverProcessingService';
import CloudSourceOptions from './CloudSourceOptions';
import './FileUploader.css';

function FileUploader({ tool, customLayout = false }) {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processedResults, setProcessedResults] = useState([]);
    const fileInputRef = useRef(null);
    const isServerMode = tool?.mode === 'server';

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles) => {
        const fileObjects = newFiles.map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: formatFileSize(file.size),
            status: 'ready'
        }));
        setFiles((prev) => [...prev, ...fileObjects]);
        setProcessedResults([]);
    };

    const removeFile = (id) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setProcessedResults([]);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const processFiles = async () => {
        setProcessing(true);
        try {
            if (tool.id === 'pdf-merge') {
                const fileList = files.map(f => f.file);
                const result = isServerMode
                    ? await serverProcessingService.mergePDFs(fileList)
                    : await pdfService.mergePDFs(fileList);
                setProcessedResults([result]);
                setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
            }
            else if (tool.id === 'pdf-split') {
                const file = files[0].file;
                const results = await pdfService.splitPDF(file);
                setProcessedResults(results);
                setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
            }
            else if (tool.id === 'image-convert' || tool.id === 'image-compress') {
                const results = [];
                for (let i = 0; i < files.length; i++) {
                    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f));
                    const format = tool.id === 'image-convert' ? 'png' : 'jpeg';
                    const quality = tool.id === 'image-compress' ? 60 : 90;
                    const result = isServerMode
                        ? (tool.id === 'image-compress'
                            ? await serverProcessingService.compressImage(files[i].file, { quality, format })
                            : await serverProcessingService.convertImage(files[i].file, { format }))
                        : await imageService.convertImage(files[i].file, `image/${format}`, quality / 100);
                    results.push({ blob: result, originalName: files[i].name, format });
                    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'completed' } : f));
                }
                setProcessedResults(results);
            }
        } catch (error) {
            console.error('Processing error:', error);
            setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = () => {
        if (processedResults.length === 0) return;
        if (tool.id === 'pdf-merge') {
            pdfService.downloadPDF(processedResults[0], 'merged_anyfileforge.pdf');
        } else if (tool.id === 'pdf-split') {
            processedResults.forEach((data, index) => pdfService.downloadPDF(data, `page_${index + 1}.pdf`));
        } else if (tool.id.startsWith('image-')) {
            processedResults.forEach((res) => {
                const ext = String(res.format || '')
                    .replace('image/', '')
                    .trim() || 'png';
                imageService.downloadBlob(res.blob, `${res.originalName.split('.')[0]}_forge.${ext}`);
            });
        }
    };

    if (files.length === 0 && customLayout) {
        return (
            <div
                className={`massive-uploader ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="massive-uploader-inner">
                    <div className="massive-button-group">
                        <button
                            className="btn btn-primary massive-select-btn"
                            onClick={() => fileInputRef.current.click()}
                        >
                            Select {tool.name.split(' ')[0]} files
                        </button>

                        {isServerMode && <CloudSourceOptions layout="side" />}
                    </div>

                    <p className="massive-drop-text">
                        {isServerMode
                            ? 'Upload from local system or cloud sources (online mode - paid)'
                            : 'Upload from your local system only (offline mode - free, serverless)'}
                    </p>
                    <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} aria-label={`Select ${tool.name} files`} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`file-uploader card ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} aria-label="Upload files" />
            {files.length === 0 ? (
                <div>
                    <div
                        className="upload-placeholder"
                        onClick={() => fileInputRef.current.click()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current.click();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="upload-icon"><Upload size={40} aria-hidden="true" /></div>
                        <h3>Click to upload or drag & drop</h3>
                        <p>{isServerMode ? 'Online mode (paid): local + cloud sources' : 'Offline mode (free): local system upload only'}</p>
                    </div>
                    {isServerMode && <CloudSourceOptions layout="inline" />}
                </div>
            ) : (
                <div className="file-list-container" aria-live="polite">
                    <div className="file-list">
                        {files.map((file) => (
                            <div key={file.id} className="file-item">
                                <div className="file-info">
                                    <File className="file-icon" size={24} aria-hidden="true" />
                                    <div className="file-details">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">{file.size}</span>
                                    </div>
                                </div>
                                <div className="file-status">
                                    {file.status === 'ready' && (
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFile(file.id)}
                                            aria-label={`Remove ${file.name}`}
                                            title={`Remove ${file.name}`}
                                        >
                                            <X size={18} aria-hidden="true" />
                                        </button>
                                    )}
                                    {file.status === 'processing' && (
                                        <>
                                            <Loader className="spinning" size={18} aria-hidden="true" />
                                            <span className="sr-only">Processing</span>
                                        </>
                                    )}
                                    {file.status === 'completed' && (
                                        <>
                                            <CheckCircle className="success-icon" size={18} aria-hidden="true" />
                                            <span className="sr-only">Completed</span>
                                        </>
                                    )}
                                    {file.status === 'error' && (
                                        <>
                                            <AlertCircle className="error-icon" size={18} aria-hidden="true" />
                                            <span className="sr-only">Error</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="uploader-actions">
                        {!processing && processedResults.length === 0 && (
                            <div className="action-row">
                                <button className="btn btn-secondary" onClick={() => setFiles([])}>Clear All</button>
                                <button className="btn btn-primary" onClick={processFiles}>{tool.name} Now</button>
                            </div>
                        )}
                        {processing && <button className="btn btn-primary" disabled aria-busy="true"><Loader className="spinning" size={18} aria-hidden="true" /> Processing...</button>}
                        {processedResults.length > 0 && <button className="btn btn-primary btn-success btn-full" onClick={handleDownload}><Download size={18} aria-hidden="true" /> Download All</button>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileUploader;
