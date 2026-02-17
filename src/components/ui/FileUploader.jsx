import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import CloudSourceOptions from './CloudSourceOptions';
import './FileUploader.css';

/**
 * Reusable File Selection Component
 * Handles the initial "Select Files" or "Drop Files" state.
 */
function FileUploader({
    tool,
    onFilesSelected,
    multiple = true,
    accept = "application/pdf"
}) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const isServerMode = tool?.mode === 'server';

    const handleFiles = (incomingFiles) => {
        const fileList = Array.from(incomingFiles);
        if (fileList.length > 0) {
            onFilesSelected(multiple ? fileList : [fileList[0]]);
        }
    };

    const handleDrag = (e, dragging) => {
        e.preventDefault();
        setIsDragging(dragging);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div
            className={`massive-uploader ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            role="region"
            aria-label="File upload drop zone"
        >
            <div className="massive-uploader-inner">
                <div className="massive-upload-icon-wrapper" aria-hidden="true">
                    <Upload size={48} className="massive-upload-icon" />
                </div>
                <div className="massive-button-group">
                    <button
                        className="btn btn-primary massive-select-btn"
                        type="button"
                    >
                        Select {tool?.name || 'File'}
                    </button>

                    {isServerMode && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <CloudSourceOptions layout="side" onFilesSelected={handleFiles} />
                        </div>
                    )}
                </div>

                <p className="massive-drop-text">
                    {isServerMode
                        ? 'Upload from local system or cloud sources (online mode)'
                        : 'or drop files here (offline mode - free, serverless)'}
                </p>
                <input
                    type="file"
                    multiple={multiple}
                    hidden
                    tabIndex="-1"
                    aria-hidden="true"
                    aria-label="Hidden file input"
                    ref={fileInputRef}
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = '';
                    }}
                    accept={accept}
                />
            </div>
        </div>
    );
}

export default FileUploader;
