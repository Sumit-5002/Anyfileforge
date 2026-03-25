import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import FileThumbnail from '../../../../components/tools/shared/FileThumbnail';
import { Crop, Settings, Layout, FileImage } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

const VisualCropper = ({ file, cropData, onCropChange }) => {
    const canvasRef = React.useRef(null);
    const [img, setImg] = React.useState(null);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

    React.useEffect(() => {
        const image = new Image();
        const url = URL.createObjectURL(file);
        image.onload = () => {
            setImg(image);
            URL.revokeObjectURL(url);
        };
        image.src = url;
    }, [file]);

    React.useEffect(() => {
        if (!img || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Responsive Scaling
        const containerWidth = canvas.parentElement.clientWidth - 40;
        const scale = Math.min(containerWidth / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Draw selection box
            const { x, y, width, height } = cropData;
            const sx = x * scale;
            const sy = y * scale;
            const sw = width * scale;
            const sh = height * scale;

            // Overlay dark area
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.clearRect(sx, sy, sw, sh);

            // Border
            ctx.strokeStyle = 'var(--primary-500)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(sx, sy, sw, sh);
            ctx.setLineDash([]);
        };

        draw();
    }, [img, cropData]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const scale = canvasRef.current.width / img.width;
        
        const nx = Math.min(startPos.x, x);
        const ny = Math.min(startPos.y, y);
        const nw = Math.abs(startPos.x - x);
        const nh = Math.abs(startPos.y - y);

        onCropChange({
            x: Math.round(nx / scale),
            y: Math.round(ny / scale),
            width: Math.round(nw / scale),
            height: Math.round(nh / scale)
        });
    };

    const handleMouseUp = () => setIsDrawing(false);

    return (
        <div className="visual-cropper-container flex flex-col items-center">
            <div className="cropper-tip text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                Drag on the image to select a crop area
            </div>
            <div className="canvas-wrapper relative bg-black/20 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                <canvas 
                    ref={canvasRef} 
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="cursor-crosshair"
                />
            </div>
        </div>
    );
};

function ImageCropTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [cropData, setCropData] = useState({ x: 0, y: 0, width: 800, height: 600 });
    const [format, setFormat] = useState('image/jpeg');
    const [quality] = useState(0.9);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState([]);

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

            const outName = `${getBaseName(file.name)}_crop.${extension}`;
            setResults(prev => [...prev, {
                id: file.name + Date.now(),
                name: outName,
                data: blob,
                type: 'image'
            }]);
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
            results={results}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFile(null); setResults([]); setProgress(0); }}
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
            <div className="workspace-cropper-view">
                <VisualCropper 
                    file={file} 
                    cropData={cropData} 
                    onCropChange={setCropData} 
                />
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Current Selection Source</h4>
                <div className="file-item-horizontal p-4 bg-white/5 rounded-2xl border border-white/5">
                    <FileThumbnail file={file} />
                    <div className="file-item-info ml-4">
                        <div className="file-item-name font-mono">{file.name}</div>
                        <div className="file-item-size text-[10px] uppercase font-bold tracking-widest opacity-40">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                </div>
            </div>
        </ToolWorkspace>
    );
}

export default ImageCropTool;
