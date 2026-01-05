## 2026-01-05 - [Authorization Bypass in Chat API]
**Vulnerability:** The Chat API (`api/chat.js`) caught token verification errors but proceeded to process the request without user tracking, effectively allowing bypassing of usage limits.
**Learning:** Checking for an authorization header is not enough; the token validity must be enforced. Fail-open error handling in authentication paths defeats the purpose of the check.
**Prevention:** Ensure that authentication failures result in a 401/403 response and halt request processing immediately, rather than just logging the error and continuing.
