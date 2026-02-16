import {
    FileText, Scissors, Zap, FileSpreadsheet,
    Presentation, FileEdit, FileSearch, Lock, Unlock,
    RotateCw, Hash, ShieldAlert, FileClock,
    Search, FileCheck, Layers, Layout, Image,
    Maximize, Crop, RefreshCcw, Type, Smile,
    Eraser, EyeOff, Globe, Wand2
} from 'lucide-react';
import ENGINEER_TOOLS from '../tools/engineer';
import RESEARCHER_TOOLS from '../tools/researcher';

const SERVER_MODE_TOOL_IDS = new Set([
    'html-to-pdf',
    'word-to-pdf',
    'excel-to-pdf',
    'pp-to-pdf',
    'pdf-ocr',
    'pdf-to-word',
    'pdf-to-excel',
    'pdf-to-pp',
    'pdf-to-jpg',
    'pdf-edit',
    'pdf-protect',
    'pdf-pdfa',
]);

const applyMode = (groups, defaultAccept = '*/*') => groups.map((group) => ({
    ...group,
    tools: group.tools.map((tool) => ({
        ...tool,
        accept: tool.accept || defaultAccept,
        mode: SERVER_MODE_TOOL_IDS.has(tool.id) ? 'server' : 'serverless'
    }))
}));

export const TOOLS = {
    pdf: applyMode([
        {
            category: 'Organize PDF',
            tools: [
                { id: 'pdf-merge', name: 'Merge PDF', description: 'Combine PDFs in the order you want.', icon: Layers, color: '#e5322d' },
                { id: 'pdf-split', name: 'Split PDF', description: 'Separate pages into independent files.', icon: Scissors, color: '#f59e0b' },
                { id: 'pdf-organize', name: 'Organize PDF', description: 'Sort, delete or add pages to your PDF.', icon: Layout, color: '#09c1d5' },
                { id: 'pdf-remove-pages', name: 'Remove PDF Pages', description: 'Remove specific pages from your document.', icon: Eraser, color: '#ef4444' }
            ]
        },
        {
            category: 'Optimize PDF',
            tools: [
                { id: 'pdf-compress', name: 'Compress PDF', description: 'Reduce file size while optimizing quality.', icon: Zap, color: '#09c1d5' },
                { id: 'pdf-repair', name: 'Repair PDF', description: 'Recover data from corrupt or damaged PDFs.', icon: Wand2, color: '#ec4899' },
                { id: 'pdf-ocr', name: 'OCR PDF', description: 'Convert scanned PDF into searchable text.', icon: Search, color: '#14b8a6', isPro: true }
            ]
        },
        {
            category: 'Convert to PDF',
            tools: [
                { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert DOCX files to PDF.', icon: FileText, color: '#2b5797' },
                { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Convert XLSX spreadsheets to PDF.', icon: FileSpreadsheet, color: '#1e7145' },
                { id: 'pp-to-pdf', name: 'PowerPoint to PDF', description: 'Convert PPTX slideshows to PDF.', icon: Presentation, color: '#d24726' },
                { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Convert webpages to PDF via URL.', icon: Globe, color: '#06b6d4', isPro: true },
                { id: 'jpg-to-pdf', name: 'JPG to PDF', description: 'Convert JPG images to PDF easily.', icon: Image, color: '#3b82f6' }
            ]
        },
        {
            category: 'Convert from PDF',
            tools: [
                { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF to editable DOCX.', icon: FileText, color: '#2b5797', isPro: true },
                { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Extract data to Excel spreadsheets.', icon: FileSpreadsheet, color: '#1e7145', isPro: true },
                { id: 'pdf-to-pp', name: 'PDF to PowerPoint', description: 'Convert PDF to editable PPTX.', icon: Presentation, color: '#d24726', isPro: true },
                { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Extract images or convert pages to JPG.', icon: Image, color: '#3b82f6' }
            ]
        },
        {
            category: 'Edit PDF',
            tools: [
                { id: 'pdf-edit', name: 'Edit PDF', description: 'Add text, images, and shapes to PDF.', icon: FileEdit, color: '#f59e0b', isPro: true },
                { id: 'pdf-sign', name: 'Sign PDF', description: 'Sign yourself or request signatures.', icon: FileCheck, color: '#09c1d5', isPro: true },
                { id: 'pdf-watermark', name: 'Watermark', description: 'Stamp images or text over your PDF.', icon: Type, color: '#ef4444' },
                { id: 'pdf-rotate', name: 'Rotate PDF', description: 'Rotate one or all pages in your PDF.', icon: RotateCw, color: '#ec4899' },
                { id: 'pdf-pagenumber', name: 'Page Numbers', description: 'Add page numbers with custom styles.', icon: Hash, color: '#14b8a6' },
                { id: 'pdf-pdfa', name: 'PDF to PDF/A', description: 'Archive your PDF for long-term storage.', icon: FileClock, color: '#64748b', isPro: true }
            ]
        },
        {
            category: 'Security & Advanced',
            tools: [
                { id: 'pdf-unlock', name: 'Unlock PDF', description: 'Remove password and security.', icon: Unlock, color: '#ef4444' },
                { id: 'pdf-protect', name: 'Protect PDF', description: 'Encrypt PDF with a password.', icon: Lock, color: '#059669', isPro: true },
                { id: 'pdf-redact', name: 'Redact PDF', description: 'Permanently remove sensitive info.', icon: ShieldAlert, color: '#b91c1c', isPro: true },
                { id: 'pdf-compare', name: 'Compare PDF', description: 'Spot differences between file versions.', icon: FileSearch, color: '#6366f1', isPro: true },
                { id: 'pdf-crop', name: 'Crop PDF', description: 'Trim margins or selected areas.', icon: Crop, color: '#f59e0b', isPro: true }
            ]
        }
    ], 'application/pdf'),
    image: applyMode([
        {
            category: 'Optimize & Convert',
            tools: [
                { id: 'image-compress', name: 'Compress IMAGE', description: 'Save space while maintaining quality.', icon: Zap, color: '#09c1d5' },
                { id: 'image-to-jpg', name: 'Convert to JPG', description: 'Bulk convert formats into JPG.', icon: RefreshCcw, color: '#3b82f6' },
                { id: 'image-from-jpg', name: 'Convert from JPG', description: 'Turn JPG to PNG, GIF or WebP.', icon: RefreshCcw, color: '#8b5cf6' }
            ]
        },
        {
            category: 'Transform',
            tools: [
                { id: 'image-resize', name: 'Resize IMAGE', description: 'Define dimensions by px or %.', icon: Maximize, color: '#14b8a6' },
                { id: 'image-crop', name: 'Crop IMAGE', description: 'Easy visual crop for JPG, PNG, GIF.', icon: Crop, color: '#f59e0b' },
                { id: 'image-rotate', name: 'Rotate IMAGE', description: 'Rotate multiple images at once.', icon: RotateCw, color: '#ec4899' }
            ]
        },
        {
            category: 'Advanced Scaling',
            tools: [
                { id: 'image-upscale', name: 'Upscale Image', description: 'Enlarge images with high resolution.', icon: Wand2, color: '#8b5cf6', isPro: true },
                { id: 'image-remove-bg', name: 'Remove Background', description: 'Instantly detect and cut backgrounds.', icon: Eraser, color: '#ef4444', isPro: true },
                { id: 'image-blur-face', name: 'Blur Face', description: 'Blur out faces or private info.', icon: EyeOff, color: '#1e293b', isPro: true }
            ]
        },
        {
            category: 'Editor & Fun',
            tools: [
                { id: 'image-editor', name: 'Photo Editor', description: 'Add text, effects, and stickers.', icon: FileEdit, color: '#f59e0b', isPro: true },
                { id: 'image-watermark', name: 'Watermark Image', description: 'Stamp image or text over photos.', icon: Type, color: '#09c1d5' },
                { id: 'image-meme', name: 'Meme Generator', description: 'Create custom memes with ease.', icon: Smile, color: '#ec4899' }
            ]
        }
    ], 'image/*'),
    engineer: applyMode(ENGINEER_TOOLS),
    researcher: applyMode(RESEARCHER_TOOLS)
};
