import React from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import './FileList.css';

function FileList({ files, onRemove, onMoveUp, onMoveDown, allowReorder = false }) {
    if (files.length === 0) return null;

    return (
        <div className="file-list">
            {files.map((file, index) => (
                <div key={file.id} className="file-row">
                    <div className="file-meta">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{file.size}</span>
                    </div>
                    <div className="file-actions">
                        {allowReorder && (
                            <>
                                <button
                                    className="icon-btn"
                                    onClick={() => onMoveUp(index)}
                                    aria-label="Move up"
                                >
                                    <ArrowUp size={16} />
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={() => onMoveDown(index)}
                                    aria-label="Move down"
                                >
                                    <ArrowDown size={16} />
                                </button>
                            </>
                        )}
                        <button
                            className="icon-btn danger"
                            onClick={() => onRemove(file.id)}
                            aria-label="Remove file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default FileList;
