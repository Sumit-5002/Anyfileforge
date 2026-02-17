## 2026-02-15 - Route-based Code Splitting for Large Initial Bundles
**Learning:** In a privacy-first app where many heavy libraries (like `pdf-lib` or `jszip`) are imported by specific tool runners, a single `index.js` bundle can quickly exceed 1MB. Static imports in `App.jsx` force the browser to download every tool even for the homepage.
**Action:** Always implement `React.lazy` and `Suspense` for routes in this codebase to isolate heavy dependencies into separate chunks. This reduced the initial bundle size by ~48%.

## 2026-02-16 - Registry-based Code Splitting for Tool Runners
**Learning:** While route-based splitting isolates pages, central registries (like `TOOL_RUNNERS`) that statically import all sub-components still cause massive bloat in the page-specific chunks. Lazy loading the components within the registry itself is necessary to achieve granular code splitting.
**Action:** Use `React.lazy` within registry objects to ensure that only the required component is downloaded when accessed, preventing unrelated heavy components from being bundled together. This reduced the `ToolDetailPage` chunk size by ~98%.

## 2026-02-16 - Parallelizing Multi-File PDF/Image Processing
**Learning:** Sequential `await` calls within loops for independent file operations (like loading/parsing multiple PDFs in a merge tool) create a linear bottleneck. Parallelizing the resource-heavy loading phase while keeping the state-modifying assembly phase sequential significantly reduces total latency.
**Action:** Always use `Promise.all` to concurrently read and parse independent files before iterating through them for sequential assembly. This achieved a ~2.9x speedup in the PDF merge processing logic.

## 2026-02-17 - Efficient Image Loading and Parallel Batch Processing
**Learning:** Using `FileReader.readAsDataURL` to load images creates large Base64 strings, consuming significant memory and CPU (due to encoding overhead). `URL.createObjectURL` is much faster as it creates a direct reference to the file data. Furthermore, processing multiple independent files (like resizing) in a sequential loop is a major bottleneck that can be easily solved with `Promise.all`.
**Action:** Use `URL.createObjectURL` for image loading and ensure that independent batch operations are parallelized using `Promise.all` with functional state updates (`setCount(prev => prev + 1)`) to avoid race conditions.
