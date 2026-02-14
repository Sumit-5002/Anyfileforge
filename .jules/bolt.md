# Bolt's Journal - Critical Learnings Only

## 2025-05-14 - Route-based code splitting and rendering optimizations
**Learning:** The application had a significant bundle size bottleneck (~1.16MB) because heavy libraries like `pdf-lib` were included in the main chunk via static imports in `App.jsx`. Additionally, the `useEffect` + `useState` pattern for finding tool metadata in `ToolDetailPage.jsx` was causing unnecessary cascading renders and triggering ESLint warnings.
**Action:** Use `React.lazy` and `Suspense` for all top-level routes to isolate heavy dependencies. Prefer `useMemo` for selecting or filtering data from existing static sources to reduce render passes and improve component efficiency.
