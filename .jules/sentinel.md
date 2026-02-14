## 2025-05-22 - [Privilege Escalation via Insecure Firestore Rules]
**Vulnerability:** Users were able to upgrade their own account tier to 'premium' and change their user roles directly from the client because Firestore rules allowed unrestricted writes to their own user document.
**Learning:** In client-side Firebase applications, allowing `write` access to a user's own document without field-level restrictions is a major privilege escalation risk.
**Prevention:** Use `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['sensitive_field'])` in Firestore rules to protect sensitive fields from client-side modification.
