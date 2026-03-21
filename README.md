# <img src="public/logo.png" alt="Logo" width="50" height="50"> AnyFileForge

> **The Ultimate Secure File Processing Platform for Engineers & Researchers**  
> *Built by [Sumit Prasad](https://github.com/Sumit-5002)*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-orange.svg)](https://firebase.google.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Sumit--5002-181717?logo=github)](https://github.com/Sumit-5002)
[![Status](https://img.shields.io/badge/Status-Active_Development-green.svg)]()

AnyFileForge is an open-source, **privacy-first** web application that handles complex file operations **entirely in the browser**. No file ever leaves your device unless you explicitly choose to save it to the cloud. Whether you're an engineer who needs to format JSON, a researcher compiling LaTeX, or just someone who needs to merge PDFs — AnyFileForge has you covered.

---

## 🌟 Why AnyFileForge?

- **🔒 Privacy First** — All processing happens client-side (in your browser). Your files are never uploaded to our servers unless you explicitly opt-in.
- **⚡ Blazing Fast** — Powered by WebAssembly (`qpdf-wasm`, `pdfjs-dist`) and modern browser APIs.
- **🛠️ Specialized Tools** — Custom-built utilities for Software Engineers and Academic Researchers, not just generic converters.
- **📱 Fully Responsive** — Works perfectly on Desktop, Tablet, and Mobile.
- **🌍 Multilingual** — Supports English, Spanish, and Hindi via `i18next`.
- **📦 Installable PWA** — Install AnyFileForge as a native-like app on any device.

---

## 🔥 Features by Role

### 👨‍💻 For Developers / Engineers
- **Code Utilities**: JSON Formatter & Validator, JS/CSS/HTML Minifier, Regex Tester
- **Data Conversion**: JSON ↔ CSV, Base64 Encoder/Decoder, Markdown Live Preview
- **Visualization**: CSV Data Plotter, Interactive charts

### 🔬 For Academic Researchers
- **Academic Writing**: LaTeX Editor, BibTeX Reference Manager
- **Data Analysis**: CSV Plotting with instant chart generation
- **Format Support**: HDF5, Parquet, NetCDF *(Planned)*

### 📄 For Everyone (PDF & Images)
- **PDF Suite (25+ tools)**: Merge, Split, Compress, Rotate, Watermark, Sign, Protect, Unlock, Compare, Redact, Add Page Numbers, Organize Pages, Repair
- **PDF Conversions**: PDF↔Word, PDF↔Excel, PDF↔PPT, PDF↔JPG, HTML→PDF, JPG→PDF
- **Image Studio**: Resize, Crop, Compress, Rotate/Flip, Convert (WebP/JPG/PNG), Watermark, Blur Faces, Remove Background, Meme Generator, Upscale

---

## 🏗️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | `^19.2.0` | Core UI framework — component-based rendering |
| **React DOM** | `^19.2.0` | React renderer for the browser |
| **Vite** | `^7.3.1` | Build tool & dev server with HMR |
| **React Router DOM** | `^7.13.0` | Client-side routing (SPA navigation) |

### Styling & Icons
| Technology | Version | Purpose |
|---|---|---|
| **Vanilla CSS** | — | Custom design system with CSS variables, no framework needed |
| **Lucide React** | `^0.564.0` | Beautiful, consistent SVG icon set |

### PDF Processing
| Library | Version | Purpose |
|---|---|---|
| **pdf-lib** | `^1.17.1` | Create, merge, split, rotate, watermark, and modify PDFs in the browser |
| **pdfjs-dist** | `^5.5.207` | Render PDF pages to canvas (view, extract text, convert to image) |
| **qpdf-wasm-esm-embedded** | `^1.1.1` | WebAssembly port of QPDF — password protection & unlocking |
| **mammoth** | `^1.11.0` | Convert `.docx` Word files to HTML/text for PDF generation |
| **docx** | `^9.6.0` | Generate `.docx` Word files from extracted PDF content |
| **xlsx** | `^0.18.5` | Read/write Excel `.xlsx` files — used in PDF→Excel conversion |
| **pptxgenjs** | `^4.0.1` | Generate PowerPoint `.pptx` files from PDF page renders |

### File & Archive Utilities
| Library | Version | Purpose |
|---|---|---|
| **jszip** | `^3.10.1` | Create and read `.zip` archives (batch download multiple output files) |

### Drag & Drop
| Library | Version | Purpose |
|---|---|---|
| **react-dnd** | `^16.0.1` | Drag-and-drop framework for React (PDF page organizer) |
| **react-dnd-html5-backend** | `^16.0.1` | HTML5 drag-and-drop backend for `react-dnd` |
| **dnd-core** | `^16.0.1` | Core state management engine for `react-dnd` |

### Internationalization (i18n)
| Library | Version | Purpose |
|---|---|---|
| **i18next** | `^25.8.7` | Internationalization framework |
| **react-i18next** | `^16.5.4` | React bindings for i18next (`useTranslation` hook) |
| **i18next-browser-languagedetector** | `^8.2.1` | Auto-detects user's browser language |

### Backend-as-a-Service (Firebase)
| Service | Version | Purpose |
|---|---|---|
| **firebase** | `^12.9.0` | Firebase JavaScript SDK |
| **Firebase Auth** | — | Email/password and Google Sign-In authentication |
| **Firebase Firestore** | — | NoSQL database for user profiles, projects, feedback |
| **Firebase Storage** | — | Cloud file storage for user-saved processed files |
| **firebase-tools** | `^15.6.0` | CLI tool for deploying to Firebase Hosting |

### Progressive Web App (PWA)
| Library | Version | Purpose |
|---|---|---|
| **vite-plugin-pwa** | `^1.2.0` | Generates PWA manifest and service worker via Workbox |
| **workbox-window** | `^7.4.0` | Manages service worker lifecycle & update notifications |

### Dev Dependencies
| Tool | Version | Purpose |
|---|---|---|
| **@vitejs/plugin-react** | `^5.1.4` | Vite plugin for React — Fast Refresh, JSX transform |
| **ESLint** | `^9.39.1` | JavaScript/JSX linter for code quality |
| **eslint-plugin-react-hooks** | `^7.0.1` | ESLint rules for correct React Hooks usage |
| **eslint-plugin-react-refresh** | `^0.4.24` | ESLint rules for Vite's Fast Refresh compatibility |
| **@types/react** | `^19.2.7` | TypeScript type definitions for React |
| **globals** | `^16.5.0` | Global variable definitions for ESLint environments |

---

## 📁 Backend Server (Optional)

> The backend server handles computationally heavy file operations that would be too slow or memory-intensive in the browser.

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | LTS | Server runtime |
| **Express** | `^4.18.2` | HTTP server framework for REST API routes |
| **Multer** | `^1.4.5-lts.1` | Multipart form data parser — handles file uploads |
| **Sharp** | `^0.33.0` | High-performance image processing (resize, compress, convert) |
| **pdf-lib** | `^1.17.1` | PDF creation and manipulation on the server |
| **Helmet** | `^7.1.0` | Secures HTTP headers against common vulnerabilities |
| **express-rate-limit** | `^7.1.5` | Prevents API abuse with per-IP rate limiting |
| **cors** | `^2.8.5` | Enables Cross-Origin Resource Sharing for the frontend |
| **dotenv** | `^16.3.1` | Loads `.env` file into `process.env` |
| **nodemon** | `^3.0.2` | *(devDep)* Auto-restarts server on file changes during development |

---

## 🚀 Quick Start Guide

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/anyfileforge.git
cd anyfileforge
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Open `.env` and fill in your Firebase credentials (see [Firebase Setup](#-firebase-setup) below).

### 3. Run Locally
```bash
npm run dev
```
Visit `http://localhost:5173` to see the app in action!

### 4. (Optional) Run the Backend Server
```bash
cd server
npm install
npm run dev
```
The server runs on `http://localhost:3001` by default.

---

## 🔥 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google provider)
3. Enable **Firestore Database**
4. Enable **Storage**
5. Copy your Firebase web config to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /files/{fileId} {
      allow read, write: if request.auth != null;
      allow delete: if request.time > resource.data.expiresAt;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /files/{fileId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📁 File Structure

See **[FILE_STRUCTURE.md](FILE_STRUCTURE.md)** for a detailed, annotated breakdown of every folder and file in the project.

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

✅ Commercial use &nbsp; ✅ Modification &nbsp; ✅ Distribution &nbsp; ✅ Private use

---

## 🎯 Roadmap

### Phase 1: Core Features *(Current)*
- [x] Full UI and navigation
- [x] 25+ PDF tools (merge, split, compress, convert, sign, protect…)
- [x] 13+ Image tools (resize, crop, compress, convert, watermark…)
- [x] Developer tools (JSON, Regex, Base64, Markdown, Minifier…)
- [x] Firebase Authentication (Email + Google)
- [x] Multilingual support (EN / ES / HI)
- [x] PWA — installable as desktop/mobile app
- [x] Drag-and-drop PDF page organizer

### Phase 2: Advanced Features
- [ ] Batch processing with progress tracking
- [ ] REST API for programmatic access
- [ ] Advanced PDF annotations and form filling
- [ ] OCR for scanned documents (Tesseract.js)
- [ ] Expanded researcher tools (HDF5, Parquet, NetCDF)

### Phase 3: Premium Features
- [ ] Extended cloud storage duration
- [ ] Priority processing queue
- [ ] Team collaboration and file sharing
- [ ] Self-hosted deployment guide
- [ ] Enterprise SSO

---

## 🙏 Acknowledgments

| Library | Use |
|---------|-----|
| [React](https://reactjs.org/) | UI framework |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Firebase](https://firebase.google.com/) | Auth, database, storage |
| [pdf-lib](https://pdf-lib.js.org/) | Client-side PDF manipulation |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | PDF rendering engine |
| [Lucide Icons](https://lucide.dev/) | Icon set |
| [docx](https://docx.js.org/) | Word document generation |
| [pptxgenjs](https://gitbrent.github.io/PptxGenJS/) | PowerPoint generation |
| [xlsx](https://sheetjs.com/) | Excel file handling |
| [sharp](https://sharp.pixelplumbing.com/) | Server-side image processing |

---

## 👨‍💻 Developer & Contact

| Field | Details |
|-------|---------|
| **Name** | Sumit Prasad |
| **Role** | Full-Stack Software Engineer |
| **GitHub Profile** | [@Sumit-5002](https://github.com/Sumit-5002) |
| **Project Repository** | [Sumit-5002/Anyfileforge](https://github.com/Sumit-5002/Anyfileforge) |
| **Report Issues** | [Anyfileforge/issues](https://github.com/Sumit-5002/Anyfileforge/issues) |
| **LinkedIn** | [sumit-prasad-bce2005](https://linkedin.com/in/sumit-prasad-bce2005) |
| **Email** | [sumitboy2005@gmail.com](mailto:sumitboy2005@gmail.com) |

---

**Built with ❤️ by [Sumit Prasad](https://github.com/Sumit-5002) — for engineers and researchers worldwide**

AF-PROJECT-DEV-2026
