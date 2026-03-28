## 2025-05-15 - Accessible Grid Navigation
**Learning:** For grid items containing nested interactive elements (like rotate/remove buttons), using `role="button"` and `tabIndex="0"` on the parent container (when the whole item is clickable) allows keyboard users to select the item via Enter/Space, while children remain independently focusable.
**Action:** Apply `role="button"` and `tabIndex="0"` to clickable grid containers and ensure `onKeyDown` handles Enter/Space.

## 2025-05-20 - Keyboard Visibility for Hover Overlays
**Learning:** Actions hidden behind hover states (like "View" or "Remove" buttons in image grids) are inaccessible to keyboard users unless they are also revealed on focus. Using `:focus-within` on the parent container ensures these secondary actions are available to users tabbing through the interface.
**Action:** Use CSS `:focus-within` on parent containers to reveal overlay controls that are normally shown on `:hover`.
