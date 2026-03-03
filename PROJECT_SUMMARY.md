# AnyFileForge — Project Summary

> **Developer**: Sumit Prasad · [@Sumit-5002](https://github.com/Sumit-5002) · [sumitboy2005@gmail.com](mailto:sumitboy2005@gmail.com)  
> **Repo**: [github.com/Sumit-5002/Anyfileforge](https://github.com/Sumit-5002/Anyfileforge)  
> **Status**: Active Development · Version 0.0.0

---

## 🎉 What Has Been Built

AnyFileForge is a **privacy-first, local-first file processing web application** targeting engineers and researchers. All processing happens in the browser using WebAssembly and modern browser APIs. An optional Node.js/Express backend on Render handles heavy server-side tasks.

---

## ✅ Completed Features

### 1. Full UI/UX Design System
- Dark theme with blue (`#2563eb`) + yellow (`#facc15`) brand palette
- CSS custom properties (design tokens) for colors, spacing, typography, shadows
- Glassmorphism cards, gradient backgrounds, `bg-mesh` and `bg-grid` systems
- Smooth animations (`fadeIn`, `slideUp`, `reveal-scale`, `float`, `sweep`)
- Fully responsive — tested on mobile (375px), tablet (768px), desktop (1200px+)
- Google Fonts: **Outfit** (headings) + **Inter** (body)

### 2. Core Pages (All Implemented)

| Page | Route | Auth |
|------|-------|:----:|
| Home / Landing | `/` | ❌ |
| Tools Catalog | `/tools` | ❌ |
| Tool Detail (dynamic) | `/tools/:toolId` | ❌ |
| About | `/about` | ❌ |
| Developer Profile | `/developer` | ❌ |
| Pricing | `/pricing` | ❌ |
| Auth (Login/Register) | `/login`, `/signup` | ❌ |
| User Profile | `/profile` | ✅ |
| Projects | `/projects` | ✅ |
| Project Detail + Workflow | `/projects/:id` | ✅ |
| Privacy Policy | `/privacy` | ❌ |
| Terms of Service | `/terms` | ❌ |
| License | `/license` | ❌ |

### 3. PDF Tools (25+ Runners Implemented)

**Organize:** Merge · Split · Organize Pages · Remove Pages  
**Optimize:** Compress · Repair  
**Convert to PDF:** Word→PDF · Excel→PDF · PPT→PDF · HTML→PDF · JPG→PDF  
**Convert from PDF:** PDF→Word · PDF→Excel · PDF→PPT · PDF→JPG  
**Edit:** Watermark · Rotate · Page Numbers · Crop · Sign  
**Security:** Unlock · Protect · Redact · Compare

### 4. Image Tools (13 Runners Implemented)

Compress · Convert to JPG · Convert from JPG · Resize · Crop · Rotate/Flip ·
Watermark · Photo Editor · Blur Face · Remove Background · Upscale · Meme Generator · HTML→Image

### 5. Developer / Text Tools (9 Runners)

JSON Formatter · JSON↔CSV · Base64 Encoder · Markdown Preview ·
Regex Tester · Code Minifier · CSV Plotter · LaTeX Editor · BibTeX Manager

### 6. Firebase Integration (Complete)
- **Auth**: Email/password + Google Sign-In via `AuthContext`
- **Firestore**: User profiles, projects, workflows, feedback
- **Storage**: Cloud file saves for premium users
- **Hosting**: Deployed to `anyfileforge.web.app`

### 7. Projects & Workflow Builder (New ✨)
- Create named projects with descriptions
- Clickable project cards navigate to `/projects/:id`
- **Workflow Builder**: Add 50+ tools as pipeline steps, reorder them, run them
- Live run log showing step-by-step progress
- Save/load/delete workflows — persisted to Firestore
- Quick tool shortcut grid in sidebar

### 8. Progressive Web App (PWA)
- Installable on desktop and mobile via `vite-plugin-pwa`
- Offline-ready with Workbox service worker
- Install banner prompt (`InstallPwa` component)

### 9. Internationalization (i18n)
- English, Spanish, Hindi via `i18next` + `react-i18next`
- Language switcher in Header
- Browser language auto-detection

### 10. Optional Node.js / Express Backend (Render)
- Express server in `server/` — deployed to Render.com
- Routes: `/api/pdf/*`, `/api/image/*`, `/api/engineer/*`, `/api/researcher/*`
- Helmet (security headers), CORS, rate limiting, Multer (file uploads)
- `sharp` for high-quality image processing
- Auto-cleanup of temporary uploads (30 min retention)
- Health endpoint: `GET /api/health`

---

## 🏗️ Technology Stack

### Frontend
| Tech | Version | Role |
|------|---------|------|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool + dev server |
| React Router DOM | 7.x | SPA routing |
| Vanilla CSS | — | Design system |
| Lucide React | 0.564 | Icon library |

### PDF Processing (Browser)
| Library | Role |
|---------|------|
| `pdf-lib` | Create, merge, split, rotate, watermark PDFs |
| `pdfjs-dist` | Render PDF pages to canvas |
| `qpdf-wasm-esm-embedded` | Password protection/unlock (WebAssembly) |
| `mammoth` | DOCX → HTML/text extraction |
| `docx` | Generate .docx from extracted content |
| `xlsx` | Read/write Excel files |
| `pptxgenjs` | Generate PowerPoint files |

### Utilities
| Library | Role |
|---------|------|
| `jszip` | Create ZIP archives for batch downloads |
| `react-dnd` + `react-dnd-html5-backend` | Drag-and-drop (PDF page organizer) |
| `i18next` + `react-i18next` | Internationalisation |
| `i18next-browser-languagedetector` | Auto language detection |
| `vite-plugin-pwa` + `workbox-window` | PWA / offline support |

### Backend (Render)
| Tech | Role |
|------|------|
| Node.js + Express | HTTP server |
| `sharp` | Server-side image processing |
| `multer` | File upload handling |
| `helmet` | Security HTTP headers |
| `express-rate-limit` | API rate limiting |
| `cors` | Cross-origin request control |

### Backend-as-a-Service (Firebase)
| Service | Role |
|---------|------|
| Firebase Auth | Login, Google Sign-In |
| Firestore | Users, projects, workflows, feedback |
| Storage | Cloud file saves |
| Hosting | Frontend deployment |

---

## 📁 Key File Locations

| What | Where |
|------|-------|
| All tool definitions | `src/data/toolsData.js` |
| PDF processing logic | `src/services/pdf/` |
| Image processing logic | `src/services/image/` |
| All tool runner UIs | `src/features/tools/runners/` |
| Firebase config | `src/config/firebase.js` |
| i18n config | `src/config/i18n.js` |
| Auth context | `src/contexts/AuthContext.jsx` |
| Global styles | `src/styles/index.css` |
| Backend server | `server/server.js` |
| Backend routes | `server/routes/` |

> Full annotated breakdown → [FILE_STRUCTURE.md](FILE_STRUCTURE.md)

---

## 🚀 How to Run

```bash
# Frontend
npm install
cp .env.example .env   # fill in Firebase keys + VITE_SERVER_URL
npm run dev            # http://localhost:5173

# Backend (optional)
cd server
npm install
npm run dev            # http://localhost:5000
```

> Full Render + ENV setup → [RENDER_SETUP_GUIDE.md](RENDER_SETUP_GUIDE.md) *(see antigravity brain folder)*

---

## 🗺️ Roadmap

### ✅ Done
- [x] 25+ PDF tools with client-side processing
- [x] 13 Image tools
- [x] 9 Developer/text tools
- [x] Firebase Auth + Firestore
- [x] Projects + Workflow builder
- [x] PWA + i18n (EN/ES/HI)
- [x] Express backend on Render

### 🔜 Next
- [ ] Stripe payment integration (Premium tier)
- [ ] Full server-mode tool activation (Word→PDF, OCR, PDF Edit)
- [ ] Unit tests for services
- [ ] Firebase Cloud Functions for auto file cleanup
- [ ] Expanded researcher tools (HDF5, Parquet)
- [ ] Accessibility audit (ARIA, keyboard nav)

---

*Last updated: March 2026 · by [Sumit Prasad](https://github.com/Sumit-5002)*
