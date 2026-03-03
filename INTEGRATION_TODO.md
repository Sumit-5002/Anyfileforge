# Integration TODO

> Last updated: March 2026

---

## ✅ DONE — Backend (Render)

The Express backend is **live and confirmed running** on Render.

```json
{"status":"ok","message":"AnyFileForge API is running",
 "endpoints":["/api/pdf/*","/api/image/*","/api/engineer/*","/api/researcher/*"]}
```

Confirmed working:
- `GET /api/health` → healthy ✅
- `GET /` → API info response ✅
- All route files mounted: `pdf`, `image`, `engineer`, `researcher` ✅
- Helmet, CORS, rate-limiting, Multer all active ✅
- Auto-cleanup of uploads (30 min TTL) ✅

---

## ⚠️ P0 — Must Do Before Push

### 1. Update `VITE_SERVER_URL` in frontend `.env`

Currently set to `localhost:5000` — must be changed to the **live Render URL**:

```env
# .env (root)
VITE_SERVER_URL=https://YOUR-RENDER-URL.onrender.com
```

> Without this, online-mode tools will fail in production because the frontend still calls `localhost`.

### 2. Add Render URL to Firebase Hosting env during build

When running `npm run build` for Firebase Hosting deploy, make sure `.env` has the Render URL set — Vite bakes `VITE_*` vars into the bundle at build time.

### 3. Verify CORS on Render

In Render dashboard → Environment, confirm:
```
CLIENT_URL = https://anyfileforge.web.app
```
Your `server.js` CORS list already includes `https://anyfileforge.web.app` hardcoded — so this should already work.

---

## 🔴 P1 — High Priority

### Server-Mode Tools (Backend wired, but runners show "Coming Soon")
These tools have routes on the server but the frontend runners need to call `serverProcessingService`:

**PDF:**
- [ ] `word-to-pdf` — needs server route call
- [ ] `excel-to-pdf` — needs server route call
- [ ] `pp-to-pdf` — needs server route call
- [ ] `html-to-pdf` — needs server route call
- [ ] `pdf-ocr` — needs server route call
- [ ] `pdf-to-word` (large files) — server fallback
- [ ] `pdf-to-excel` (large files) — server fallback
- [ ] `pdf-to-jpg` (large files) — server fallback

**Image:**
- [ ] `image-upscale` — needs server route call
- [ ] `image-remove-bg` — needs server route call
- [ ] `image-blur-face` — needs server route call (sharp)
- [ ] `image-editor` (advanced) — needs server route call

### Auth + Entitlement Enforcement
- [ ] Confirm `userData.tier` is loaded before gating Pro tools
- [ ] Route guards for `/profile` and `/projects` (redirect to `/login` if not authed)
- [ ] Currently `useAuth()` returns `user` in some places and `currentUser` in others — standardize

### Payments (Stripe)
- [ ] Integrate Stripe Checkout (test mode) for Premium tier
- [ ] Webhook to update `userData.tier` in Firestore on successful payment
- [ ] Coupon validation on backend, not frontend-only

---

## 🟡 P2 — Medium Priority

### Data & Persistence
- [ ] Feedback form → verify Firestore write path works end-to-end
- [ ] Projects → add delete project functionality
- [ ] Add usage event logging per tool run (useful for analytics)

### UX Improvements
- [ ] PDF tools: add page thumbnail preview for split/organize/remove-pages tools
- [ ] Image tools: show before/after file size + compression ratio
- [ ] Workflow builder: add drag-and-drop step reordering (currently uses ↑/↓ buttons)

### Quality
- [ ] Unit tests for: `src/services/pdf/pdfMergeSplit.js`, `src/utils/pageRange.js`, `src/services/imageService.js`
- [ ] `npm run lint` must pass with 0 errors before push
- [ ] Add smoke tests for top 5 tools (merge, split, compress, resize, convert-to-jpg)

---

## 🟢 P3 — Nice to Have

- [ ] Researcher tools: HDF5 viewer, Parquet reader, NetCDF support
- [ ] Accessibility audit — ARIA labels, focus traps in modals, keyboard navigation
- [ ] More i18n coverage — currently only partial UI strings are translated
- [ ] Firebase Cloud Functions for scheduled Storage cleanup (instead of server-side cleanup)
- [ ] CI/CD: GitHub Actions for `npm run lint` + `npm run build` on every PR

---

## 📋 Suggested Execution Order

1. ✅ ~~Fix runner import paths~~ — Done
2. ✅ ~~Deploy backend to Render~~ — **Done and confirmed live**
3. ⬅️ **YOU ARE HERE** — Update `VITE_SERVER_URL` with live Render URL → rebuild → redeploy Firebase Hosting
4. Activate server-mode tool runners one vertical at a time (start with `html-to-pdf`)
5. Integrate Stripe test payments
6. Complete remaining server-mode tools
7. Write tests for critical services
