import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';
import { Compare } from 'lucide-react';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageRemoveBgTool({ tool }) {
    const [mode, setMode] = useState('auto');
    const [color, setColor] = useState('#ffffff');
    const [tolerance, setTolerance] = useState('40');
    const [preview, setPreview] = useState(null); // { original, processed, blob, name }
    const [sliderPos, setSliderPos] = useState(50);

    const handleProcess = async (file) => {
        try {
            const blob = await imageService.removeBackgroundByColor(file, {
                mode,
                color,
                tolerance: Math.min(255, Math.max(0, Number(tolerance) || 40))
            });

            setPreview({
                original: URL.createObjectURL(file),
                processed: URL.createObjectURL(blob),
                blob,
                name: `${getBaseName(file.name)}_no_bg.png`
            });
        } catch {
            alert('Failed to remove background.');
        }
    };

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Remove Background"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');
                await handleProcess(item.file);
                return null; // Local preview handles its own state
            }}
        >
            <div className="tool-tabs mb-6 flex gap-2">
                <button 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'auto' ? 'bg-primary-500 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`} 
                    onClick={() => setMode('auto')}
                >
                    Auto Mode
                </button>
                <button 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'pick' ? 'active bg-primary-500 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`} 
                    onClick={() => setMode('pick')}
                >
                    Color Pick
                </button>
            </div>

            <div className="tool-inline mt-2 grid grid-cols-2 gap-4">
                <div className="tool-field flex flex-col gap-2">
                    <label className="text-[9px] uppercase font-black text-slate-600">Bg Color</label>
                    <input 
                        type="color" 
                        className="w-full h-10 bg-transparent rounded-lg cursor-pointer border-none"
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                        disabled={mode !== 'pick'} 
                    />
                </div>
                <div className="tool-field flex flex-col gap-2">
                    <label className="text-[9px] uppercase font-black text-slate-600">Tolerance ({tolerance})</label>
                    <input 
                        type="range" 
                        min="0" max="255" 
                        className="accent-primary-500 mt-2"
                        value={tolerance} 
                        onChange={(e) => setTolerance(e.target.value)} 
                    />
                </div>
            </div>

            {preview && (
                <div className="comparison-container mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-2.5 bg-primary-500/10 rounded-xl"><Compare size={18} className="text-primary-400 rotate-90"/></div>
                        <div>
                            <h4 className="text-sm font-black italic tracking-tighter text-white uppercase">Visual_Diff</h4>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Segmentation Analysis</p>
                        </div>
                    </div>
                    
                    <div 
                        className="comparison-slider relative aspect-video bg-black/40 rounded-[32px] overflow-hidden border border-white/5 cursor-ew-resize group"
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            setSliderPos(Math.min(100, Math.max(0, x)));
                        }}
                    >
                        <img src={preview.original} alt="Original" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                            <img src={preview.processed} alt="Processed" className="w-full h-full object-contain bg-slate-900" />
                        </div>
                        <div className="absolute top-0 bottom-0 w-1 bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10" style={{ left: `${sliderPos}%` }}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold shadow-2xl border-4 border-slate-950/50">
                                ↔
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-primary-gradient mt-8 w-full py-4 rounded-2xl font-black italic tracking-tighter text-xs uppercase"
                        onClick={() => imageService.downloadBlob(preview.blob, preview.name)}
                    >
                        Export Segmented Image
                    </button>
                </div>
            )}
        </GenericFileTool>
    );
}

export default ImageRemoveBgTool;
