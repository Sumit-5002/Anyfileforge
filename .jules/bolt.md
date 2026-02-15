## 2026-02-15 - Route-based Code Splitting for Large Initial Bundles
**Learning:** In a privacy-first app where many heavy libraries (like `pdf-lib` or `jszip`) are imported by specific tool runners, a single `index.js` bundle can quickly exceed 1MB. Static imports in `App.jsx` force the browser to download every tool even for the homepage.
**Action:** Always implement `React.lazy` and `Suspense` for routes in this codebase to isolate heavy dependencies into separate chunks. This reduced the initial bundle size by ~48%.
