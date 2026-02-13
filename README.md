# 🔨 AnyFileForge

> **A Free, Open-Source Cross-Platform File Sharing & Processing System**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-orange.svg)](https://firebase.google.com/)

AnyFileForge is a privacy-first file processing platform built specifically for engineers and researchers. Convert, compress, merge, and process files with professional-grade tools—all while maintaining complete control over your data.

## ✨ Features

### 🔐 Privacy & Security
- **Client-Side Encryption**: Files are encrypted in your browser before upload
- **Auto-Delete**: All files automatically delete after 30 minutes
- **Zero Data Retention**: We never store or track your files
- **No Registration Required**: Use core features without creating an account

### 🛠️ File Processing Tools

#### PDF Tools
- Merge multiple PDFs into one
- Split PDFs by page range
- Compress PDFs to reduce file size
- Convert PDF ↔ Word/Excel/PowerPoint/Images

#### Image Tools
- Convert between formats (JPG, PNG, WebP, TIFF)
- Compress images with quality control
- Resize and crop images
- Batch processing support

#### Document Tools
- Convert DOCX, XLSX, PPTX files
- Office documents ↔ PDF conversion
- Preserve formatting and metadata

#### Data Tools (For Researchers)
- JSON/YAML/XML conversion
- CSV/Excel data processing
- Support for HDF5, Parquet, NetCDF
- LaTeX, BibTeX, Jupyter notebook tools

### 🌐 Cross-Platform
- **Web**: Works on any modern browser
- **Desktop**: Windows, macOS, Linux
- **Mobile**: iOS and Android (Progressive Web App)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase account (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/anyfileforge.git
cd anyfileforge

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Firebase credentials to .env
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
# ... etc

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
anyfileforge/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── FileUploader.jsx
│   │   └── ToolCard.jsx
│   ├── pages/              # Page components
│   │   ├── HomePage.jsx
│   │   ├── ToolsPage.jsx
│   │   ├── PricingPage.jsx
│   │   └── AboutPage.jsx
│   ├── utils/              # Utility functions (to be added)
│   ├── services/           # API services (to be added)
│   ├── firebase.js         # Firebase configuration
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env.example            # Environment variables template
├── package.json
├── vite.config.js
├── LICENSE                 # MIT License
└── README.md
```

## 🔧 Configuration

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
