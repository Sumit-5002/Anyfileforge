## 2025-05-14 - [Accessibility Enhancement for File Uploaders]
**Learning:** Component-based file uploaders often overlook the keyboard accessibility of the drag-and-drop zone itself. By adding `role="button"` and `tabIndex={0}`, we allow users to "click" the drop zone with Space/Enter, making it discoverable and usable for keyboard-only users. Additionally, hidden inputs used for file selection should always have descriptive `aria-label`s that reflect the specific action (e.g., "Select PDF files" vs just "Select files").
**Action:** Always ensure large click/drop targets have semantic roles and keyboard listeners. Use dynamic ARIA labels for file inputs to provide context about what types of files are expected.

## 2025-05-14 - [Screen Reader Status Announcements]
**Learning:** Visual status icons (processing/complete) are invisible to screen readers if only using CSS classes or `aria-hidden` icons. Using `sr-only` text next to the icon and wrapping the parent container in `aria-live="polite"` ensures that state transitions are announced. Also, avoid `aria-label` on interactive elements that diverges from visible text, as it creates a confusing experience and fails "Label in Name" checks.
**Action:** Use `sr-only` utility classes for status updates and leverage `aria-live` for dynamic UI states. Ensure accessible names match visible labels.
