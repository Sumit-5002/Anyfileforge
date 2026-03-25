# Integration TODO

## Current State

- Tool architecture standardized with per-tool runner files under `src/features/tools/runners/`.
- `ToolDetailPage` fully routes to runner components using `TOOL_RUNNERS`.
- Researcher & Scientific tools are being prioritized for academic workflows.

## P0: Completed & Verified

- [x] **Fix broken relative imports**: All runner files patched to use `../../../../services/` and `../../../../components/tools/`.
- [x] **PDF to Word (Offline)**: Fixed browser compatibility issues (Blob vs Buffer) in `pdfToWordConverter.js`.
- [x] **Parquet Viewer**: Upgraded with SQL querying, Visualization (Charts), and Schema stats.
- [x] **HDF5 Viewer**: Repaired tree traversal and implemented CSV/JSON export handlers.
- [x] **NetCDF Viewer**: Added "Global Export" for multi-variable synchronization and Panoply-style UI.
- [x] **DOI to BibTeX**: Verified offline-first logic and UI refinements.
- [x] **Jupyter (.ipynb) to PDF**: Implemented high-fidelity client-side rendering via html2canvas.

## P1: Immediate Research & Science (Bioinformatics)

- [ ] **FASTQ QC**: Refactor to export raw dataset (CSV/JSON/FASTQ) instead of just the summary report.
- [ ] **FASTA Analyzer**: Verify biological library integration (e.g., biotypes/sequences) and ensure offline reliability.
- [ ] **MAT Viewer**: Fix multi-file (.mat) support and improve nested structure visibility.
- [ ] **PCAP Analyzer**: Fix UI overflow in packet list and improve frame detailed view.
- [ ] **LaTeX Editor**: Build split-pane editor/preview interface with offline PDF export.
- [ ] **BibTeX Manager**: Fix parsing logic and implement proper citation exports.

## P1: Server Mode Integration (Backend Gating)

- Current server-mode tools are intentionally gated and show "Coming Soon".
- [ ] **Backend Setup**: Initialize Firebase Cloud Functions (2nd gen) for heavy processing.
- [ ] **Tools to Integrate**:
    - `pdf-ocr`, `pdf-repair`, `pdf-redact` (for massive files), `pdf-protect`, `pdf-compare`.
    - `word-to-pdf`, `excel-to-pdf`, `pp-to-pdf`, `html-to-pdf`.
    - `image-upscale`, `image-remove-bg`.

## P2: UX and UI Excellence 

- [ ] **PDF Thumbnails**: Add thumbnail rendering for `pdf-organize` and `pdf-split`.
- [ ] **Drag & Drop**: Implement `react-dnd` for PDF page reordering.
- [ ] **Bio-Visuals**: Add sequence alignment visualizations for FASTA/FASTQ.
- [ ] **PWA Enhancement**: Improve offline manifest for heavy scientific libraries.

## Suggested Execution Order

1. Complete FASTQ/FASTA bioinformatics upgrades.
2. Fix PCAP/MAT viewer UI and deep-structure bugs.
3. Build the LaTeX/BibTeX academic suite.
4. Scale to Backend (Firebase Functions) for OCR and Office conversions.
5. Integrate Payments (Stripe) for Pro features.

