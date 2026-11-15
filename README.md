# CARETRACE — The Intelligent Healthcare Continuity Network

> **PromptWars × Catalyst 2026 Submission**  
> An interconnected, elder-centred healthcare coordination platform featuring deterministic care continuity, proactive care gap radar, and caregiver synchronization.

---

## 1. What CARETRACE Does

Healthcare transitions are notoriously fragile for elderly individuals. When a senior transitions between hospital, specialist consultations, primary care, and home care, discharge notes get misplaced, medication regimens become duplicated or conflicting, and family caregivers are left uncertain about who is responsible for which task.

**CARETRACE** solves this through:
- **Elder Home Centred Interface:** Designed for elderly autonomy with high-contrast text, large touch controls, voice-readout daily schedules, and 1-touch emergency callout.
- **Medication Lifecycle & Adherence Tracker:** Full lifecycle prescription management with scheduled dose tracking, reason codes for missed/skipped doses, and adherence analytics.
- **Care Continuity Engine (Signature Innovation):** Deterministic, versioned care instructions with source provenance (e.g. hospital discharge, cardiology consult). Analyzes changes across medications and tasks, calculates future impacted dose events, and mandates an authorized human-in-the-loop clinical approval gate before activating updates.
- **Care Gap Radar:** Proactive automated engine scanning for missed medication streaks, overdue care tasks, expiring refills, and lapsed doctor follow-ups with one-click resolution.
- **Proactive Notification Centre & Reminder Engine:** Multi-channel alerting (In-App, Email via Resend, Carrier SMS) with honest state machines (`sent_to_provider` != `delivered`), lock-screen non-sensitive preview sanitization, quiet hours suppression, and explicit bilateral responsibility sign-offs.
- **Care Circle Collaboration:** Granular permission tiers (`full_admin`, `caregiver_editor`, `family_viewer`, `emergency_only`) synchronizing family members and professional caregivers.
- **Emergency Care Passport:** Standardized clinical emergency handoff document with QR verification and authorized PDF export.

---

## 2. Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Standalone Output)
- **Runtime & Language:** [Node.js](https://nodejs.org/) (v22/v24), [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling & Design System:** [Tailwind CSS](https://tailwindcss.com/) with custom elder accessibility palette (Deep Navy & Clinical Teal), [Lucide React](https://lucide.dev/) icons
- **Database & Auth:** [Supabase](https://supabase.com/) PostgreSQL with Row Level Security (RLS) policies and foreign key integrity
- **Validation:** [Zod](https://zod.dev/) for strict runtime input validation
- **Testing:** [Vitest](https://vitest.dev/) for unit and integration testing
- **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF) for client-side accessible Care Passport exports
- **Containerization & Deployment:** Docker multi-stage build configured for [Google Cloud Run](https://cloud.google.com/run)

---

## 3. Prerequisites

- **Node.js:** `v20.x` or higher (tested on `v22.x` and `v24.15.0`)
- **Package Manager:** `pnpm` (v11 or v12 recommended) or `npm` (v10+)
- **Git**

---

## 4. Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CARETRACE
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *Note:* CARETRACE comes pre-configured with a complete synthetic demonstration mode (`NEXT_PUBLIC_DEMO_MODE=true`), allowing evaluators to run the complete platform instantly with realistic synthetic patient data without needing third-party API accounts.

4. **Run the Development Server:**
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Environment Configuration

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_DEMO_MODE` | Enable synthetic demo data mode | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | `your-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | `your-service-role-key` |
| `RESEND_API_KEY` | Resend API key for live email notifications | `re_...` (optional in demo mode) |
| `NOTIFICATION_FROM_EMAIL` | Sender email address | `alerts@caretrace.health` |
| `CRON_SECRET` | Secret token for Google Cloud Scheduler / cron queue runner | `caretrace-cron-secret-2026` |
| `ACCESS_PIN_SALT` | Salt for emergency access PIN hashing | `caretrace-secure-salt-2026` |

---

## 6. Development & Quality Commands

```bash
# Start development server
pnpm run dev

# Run unit and integration tests
pnpm run test

# Run TypeScript type check
pnpm tsc --noEmit

# Build production bundle (Standalone output for Cloud Run)
pnpm run build

# Start production server locally
pnpm run start
```

---

## 7. Deployment

### Vercel Deployment (Recommended):
CARETRACE is optimized for instant deployment on [Vercel](https://vercel.com):
1. Import the GitHub repository: [`https://github.com/mukeshnaga2008/CARETRACE`](https://github.com/mukeshnaga2008/CARETRACE)
2. Framework preset: **Next.js**
3. Configure environment variables from `.env.example` (or set `NEXT_PUBLIC_DEMO_MODE=true` for demonstration evaluation)
4. Click **Deploy**.

### Local Docker Build & Test:
```bash
docker build -t caretrace .
docker run -p 8080:8080 -e PORT=8080 caretrace
```

### Google Cloud Run Deployment:
```bash
gcloud run deploy caretrace \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## 8. Clinical Safety & Non-Diagnostic Boundary

CARETRACE is a healthcare coordination and communication platform. 
- It does **not** make clinical diagnoses.
- It does **not** compute medical dosages or prescribe therapy.
- It requires **explicit human verification and approval** before any care instruction change is activated.
- All demonstrations strictly use synthetic, fictional clinical scenarios.

---

## 9. Security, Privacy & Threat Mitigation (Phase 14 Hardened)

CARETRACE incorporates a comprehensive healthcare security model documented in [THREAT_MODEL.md](THREAT_MODEL.md), [SECURITY_REVIEW.md](SECURITY_REVIEW.md), and [SECURITY_TEST_REPORT.md](SECURITY_TEST_REPORT.md).

### Core Security Controls
- **Patient Isolation & IDOR Defense:** Every health record is bounded by `patient_id`. Access is enforced at both the application API layer (`verifyPatientScope`) and database layer via Supabase Row Level Security (RLS).
- **Fail-Closed Access Revocation:** Suspended or revoked Care Circle relationships instantly revoke read, write, and notification delivery privileges.
- **Privilege Escalation Prevention:** Anti-tampering triggers (`trg_prevent_privilege_escalation`) and server-side checks prevent non-admin users from modifying their own roles or permission tiers.
- **Strictly Private Document Storage:** Clinical attachments and Care Passport PDFs are stored in private Supabase buckets (`care_documents`, `public = false`) protected by object-level RLS policies.
- **Secure File Upload Pipeline:** Strict MIME type whitelist (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`), 10MB size boundaries, path traversal neutralization, and UUID key isolation.
- **PHI Sanitization in Logs:** Centralized log sanitizer (`src/lib/security/phi-sanitizer.ts`) masks sensitive keys and redacts passwords, tokens, SSNs, phone numbers, and emails.
- **HTTP Security Headers & CSP:** Next.js configured with Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (DENY), and X-Content-Type-Options (nosniff).
- **Rate Limiting:** Sliding-window rate limiter protecting login, passport export, and background queue endpoints.
- **Constant-Time Verification:** Timing-safe comparisons (`safeCompare`) for `CRON_SECRET` and authentication tokens.

