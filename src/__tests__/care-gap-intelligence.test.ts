import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createCareGapSchema,
  assignCareGapSchema,
  respondToAssignmentSchema,
  resolveCareGapSchema,
  dismissCareGapSchema,
  updateCareGapStatusSchema,
} from '@/lib/validations/care-gaps.schema';
import {
  getCachedCareGaps,
  getCareGapById,
  detectCareGaps,
  assignCareGap,
  respondToAssignment,
  resolveCareGap,
  dismissCareGap,
  updateCareGapStatus,
  getCachedNotificationJobs,
} from '@/lib/data/care-gap-intelligence-data';
import { getCachedMedications } from '@/lib/data/medication-lifecycle-data';

describe('CARETRACE Medication & Care Gap Intelligence (Prompt 11)', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Zod Validation Schemas                                                  */
  /* -------------------------------------------------------------------------- */
  describe('Zod Validation Schemas', () => {
    it('validates a valid CreateCareGapInput', () => {
      const valid = {
        patientId: 'patient-profile-001',
        category: 'medication',
        gapType: 'missed_medication_event',
        title: 'Missed Morning Metoprolol Dose',
        explanation: 'Patient missed 08:00 AM scheduled dose per adherence log.',
        priority: 'high_priority',
        priorityReason: 'Key rate-control medication requires coordinator follow-up.',
        relatedRecordType: 'dose_event',
        relatedRecordId: 'dose-event-003',
        relatedRecordTitle: 'Metoprolol 50mg',
        sourceModule: 'medication_lifecycle',
        actionRoute: '/medications/adherence',
        actionLabel: 'Inspect Adherence Log',
      };
      const result = createCareGapSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid gap category and type combinations', () => {
      const invalid = {
        category: 'invalid_category',
        gapType: 'unknown_type',
        title: 'Gap',
      };
      expect(createCareGapSchema.safeParse(invalid).success).toBe(false);
    });

    it('validates AssignCareGap schema', () => {
      const valid = {
        gapId: 'gap-001',
        assignedToId: 'member-david',
        assignedToName: 'David Sullivan',
        assignedToRole: 'Family Care Coordinator',
        note: 'Please verify with Eleanor.',
      };
      expect(assignCareGapSchema.safeParse(valid).success).toBe(true);

      const missingAssignee = {
        gapId: 'gap-001',
        assignedToId: '',
      };
      expect(assignCareGapSchema.safeParse(missingAssignee).success).toBe(false);
    });

    it('validates RespondToAssignment schema (accept/decline)', () => {
      expect(
        respondToAssignmentSchema.safeParse({
          gapId: 'gap-001',
          action: 'accept',
        }).success
      ).toBe(true);

      expect(
        respondToAssignmentSchema.safeParse({
          gapId: 'gap-001',
          action: 'decline',
          reason: 'Unavailable due to travel.',
        }).success
      ).toBe(true);

      expect(
        respondToAssignmentSchema.safeParse({
          gapId: 'gap-001',
          action: 'invalid_action',
        }).success
      ).toBe(false);
    });

    it('validates ResolveCareGap schema with mandatory action and details (min 5 chars)', () => {
      const valid = {
        gapId: 'gap-001',
        resolutionAction: 'Phone Check-in',
        resolutionDetails: 'Spoke with patient; dose was taken with breakfast at 09:15 AM.',
        resolvedByName: 'Sarah Jenkins, RN',
      };
      expect(resolveCareGapSchema.safeParse(valid).success).toBe(true);

      const invalid = {
        gapId: 'gap-001',
        resolutionAction: 'OK',
        resolutionDetails: 'Done', // <5 chars
        resolvedByName: 'Sarah',
      };
      expect(resolveCareGapSchema.safeParse(invalid).success).toBe(false);
    });

    it('validates DismissCareGap schema requiring mandatory justification', () => {
      const valid = {
        gapId: 'gap-001',
        dismissedReason: 'Alert duplicated by visiting nurse manual entry.',
        dismissedByName: 'David Sullivan',
      };
      expect(dismissCareGapSchema.safeParse(valid).success).toBe(true);

      const invalid = {
        gapId: 'gap-001',
        dismissedReason: 'N/A', // <5 chars
        dismissedByName: 'David',
      };
      expect(dismissCareGapSchema.safeParse(invalid).success).toBe(false);
    });

    it('validates UpdateCareGapStatus schema', () => {
      expect(
        updateCareGapStatusSchema.safeParse({
          gapId: 'gap-001',
          status: 'in_progress',
        }).success
      ).toBe(true);

      expect(
        updateCareGapStatusSchema.safeParse({
          gapId: 'gap-001',
          status: 'awaiting_clarification',
          clarificationRequest: 'Awaiting lab protocol confirmation.',
        }).success
      ).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Baseline Data Store & Notification Surveillance                         */
  /* -------------------------------------------------------------------------- */
  describe('Care Gap Baseline Data Store', () => {
    it('loads baseline care gaps covering all 5 categories', () => {
      const gaps = getCachedCareGaps();
      expect(gaps.length).toBeGreaterThanOrEqual(7);

      const categories = new Set(gaps.map((g) => g.category));
      expect(categories.has('medication')).toBe(true);
      expect(categories.has('responsibility')).toBe(true);
      expect(categories.has('appointment')).toBe(true);
      expect(categories.has('instruction_continuity')).toBe(true);
      expect(categories.has('notification')).toBe(true);
    });

    it('ensures every gap contains an explainable priority reason (no unexplained priorities)', () => {
      const gaps = getCachedCareGaps();
      gaps.forEach((g) => {
        expect(g.priorityReason).toBeTruthy();
        expect(g.priorityReason.length).toBeGreaterThan(5);
        expect(g.explanation).toBeTruthy();
        expect(g.deduplicationKey).toBeTruthy();
      });
    });

    it('tracks notification delivery attempts and includes a failed job', () => {
      const jobs = getCachedNotificationJobs();
      expect(jobs.length).toBeGreaterThanOrEqual(4);

      const failedJob = jobs.find((j) => j.status === 'failed');
      expect(failedJob).toBeDefined();
      expect(failedJob?.lastError).toContain('Gateway Timeout');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Deterministic Gap Detection Engine                                      */
  /* -------------------------------------------------------------------------- */
  describe('Deterministic Detection Engine', () => {
    it('scans multi-module records and identifies gaps deterministically', () => {
      const result = detectCareGaps('patient-profile-001');
      expect(result).toBeDefined();
      expect(result.allGaps.length).toBeGreaterThanOrEqual(7);

      // Verify unconfirmed vs missed distinction
      const missedGaps = result.allGaps.filter((g) => g.gapType === 'missed_medication_event');
      const unconfirmedGaps = result.allGaps.filter((g) => g.gapType === 'overdue_unconfirmed_event');

      expect(missedGaps.length).toBeGreaterThan(0);
      expect(unconfirmedGaps.length).toBeGreaterThan(0);

      // Verify safety text in unconfirmed gaps
      unconfirmedGaps.forEach((g) => {
        expect(g.explanation.toLowerCase()).toContain('not assume');
      });
    });

    it('prevents duplicate gaps on repeated execution (Idempotent Deduplication)', () => {
      const initial = detectCareGaps('patient-profile-001');
      const run2 = detectCareGaps('patient-profile-001');

      // Second run must identify 0 new gaps because existing active gaps are deduplicated
      expect(run2.newGapsCount).toBe(0);
      expect(run2.allGaps.length).toBe(initial.allGaps.length);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Ownership, Assignment & Lifecycle Workflows                             */
  /* -------------------------------------------------------------------------- */
  describe('Care Gap Ownership & Lifecycle Management', () => {
    it('assigns gap to a Care Circle member and updates audit history', () => {
      const gaps = getCachedCareGaps();
      const targetGap = gaps.find((g) => g.status === 'open') || gaps[0];

      const assigned = assignCareGap(
        targetGap.id,
        'member-sarah',
        'Sarah Jenkins, RN',
        'Visiting Nurse',
        'David Sullivan',
        'Family Coordinator',
        'Please review morning vitals check.'
      );

      expect(assigned).toBeDefined();
      expect(assigned?.status).toBe('assigned');
      expect(assigned?.assignedToName).toBe('Sarah Jenkins, RN');
      expect(assigned?.auditHistory[0].action).toBe('gap_assigned');
      expect(assigned?.auditHistory[0].note).toContain('morning vitals check');
    });

    it('allows an assigned member to accept responsibility', () => {
      const gaps = getCachedCareGaps();
      const assignedGap = gaps.find((g) => g.status === 'assigned') || gaps[0];

      const accepted = respondToAssignment(
        assignedGap.id,
        'accept',
        'Sarah Jenkins, RN',
        'Visiting Nurse',
        'Accepted. Will check during morning home visit.'
      );

      expect(accepted).toBeDefined();
      expect(accepted?.status).toBe('acknowledged');
      expect(accepted?.auditHistory[0].action).toBe('assignment_accepted');
    });

    it('allows an assigned member to decline responsibility returning gap to open pool', () => {
      const gaps = getCachedCareGaps();
      const gap = gaps[0];

      // Assign first
      assignCareGap(gap.id, 'member-sarah', 'Sarah Jenkins', 'Nurse', 'David', 'Coordinator');

      // Then decline
      const declined = respondToAssignment(
        gap.id,
        'decline',
        'Sarah Jenkins, RN',
        'Visiting Nurse',
        'Off duty until Friday.'
      );

      expect(declined).toBeDefined();
      expect(declined?.status).toBe('open');
      expect(declined?.assignedToId).toBeUndefined();
      expect(declined?.auditHistory[0].action).toBe('assignment_declined');
    });

    it('resolves a gap with mandatory action, details, and resolver identity', () => {
      const gaps = getCachedCareGaps();
      const targetGap = gaps.find((g) => g.status !== 'resolved') || gaps[0];

      const resolved = resolveCareGap(
        targetGap.id,
        'Caregiver Verification',
        'Contacted patient and confirmed dose was taken with afternoon tea.',
        'Sarah Jenkins, RN',
        'Visiting Nurse'
      );

      expect(resolved).toBeDefined();
      expect(resolved?.status).toBe('resolved');
      expect(resolved?.resolvedByName).toBe('Sarah Jenkins, RN');
      expect(resolved?.resolutionDetails).toContain('Caregiver Verification');
      expect(resolved?.auditHistory[0].action).toBe('gap_resolved');
    });

    it('dismisses a gap with mandatory recorded justification', () => {
      const gaps = getCachedCareGaps();
      const targetGap = gaps.find((g) => g.status !== 'dismissed') || gaps[1];

      const dismissed = dismissCareGap(
        targetGap.id,
        'Procedure rescheduled by cardiology department; prep cancelled.',
        'David Sullivan',
        'Family Coordinator'
      );

      expect(dismissed).toBeDefined();
      expect(dismissed?.status).toBe('dismissed');
      expect(dismissed?.dismissedReason).toContain('rescheduled by cardiology');
      expect(dismissed?.auditHistory[0].action).toBe('gap_dismissed');
    });

    it('reopens a resolved or dismissed gap when an issue recurs', () => {
      const gaps = getCachedCareGaps();
      const resolvedGap = gaps.find((g) => g.status === 'resolved') || gaps[0];

      const reopened = updateCareGapStatus(
        resolvedGap.id,
        'reopened',
        'David Sullivan',
        'Family Coordinator',
        'Issue observed again on subsequent shift.'
      );

      expect(reopened).toBeDefined();
      expect(reopened?.status).toBe('reopened');
      expect(reopened?.auditHistory[0].action).toBe('status_changed_to_reopened');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. Clinical Safety & Non-Prescribing Guardrails                             */
  /* -------------------------------------------------------------------------- */
  describe('Clinical Safety Guardrails', () => {
    it('verifies care gap detection and resolution NEVER alters active medication dosages or regimens', () => {
      const medsBefore = getCachedMedications().map((m) => ({
        id: m.id,
        dosage: m.strengthText,
        instructions: m.prescribedInstructions,
      }));

      // Run detection and resolution operations
      detectCareGaps('patient-profile-001');
      const gaps = getCachedCareGaps();
      resolveCareGap(
        gaps[0].id,
        'Routine Verification',
        'Verified taken without dosage alteration.',
        'Sarah Jenkins',
        'Nurse'
      );

      const medsAfter = getCachedMedications().map((m) => ({
        id: m.id,
        dosage: m.strengthText,
        instructions: m.prescribedInstructions,
      }));

      // Strictly verify no dosages or instructions were modified
      expect(medsAfter).toEqual(medsBefore);
    });

    it('verifies that unconfirmed events are never assumed to be missed', () => {
      const gaps = getCachedCareGaps();
      const unconfirmed = gaps.filter((g) => g.gapType === 'overdue_unconfirmed_event');

      unconfirmed.forEach((g) => {
        expect(g.gapType).not.toBe('missed_medication_event');
        expect(g.explanation).toContain('not assume');
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. SQL Migration 8 Verification                                            */
  /* -------------------------------------------------------------------------- */
  describe('Database Schema & Migration 8 Verification', () => {
    it('verifies SQL migration 20260215000008_care_gap_intelligence.sql exists with correct tables and RLS', () => {
      const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260215000008_care_gap_intelligence.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

      // Verify table
      expect(sqlContent).toContain('create table if not exists care_gaps');
      expect(sqlContent).toContain('alter table care_gaps enable row level security;');

      // Verify indexes
      expect(sqlContent).toContain('create index if not exists idx_care_gaps_patient');
      expect(sqlContent).toContain('create index if not exists idx_care_gaps_category');
      expect(sqlContent).toContain('create index if not exists idx_care_gaps_priority');
      expect(sqlContent).toContain('create index if not exists idx_care_gaps_dedup');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 7. Route & API Files Verification                                          */
  /* -------------------------------------------------------------------------- */
  describe('Care Gaps Route Files Verification', () => {
    it('verifies all 7 frontend UI route pages exist', () => {
      const routePaths = [
        'src/app/care-gaps/page.tsx',
        'src/app/care-gaps/[id]/page.tsx',
        'src/app/care-gaps/medications/page.tsx',
        'src/app/care-gaps/tasks/page.tsx',
        'src/app/care-gaps/appointments/page.tsx',
        'src/app/care-gaps/reviews/page.tsx',
        'src/app/care-gaps/history/page.tsx',
      ];

      routePaths.forEach((relPath) => {
        const fullPath = path.join(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });

    it('verifies all care-gaps API route handlers exist', () => {
      const apiRoutePaths = [
        'src/app/api/care-gaps/route.ts',
        'src/app/api/care-gaps/detect/route.ts',
        'src/app/api/care-gaps/[id]/route.ts',
        'src/app/api/care-gaps/[id]/assign/route.ts',
        'src/app/api/care-gaps/[id]/resolve/route.ts',
      ];

      apiRoutePaths.forEach((relPath) => {
        const fullPath = path.join(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
