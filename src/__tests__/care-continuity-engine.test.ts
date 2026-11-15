import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  createContinuityAnalysisSchema,
  continuityReviewDecisionSchema,
  excludeImpactRecordSchema,
  escalateReviewSchema,
  requestContinuityClarificationSchema,
  executeImplementationSchema,
} from '@/lib/validations/continuity.schema';
import {
  getCachedAnalyses,
  getCachedImpacts,
  getCachedContinuityReviews,
  getCachedJobs,
  detectInstructionChange,
  submitReviewDecision,
  excludeImpactRecord,
  requestReviewClarification,
  escalateContinuityReview,
  executeControlledImplementation,
} from '@/lib/data/care-continuity-data';
import {
  getCachedInstructions,
  getCachedInstructionVersions,
} from '@/lib/data/instruction-vault-data';

describe('CARETRACE Care Continuity Engine (Prompt 10)', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Zod Validation Schemas                                                  */
  /* -------------------------------------------------------------------------- */
  describe('Zod Validation Schemas', () => {
    it('validates valid CreateContinuityAnalysisInput', () => {
      const valid = {
        patientId: 'patient-profile-001',
        instructionId: 'inst-001',
        eventType: 'new_version_created',
        currentVersionNumber: 2,
        previousVersionNumber: 1,
      };
      const result = createContinuityAnalysisSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid eventType in createContinuityAnalysisSchema', () => {
      const invalid = {
        instructionId: 'inst-001',
        eventType: 'unknown_event_type',
        currentVersionNumber: 2,
      };
      const result = createContinuityAnalysisSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates valid ContinuityReviewDecisionInput', () => {
      const validDecision = {
        reviewId: 'cont-rev-001',
        decision: 'approved',
        rationale: 'Verified threshold shift with attending cardiologist Dr. Vance.',
        approvedRecordIds: ['imp-001', 'imp-002'],
        excludedRecords: [],
        optimisticVersionLock: 1,
      };
      const result = continuityReviewDecisionSchema.safeParse(validDecision);
      expect(result.success).toBe(true);
    });

    it('rejects clinical review decision without mandatory rationale (min 5 chars)', () => {
      const invalidDecision = {
        reviewId: 'cont-rev-001',
        decision: 'approved',
        rationale: 'OK', // Too short
        approvedRecordIds: ['imp-001'],
        optimisticVersionLock: 1,
      };
      const result = continuityReviewDecisionSchema.safeParse(invalidDecision);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('min 5 characters');
      }
    });

    it('validates ExcludeImpactRecord schema requiring min 5 chars reason', () => {
      const validExclusion = {
        impactRecordId: 'imp-001',
        exclusionReason: 'Patient self-manages this dose independently.',
      };
      expect(excludeImpactRecordSchema.safeParse(validExclusion).success).toBe(true);

      const invalidExclusion = {
        impactRecordId: 'imp-001',
        exclusionReason: 'N/A', // Too short
      };
      expect(excludeImpactRecordSchema.safeParse(invalidExclusion).success).toBe(false);
    });

    it('validates EscalateReview schema and requires reason', () => {
      const validEscalation = {
        reviewId: 'cont-rev-001',
        escalateTo: 'Dr. Eleanor Vance, MD',
        escalationReason: 'Requires physician evaluation for borderline low pulse threshold.',
      };
      expect(escalateReviewSchema.safeParse(validEscalation).success).toBe(true);

      const invalidEscalation = {
        reviewId: 'cont-rev-001',
        escalateTo: 'Dr. Vance',
        escalationReason: '',
      };
      expect(escalateReviewSchema.safeParse(invalidEscalation).success).toBe(false);
    });

    it('validates ExecuteImplementation schema', () => {
      const validImpl = {
        reviewId: 'cont-rev-001',
        optimisticVersionLock: 1,
        approvedRecordIds: ['imp-001', 'imp-002'],
      };
      expect(executeImplementationSchema.safeParse(validImpl).success).toBe(true);

      const emptyRecords = {
        reviewId: 'cont-rev-001',
        optimisticVersionLock: 1,
        approvedRecordIds: [],
      };
      expect(executeImplementationSchema.safeParse(emptyRecords).success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Initial Data Store & Baseline Analysis                                   */
  /* -------------------------------------------------------------------------- */
  describe('Continuity Baseline Data Store', () => {
    it('loads baseline analyses, impacts, reviews, and execution jobs', () => {
      const analyses = getCachedAnalyses();
      const impacts = getCachedImpacts();
      const reviews = getCachedContinuityReviews();
      const jobs = getCachedJobs();

      expect(analyses.length).toBeGreaterThanOrEqual(3);
      expect(impacts.length).toBeGreaterThanOrEqual(4);
      expect(reviews.length).toBeGreaterThanOrEqual(3);
      expect(jobs.length).toBeGreaterThanOrEqual(1);
    });

    it('maintains deterministic diff summary on baseline Metoprolol revision', () => {
      const metoprololAnalysis = getCachedAnalyses().find((a) => a.id === 'cont-ana-001');
      expect(metoprololAnalysis).toBeDefined();
      expect(metoprololAnalysis?.previousVersionNumber).toBe(1);
      expect(metoprololAnalysis?.currentVersionNumber).toBe(2);

      const targetParamDiff = metoprololAnalysis?.diffSummary.find((d) => d.field === 'targetParameter');
      expect(targetParamDiff).toBeDefined();
      expect(targetParamDiff?.changeType).toBe('modified');
      expect(targetParamDiff?.previousValue).toContain('110 mmHg');
      expect(targetParamDiff?.currentValue).toContain('100 mmHg');
    });

    it('maps downstream impacts with plain-language explainability', () => {
      const impacts = getCachedImpacts().filter((imp) => imp.analysisId === 'cont-ana-001');
      expect(impacts.length).toBeGreaterThanOrEqual(3);

      impacts.forEach((imp) => {
        const reason = imp.reasonIdentified || imp.explainableReason || '';
        expect(reason).toBeTruthy();
        expect(reason.length).toBeGreaterThan(10);
        expect(imp.relatedRecordTitle).toBeTruthy();
        expect(imp.impactClassification || imp.classification).toBeTruthy();
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Change Detection & Engine Operations                                    */
  /* -------------------------------------------------------------------------- */
  describe('Care Continuity Engine Operations', () => {
    it('detects changes when a new instruction version is processed', () => {
      const instructions = getCachedInstructions();
      const inst = instructions.find((i) => i.id === 'inst-001') || instructions[0];
      const versions = getCachedInstructionVersions().filter((v) => v.instructionId === inst.id);
      const prev = versions.find((v) => v.versionNumber === 1) || null;

      const result = detectInstructionChange(
        inst,
        prev,
        'new_version_created',
        { name: 'Sarah Jenkins, RN', role: 'caregiver' }
      );

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.status).toBe('awaiting_human_review');
      expect(result.analysis.diffSummary.length).toBeGreaterThan(0);
      expect(result.analysis.detectedImpactCount).toBeGreaterThan(0);
      expect(result.impacts.length).toBeGreaterThan(0);
      expect(result.review).toBeDefined();
    });

    it('excludes an individual downstream record with mandatory reason', () => {
      const impacts = getCachedImpacts();
      const targetImpact = impacts[0];
      const reason = 'Excluding from automatic prompt adjustment per verbal discussion.';

      const result = excludeImpactRecord(targetImpact.id, reason);
      expect(result).toBeDefined();
      expect(result?.reviewStatus).toBe('excluded');
      expect(result?.exclusionReason).toBe(reason);
    });

    it('requests clarification and marks review as needs_clarification', () => {
      const reviews = getCachedContinuityReviews();
      const targetReview = reviews[0];

      const updated = requestReviewClarification(
        targetReview.id,
        'Does the pulse threshold apply during bedtime readings as well?',
        'Sarah Jenkins, RN'
      );

      expect(updated).toBeDefined();
      expect(updated?.reviewStatus).toBe('needs_clarification');
      expect(updated?.clarificationQuestion).toContain('bedtime readings');
    });

    it('escalates continuity review to another clinician', () => {
      const reviews = getCachedContinuityReviews();
      const targetReview = reviews[0];

      const escalated = escalateContinuityReview(
        targetReview.id,
        'Dr. Eleanor Vance, MD',
        'Complex cardiac history requires physician evaluation.'
      );

      expect(escalated).toBeDefined();
      expect(escalated?.escalatedTo).toBe('Dr. Eleanor Vance, MD');
      expect(escalated?.reviewNotes).toContain('Complex cardiac history');
    });

    it('submits clinical approval decision and updates review status', () => {
      const reviews = getCachedContinuityReviews();
      const targetReview = reviews.find((r) => r.reviewStatus === 'awaiting_human_review') || reviews[0];

      const result = submitReviewDecision(
        targetReview.id,
        'approved',
        'Clinical parameters verified. Approved for downstream coordination updates.',
        ['imp-001', 'imp-003'],
        [],
        'Sarah Jenkins, RN',
        targetReview.optimisticVersionLock
      );

      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
      expect(result.review?.reviewStatus).toBe('approved_for_downstream_update');
      expect(result.review?.decisionRationale).toContain('Clinical parameters verified');
      expect(result.review?.decidedByName).toBe('Sarah Jenkins, RN');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Concurrency Protection & Controlled Downstream Implementation            */
  /* -------------------------------------------------------------------------- */
  describe('Concurrency & Controlled Downstream Implementation', () => {
    it('blocks implementation when review has not received human approval', () => {
      const reviews = getCachedContinuityReviews();
      const unapprovedReview = reviews[0];
      unapprovedReview.reviewStatus = 'needs_clarification';

      const result = executeControlledImplementation(
        unapprovedReview.id,
        'Sarah Jenkins, RN',
        unapprovedReview.optimisticVersionLock
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('authorized human approval');
    });

    it('blocks implementation when optimistic concurrency lock mismatches', () => {
      const reviews = getCachedContinuityReviews();
      const approvedReview = reviews[0];
      approvedReview.reviewStatus = 'approved_for_downstream_update';

      const result = executeControlledImplementation(
        approvedReview.id,
        'Sarah Jenkins, RN',
        999 // Mismatched lock
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Concurrency lock mismatch');
    });

    it('safely executes downstream implementation without altering dosages (Non-Prescribing Safety Rule)', () => {
      const reviews = getCachedContinuityReviews();
      const approvedReview = reviews[0];
      approvedReview.reviewStatus = 'approved_for_downstream_update';

      // Approve an impact
      const impacts = getCachedImpacts().filter((i) => i.analysisId === approvedReview.analysisId);
      if (impacts.length > 0) {
        impacts[0].reviewStatus = 'approved_for_update';
      }

      const result = executeControlledImplementation(
        approvedReview.id,
        'Sarah Jenkins, RN',
        approvedReview.optimisticVersionLock
      );

      expect(result.success).toBe(true);
      expect(result.job).toBeDefined();
      expect(result.job?.status).toBe('completed');
      expect(result.job?.executedAuditRecords).toBeDefined();

      // Clinical safety verification: verify medication dosage was NEVER changed
      result.job?.executedAuditRecords.forEach((audit) => {
        if (audit.recordType === 'medication') {
          expect(audit.action).toBe('instruction_provenance_linked');
          // No dose changes allowed
          expect(audit.action).not.toContain('dosage');
          expect(audit.action).not.toContain('frequency');
        }
      });
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. SQL Migration 7 Verification                                            */
  /* -------------------------------------------------------------------------- */
  describe('Database Schema & Migration 7 Verification', () => {
    it('verifies SQL migration 20260215000007_care_continuity_engine.sql exists with correct tables and RLS', () => {
      const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260215000007_care_continuity_engine.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

      // Verify required tables
      expect(sqlContent).toContain('create table if not exists continuity_analyses');
      expect(sqlContent).toContain('create table if not exists continuity_impacts');
      expect(sqlContent).toContain('create table if not exists continuity_reviews');
      expect(sqlContent).toContain('create table if not exists continuity_implementation_jobs');

      // Verify RLS enablement
      expect(sqlContent).toContain('alter table continuity_analyses enable row level security;');
      expect(sqlContent).toContain('alter table continuity_impacts enable row level security;');
      expect(sqlContent).toContain('alter table continuity_reviews enable row level security;');
      expect(sqlContent).toContain('alter table continuity_implementation_jobs enable row level security;');

      // Verify Indexes
      expect(sqlContent).toContain('create index if not exists idx_continuity_analyses_patient');
      expect(sqlContent).toContain('create index if not exists idx_continuity_impacts_analysis');
      expect(sqlContent).toContain('create index if not exists idx_continuity_reviews_patient');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. Route Files Verification                                                */
  /* -------------------------------------------------------------------------- */
  describe('Continuity Route Files Verification', () => {
    it('verifies all 7 frontend UI route pages exist', () => {
      const routePaths = [
        'src/app/continuity/page.tsx',
        'src/app/continuity/changes/page.tsx',
        'src/app/continuity/changes/[id]/page.tsx',
        'src/app/continuity/impact/page.tsx',
        'src/app/continuity/reviews/page.tsx',
        'src/app/continuity/reviews/[id]/page.tsx',
        'src/app/continuity/history/page.tsx',
      ];

      routePaths.forEach((relPath) => {
        const fullPath = path.join(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });

    it('verifies all continuity API route handlers exist', () => {
      const apiRoutePaths = [
        'src/app/api/continuity/analyses/route.ts',
        'src/app/api/continuity/analyses/[id]/route.ts',
        'src/app/api/continuity/impacts/route.ts',
        'src/app/api/continuity/reviews/route.ts',
        'src/app/api/continuity/reviews/[id]/route.ts',
        'src/app/api/continuity/reviews/[id]/implement/route.ts',
      ];

      apiRoutePaths.forEach((relPath) => {
        const fullPath = path.join(process.cwd(), relPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
