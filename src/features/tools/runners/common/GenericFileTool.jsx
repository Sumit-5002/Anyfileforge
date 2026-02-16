import React, { useRef, useState } from 'react';
import { Upload, X, ArrowUp, ArrowDown, Download, Loader, Plus } from 'lucide-react';
import JSZip from 'jszip';
import pdfService from '../../../../services/pdfService';
import imageService from '../../../../services/imageService';
import CloudSourceOptions from '../../../../components/ui/CloudSourceOptions';
import { useFileQueue } from './useFileQueue';
import './GenericFileTool.css';

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const downloadText = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, filename);
};

const normalizeResults = (results) => {
    if (!results) return [];
    return Array.isArray(results) ? results : [results];
};

function GenericFileTool({
    tool,
    accept = '*/*',
    multiple = true,
    canReorder = false,
    actionLabel,
    onProcess,
    children
}) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');
    const { files, addFiles, replaceFiles, removeFile, clearFiles, moveFile } = useFileQueue();
    const isServerMode = tool?.mode === 'server';

    const handleFiles = (fileList) => {
        if (multiple) {
            addFiles(fileList);
        } else {
            replaceFiles(fileList);
        }
        setResults([]);
        setError('');
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
    };

    const handleProcess = async () => {
        setError('');
        setProcessing(true);
        try {
            if (!files.length) {
                throw new Error('Please add at least one file.');
            }
            const payload = files.map((item) => item.file);
            const nextResults = await onProcess({ files: payload, items: files });
            setResults(normalizeResults(nextResults));
        } catch (err) {
            setError(err?.message || 'Processing failed.');
        } finally {
            setProcessing(false);
        }
    };

    const downloadResult = (result) => {
        if (result?.download) {
            result.download();
            return;
        }
        if (result?.type === 'pdf') {
            pdfService.downloadPDF(result.data, result.name || 'output.pdf');
            return;
        }
        if (result?.type === 'image') {
            imageService.downloadBlob(result.data, result.name || 'image-output.png');
            return;
        }
        if (result?.type === 'text') {
            downloadText(result.data, result.name || 'output.txt');
            return;
        }
        if (result?.data instanceof Blob) {
            downloadBlob(result.data, result.name || 'output.bin');
        }
    };

    const downloadAll = async () => {
        if (!results.length) return;
        if (results.length === 1) {
            downloadResult(results[0]);
            return;
        }
        const zip = new JSZip();
        results.forEach((result) => {
            zip.file(result.name || 'output', result.data);
        });
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, `${tool.id || 'results'}.zip`);
    };

    return (
        <div className="tool-runner card">
            <div className="tool-runner-header">
                <h3>{tool.name}</h3>
                <p>{tool.description}</p>
            </div>

            <button
                type="button"
                className={`tool-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                aria-label="Upload files"
            >
                <Upload size={36} aria-hidden="true" />
                <span>
                    <strong>Drop files here</strong>
                    <span className="tool-dropzone-subtitle">{isServerMode ? 'or click to browse (online mode)' : 'or click to browse (offline mode)'}</span>
                </span>
            </button>
            <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={(event) => handleFiles(event.target.files)}
                style={{ display: 'none' }}
                aria-hidden="true"
            />
            {isServerMode && (
                <div className="tool-cloud-row">
                    <span className="tool-cloud-label">Cloud sources (online mode):</span>
                    <CloudSourceOptions layout="inline" />
                </div>
            )}

            {files.length > 0 && (
                <div className="tool-file-queue">
                    {files.map((file, index) => (
                        <div key={file.id} className="tool-file-row">
                            <div className="tool-file-meta">
                                <span className="tool-file-name">{file.name}</span>
                                <span className="tool-file-size">{file.size}</span>
                            </div>
                            <div className="tool-file-actions">
                                {canReorder && (
                                    <>
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            onClick={() => moveFile(index, Math.max(0, index - 1))}
                                            aria-label="Move up"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            onClick={() => moveFile(index, Math.min(files.length - 1, index + 1))}
                                            aria-label="Move down"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => removeFile(file.id)}
                                    aria-label="Remove file"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="tool-file-controls">
                        {multiple && (
                            <button className="btn btn-secondary" type="button" onClick={() => inputRef.current?.click()}>
                                <Plus size={16} /> Add more
                            </button>
                        )}
                        <button className="btn btn-secondary" type="button" onClick={clearFiles}>
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {children && <div className="tool-options">{children}</div>}

            {error && <div className="tool-error">{error}</div>}

            <div className="tool-actions">
                <button className="btn btn-primary" type="button" onClick={handleProcess} disabled={processing}>
                    {processing ? <Loader size={16} className="spinning" /> : null}
                    {processing ? 'Processing...' : (actionLabel || `Run ${tool.name}`)}
                </button>
                {results.length > 0 && (
                    <button className="btn btn-secondary" type="button" onClick={downloadAll}>
                        <Download size={16} /> Download {results.length > 1 ? 'ZIP' : 'File'}
                    </button>
                )}
            </div>

            {results.length > 0 && (
                <div className="tool-results">
                    {results.map((result, index) => (
                        <div key={`${result.name}-${index}`} className="tool-result-row">
                            <span>{result.name || `Result ${index + 1}`}</span>
                            <button className="btn btn-secondary" type="button" onClick={() => downloadResult(result)}>
                                <Download size={16} /> Download
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GenericFileTool;
