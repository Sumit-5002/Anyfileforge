## 2026-02-15 - Route-based Code Splitting for Large Initial Bundles
**Learning:** In a privacy-first app where many heavy libraries (like `pdf-lib` or `jszip`) are imported by specific tool runners, a single `index.js` bundle can quickly exceed 1MB. Static imports in `App.jsx` force the browser to download every tool even for the homepage.
**Action:** Always implement `React.lazy` and `Suspense` for routes in this codebase to isolate heavy dependencies into separate chunks. This reduced the initial bundle size by ~48%.

## 2026-02-16 - Registry-based Code Splitting for Tool Runners
**Learning:** While route-based splitting isolates pages, central registries (like `TOOL_RUNNERS`) that statically import all sub-components still cause massive bloat in the page-specific chunks. Lazy loading the components within the registry itself is necessary to achieve granular code splitting.
**Action:** Use `React.lazy` within registry objects to ensure that only the required component is downloaded when accessed, preventing unrelated heavy components from being bundled together. This reduced the `ToolDetailPage` chunk size by ~98%.
