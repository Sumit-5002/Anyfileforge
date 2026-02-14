import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import './FileDropzone.css';

function FileDropzone({ label, hint, multiple = false, accept, onFilesAdded }) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleFiles = (fileList) => {
        if (!fileList || fileList.length === 0) return;
        onFilesAdded(Array.from(fileList));
    };

    return (
        <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
            }}
        >
            <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={(e) => handleFiles(e.target.files)}
                hidden
            />
            <div
                className="dropzone-inner"
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
            >
                <div className="dropzone-icon">
                    <Upload size={28} aria-hidden="true" />
                </div>
                <div>
                    <h4>{label}</h4>
                    {hint && <p>{hint}</p>}
                </div>
            </div>
        </div>
    );
}

export default FileDropzone;
