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

    return (
        <div
            className={`massive-uploader ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDrop={handleDrop}
        >
            <div className="massive-uploader-inner">
                <div className="massive-button-group">
                    <button
                        className="btn btn-primary massive-select-btn"
                        onClick={() => fileInputRef.current.click()}
                    >
                        Select {tool?.name || 'File'}
                    </button>

                    {isServerMode && <CloudSourceOptions layout="side" onFilesSelected={handleFiles} />}
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
