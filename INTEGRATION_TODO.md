# Integration TODO

## Current State

- Tool architecture was started with per-tool runner files under `src/features/tools/runners/`.
- `ToolDetailPage` already routes to runner components using `TOOL_RUNNERS`.
- Some files are still partially wired due an interrupted edit session.

## P0: Must Fix First (Build/Runtime Blocking)

- Fix broken relative imports in runner files.
- Current issue:
- Many runners still import from `../../../services/...`, `../../../utils/...`, and `../../../components/tools/TextToolRunner`.
- Correct paths should be:
- From `src/features/tools/runners/pdf/*` and `src/features/tools/runners/image/*`: `../../../../services/...`
- From `src/features/tools/runners/pdf/*` for page range: `../../../../utils/pageRange`
- From `src/features/tools/runners/text/*`: `../../../../components/tools/TextToolRunner`
- Affected files:
- `src/features/tools/runners/pdf/*.jsx` (except already patched files)
- `src/features/tools/runners/image/*.jsx`
- `src/features/tools/runners/text/*.jsx`

## P0: Verify Functional Tool Coverage

- Confirm serverless tools have a runner and actual logic:
- `pdf-merge`, `pdf-split`, `pdf-organize`, `pdf-remove-pages`, `pdf-compress`, `pdf-rotate`, `pdf-pagenumber`, `pdf-watermark`, `pdf-unlock`, `pdf-crop`, `jpg-to-pdf`
- `image-compress`, `image-to-jpg`, `image-from-jpg`, `image-resize`, `image-crop`, `image-rotate`, `image-watermark`, `image-meme`
- `json-formatter`, `json-to-csv`, `base64-encode`, `code-minifier`, `regex-tester`, `markdown-preview`, `csv-plotter`, `latex-editor`, `bibtex-manager`

## P1: Server Mode Integration (Backend)

- Current server-mode tools are intentionally gated and show "Coming Soon".
- Integrate real backend execution for:
- `word-to-pdf`, `excel-to-pdf`, `pp-to-pdf`, `html-to-pdf`
- `pdf-ocr`, `pdf-repair`, `pdf-to-word`, `pdf-to-excel`, `pdf-to-pp`, `pdf-to-jpg`
- `pdf-edit`, `pdf-sign`, `pdf-redact`, `pdf-protect`, `pdf-compare`, `pdf-pdfa`
- `image-upscale`, `image-remove-bg`, `image-blur-face`, `image-editor`

### Recommended backend for this project

- Best fit now: Firebase stack.
- `Firebase Hosting` for frontend deploy.
- `Cloud Functions (2nd gen)` for server-mode processing endpoints.
- `Firestore` for user metadata, tool jobs, feedback.
- `Cloud Storage` for temporary job files.
- Reason:
- Already using Firebase in project.
- Fastest integration path with least migration cost.
- Good free/start tier for demo.

## P1: Auth and Entitlement Enforcement

- Keep free usage without login for serverless tools.
- Enforce login + plan check for:
- `tool.mode === 'server'`
- `tool.isPro === true`
- Confirm `userData.tier` is reliably loaded before gating decision.
- Add route guards for profile/projects pages if required.

## P1: Payments and Coupons

- Current checkout is demo-level.
- Integrate real payment provider:
- Recommended: `Stripe Checkout` (test mode for free demo).
- Required:
- Product/price IDs in env.
- Webhook endpoint to upgrade tier in Firestore.
- Coupon validation source of truth in backend, not frontend-only.

## P1: Data Integrations

- Feedback persistence:
- Add/verify Firestore write path + validation.
- Projects persistence:
- Confirm create/list/update/delete flow and security rules.
- Add usage logging for tool runs (optional but useful for analytics + debugging).

## P2: UX and Tool Logic Enhancements

- PDF tools:
- Add page thumbnail preview for split/organize/remove/crop.
- Add drag-and-drop reorder UI in organize tool.
- Add "selected pages" visual confirmation.
- Image tools:
- Add live preview for crop, rotate, watermark, meme.
- Show before/after size and compression ratio.
- Improve validation messages for invalid numeric inputs.

## P2: Stability and Quality

- Add automated checks:
- `npm run lint`
- build check in CI
- Add test coverage for service utilities:
- `src/services/pdfService.js`
- `src/services/imageService.js`
- `src/utils/pageRange.js`
- Add smoke tests for top tools (merge/split/compress/convert).

## P2: Deployment and Ops

- Add environment strategy:
- `.env.example` complete and current.
- No secrets in repo.
- Add production deploy docs:
- Firebase hosting + functions deploy commands.
- Add error logging/monitoring:
- Firebase Crashlytics alternatives for web or basic logging pipeline.

## Suggested Execution Order

1. Fix runner import paths and compile.
2. Run lint/build and fix all blocking issues.
3. Validate all serverless tools end-to-end.
4. Integrate Firebase Functions for one server-mode vertical first (`html-to-pdf` + `pdf-ocr`).
5. Integrate Stripe test payments + tier update webhook.
6. Complete remaining server-mode tools in phases.

