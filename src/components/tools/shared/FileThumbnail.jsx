import React, { useState, useEffect } from 'react';
import { File as FileIcon, ImageIcon } from 'lucide-react';

const FileThumbnail = ({ file, className = "" }) => {
    const [url, setUrl] = useState(null);
    const isImage = file && file.type?.startsWith('image/');

    useEffect(() => {
        if (!isImage || !file) return;
        
        const previewUrl = URL.createObjectURL(file);
        setUrl(previewUrl);
        
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [file, isImage]);

    if (!file) return null;

    if (isImage && url) {
        return (
            <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg group ${className}`}>
                <img 
                    src={url} 
                    alt={file.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                />
            </div>
        );
    }

    return (
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 ${className}`}>
            <FileIcon size={20} />
        </div>
    );
};

export default FileThumbnail;
