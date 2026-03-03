import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import { Smile, Type, Settings, ImageIcon } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageMemeTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [topText, setTopText] = useState('');
    const [bottomText, setBottomText] = useState('');
    const [fontSize, setFontSize] = useState('42');
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (newFiles) => {
        if (newFiles.length > 0) {
            setFile(newFiles[0]);
            if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            const blob = await imageService.memeImage(file, topText, bottomText, {
                fontSize: Number(fontSize) || 42
            });
            imageService.downloadBlob(blob, `${getBaseName(file.name)}_meme.png`);
        } catch (error) {
            console.error('Meme generation failed:', error);
            alert('Failed to generate meme.');
        } finally {
            setProcessing(false);
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept="image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Create Meme"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group mb-3">
                        <Smile size={14} />
                        <label>Meme Text</label>
                    </div>
                    <div className="tool-field">
                        <label>Top Text</label>
                        <input type="text" value={topText} onChange={(e) => setTopText(e.target.value)} placeholder="TOP TEXT" />
                    </div>
                    <div className="tool-field">
                        <label>Bottom Text</label>
                        <input type="text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} placeholder="BOTTOM TEXT" />
                    </div>

                    <div className="sidebar-label-group mt-4 mb-3">
                        <Settings size={14} />
                        <label>Styling</label>
                    </div>
                    <div className="tool-field">
                        <label>Font Size</label>
                        <input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                <div className="file-item-horizontal">
                    <ImageIcon size={24} className="text-primary" />
                    <div className="file-item-info">
                        <div className="file-item-name">{file.name}</div>
                        <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button className="btn-icon-danger" onClick={() => setFile(null)} disabled={processing}>×</button>
                </div>
                <div className="mt-4 p-4 text-center opacity-70 border rounded-lg border-dashed">
                    <p>Enter text on the right to customize your meme.</p>
                </div>
            </div>
        </ToolWorkspace>
    );
}

export default ImageMemeTool;
