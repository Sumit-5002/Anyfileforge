import PdfMergeTool from './pdf/PdfMergeTool';
import PdfSplitTool from './pdf/PdfSplitTool';
import PdfOrganizeTool from './pdf/PdfOrganizeTool';
import PdfRemovePagesTool from './pdf/PdfRemovePagesTool';
import PdfCompressTool from './pdf/PdfCompressTool';
import PdfRepairTool from './pdf/PdfRepairTool';
import PdfRotateTool from './pdf/PdfRotateTool';
import PdfPageNumberTool from './pdf/PdfPageNumberTool';
import PdfWatermarkTool from './pdf/PdfWatermarkTool';
import PdfUnlockTool from './pdf/PdfUnlockTool';
import PdfSignTool from './pdf/PdfSignTool';
import PdfRedactTool from './pdf/PdfRedactTool';
import PdfCompareTool from './pdf/PdfCompareTool';
import PdfCropTool from './pdf/PdfCropTool';
import JpgToPdfTool from './pdf/JpgToPdfTool';

import ImageCompressTool from './image/ImageCompressTool';
import ImageToJpgTool from './image/ImageToJpgTool';
import ImageFromJpgTool from './image/ImageFromJpgTool';
import ImageResizeTool from './image/ImageResizeTool';
import ImageCropTool from './image/ImageCropTool';
import ImageRotateTool from './image/ImageRotateTool';
import ImageWatermarkTool from './image/ImageWatermarkTool';
import ImageMemeTool from './image/ImageMemeTool';
import ImageUpscaleTool from './image/ImageUpscaleTool';
import ImageRemoveBgTool from './image/ImageRemoveBgTool';
import ImageBlurFaceTool from './image/ImageBlurFaceTool';
import ImageEditorTool from './image/ImageEditorTool';

import JsonFormatterTool from './text/JsonFormatterTool';
import JsonToCsvTool from './text/JsonToCsvTool';
import Base64Tool from './text/Base64Tool';
import CodeMinifierTool from './text/CodeMinifierTool';
import RegexTesterTool from './text/RegexTesterTool';
import MarkdownPreviewTool from './text/MarkdownPreviewTool';
import CsvPlotterTool from './text/CsvPlotterTool';
import LatexEditorTool from './text/LatexEditorTool';
import BibtexManagerTool from './text/BibtexManagerTool';

export const TOOL_RUNNERS = {
    'pdf-merge': PdfMergeTool,
    'pdf-split': PdfSplitTool,
    'pdf-organize': PdfOrganizeTool,
    'pdf-remove-pages': PdfRemovePagesTool,
    'pdf-compress': PdfCompressTool,
    'pdf-repair': PdfRepairTool,
    'pdf-rotate': PdfRotateTool,
    'pdf-pagenumber': PdfPageNumberTool,
    'pdf-watermark': PdfWatermarkTool,
    'pdf-unlock': PdfUnlockTool,
    'pdf-sign': PdfSignTool,
    'pdf-redact': PdfRedactTool,
    'pdf-compare': PdfCompareTool,
    'pdf-crop': PdfCropTool,
    'jpg-to-pdf': JpgToPdfTool,

    'image-compress': ImageCompressTool,
    'image-to-jpg': ImageToJpgTool,
    'image-from-jpg': ImageFromJpgTool,
    'image-resize': ImageResizeTool,
    'image-crop': ImageCropTool,
    'image-rotate': ImageRotateTool,
    'image-watermark': ImageWatermarkTool,
    'image-meme': ImageMemeTool,
    'image-upscale': ImageUpscaleTool,
    'image-remove-bg': ImageRemoveBgTool,
    'image-blur-face': ImageBlurFaceTool,
    'image-editor': ImageEditorTool,

    'json-formatter': JsonFormatterTool,
    'json-to-csv': JsonToCsvTool,
    'base64-encode': Base64Tool,
    'code-minifier': CodeMinifierTool,
    'regex-tester': RegexTesterTool,
    'markdown-preview': MarkdownPreviewTool,
    'csv-plotter': CsvPlotterTool,
    'latex-editor': LatexEditorTool,
    'bibtex-manager': BibtexManagerTool
};

export default TOOL_RUNNERS;
