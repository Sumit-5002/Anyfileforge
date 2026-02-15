import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader, Download } from 'lucide-react';
import pdfService from '../../services/pdfService';
import imageService from '../../services/imageService';
import './FileUploader.css';

function FileUploader({ tool, customLayout = false }) {
    const [errorMessage, setErrorMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processedResults, setProcessedResults] = useState([]);
    const fileInputRef = useRef(null);

    /* ---------------- FILE SIZE FORMATTER (Moved Up — must exist before use) ---------------- */
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    /* ---------------- VALIDATION ---------------- */

    const isValidPDF = (file) => file.type === 'application/pdf';
    const isValidImage = (file) => file.type.startsWith('image/');

    const validateFileForTool = (file) => {
        if (tool.id.startsWith('pdf')) return isValidPDF(file);
        if (tool.id.startsWith('image')) return isValidImage(file);
        return true;
    };

    /* ---------------- FILE HANDLING ---------------- */

    const addFiles = (newFiles) => {
        const valid = [];
        const invalid = [];

        newFiles.forEach((file) => {
            if (validateFileForTool(file)) {
                valid.push({
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    name: file.name,
                    size: formatFileSize(file.size),
                    status: 'ready'
                });
            } else {
                invalid.push(file.name);
            }
        });

        if (invalid.length > 0) {
            setErrorMessage(`Invalid file type for ${tool.name}: ${invalid.join(', ')}`);
        } else {
            setErrorMessage('');
        }

        if (valid.length > 0) {
            setFiles((prev) => [...prev, ...valid]);
            setProcessedResults([]);
        }
    };

    const removeFile = (id) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setProcessedResults([]);
        setErrorMessage('');
    };

    /* ---------------- DRAG EVENTS ---------------- */

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
        addFiles(Array.from(e.dataTransfer.files));
    };

    const handleFileSelect = (e) => {
        addFiles(Array.from(e.target.files));
    };

    /* ---------------- PROCESSING ---------------- */

    const processFiles = async () => {
        setProcessing(true);
        try {
            if (tool.id === 'pdf-merge') {
                const fileList = files.map(f => f.file);
                const result = await pdfService.mergePDFs(fileList);
                setProcessedResults([result]);
                setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
            }

            else if (tool.id === 'pdf-split') {
                const file = files[0].file;
                const results = await pdfService.splitPDF(file);
                setProcessedResults(results);
                setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
            }

            else if (tool.id.startsWith('image')) {
                const results = [];

                for (let i = 0; i < files.length; i++) {
                    setFiles(prev => prev.map((f, idx) =>
                        idx === i ? { ...f, status: 'processing' } : f
                    ));

                    const format = tool.id === 'image-convert' ? 'image/png' : 'image/jpeg';
                    const quality = tool.id === 'image-compress' ? 0.6 : 0.9;

                    const result = await imageService.convertImage(files[i].file, format, quality);

                    results.push({ blob: result, originalName: files[i].name, format });

                    setFiles(prev => prev.map((f, idx) =>
                        idx === i ? { ...f, status: 'completed' } : f
                    ));
                }

                setProcessedResults(results);
            }
        } catch (error) {
            console.error('Processing error:', error);
            setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
            setErrorMessage('Processing failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    /* ---------------- DOWNLOAD ---------------- */

    const handleDownload = () => {
        if (processedResults.length === 0) return;

        if (tool.id === 'pdf-merge') {
            pdfService.downloadPDF(processedResults[0], 'merged_anyfileforge.pdf');
        }

        else if (tool.id === 'pdf-split') {
            processedResults.forEach((data, index) =>
                pdfService.downloadPDF(data, `page_${index + 1}.pdf`)
            );
        }

        else if (tool.id.startsWith('image')) {
            processedResults.forEach((res) => {
                const ext = res.format.split('/')[1];
                imageService.downloadBlob(res.blob, `${res.originalName.split('.')[0]}_forge.${ext}`);
            });
        }
    };

    /* ---------------- RENDER ---------------- */

    return (
        <div
            className={`file-uploader card ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />

            {errorMessage && (
                <div className="upload-error">
                    <AlertCircle size={18} />
                    {errorMessage}
                </div>
            )}

            {files.length === 0 ? (
                <div className="upload-placeholder" onClick={() => fileInputRef.current.click()}>
                    <Upload size={40} />
                    <h3>Click to upload or drag & drop</h3>
                </div>
            ) : (
                <>
                    <div className="file-list">
                        {files.map((file) => (
                            <div key={file.id} className="file-item">
                                <span>{file.name}</span>
                                <button onClick={() => removeFile(file.id)}>
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={processFiles}
                        disabled={files.length === 0 || processing}
                    >
                        {processing ? 'Processing...' : `${tool.name} Now`}
                    </button>

                    {processedResults.length > 0 && (
                        <button className="btn btn-success" onClick={handleDownload}>
                            <Download size={18} /> Download
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

export default FileUploader;
