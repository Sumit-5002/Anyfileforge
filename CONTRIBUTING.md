# Contributing to AnyFileForge

> Thank you for considering contributing! Every contribution — bug fixes, new tools, translations, or docs — makes AnyFileForge better for engineers and researchers worldwide.

---

## 👨‍💻 Project Maintainer

**Sumit Prasad** — [@Sumit-5002](https://github.com/Sumit-5002) — [sumitboy2005@gmail.com](mailto:sumitboy2005@gmail.com)

---

## 📋 Code of Conduct

Be respectful, inclusive, and constructive. Report unacceptable behavior directly to [sumitboy2005@gmail.com](mailto:sumitboy2005@gmail.com).

---

## 🐛 Reporting Bugs

Before filing a bug, check [existing issues](https://github.com/Sumit-5002/Anyfileforge/issues) to avoid duplicates. When you do open one, include:

- **Clear title** describing the problem
- **Steps to reproduce** (exact sequence)
- **Expected vs actual behaviour**
- **Screenshot or error message** if applicable
- **Environment**: Browser, OS, Node version

---

## 💡 Suggesting Features

Open a GitHub Issue with:
- What the feature does
- Why it's useful to engineers/researchers
- Any reference tools that do something similar

---

## 🔧 Development Setup

```bash
# 1. Fork then clone your fork
git clone https://github.com/YOUR_USERNAME/Anyfileforge.git
cd Anyfileforge

# 2. Install frontend dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your Firebase credentials in .env

# 4. Start the dev server
npm run dev
# App runs at http://localhost:5173

# ──── Optional: Run the backend server ────
cd server
npm install
cp .env.example .env  # (or create server/.env — see RENDER_SETUP_GUIDE.md)
npm run dev
# Server runs at http://localhost:5000
```

---

## 🏗️ Project Structure (Quick Reference)

```
PROJECT CODE/
├── src/
│   ├── app/                    # App shell, routing (App.jsx)
│   ├── components/
│   │   ├── layout/             # Header, Footer
│   │   ├── ui/                 # FileUploader, ToolCard, ErrorBoundary
│   │   ├── tools/              # TextToolRunner, FileDropzone, FileList
│   │   ├── meta/               # SeoHead
│   │   └── pwa/                # InstallPwa
│   ├── config/                 # firebase.js, i18n.js
│   ├── contexts/               # AuthContext.jsx
│   ├── data/                   # toolsData.js (master tool registry)
│   ├── features/
│   │   ├── home/               # HomePage
│   │   ├── tools/              # ToolsPage, ToolDetailPage
│   │   │   └── runners/
│   │   │       ├── common/     # ToolWorkspace, GenericFileTool, PageGrid
│   │   │       ├── pdf/        # 27 PDF tool runners
│   │   │       ├── image/      # 13 image tool runners
│   │   │       └── text/       # 9 developer/text tool runners
│   │   ├── about/              # AboutPage, DeveloperPage
│   │   ├── auth/               # AuthPage (login/signup)
│   │   ├── profile/            # ProfilePage
│   │   ├── projects/           # ProjectsPage, ProjectDetailPage (workflow builder)
│   │   ├── pricing/            # PricingPage
│   │   └── legal/              # PrivacyPage, TermsPage, LicensePage
│   ├── hooks/                  # useDeviceType, useParallelFileProcessor
│   ├── locales/                # en.json, es.json, hi.json (i18n)
│   ├── services/
│   │   ├── pdf/                # 14 PDF processing modules
│   │   ├── image/              # 5 image processing modules
│   │   ├── cloudService.js     # Firebase Storage
│   │   ├── projectService.js   # Firestore projects CRUD
│   │   ├── userService.js      # Firestore user profiles
│   │   └── serverProcessingService.js  # Render backend calls
│   ├── styles/                 # index.css (global design tokens)
│   ├── tools/                  # engineer/, researcher/ tool implementations
│   └── utils/                  # fileUtils.js, pageRange.js
├── server/                     # Node.js/Express backend (optional, for heavy tasks)
│   ├── routes/                 # pdf.js, image.js, engineer.js, researcher.js
│   └── server.js               # Express entry point
├── public/                     # logo.png, PWA icons
└── docs/                       # FILE_STRUCTURE.md, RENDER_SETUP_GUIDE.md
```

> See [FILE_STRUCTURE.md](FILE_STRUCTURE.md) for the full annotated breakdown.

---

## ✍️ Coding Standards

### React / JavaScript
- Use **functional components** with hooks — no class components
- Follow **ES2020+** syntax
- Keep components small and single-responsibility
- Co-locate CSS with component (e.g. `MyComponent.jsx` + `MyComponent.css`)
- Use `useCallback` / `useMemo` for expensive functions
- Lazy-load new page-level components in `App.jsx`

### CSS
- Use **CSS custom properties** (variables) defined in `src/styles/index.css` — never hardcode colours
- Keep styles in the component's own `.css` file, not inline
- Always ensure **mobile responsiveness** — test at 375px, 768px, 1200px

### Adding a New Tool

1. Add the tool config entry to `src/data/toolsData.js` (id, name, icon, color, category, accept)
2. Create the runner: `src/features/tools/runners/{category}/YourToolName.jsx`
3. Register the runner in `src/features/tools/runners/index.js`
4. Test it by navigating to `/tools/your-tool-id`

### Commit Messages
Use the **Conventional Commits** format:

```
feat: add PDF crop tool
fix: correct page range parsing for split tool
docs: update FILE_STRUCTURE.md with new routes
refactor: extract common file queue logic to useFileQueue hook
```

---

## ✅ What We Need Help With

### 🔴 High Priority
- [ ] Complete remaining server-mode tool integrations (Word→PDF, OCR, PDF Edit)
- [ ] Add Stripe payment integration (test mode) for Premium tier
- [ ] Firebase Cloud Functions for scheduled file cleanup
- [ ] Add proper error boundaries and user-friendly error messages

### 🟡 Medium Priority
- [ ] Unit tests for service utilities (`pdfService`, `imageService`, `pageRange`)
- [ ] Improve mobile layout for ToolWorkspace (tool pages)
- [ ] Add more i18n translation keys (currently partial coverage)
- [ ] Accessibility audit — ARIA labels, keyboard navigation for modals

### 🟢 Nice to Have
- [ ] Add more researcher tools (HDF5, Parquet, NetCDF viewers)
- [ ] Dark/light theme toggle
- [ ] Drag-and-drop file ordering in more tools
- [ ] Performance: virtual scroll for large file lists

---

## 📬 Submitting a Pull Request

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature-name`
3. Make your changes
4. Run lint: `npm run lint`
5. Test manually in the browser
6. Commit using Conventional Commits format
7. Push: `git push origin feat/your-feature-name`
8. Open a PR against `main` — describe what you changed and why

---

## 📝 License

By contributing, you agree that your contributions will be licensed under the **MIT License**.

---

**Thank you for contributing to AnyFileForge! 🎉**  
*Built with ❤️ by [Sumit Prasad](https://github.com/Sumit-5002)*
