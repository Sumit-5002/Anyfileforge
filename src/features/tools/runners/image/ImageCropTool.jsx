import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Crop, Settings, Layout, FileImage } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageCropTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [cropData, setCropData] = useState({ x: 0, y: 0, width: 800, height: 600 });
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState(0.9);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    const applyPreset = (ratio) => {
        const w = 800;
        const h = Math.round(w / ratio);
        setCropData({ ...cropData, width: w, height: h });
    };

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!cropData.width || !cropData.height) {
            alert('Provide crop width and height.');
            return;
        }
        setProcessing(true);
        setProgress(50);
        try {
            const normalizedQuality = Math.min(1, Math.max(0.1, Number(quality)));
            const blob = tool.mode === 'server'
                ? await serverProcessingService.cropImage(file, {
                    ...cropData,
                    format: format.replace('image/', ''),
                    quality: Math.round(normalizedQuality * 100)
                })
                : await imageService.cropImage(file, cropData.x, cropData.y, cropData.width, cropData.height, format, normalizedQuality);

            imageService.downloadBlob(blob, `${getBaseName(file.name)}_crop.${extension}`);
            setProgress(100);
        } finally {
            setProcessing(false);
            setTimeout(() => setProgress(0), 1000);
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
            onReset={() => { setFile(null); setProgress(0); }}
            processing={processing}
            progress={progress}
            onProcess={handleProcess}
            actionLabel="Apply Crop"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group mb-3">
                        <Layout size={14} />
                        <label>Aspect Ratio Presets</label>
                    </div>
                    <div className="tool-tabs mb-4">
                        <button className="tool-tab-btn" onClick={() => applyPreset(1)}>1:1</button>
                        <button className="tool-tab-btn" onClick={() => applyPreset(4 / 3)}>4:3</button>
                        <button className="tool-tab-btn" onClick={() => applyPreset(16 / 9)}>16:9</button>
                    </div>

                    <div className="sidebar-label-group">
                        <Crop size={14} />
                        <label>Manual Selection (px)</label>
                    </div>
                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>X Offset</label>
                            <input type="number" min="0" value={cropData.x} onChange={e => setCropData({ ...cropData, x: e.target.value })} />
                        </div>
                        <div className="tool-field">
                            <label>Y Offset</label>
                            <input type="number" min="0" value={cropData.y} onChange={e => setCropData({ ...cropData, y: e.target.value })} />
                        </div>
                    </div>
                    <div className="tool-inline">
                        <div className="tool-field">
                            <label>Width</label>
                            <input type="number" min="1" value={cropData.width} onChange={e => setCropData({ ...cropData, width: e.target.value })} />
                        </div>
                        <div className="tool-field">
                            <label>Height</label>
                            <input type="number" min="1" value={cropData.height} onChange={e => setCropData({ ...cropData, height: e.target.value })} />
                        </div>
                    </div>

                    <div className="sidebar-label-group mt-3">
                        <Settings size={14} />
                        <label>Quality & Format</label>
                    </div>
                    <div className="tool-field mt-2">
                        <select value={format} onChange={e => setFormat(e.target.value)}>
                            <option value="image/jpeg">Output JPEG</option>
                            <option value="image/png">Output PNG</option>
                            <option value="image/webp">Output WebP</option>
                        </select>
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                <div className="file-item-horizontal">
                    <FileImage size={24} className="text-primary" />
                    <div className="file-item-info">
                        <div className="file-item-name">{file.name}</div>
                        <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                </div>
            </div>
            <p className="tool-help text-center mt-4">
                Use presets for social media (1:1 Square) or cinematic (16:9 TV) crops.
            </p>
        </ToolWorkspace>
    );
}

export default ImageCropTool;
