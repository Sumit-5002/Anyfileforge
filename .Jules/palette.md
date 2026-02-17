## 2025-01-24 - [Semantic File Dropzones]
**Learning:** Converting file dropzones from `div` to `<button>` significantly improves accessibility but requires careful handling of nested `<input>` elements. Since `<button>` cannot contain other interactive elements like `<input>`, the file input must be a sibling, not a child. This ensures the component is natively focusable and responds correctly to keyboard interactions (Enter/Space) without manual event listeners.
**Action:** Always move `<input type="file">` to be a sibling of the trigger `<button>` and use `aria-label` for context while hiding the input from screen readers with `aria-hidden="true"`.

## 2026-02-17 - [Accessible File Triggers]
**Learning:** Using a <label> to wrap a hidden <input type="file"> for custom styling is a common pattern but fails keyboard accessibility because the label itself is not focusable. Keyboard-only users cannot "Tab" to it.
**Action:** Replace <label> wrappers with a semantic <button> that triggers a hidden sibling <input> via a ref. Use :focus-visible to provide clear visual feedback for keyboard users.
