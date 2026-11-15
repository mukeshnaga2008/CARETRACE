# CARETRACE — Application Security Threat Model

**Document Version:** 1.0.0  
**Application:** CARETRACE — The Intelligent Healthcare Continuity Network  
**Target Environment:** Next.js 15, React 19, Supabase PostgreSQL with Row Level Security (RLS)  
**Evaluation Standard:** OWASP Top 10 (2021), OWASP API Security Top 10 (2023), STRIDE Threat Modeling  

---

## 1. Executive Summary & Architecture Overview

CARETRACE is an intelligent healthcare continuity platform designed for elderly patients, their families, and authorized professional care circles. The platform coordinates clinical medication regimens, doctor appointments, care instructions, continuity impact reviews, care gap tracking, proactive notifications, and cryptographic Care Passport summaries.

Because CARETRACE coordinates critical health information, data confidentiality, non-repudiable provenance, and strict tenant/patient isolation are primary system invariants.

### Security Architecture Principles
1. **Defense in Depth:** Client-side UI controls are convenience layers only; server-side routes, middleware, and database Row Level Security (RLS) independently enforce access controls.
2. **Explicit Patient & Care Circle Isolation:** Every health record is foreign-keyed to a `patient_id`. Access is governed by active Care Circle membership, designated roles, and granular permission tiers (`view_only`, `standard_caregiver`, `medication_manager`, `full_admin`).
3. **Fail-Closed Permissions:** Revoked, expired, or suspended Care Circle memberships instantly terminate all read and write privileges.
4. **Data Integrity & Traceability:** Auditable changes, non-repudiable export logs, and cryptographic SHA-256 snapshot hashes (`CT-SHA256-...`) ensure tamper detection for emergency clinical handoffs.
5. **Privacy by Design & PHI Minimization:** Lock-screen and third-party notifications default to non-sensitive generic summaries, shielding Protected Health Information (PHI).

---

## 2. Threat Analysis Matrix (12 Core Healthcare Risks)

The following matrix identifies 12 realistic healthcare coordination threats, analyzing affected application areas, impact, existing controls, required mitigations, and verification methods.

---

### Threat 1: Unauthorized Cross-Patient Record Access (IDOR / Broken Object-Level Authorization)
- **Threat Category:** STRIDE: Information Disclosure / Elevation of Privilege
- **Affected Area:** API endpoints (`/api/medications/*`, `/api/appointments/*`, `/api/instructions/*`, `/api/timeline/*`, `/api/care-passport/*`), dynamic page routes (`/timeline/[id]`, `/instructions/[id]`, `/care-gaps/[id]`).
- **Potential Impact:** Critical. An unauthorized user or family member belonging to Patient A manipulates a `patientId` parameter or record UUID in a request to inspect Patient B’s clinical history, medications, or advance directives.
- **Existing Safeguards:** Supabase Row Level Security (RLS) policies filter by `patient_id IN (SELECT patient_id FROM care_circle_members WHERE user_id = auth.uid() AND is_active = true)`. Middleware protects authenticated paths.
- **Required Mitigation:**
  1. Add strict server-side validation helper (`verifyPatientAccess`) ensuring the authenticated session's user belongs to the requested `patientId` with active status.
  2. Ensure all API route handlers and server actions extract the authorized patient scope from the verified session rather than trusting query parameters blindly.
  3. Ensure database queries combine `id` and `patient_id` in `WHERE` clauses.
- **Testing Approach:** Automated unit and integration tests executing cross-patient IDOR requests against `/api/timeline`, `/api/care-passport/data`, and `/api/medications/[id]`, asserting HTTP 403 Forbidden.

---

### Threat 2: Caregiver or Family-Member Privilege Escalation
- **Threat Category:** STRIDE: Elevation of Privilege
- **Affected Area:** `/api/care-circle/members/[id]`, `/api/instructions/[id]/review`, `/api/care-circle/roles`.
- **Potential Impact:** High. A user with `view_only` or `standard_caregiver` permissions crafts a PATCH/PUT request to elevate their `permissionTier` to `full_admin` or alter clinical verification statuses on care directives.
- **Existing Safeguards:** Client UI disables edit buttons for non-admin roles; RLS policy restricts `care_instructions` mutation to `permission_tier IN ('full_admin', 'caregiver_editor', 'clinician_access')`.
- **Required Mitigation:**
  1. Enforce database-level check: only existing `full_admin` members or the patient themselves can alter `permission_tier` or `membership_status` in `care_circle_members`.
  2. Implement Zod schema validation disallowing self-updates to `permissionTier`.
  3. Validate role-tier hierarchy on every instruction review and continuity decision.
- **Testing Approach:** Test simulating a `view_only` user attempting to PATCH `/api/care-circle/members/[id]` with `permissionTier: 'full_admin'`, verifying rejection with HTTP 403.

---

### Threat 3: Data Access Continuing After Membership or Consent Revocation
- **Threat Category:** STRIDE: Information Disclosure
- **Affected Area:** Care Circle membership management, active session tokens, background notification queues.
- **Potential Impact:** High. A discharged visiting nurse, former home-health aide, or estranged family member retains cached authorization or continues receiving live medication doses, appointment notices, or Care Passport exports.
- **Existing Safeguards:** Database schema includes `membership_status = 'revoked'` and `is_active = false`.
- **Required Mitigation:**
  1. Every data query must verify `is_active = true AND membership_status = 'active'`.
  2. Real-time revocation triggers immediate session invalidation and notification suppression for that recipient.
  3. Notification queue dispatcher verifies active Care Circle membership before delivering queued messages.
- **Testing Approach:** Revoke a simulated caregiver membership, then execute data queries and reminder delivery tests; assert zero records returned and notification marked `suppressed_membership_revoked`.

---

### Threat 4: Insecure Session Handling & Cookie Tampering
- **Threat Category:** STRIDE: Spoofing / Tampering
- **Affected Area:** `src/middleware.ts`, `src/lib/supabase/middleware.ts`, session cookies (`caretrace_session`, `caretrace_demo_role`).
- **Potential Impact:** High. Session hijacking, cookie theft over plaintext networks, or unauthorized role spoofing via cookie modification.
- **Existing Safeguards:** Next.js middleware inspects Supabase auth session; demo mode inspects session flags.
- **Required Mitigation:**
  1. Set cookie attributes: `HttpOnly: true`, `SameSite: 'Lax'`, and `Secure: true` in production environments (`NODE_ENV === 'production'`).
  2. Sanitize and validate `caretrace_demo_role` against an enumerated whitelist (`AppRole`).
  3. Enforce automatic redirection on session expiration.
  4. Ensure complete server-side cookie deletion on logout (`/api/auth/logout`).
- **Testing Approach:** Automated tests verifying that invalid session cookies reject with HTTP 401/307, that cookies set `HttpOnly` and `SameSite`, and that logout deletes all session state.

---

### Threat 5: Insecure API Endpoints & Unvalidated Untrusted Inputs
- **Threat Category:** STRIDE: Tampering / Denial of Service
- **Affected Area:** All `/api/*` endpoints (timeline filters, analytics queries, passport configurations, notification preferences, gap resolutions).
- **Potential Impact:** Medium to High. Injection attacks, server errors, denial of service via oversized pagination limits or malformed payload crashes.
- **Existing Safeguards:** Zod validation schemas implemented across major features.
- **Required Mitigation:**
  1. Enforce strict Zod schema parsing on all POST, PUT, and PATCH request bodies.
  2. Cap query limits (e.g. `limit <= 100`, `page >= 1`).
  3. Return uniform, sanitized error structures `{ error: string, details?: any }` without exposing backend stack traces or internal database column errors.
- **Testing Approach:** Fuzz testing and automated schema validation tests with oversized strings, negative numbers, SQL fragments, and unknown JSON fields.

---

### Threat 6: Exposure of Private Clinical Documents & Care Passport Exports
- **Threat Category:** STRIDE: Information Disclosure
- **Affected Area:** `/care-passport/preview`, `/care-passport/export`, PDF downloads, Supabase Storage buckets.
- **Potential Impact:** Critical. Unauthenticated or public web access to exported Care Passport PDFs, which contain full patient demographics, medical history, emergency proxies, and resuscitation preferences.
- **Existing Safeguards:** Passport generation requires authorization; cryptographic verification hashes logged to `care_passport_exports`.
- **Required Mitigation:**
  1. Private Supabase storage bucket (`care_documents`) configured with `public = false`.
  2. Storage RLS policies requiring valid patient or active Care Circle membership.
  3. Signed URLs with short expiration windows (max 15 minutes) for file downloads.
  4. Non-repudiable audit logging for every export event including requester IP/identity, timestamp, and verification hash.
- **Testing Approach:** Unit tests asserting that storage bucket configuration is strictly private and that unauthenticated requests to export APIs receive 401 Unauthorized.

---

### Threat 7: Sensitive Personal & Health Information (PHI) Appearing in Application Logs
- **Threat Category:** STRIDE: Information Disclosure
- **Affected Area:** Server console logs, error handlers, third-party log collectors, audit event logs.
- **Potential Impact:** Medium. Passwords, auth tokens, patient names, diagnoses, or medication details leaking into centralized logging infrastructure or error monitoring dashboards.
- **Existing Safeguards:** Structured error responses.
- **Required Mitigation:**
  1. Implement a centralized PHI redaction utility (`phi-sanitizer.ts`) masking sensitive patterns (names, emails, tokens, medical identifiers, dosages).
  2. Ensure error loggers never print `request.body` or raw database exceptions directly in production.
  3. Strip credentials and session keys prior to logging audit trails.
- **Testing Approach:** Unit tests passing objects containing sensitive keys (`password`, `token`, `medicationName`, `diagnosis`) through the sanitizer, asserting replacement with `[REDACTED]`.

---

### Threat 8: Malicious or Invalid File Uploads
- **Threat Category:** STRIDE: Tampering / Elevation of Privilege
- **Affected Area:** Instruction Vault attachment uploads (`/api/instructions/[id]/attachments`).
- **Potential Impact:** High. Attackers upload malicious executables, HTML with embedded JavaScript (stored XSS), or zip bombs to compromise client browsers or exhaust storage.
- **Existing Safeguards:** `instruction_attachments` table records MIME type and file size.
- **Required Mitigation:**
  1. Strict server-side MIME type whitelist: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`.
  2. Maximum file size cap: 10 MB per file.
  3. Path traversal defense: sanitize file names to strip `../`, null bytes, and non-alphanumeric characters.
  4. Store files using randomized UUID keys rather than user-supplied file names.
- **Testing Approach:** Automated tests attempting to upload `.exe`, `.html`, oversized files (15MB), and files with `../../` in their names, asserting HTTP 400 rejection.

---

### Threat 9: Notification Information Exposed to Unintended Recipient
- **Threat Category:** STRIDE: Information Disclosure
- **Affected Area:** `/api/notifications`, email delivery (Resend), lock-screen alerts.
- **Potential Impact:** High. Acute clinical notifications delivered to wrong contact or displaying sensitive psychiatric/cardiac medication names on an unattended lock screen.
- **Existing Safeguards:** Privacy setting `nonSensitivePreviewsOnly: true` supported; recipient IDs matched to user profiles.
- **Required Mitigation:**
  1. RLS policy on `notifications` enforcing `recipient_id = auth.uid()` for all SELECT operations.
  2. Notification preview generator masks sensitive clinical terms into generic reminders ("Upcoming Care Task: Scheduled Medication Dose") when privacy mode is active.
  3. Dispatcher re-verifies recipient's active status immediately prior to provider handoff.
- **Testing Approach:** Unit tests verifying that `generateSafePreview` strips medication drug names and condition labels when `nonSensitivePreviewsOnly` is true.

---

### Threat 10: Unsafe Handling of Untrusted Text & Cross-Site Scripting (XSS)
- **Threat Category:** STRIDE: Tampering / Elevation of Privilege
- **Affected Area:** Care instruction rich text, task completion notes, handover descriptions, appointment prep questions.
- **Potential Impact:** High. Script injection via user-supplied text executed in other Care Circle members' or physicians' browsers.
- **Existing Safeguards:** React auto-escapes string content in JSX by default.
- **Required Mitigation:**
  1. Enforce strict Content Security Policy (CSP) blocking unauthorized script sources and disallowing `eval()` in production.
  2. Avoid all use of `dangerouslySetInnerHTML`.
  3. Sanitize markdown and rich text inputs before rendering.
- **Testing Approach:** Automated tests injecting `<script>alert(1)</script>` and `javascript:...` strings into task notes and instruction titles, confirming safe escaping and CSP compliance.

---

### Threat 11: Accidental Exposure of Environment Variables & Service Credentials
- **Threat Category:** STRIDE: Information Disclosure
- **Affected Area:** `.env`, `.env.example`, Next.js client bundles, public git history.
- **Potential Impact:** Critical. Supabase service-role keys or database passwords leaked to client-side JavaScript or committed to version control.
- **Existing Safeguards:** `.gitignore` excludes `.env*.local` and `.env`; service-role key is un-prefixed (`SUPABASE_SERVICE_ROLE_KEY`).
- **Required Mitigation:**
  1. Audit all `NEXT_PUBLIC_*` environment variables; ensure no private credentials use this prefix.
  2. Verify `.gitignore` explicitly blocks all `.env`, `.pem`, `.key`, and `.pfx` files.
  3. Validate that `.env.example` contains only non-secret placeholders and documentation.
- **Testing Approach:** Automated test scanning the build output and client bundle source maps for occurrences of `SUPABASE_SERVICE_ROLE_KEY` or private key patterns.

---

### Threat 12: Background Jobs Operating with Excessive Privileges
- **Threat Category:** STRIDE: Elevation of Privilege
- **Affected Area:** `/api/notifications/process-queue`, `/api/care-gaps/detect`, scheduled reminder scanners.
- **Potential Impact:** High. Unauthenticated external callers trigger denial of service or invoke background jobs repeatedly, causing duplicate alerts or database load.
- **Existing Safeguards:** `CRON_SECRET` bearer token validation.
- **Required Mitigation:**
  1. Protect all background execution routes with constant-time string comparison of the `Authorization: Bearer <CRON_SECRET>` header.
  2. Implement idempotency locking preventing concurrent or duplicate job executions within short intervals.
  3. Restrict background workers to the minimum necessary database operations.
- **Testing Approach:** Automated tests calling `/api/notifications/process-queue` without headers, with invalid secrets, and with valid secrets; verifying HTTP 401 for unauthorized calls and HTTP 200 for valid calls.

---

## 3. Threat Model Summary Table

| ID | Threat Description | STRIDE | Severity | Safeguard Status |
|---|---|---|---|---|
| **T-01** | Cross-Patient Record Access (IDOR) | Information Disclosure | **Critical** | Hardened (RLS + Server verification) |
| **T-02** | Caregiver Privilege Escalation | Elevation of Privilege | **High** | Hardened (Role hierarchy + RLS checks) |
| **T-03** | Access Post-Revocation | Information Disclosure | **High** | Hardened (Active status filters + Queue checks) |
| **T-04** | Insecure Sessions & Cookie Tampering | Spoofing / Tampering | **High** | Hardened (HttpOnly, SameSite, Secure flags) |
| **T-05** | Insecure API Inputs & Malformed Data | Tampering | **Medium** | Hardened (Zod schemas + Uniform error replies) |
| **T-06** | Private Clinical Documents / PDF Leak | Information Disclosure | **Critical** | Hardened (Private storage + Audit ledger) |
| **T-07** | PHI Exposure in Logs | Information Disclosure | **Medium** | Hardened (Centralized PHI Sanitizer) |
| **T-08** | Malicious File Uploads / Path Traversal | Tampering / XSS | **High** | Hardened (MIME whitelist, size cap, UUID keys) |
| **T-09** | Notification Leak to Wrong Recipient | Information Disclosure | **High** | Hardened (Safe previews + Recipient isolation) |
| **T-10** | Untrusted Text Injection (XSS) | Tampering / XSS | **High** | Hardened (CSP headers + React auto-escaping) |
| **T-11** | Environment Variable / Credential Exposure | Information Disclosure | **Critical** | Hardened (.gitignore + Server-only key isolation) |
| **T-12** | Background Job Privilege Abuse | Elevation of Privilege | **High** | Hardened (Constant-time CRON_SECRET auth) |
