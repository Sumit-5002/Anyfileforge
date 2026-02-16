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
    const [cropData, setCropData] = useState({ x: 0, y: 0, width: 500, height: 500 });
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState(0.9);
    const [processing, setProcessing] = useState(false);

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

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
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Apply Crop"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group">
                        <Crop size={14} />
                        <label>Crop Selection (px)</label>
                    </div>
                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>X Position</label>
                            <input type="number" min="0" value={cropData.x} onChange={e => setCropData({ ...cropData, x: e.target.value })} />
                        </div>
                        <div className="tool-field">
                            <label>Y Position</label>
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
                        <Layout size={14} />
                        <label>Output</label>
                    </div>
                    <div className="tool-field mt-2">
                        <select value={format} onChange={e => setFormat(e.target.value)}>
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </div>
                    <div className="tool-field">
                        <label>Quality ({Math.round(quality * 100)}%)</label>
                        <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={e => setQuality(e.target.value)} />
                    </div>
                </div>
            }
        >
            <div className="file-item-horizontal">
                <FileImage size={24} className="text-primary" />
                <div className="file-item-info">
                    <div className="file-item-name">{file.name}</div>
                    <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
            </div>
            <p className="tool-help text-center mt-4">
                Enter precise pixel coordinates to crop your image exactly where you need it.
            </p>
        </ToolWorkspace>
    );
}

export default ImageCropTool;
