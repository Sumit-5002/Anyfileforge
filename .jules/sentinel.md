## 2025-05-22 - [Privilege Escalation via Insecure Firestore Rules]
**Vulnerability:** Users were able to upgrade their own account tier to 'premium' and change their user roles directly from the client because Firestore rules allowed unrestricted writes to their own user document.
**Learning:** In client-side Firebase applications, allowing `write` access to a user's own document without field-level restrictions is a major privilege escalation risk.
**Prevention:** Use `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['sensitive_field'])` in Firestore rules to protect sensitive fields from client-side modification.

## 2026-02-16 - [ReDoS Vulnerability in Regex Testing Endpoint]
**Vulnerability:** The `/api/engineer/regex-test` endpoint allowed users to provide arbitrary regular expressions and test strings. A malicious user could provide a catastrophic backtracking regex (e.g., `(a+)+$`) that would hang the Node.js event loop, causing a Denial of Service.
**Learning:** In Node.js, regular expression operations are synchronous and can block the event loop. User-provided regex patterns are inherently dangerous.
**Prevention:** Always run user-provided regular expressions in a separate context with a strict timeout using the `vm` module or Worker Threads. Additionally, validate that all inputs are strings to prevent type-confusion or context-escape attacks.
