## 2025-05-15 - Accessible Grid Navigation
**Learning:** For grid items containing nested interactive elements (like rotate/remove buttons), using `role="button"` and `tabIndex="0"` on the parent container (when the whole item is clickable) allows keyboard users to select the item via Enter/Space, while children remain independently focusable.
**Action:** Apply `role="button"` and `tabIndex="0"` to clickable grid containers and ensure `onKeyDown` handles Enter/Space.
