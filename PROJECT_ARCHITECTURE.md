# CARETRACE — Project Architecture Specification

**Product:** CARETRACE  
**Positioning:** The Intelligent Healthcare Continuity Network  
**Target:** PromptWars × Catalyst 2026

---

## 1. Executive Summary

CARETRACE is an interconnected, elder-centred healthcare coordination platform. It eliminates fragmented care transitions, ambiguous handovers, and missed medications by bridging the communication gap between elderly patients, family members, informal caregivers, and multidisciplinary healthcare providers.

---

## 2. Architectural Boundaries & System Structure

The system is architected as a modular Next.js 15 App Router platform with strict TypeScript typing, Tailwind CSS elder-optimized design system, Supabase PostgreSQL with Row Level Security (RLS), and containerized Cloud Run execution.

```
c:\Users\mukes\Music\CARETRACE
├── src/
│   ├── app/                         # Next.js App Router (pages, layouts, routes, APIs)
│   │   ├── api/
│   │   │   └── health/route.ts      # Cloud Run container health monitor
│   │   ├── globals.css              # Elder-accessible theme & high-contrast styles
│   │   ├── layout.tsx               # Root layout with accessibility bounds
│   │   ├── page.tsx                 # Foundation portal & module roadmap
│   │   ├── error.tsx                # Safe clinical error boundaries
│   │   ├── loading.tsx              # Calm accessible loading states
│   │   └── not-found.tsx            # Clear record navigation fallback
│   ├── components/
│   │   ├── ui/                      # Foundational design primitives (Button, Card, Badge)
│   │   ├── common/                  # Shared layouts (Navigation, Accessibility Toolbar)
│   │   └── features/                # Domain-specific modules
│   │       ├── dashboard/           # Elder Home view & daily schedule
│   │       ├── medications/         # Medication Lifecycle & Adherence Tracker
│   │       ├── appointments/        # Appointment Intelligence & companion rides
│   │       ├── care-circle/         # Care Circle roster & permission tiers
│   │       ├── continuity/          # Care Continuity Engine & diff reviewers
│   │       ├── radar/               # Care Gap Radar & proactive detection
│   │       ├── notifications/       # Honest notification state machines
│   │       ├── passport/            # Emergency Care Passport & PDF generator
│   │       └── privacy/             # Consent records & break-glass access
│   ├── lib/
│   │   ├── auth/                    # Session management & role-based access control
│   │   ├── constants/               # System constants, roles, and status enums
│   │   ├── services/                # Core business logic engines
│   │   ├── supabase/                # Isomorphic client, server, and middleware access
│   │   ├── utils/                   # Shared utility functions (cn, date, formatting)
│   │   └── validations/             # Zod input schemas for patient safety
│   ├── types/
│   │   └── caretrace.ts             # Strict TypeScript definitions for all 15 modules
│   └── __tests__/                   # Vitest unit, integration, and security tests
├── supabase/
│   └── migrations/                  # 20 PostgreSQL tables with foreign keys, indexes, and RLS
├── Dockerfile                       # Multi-stage production container for Google Cloud Run
├── .dockerignore                    # Docker build optimization
├── .env.example                     # Sanitized environment template
├── vitest.config.ts                 # Unit test configuration
├── tailwind.config.ts               # Custom deep navy & clinical teal elder theme
└── tsconfig.json                    # Strict TypeScript compiler options
```

---

## 3. Product Module Architecture

| Module | Purpose | Architectural Boundary |
| :--- | :--- | :--- |
| **1. Elder Home** | Centred daily dashboard with voice readout, clear reminders, and 1-touch emergency access | `src/components/features/dashboard` |
| **2. Health Identity & Consent** | Patient core profile, allergies, chronic conditions, and granular data-sharing consent | `src/components/features/privacy` & `src/lib/validations` |
| **3. Secure Auth & Access** | Multi-role authentication (Patient, Family, Caregiver, Doctor) with RLS patient isolation | `src/lib/auth` & `src/lib/supabase` |
| **4. Medication Lifecycle** | Active prescriptions, dosing instructions, refill schedules, and clinical warnings | `src/components/features/medications` |
| **5. Adherence Tracker** | Dose event logging (Taken, Missed, Skipped, Delayed) with streak and adherence rate metrics | `src/components/features/medications` |
| **6. Appointment Intelligence** | Clinical visits, companion assignments, transport requirements, and post-visit notes | `src/components/features/appointments` |
| **7. Care Circle** | Family and caregiver member management with emergency escalation hierarchy | `src/components/features/care-circle` |
| **8. Care Task Manager** | Coordinated tasks (vitals check, physical therapy, refills) with assignment acknowledgement | `src/components/features/dashboard` |
| **9. Care Continuity Engine** | *Signature Innovation*: Versioned instructions, source provenance, deterministic diffs, impact analysis, and human approval gates | `src/components/features/continuity` & `src/lib/services/continuity-engine.ts` |
| **10. Care Gap Radar** | Proactive scanning for missed med streaks, overdue tasks, expiring refills, and inactive circles | `src/components/features/radar` & `src/lib/services/care-gap-detector.ts` |
| **11. Care Timeline & Audit** | Tamper-evident, chronological log of all clinical, adherence, and access events | `src/lib/services/audit-service.ts` |
| **12. Notification Centre** | Multi-channel notification pipeline (In-App, Email, SMS) with honest lifecycle states | `src/lib/services/notification-service.ts` |
| **13. Care Passport** | Verified emergency handoff summary with authorized PDF export and audit verification | `src/components/features/passport` |
| **14. Privacy & Access Centre** | Break-glass emergency overrides, access tokens, and granular consent revocation | `src/components/features/privacy` |
| **15. Accessibility Controls** | High-contrast toggles, 3-tier font scaling, reduced motion, and speech synthesis | `src/components/common/accessibility-toolbar.tsx` |

---

## 4. Security & Patient Safety Principles

1. **Human-in-the-Loop Clinical Gate:** Unverified instruction versions never become active automatically. They must be explicitly approved or rejected with a documented clinical rationale by an authorized user.
2. **Strict Non-Diagnostic Scope:** The system coordinates schedules, verifies provenance, and highlights changes without giving medical diagnoses, treatment decisions, or dosage recommendations.
3. **Patient-Level Data Isolation:** Database records are bound to `patient_id` foreign keys and guarded by Supabase Row Level Security (RLS) policies.
4. **Honest Notification Lifecycle:** Notifications transition through explicit states (`queued`, `processing`, `sent`, `delivered`, `failed`, `cancelled`). The platform never claims external email delivery unless confirmed by the external provider.
5. **Tamper-Evident Audit Logging:** All sensitive read/export operations (such as Care Passport downloads and emergency break-glass views) are logged with actor identity, timestamp, and IP address.


---

## 5. Phase 8: Care Circle Collaboration Architecture

### 5.1 Architecture Overview
The Care Circle Collaboration module unifies family coordinators, visiting home nurses, attending physicians, and informal helpers into a synchronized care network. It features:
- **Member Directory & Granular Scopes:** 5 distinct role tiers (`family_coordinator`, `visiting_nurse`, `caregiver`, `specialist_physician`, `family_member`) and 4 permission levels (`full_admin`, `caregiver_editor`, `family_viewer`, `clinician_access`).
- **Immediate Revocation Architecture:** When access is revoked or suspended, `isActive` is immediately set to `false`, session permissions are invalidated, and pending tasks are automatically unassigned back to the Care Circle pool.
- **Shared Care Task Management:** Full lifecycle tracking (`unassigned` -> `assigned` -> `in_progress` -> `completed` -> `cancelled`), category classification, priority levels, and mandatory operational justification on reassignment.
- **Caregiver-to-Family Shift Handover:** Structured shift transitions capturing responsibilities completed, linked tasks for incoming coverage, and non-clinical observational notes, requiring incoming sign-off or structured clarification.
- **Audit & Cryptographic Invitations:** Time-limited (7-day) invitation tokens with email matching, plus append-only collaboration activity logs with non-repudiable actor attribution.

### 5.2 Implemented Routes
- `/care-circle`: Central overview dashboard with metrics, handover banner, roster preview, and urgent tasks.
- `/care-circle/members`: Directory with multi-facet filters, search, and access modification modals.
- `/care-circle/members/[id]`: Detailed member profile, 12 granular capability toggles, responsibilities, assigned tasks, and audit logs.
- `/care-circle/invitations`: Cryptographic 7-day token issuance and staged pending invitations manager.
- `/care-circle/tasks`: Shared task delegation board with priority filters, category filters, and assignment workflows.
- `/care-circle/tasks/[id]`: Individual task context, linked clinical records (medications/appointments), and completion sign-off.
- `/care-circle/handover`: Dedicated caregiver shift transition centre with unacknowledged transition alerts and clarification dialogues.
- `/care-circle/activity`: Tamper-evident collaboration audit feed tracking all delegations, role changes, and sign-offs.


---

## 6. Phase 9: Instruction Vault Architecture

### 6.1 Architecture Overview
The Instruction Vault is an immutable, versioned, source-aware repository for care instructions, clinical orders, and dietary protocols. It serves as the foundational data layer for the CARETRACE Care Continuity Engine:
- **Source Provenance & Anti-Fabrication:** Every instruction traces back to an authentic clinical encounter, hospital discharge summary, lab diagnostic report, or patient entry. If an entry is unverified or lacks formal documentation, it is flagged with `isMissingSourceDetails: true` and prevented from automatic clinical verification.
- **Human-in-the-Loop Verification Gate:** Strict human authorization is required to verify or reject instructions. Automated AI text extraction or user roles never autonomously verify an instruction. All decisions require a documented rationale (minimum 5 characters) and are recorded in the append-only `instruction_reviews` audit ledger.
- **Immutable Versioning & Verification Reset:** Edits create a new version (`v = previousVersion + 1`) and preserve the previous version. Crucially, edits **never** silently inherit verified status; every revision immediately resets to `awaiting_verification` status with required operational justification (`changeReason`).
- **Deterministic Version Comparison:** Built-in side-by-side and field diff analyzer that compares any two historical versions (title, description, structured parameters, source provenance, editor metadata) without making speculative medical conclusions.
- **Non-Prescribing Safety Rule:** Storing or editing an instruction does not automatically modify active medication regimens, dose events, or clinical appointments. Changes are surfaced for human review in downstream continuity workflows.

### 6.2 Implemented Routes
- `/instructions`: Central vault dashboard with metrics, missing source alerts, category filters, and instruction cards.
- `/instructions/add`: Author and archive new instructions backed by selected source documents.
- `/instructions/[id]`: Detailed instruction view with plain-language directives, structured parameters, source provenance, and connected entity links.
- `/instructions/[id]/edit`: Version authoring interface requiring a documented change reason and resetting verification status.
- `/instructions/[id]/history`: Immutable chronological version timeline and interactive version comparison diff tool.
- `/instructions/sources`: Provenance registry displaying all source records, document references, provider roles, and defect notices.
- `/instructions/review`: Clinical review queue for evaluating pending instructions with verify/reject workflows and rationale logging.
- `/instructions/archived`: Historical repository of superseded versions and retired clinical protocols.

### 6.3 Database Entities
- `care_instructions`: Main entity storing active version, verification status, categories, structured content, and entity links.
- `care_instruction_versions`: Immutable historical versions list with change reasons and editor attribution.
- `instruction_sources`: Provenance records capturing facilities, clinicians, document references, and missing source flags.
- `instruction_reviews`: Append-only clinical verification and rejection decision audit logs.
- `instruction_attachments`: Validated access-controlled medical document references.

## 7. Phase 10: Care Continuity Engine Architecture (Signature Innovation)

### 7.1 Architecture Overview
The Care Continuity Engine is CARETRACE's signature innovation that closes the care transition loop. When a care instruction is created, revised, rejected, superseded, or verified in the Instruction Vault, the engine:
1. **Detects Instruction Changes:** Automatically captures version transitions and performs deterministic field-by-field mathematical comparisons.
2. **Maps Downstream Relationships:** Queries relational links across medications, scheduled dose events, care tasks, shift handovers, and appointments to identify potentially affected records.
3. **Explains Downstream Implications:** Generates plain-language, non-diagnostic rationales explaining why each downstream record was identified and what non-prescribing synchronization is proposed.
4. **Enforces Mandatory Human Review Gates:** Permanently quarantines proposed changes until an authorized clinician or caregiver reviews the diff, selects or excludes records, and signs off with a mandatory clinical rationale.
5. **Enforces Strict Clinical Non-Prescribing Policy:** CARETRACE never autonomously alters, calculates, or approves medication dosages, routes, or regimens. Only safe coordination parameters (e.g. vital sign checklists, dose prompt notes, shift handover summaries) are synchronized.
6. **Guarantees Concurrency & Stale Version Safety:** Uses optimistic version locking on review records to prevent race conditions and detects stale instruction updates before allowing implementation execution.

### 7.2 Implemented Routes
- `/continuity`: Executive dashboard with 7 key metrics, visual relationship mapping preview, critical unreviewed change alerts, and recent detected change cards.
- `/continuity/changes`: Filterable registry of analyzed instruction events (new versions, rejections, verifications) with deterministic diff highlights.
- `/continuity/changes/[id]`: Detailed change view with side-by-side previous vs. current parameter diffs and downstream affected records.
- `/continuity/impact`: Complete downstream impact matrix grouped by record type (medication, dose event, care task, handover, appointment) with interactive exclusion modal.
- `/continuity/reviews`: Filterable clinical review queue with reviewer assignment, priority indicators, and direct review actions.
- `/continuity/reviews/[id]`: Comprehensive human review workflow with diff review, per-record approval/exclusion toggles, decision form (Approve, Reject, Clarification, Escalate), and controlled implementation trigger.
- `/continuity/history`: Non-repudiable audit ledger of executed synchronization jobs, optimistic lock verifications, and signed review determinations.

### 7.3 API Route Handlers
- `GET /api/continuity/analyses` & `POST /api/continuity/analyses`: List and create change analyses.
- `GET /api/continuity/analyses/[id]`: Fetch specific analysis with diff summary and impacted records.
- `GET /api/continuity/impacts` & `PATCH /api/continuity/impacts`: Query impacted records and exclude individual records with mandatory rationale.
- `GET /api/continuity/reviews`: List reviews with status and priority filters.
- `GET /api/continuity/reviews/[id]` & `PATCH /api/continuity/reviews/[id]`: Retrieve review details, submit decisions, request author clarification, or escalate to supervisory clinicians.
- `POST /api/continuity/reviews/[id]/implement`: Execute controlled downstream synchronization with optimistic lock validation and audit logging.

### 7.4 Database Schema & Migration (Migration 7)
- `continuity_analyses`: Stores change event metadata, version transitions, diff summaries, and overall status.
- `continuity_impacts`: Stores individual downstream affected records, classification types, plain-language reasons, and exclusion reasons.
- `continuity_reviews`: Human review gate records capturing decision rationale, reviewer attribution, optimistic locks, and status transitions.
- `continuity_implementation_jobs`: Immutable execution ledger capturing synchronized non-prescribing actions, lock verification, and timestamps.
- **Row Level Security:** Complete RLS policies on all 4 tables restricting data to authorized Care Circle members and patients, with update permissions reserved for clinician and caregiver editor tiers.

## 8. Phase 11: Medication & Care Gap Intelligence Architecture

### 8.1 Core Mission & Clinical Safety Architecture
The Medication & Care Gap Intelligence module unites the Medication Lifecycle Manager, Care Circle, Instruction Vault, Care Continuity Engine, Appointments, and Notifications into an active surveillance radar for care coordination gaps.

- **Care Coordination Visibility Only:** CARETRACE identifies, prioritizes, explains, and tracks gaps for human response. It never provides medical diagnoses or treatment recommendations.
- **Strict Non-Prescribing Policy:** CARETRACE never calculates, recommends, or modifies medication dosages, frequencies, or therapy regimens.
- **Omission Safety Rule:** In response to missed or skipped doses, CARETRACE never advises taking extra doses, "catching up", or altering schedules. It flags the event for caregiver well-being checks.
- **Unconfirmed Dose Distinction:** An unconfirmed dose is never assumed to be missed. Ingestion is never assumed based solely on self-reported logs.
- **Deterministic Deduplication:** Gaps are computed deterministically using composite deduplication keys (`${patientId}_${gapType}_${relatedRecordType}_${relatedRecordId}`). Repeated engine scans update existing active gaps rather than creating duplicates.

### 8.2 Five Gap Categories & 14 Granular Types
1. **Medication Gaps:**
   - `missed_medication_event`: Recorded missed dose event requiring caregiver follow-up.
   - `overdue_unconfirmed_event`: Scheduled dose past its time window without logged confirmation.
   - `refill_needed`: Active medication below 5 days of supply remaining.
   - `medication_paused_unreviewed`: Discontinued/paused medication with pending continuity review.
2. **Responsibility Gaps:**
   - `unassigned_care_task`: Active care coordination task lacking an assigned Care Circle member.
   - `overdue_task`: Care task past its scheduled due date and time.
   - `unacknowledged_shift_handover`: Caregiver shift handover awaiting incoming caregiver sign-off.
3. **Appointment Gaps:**
   - `appointment_prep_overdue`: Incomplete pre-visit preparation items (fasting, questions, records).
   - `unfulfilled_follow_up`: Provider order or post-visit action lacking completion or scheduling.
   - `unassigned_transport`: Scheduled visit requiring patient transport without an assigned companion.
4. **Instruction & Review Gaps:**
   - `unverified_instruction`: Source care directive pending clinician verification.
   - `continuity_clarification_requested`: Downstream continuity review awaiting clinical clarification.
5. **Communication & Notification Gaps:**
   - `failed_carrier_notification`: SMS/phone delivery failure on critical care alert.
   - `stale_unopened_alert`: High-priority care notice unopened after 24 hours.

### 8.3 Implemented Routes
- `/care-gaps`: Central Gap Radar dashboard featuring 6 summary metric cards, category distribution cards, active gap filters, and deterministic scan trigger.
- `/care-gaps/[id]`: Granular gap details view with assignment modal, status transition controls, resolution dialog, dismissal with mandatory justification, and complete chronological audit history.
- `/care-gaps/medications`: Specialized surveillance feed for medication gaps, low supply alerts, and dose events with explicit non-prescribing clinical safety notices.
- `/care-gaps/tasks`: Care Circle responsibility tracker highlighting unassigned care tasks and unacknowledged shift handovers.
- `/care-gaps/appointments`: Clinical visit readiness hub tracking pre-visit checklists, companion transport assignments, and post-visit orders.
- `/care-gaps/reviews`: Clinical instruction governance queue surfacing unverified care instructions and continuity reviews requiring clarification.
- `/care-gaps/history`: Permanent ledger of resolved and dismissed care gaps with reopening controls and audit inspection.

### 8.4 API Route Handlers
- `GET /api/care-gaps` & `POST /api/care-gaps`: Filtered gap listing and manual gap logging.
- `POST /api/care-gaps/detect`: Multi-module deterministic gap detection trigger.
- `GET /api/care-gaps/[id]` & `PATCH /api/care-gaps/[id]`: Gap detail query and status transitions.
- `POST /api/care-gaps/[id]/assign`: Task/gap assignment, handoff, accept, and decline workflows.
- `POST /api/care-gaps/[id]/resolve`: Auditable resolution with recorded actions or dismissal with mandatory reason.

### 8.5 Database Schema & Migration (Migration 8)
- `care_gaps`: Stores gap category, type, title, explanation, priority, status, assigned Care Circle member, related record coordinates, and immutable JSONB `audit_history`.
- **Deduplication Constraint:** Enforced via `unique_patient_gap_dedup` on `(patient_id, deduplication_key)`.
- **Row Level Security:** Complete RLS policies for patient, family, and caregiver access, restricting status updates and resolutions to authorized Care Circle members.

## 9. Phase 12: Notification Centre & Proactive Reminder Engine Architecture

### 9.1 Core Mission & Clinical Safety Architecture
Phase 12 implements the complete, production-oriented Notification Centre and Proactive Reminder Engine. It connects all upstream modules (Authentication, Patient Profiles, Medication Lifecycle, Appointments, Care Circle, Instruction Vault, Continuity Engine, and Care Gap Radar) into a multi-channel alerting and acknowledgement network.

- **Honest Delivery State Machine:** Delivery states (`draft`, `scheduled`, `queued`, `processing`, `sent_to_provider`, `delivered`, `failed`, `cancelled`, `expired`, `suppressed`) maintain a strict distinction between provider acceptance and confirmed inbox/device delivery. API acceptance is never falsely claimed as delivery.
- **Explicit Human Acknowledgement:** Opening or viewing a notification never automatically marks a clinical responsibility as completed or acknowledged. High-consequence care handovers, task assignments, and instruction diffs require explicit, authenticated sign-off with recorded actor attribution and optional notes.
- **Privacy & Non-Sensitive Previews:** When the `nonSensitivePreviewsOnly` preference is enabled, external notifications and lock-screen alerts strip protected health information (PHI), substituting generic care notices that protect patient dignity and confidentiality.
- **Quiet Hours & Channel Suppression:** Users configure sleep windows (default `21:30` - `07:30`) in their local timezone. External channels (Email, SMS, Push) are suppressed during quiet hours, while in-app notifications continue to post live with explicit audit suppression notices.
- **Deterministic Deduplication:** Stable idempotency keys prevent duplicate alerts from repeated background scans or retries.
- **Multi-Module Reminder Discovery:** Background discovery scans upcoming doctor visits, scheduled doses, care tasks, and pending handovers, creating synchronized proactive reminders according to configured user lead times.

### 9.2 Implemented Routes
- `/notifications`: Main notification feed with KPI counters, filter bar (All, Unread, Needs Ack, Archived), category dropdown, channel selector, search, quiet hours alert banner, and mark-all-read.
- `/notifications/[id]`: Granular notification details featuring delivery state timeline, non-sensitive preview vs full body, explicit sign-off form, source record deep link, and provider delivery attempt log.
- `/notifications/preferences`: User configuration console for delivery channels (In-App, Email, SMS, Push), quiet hours start/end, timezone selection, reminder lead times (Medication, Appointments, Tasks), category subscriptions, and lock-screen privacy switches.
- `/notifications/scheduled`: Upcoming proactive reminders queue synchronized with clinical timetables, with lead-time countdowns and cancellation controls.
- `/notifications/failed`: Authorized coordinator failed delivery console displaying carrier error codes (e.g. SMS 504 timeouts), retry attempts, and safe manual re-attempt triggers.
- `/notifications/history`: Immutable delivery and activity ledger tracking transport attempt codes, carrier responses, and bilateral sign-off records.

### 9.3 API Route Handlers
- `GET /api/notifications` & `POST /api/notifications`: Filtered notification feed and creation with idempotency deduplication and mark-all-read action.
- `GET /api/notifications/[id]` & `PATCH /api/notifications/[id]`: Detail query, read status toggles, and archiving.
- `POST /api/notifications/[id]/acknowledge`: Authenticated explicit sign-off workflow with permission enforcement.
- `POST /api/notifications/[id]/retry`: Coordinator-triggered manual delivery re-attempt.
- `GET /api/notifications/preferences` & `PUT /api/notifications/preferences`: Read and update user preferences and quiet hours.
- `GET /api/notifications/scheduled` & `POST /api/notifications/scheduled`: List scheduled reminders and trigger proactive multi-module reminder discovery.
- `GET /api/notifications/failed`: Feed of failed delivery attempts with provider error details.
- `POST /api/notifications/process-queue`: Protected background queue runner authenticated via `CRON_SECRET` bearer header.

### 9.4 Database Schema & Migration (Migration 9)
- `notifications`: Core notification table with delivery state checks, read status, acknowledgement status, provider references, suppression reasons, and unique idempotency keys.
- `notification_delivery_attempts`: Append-only transmission attempt logs recording provider response codes and error messages.
- `notification_acknowledgements`: Non-repudiable sign-off ledger capturing actor, role, previous/new status, notes, and timestamps.
- `notification_preferences`: User channel toggles, quiet hours, timezone, category switches, and reminder lead times.
- **Row Level Security:** Strict recipient isolation ensuring users cannot view other people's notifications, while enabling authorized Care Circle coordinators to inspect patient-related delivery failures and sign-offs.

## 10. Phase 13: Care Timeline, Analytics & Care Passport Architecture

### 10.1 Core Mission & Clinical Safety Architecture
Phase 13 delivers three deeply integrated, non-duplicative capabilities built directly atop CARETRACE's existing module records:

- **Unified Care Timeline:** A chronological, traceable history of care events projected from all upstream modules (Medication Lifecycle, Appointment Intelligence, Care Circle Tasks & Handovers, Instruction Vault, Continuity Engine, Care Gap Radar, and Notification Centre).
  - *Provenance & Timing Distinction:* Strictly differentiates event occurrence time (`occurredAt`) from recording time (`recordedAt`).
  - *Honest Self-Reporting Labels:* Self-reported doses and patient-entered observations are explicitly tagged (`isReportedOnly: true`, "Self-Reported" badge) to prevent false clinical certainty regarding medication ingestion.
  - *Direct Source Navigation:* Every timeline entry maintains direct deep-links to its authoritative source record in the respective module.
- **Care Analytics Engine:** Mathematically sound, transparent operational insights into care coordination performance across medications, clinical visits, task delegation, and continuity reviews.
  - *Strict Adherence Denominator:* Adherence percentage is calculated strictly as `reportedTaken / (reportedTaken + missed + skipped)` across eligible past doses. Cancelled, suspended, or upcoming future doses are never counted as taken or missed, avoiding artificial inflation or penalty.
  - *Clinical Safety Boundary:* Analytical insights reflect coordination operations and self-reported compliance. CARETRACE explicitly declares that coordination metrics do not prove biological drug ingestion or treatment efficacy.
- **Care Passport:** A controlled, portable, cryptographically verified clinical summary designed for acute emergency handoffs, hospital admissions, and specialist consultations.
  - *Cryptographic Verification Stamp:* Every snapshot generates a non-repudiable SHA-256 verification hash (`CT-SHA256-...`) logged to an indelible audit ledger.
  - *Client/Server PDF Generation:* Implemented using `jspdf` to render a high-contrast, structured clinical packet featuring patient demographics, healthcare proxy contacts, advance directives (DNR/POLST), active chronic conditions, documented allergies, active medication regimens, care instructions, and upcoming appointments.
  - *Print-Ready Layout:* High-contrast visual styling optimized for browser printing (`@media print` / `window.print()`).
  - *Legal & Clinical Disclaimer:* Prominently notes that the passport serves emergency coordination and handoff purposes without replacing primary hospital charts or attending physician clinical judgment.

### 10.2 Implemented Routes
- **Care Timeline:**
  - `/timeline`: Master chronological event feed with multi-module filtering, full-text search, date boundaries, and provenance inspect links.
  - `/timeline/[id]`: Granular event detail page displaying occurrence vs recorded timestamps, actor credentials, and raw metadata.
  - `/timeline/medications`: Filtered timeline slice tracking scheduled doses, self-reported administrations, and omission reasons.
  - `/timeline/appointments`: Filtered timeline slice tracking consultations, companion assignments, and cancellations.
  - `/timeline/instructions`: Filtered timeline slice tracking care directive authoring, verification, and revisions.
  - `/timeline/continuity`: Filtered timeline slice tracking downstream impact reviews and coordination decisions.
  - `/timeline/care-circle`: Filtered timeline slice tracking role changes, task completions, and shift handovers.
  - `/timeline/tasks`: Filtered timeline slice tracking operational care task assignments and due dates.
- **Care Analytics:**
  - `/analytics`: Cross-domain executive intelligence dashboard summarizing adherence, appointment readiness, task completion, and gap resolution.
  - `/analytics/medications`: Medication operational performance analytics with transparent denominator explanations and daily adherence distributions.
  - `/analytics/appointments`: Visit completion metrics, cancellation rates, and pre-visit question preparation completion percentages.
  - `/analytics/responsibilities`: Care Circle delegation metrics, task completion rates, unassigned duties, and handover acknowledgement ratios.
  - `/analytics/continuity`: Care Continuity Engine review velocity, approval rates, and instruction verification status.
  - `/analytics/care-gaps`: Care Gap Radar resolution throughput and category breakdowns.
- **Care Passport:**
  - `/care-passport`: Passport overview with cryptographic verification banner, data snapshot summaries, and direct PDF download trigger.
  - `/care-passport/preview`: High-contrast, print-friendly clinical handoff packet matching hospital/EMS transfer sheets with copy hash and print actions.
  - `/care-passport/settings`: Section inclusion customization console featuring 4 scenario presets (EMS Rapid, Specialist Visit, Caregiver Sync, Full Comprehensive) and custom handoff memos.
  - `/care-passport/history`: Non-repudiable cryptographic export ledger tracking requesting user identities, recipient roles, verification hashes, and clinical purposes.

### 10.3 Sub-Navigation Components
- `TimelineNavTabs` (`src/components/features/timeline/timeline-nav-tabs.tsx`): Category tab navigation across all timeline domains.
- `AnalyticsNavTabs` (`src/components/features/analytics/analytics-nav-tabs.tsx`): Domain tab navigation across all operational analytics modules.
- `PassportNavTabs` (`src/components/features/passport/passport-nav-tabs.tsx`): Navigation tabs linking Passport Overview, Preview, Settings, and Export History.

### 10.4 API Route Handlers
- `GET /api/timeline`: Filtered timeline event stream supporting pagination, category filtering, source module filtering, date range boundaries, and text search.
- `GET /api/timeline/[id]`: Granular single-event lookup returning full provenance metadata.
- `GET /api/analytics`: Computes mathematically sound operational metrics across medications, visits, tasks, and continuity for requested date ranges (`7d`, `30d`, `90d`, `all`).
- `GET /api/care-passport/data`: Assembles the current authorized patient information snapshot filtered by active section preferences.
- `POST /api/care-passport/export`: Generates a new Care Passport snapshot, records the non-repudiable export record in the audit ledger, and returns the verification hash.
- `GET /api/care-passport/history`: Queries the historical export audit ledger for the patient.
- `GET /api/care-passport/settings` & `PUT /api/care-passport/settings`: Retrieves and updates the user's section inclusion preferences and handoff memos with Zod validation.

### 10.5 Database Schema & Migration (Migration 10)
- `care_passport_exports`: Immutable document generation ledger recording `patient_id`, `exported_by_user_id`, `exported_by_name`, `exported_by_role`, `included_sections` (JSONB), `verification_hash`, `file_size_bytes`, `download_url`, `reason`, and `created_at`.
- `care_passport_preferences`: Configurable section preferences and custom handoff notes per user with JSONB defaults.
- **Row Level Security:** Strict isolation ensuring passport exports are accessible only to authorized Care Circle members and patients, while preferences are secured to the owning user.

## 11. Phase 14: Privacy, Security & Quality Assurance Architecture

### 11.1 Security Philosophy & Healthcare Threat Modeling
Phase 14 establishes a cross-cutting defense-in-depth security model documented in `THREAT_MODEL.md` and `SECURITY_REVIEW.md`:
- **Patient Isolation & IDOR Defense:** Every health record is explicitly scoped by `patient_id`. Multi-tenant boundaries are strictly verified on the server side (`verifyPatientScope`) and enforced at the database level by Supabase Row Level Security (RLS).
- **Fail-Closed Access Revocation:** Suspended or revoked Care Circle relationships (`membership_status != 'active'`) immediately revoke read, write, and notification delivery privileges.
- **Privilege Escalation Defenses:** Anti-tampering triggers (`trg_prevent_privilege_escalation`) and server-side checks disallow users from modifying their own roles or elevating permission tiers.
- **Storage Protection:** Clinical attachments and Care Passport PDFs are stored in private Supabase buckets (`care_documents`, `public = false`) protected by object-level RLS policies.
- **Safe File Upload Pipeline:** Strict MIME whitelist (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`), 10MB size boundaries, path traversal neutralization, and UUID key generation.
- **PHI Sanitization & Redaction:** Centralized logger (`phi-sanitizer.ts`) masks sensitive keys and redacts passwords, tokens, SSNs, phone numbers, and emails.
- **HTTP Security Headers & CSP:** Next.js configured with Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (DENY), and X-Content-Type-Options (nosniff).
- **Rate Limiting:** Sliding-window rate limiter protecting login, passport export, and background queue runner endpoints.
- **Timing-Safe Operations:** Constant-time byte XOR comparison (`safeCompare`) for `CRON_SECRET` and authentication tokens.

### 11.2 Database Schema & Security Hardening (Migration 11)
- `supabase/migrations/20260215000011_security_hardening_rls.sql`:
  - `storage.buckets`: Configures private bucket `care_documents` (`public = false`, 10MB limit, strict MIME whitelist).
  - `storage.objects`: RLS policies permitting read/write only to users with active Care Circle membership for the patient matching the storage path.
  - `instruction_attachments`: Explicit SELECT and INSERT RLS policies linking back to patient Care Circle membership and authorized editor tiers.
  - **Audit Log Immutability:** Explicit RLS policies blocking UPDATE and DELETE on `care_passport_exports` and `notification_acknowledgements`.
  - **Anti-Privilege Escalation Trigger:** `trg_prevent_privilege_escalation` on `care_circle_members` blocks self-elevation of permission tiers or self-reactivation of revoked memberships.




