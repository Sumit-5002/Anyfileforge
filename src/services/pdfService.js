import * as utils from './pdf/pdfUtils';
import * as mergeSplit from './pdf/pdfMergeSplit';
import * as structure from './pdf/pdfStructure';
import * as layout from './pdf/pdfLayout';
import * as visuals from './pdf/pdfVisuals';
import * as security from './pdf/pdfSecurity';
import * as signer from './pdf/pdfSigner';
import * as imgConv from './pdf/pdfImageConverter';
import * as wordConv from './pdf/pdfWordConverter';
import * as excelConv from './pdf/pdfExcelConverter';
import * as htmlConv from './pdf/pdfHtmlConverter';
import * as comparator from './pdf/pdfComparator';
import * as pdfToWord from './pdf/pdfToWordConverter';

const pdfService = {
    ...utils,
    ...mergeSplit,
    ...structure,
    ...layout,
    ...visuals,
    ...security,
    ...signer,
    ...imgConv,
    ...wordConv,
    ...excelConv,
    ...htmlConv,
    ...comparator,
    ...pdfToWord
};

export default pdfService;
