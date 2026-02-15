# ![Alt text](public/logo.png) AnyFileForge

> **The Ultimate Secure File Processing Platform for Engineers & Researchers**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-orange.svg)](https://firebase.google.com/)
[![Status](https://img.shields.io/badge/Status-Active_Development-green.svg)]()

AnyFileForge is an open-source, privacy-first web application designed to handle complex file operations entirely in the browser. Whether you are an engineer needing to format JSON, a researcher compiling LaTeX, or just someone who needs to merge PDFs, AnyFileForge has you covered.

## 🌟 Why AnyFileForge?

- **🔒 Privacy First**: All processing happens client-side (in your browser). Your files are never uploaded to our servers unless you explicitly choose to save them.
- **⚡ Blazing Fast**: Powered by WebAssembly and modern browser APIs.
- **🛠️ Specialized Tools**: Custom-built utilities for Software Engineers and Academic Researchers.
- **📱 Responsive**: Works perfectly on Desktop, Tablet, and Mobile.

---

## 🔥 Features by Role

### 👨‍💻 For Developers
- **Code Utilities**: JSON Formatter, Minifiers (JS/CSS/HTML), Regex Tester
- **Conversion**: JSON ↔ CSV, Base64 Encoder/Decoder, Markdown Preview
- **API Ready**: Future support for programmatic file processing

### 🔬 For Researchers
- **Data Analysis**: CSV Plotting, creating instant charts
- **Academic Writing**: LaTeX Editor, BibTeX Manager
- **Format Support**: HDF5, Parquet, NetCDF (Planned)

### 📄 For Everyone (Office / General)
- **PDF Suite**: Merge, Split, Compress, Convert (Word/Excel/PPT), Sign, Watermark
- **Image Studio**: Resize, Crop, Compress, Convert (WebP/JPG/PNG)
- **Document Hub**: Office formats conversion

---

## 🏗️ Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS (Modern Variables & Grid), Lucide Icons
- **Backend (Optional)**: Firebase (Auth, Firestore, Storage) for user profiles and cloud saves
- **Core Libs**: `pdf-lib`, `jszip`, `framer-motion` (animations)

---

## 🚀 Quick Start Guide

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/anyfileforge.git
cd anyfileforge
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Update the keys with your Firebase credentials (optional for local tools, required for Auth).

### 3. Run Locally
```bash
npm run dev
```
Visit `http://localhost:5173` to see the app in action!

---

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Storage
3. Copy your Firebase config to `.env`:

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
      allow delete: if true; // Auto-delete via Cloud Function
    }
  }
}
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

### Areas We Need Help

- [ ] Implement actual file processing (PDF, images, documents)
- [ ] Add more file format support
- [ ] Improve mobile responsiveness
- [ ] Add unit and integration tests
- [ ] Enhance accessibility (ARIA labels, keyboard navigation)
- [ ] Create API documentation
- [ ] Add internationalization (i18n)
- [ ] Performance optimizations

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### What This Means

✅ Commercial use  
✅ Modification  
✅ Distribution  
✅ Private use  

## 🎯 Roadmap

### Phase 1: Core Features (Current)
- [x] Basic UI and navigation
- [x] File upload interface
- [ ] PDF processing (merge, split, compress)
- [ ] Image conversion and compression
- [ ] Auto-delete functionality

### Phase 2: Advanced Features
- [ ] Batch processing
- [ ] API for programmatic access
- [ ] Advanced PDF editing (annotations, forms)
- [ ] OCR for scanned documents
- [ ] Cloud storage integration

### Phase 3: Premium Features
- [ ] Extended storage duration
- [ ] Priority processing
- [ ] Team collaboration
- [ ] Self-hosted deployment guide
- [ ] Enterprise SSO

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Firebase](https://firebase.google.com/) - Backend services
- [Lucide Icons](https://lucide.dev/) - Beautiful icons
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [JSZip](https://stuk.github.io/jszip/) - File compression

## 📧 Contact

- **Project Link**: [https://github.com/yourusername/anyfileforge](https://github.com/yourusername/anyfileforge)
- **Issues**: [https://github.com/yourusername/anyfileforge/issues](https://github.com/yourusername/anyfileforge/issues)
- **Email**: contact@anyfileforge.com

## 💖 Support

If you find this project useful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing code
- 📢 Sharing with others

---

**Built with ❤️ for engineers and researchers worldwide**
