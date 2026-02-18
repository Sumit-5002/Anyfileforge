## 2025-05-22 - [Privilege Escalation via Insecure Firestore Rules]
**Vulnerability:** Users were able to upgrade their own account tier to 'premium' and change their user roles directly from the client because Firestore rules allowed unrestricted writes to their own user document.
**Learning:** In client-side Firebase applications, allowing `write` access to a user's own document without field-level restrictions is a major privilege escalation risk.
**Prevention:** Use `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['sensitive_field'])` in Firestore rules to protect sensitive fields from client-side modification.

## 2026-02-16 - [ReDoS Vulnerability in Regex Testing Endpoint]
**Vulnerability:** The `/api/engineer/regex-test` endpoint allowed users to provide arbitrary regular expressions and test strings. A malicious user could provide a catastrophic backtracking regex (e.g., `(a+)+$`) that would hang the Node.js event loop, causing a Denial of Service.
**Learning:** In Node.js, regular expression operations are synchronous and can block the event loop. User-provided regex patterns are inherently dangerous.
**Prevention:** Always run user-provided regular expressions in a separate context with a strict timeout using the `vm` module or Worker Threads. Additionally, validate that all inputs are strings to prevent type-confusion or context-escape attacks.

## 2026-02-16 - [File Type Validation Bypass via Unanchored Regex]
**Vulnerability:** The file upload filter used an unanchored regular expression (`/jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv/`) to validate file extensions and mimetypes. This allowed attackers to bypass restrictions by using filenames like `test.csv.exe` or mimetypes like `text/csv-malicious`, as the regex would match the "csv" portion anywhere in the string.
**Learning:** Using regex `.test()` on file extensions or mimetypes without anchors (`^` and `$`) is a common security pitfall that leads to validation bypasses.
**Prevention:** Always use strict equality checks or a whitelist (e.g., `Set.has()`) against the full extension and mimetype strings. Ensure extensions are extracted correctly using `path.extname()` and both are converted to lowercase before comparison.

## 2026-02-17 - [DoS and Information Leakage in Computational Endpoints]
**Vulnerability:** The `/hash` and `/minify` endpoints lacked input length limits and allowed arbitrary algorithms/types, potentially leading to DoS or crashes. Additionally, raw error messages from the `crypto` and `JSON` modules were returned to the client.
**Learning:** Computational routes are high-risk for DoS if not strictly bounded. Leaking internal error messages can provide attackers with information about the server's environment or used libraries.
**Prevention:** Enforce strict whitelists for functional parameters and hard length limits (e.g., 1MB) on all computational payloads. Sanitize error responses to return generic messages.
