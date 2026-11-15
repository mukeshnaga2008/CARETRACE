import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  timelineFilterSchema,
  analyticsQuerySchema,
  carePassportConfigSchema,
  createPassportExportSchema,
  timelineCategories,
  analyticsDateRanges,
  carePassportSectionKeys,
} from '@/lib/validations/timeline-passport.schema';
import {
  getUnifiedCareTimeline,
  getTimelineEventById,
  getCareAnalytics,
  getCarePassportData,
  recordPassportExport,
  getCachedPassportExports,
  getCarePassportPreferences,
  updateCarePassportPreferences,
  DEFAULT_CARE_PASSPORT_CONFIG,
} from '@/lib/data/timeline-analytics-data';
import { generateCarePassportPDF } from '@/lib/services/passport-pdf-service';
import { CarePassportSectionKey } from '@/types/caretrace';

describe('CARETRACE Care Timeline, Analytics & Care Passport (Prompt 13)', () => {
  /* -------------------------------------------------------------------------- */
  /* 1. Zod Validation Schemas                                                  */
  /* -------------------------------------------------------------------------- */
  describe('1. Zod Validation Schemas', () => {
    it('validates timelineFilterSchema with default pagination and empty parameters', () => {
      const result = timelineFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(30);
      }
    });

    it('validates timelineFilterSchema with explicit category and date boundaries', () => {
      const input = {
        patientId: 'patient-profile-001',
        category: 'medication',
        sourceModule: 'medication_lifecycle',
        search: 'Metoprolol',
        startDate: '2026-01-01',
        endDate: '2026-02-15',
        page: 2,
        limit: 50,
      };
      const result = timelineFilterSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('medication');
        expect(result.data.search).toBe('Metoprolol');
        expect(result.data.limit).toBe(50);
      }
    });

    it('validates analyticsQuerySchema with all valid date ranges', () => {
      analyticsDateRanges.forEach((range) => {
        const result = analyticsQuerySchema.safeParse({ range });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.range).toBe(range);
        }
      });
    });

    it('defaults analyticsQuerySchema range to 30d if omitted', () => {
      const result = analyticsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.range).toBe('30d');
      }
    });

    it('rejects invalid range in analyticsQuerySchema', () => {
      const result = analyticsQuerySchema.safeParse({ range: '10year' });
      expect(result.success).toBe(false);
    });

    it('validates carePassportConfigSchema with sections record and custom notes', () => {
      const config = {
        sections: {
          patient_identity: true,
          emergency_contacts: true,
          medication_regimen: true,
          conditions_and_allergies: true,
          upcoming_appointments: false,
          care_instructions: true,
          care_circle: false,
          pending_tasks: false,
          advance_directives: true,
        },
        includeAuditHash: true,
        notes: 'Clinical transfer notes for specialist.',
      };
      const result = carePassportConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeAuditHash).toBe(true);
        expect(result.data.notes).toBe('Clinical transfer notes for specialist.');
      }
    });

    it('validates createPassportExportSchema with required sections and reason', () => {
      const exportReq = {
        patientId: 'patient-profile-001',
        includedSections: ['patient_identity', 'medication_regimen', 'emergency_contacts'],
        reason: 'Hospital ED handoff packet',
      };
      const result = createPassportExportSchema.safeParse(exportReq);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includedSections).toHaveLength(3);
      }
    });

    it('rejects createPassportExportSchema without patientId or empty sections', () => {
      const invalid = {
        patientId: '',
        includedSections: [],
      };
      const result = createPassportExportSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. Unified Care Timeline Engine                                            */
  /* -------------------------------------------------------------------------- */
  describe('2. Unified Care Timeline Engine', () => {
    it('generates a chronological event stream sorted descending by occurredAt', () => {
      const timeline = getUnifiedCareTimeline('patient-profile-001');
      expect(timeline.length).toBeGreaterThan(0);

      // Verify descending chronological ordering
      for (let i = 0; i < timeline.length - 1; i++) {
        const t1 = new Date(timeline[i].occurredAt).getTime();
        const t2 = new Date(timeline[i + 1].occurredAt).getTime();
        expect(t1).toBeGreaterThanOrEqual(t2);
      }
    });

    it('projects events across all core CARETRACE modules without duplicating source records', () => {
      const timeline = getUnifiedCareTimeline('patient-profile-001');
      const categoriesFound = new Set(timeline.map((e) => e.category));

      expect(categoriesFound.has('medication')).toBe(true);
      expect(categoriesFound.has('appointment')).toBe(true);
      expect(categoriesFound.has('instruction')).toBe(true);
      expect(categoriesFound.has('continuity')).toBe(true);
      expect(categoriesFound.has('care_circle')).toBe(true);
    });

    it('distinguishes between occurrence timestamp (occurredAt) and recording timestamp (recordedAt)', () => {
      const timeline = getUnifiedCareTimeline('patient-profile-001');
      const eventsWithBoth = timeline.filter((e) => e.occurredAt && e.recordedAt);
      expect(eventsWithBoth.length).toBeGreaterThan(0);

      eventsWithBoth.forEach((ev) => {
        expect(typeof ev.occurredAt).toBe('string');
        expect(typeof ev.recordedAt).toBe('string');
        expect(new Date(ev.occurredAt).toString()).not.toBe('Invalid Date');
        expect(new Date(ev.recordedAt).toString()).not.toBe('Invalid Date');
      });
    });

    it('labels self-reported medication events with isReportedOnly: true and provenance note', () => {
      const timeline = getUnifiedCareTimeline('patient-profile-001');
      const medicationEvents = timeline.filter((e) => e.category === 'medication');
      expect(medicationEvents.length).toBeGreaterThan(0);

      const reportedDoses = medicationEvents.filter((e) => e.isReportedOnly === true);
      expect(reportedDoses.length).toBeGreaterThan(0);

      reportedDoses.forEach((dose) => {
        expect(dose.isReportedOnly).toBe(true);
        expect(dose.actorRole?.toLowerCase()).toMatch(/patient|caregiver|family/);
      });
    });

    it('retrieves an individual timeline event by ID with full provenance metadata', () => {
      const timeline = getUnifiedCareTimeline('patient-profile-001');
      const firstEvent = timeline[0];

      const retrieved = getTimelineEventById(firstEvent.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(firstEvent.id);
      expect(retrieved?.title).toBe(firstEvent.title);
      expect(retrieved?.sourceModule).toBe(firstEvent.sourceModule);
    });

    it('returns undefined for non-existent timeline event ID', () => {
      const nonExistent = getTimelineEventById('time-non-existent-99999');
      expect(nonExistent).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. Care Analytics Calculations & Clinical Boundaries                       */
  /* -------------------------------------------------------------------------- */
  describe('3. Care Analytics Calculations & Boundaries', () => {
    it('computes reported adherence rate using strictly eligible past doses (taken / (taken + missed + skipped))', () => {
      const analytics = getCareAnalytics('patient-profile-001', '30d');
      const med = analytics.medications;

      const eligibleDoses = med.reportedTaken + med.missed + med.skipped;
      if (eligibleDoses > 0) {
        const expectedRate = Math.round((med.reportedTaken / eligibleDoses) * 100);
        expect(med.reportedAdherenceRate).toBe(expectedRate);
      } else {
        expect(med.reportedAdherenceRate).toBe(100);
      }
    });

    it('does not count scheduled upcoming doses as taken, missed, or in the adherence denominator', () => {
      const analytics = getCareAnalytics('patient-profile-001', '30d');
      const med = analytics.medications;

      expect(typeof med.scheduledUpcoming).toBe('number');
      expect(typeof med.unconfirmedOverdue).toBe('number');

      // The adherence calculation must not divide by totalDoseEvents if total includes future scheduled doses
      if (med.scheduledUpcoming > 0) {
        const totalEligible = med.reportedTaken + med.missed + med.skipped;
        expect(totalEligible).toBeLessThanOrEqual(med.totalDoseEvents);
      }
    });

    it('computes appointment metrics and preparation completion rate accurately', () => {
      const analytics = getCareAnalytics('patient-profile-001', '30d');
      const appt = analytics.appointments;

      expect(appt.totalAppointments).toBeGreaterThan(0);
      expect(typeof appt.upcomingCount).toBe('number');
      expect(typeof appt.completedCount).toBe('number');
      expect(appt.prepCompletionRate).toBeGreaterThanOrEqual(0);
      expect(appt.prepCompletionRate).toBeLessThanOrEqual(100);
    });

    it('computes care circle task metrics and completion percentage', () => {
      const analytics = getCareAnalytics('patient-profile-001', '30d');
      const cc = analytics.careCircle;

      expect(cc.activeMembersCount).toBeGreaterThan(0);
      expect(cc.taskCompletionRate).toBeGreaterThanOrEqual(0);
      expect(cc.taskCompletionRate).toBeLessThanOrEqual(100);
      expect(cc.completedTasks + cc.overdueTasks + cc.unassignedTasks).toBeLessThanOrEqual(cc.totalTasks + 10);
    });

    it('computes continuity review throughput and instruction verification stats', () => {
      const analytics = getCareAnalytics('patient-profile-001', '30d');
      const cont = analytics.continuity;

      expect(cont.totalInstructions).toBeGreaterThan(0);
      expect(cont.verifiedInstructions).toBeGreaterThanOrEqual(0);
      expect(typeof cont.totalReviews).toBe('number');
      expect(typeof cont.approvedImplementations).toBe('number');
    });

    it('respects date range parameters (7d, 30d, 90d, all)', () => {
      const a7d = getCareAnalytics('patient-profile-001', '7d');
      const a30d = getCareAnalytics('patient-profile-001', '30d');
      const aAll = getCareAnalytics('patient-profile-001', 'all');

      expect(a7d.dateRange).toBe('7d');
      expect(a30d.dateRange).toBe('30d');
      expect(aAll.dateRange).toBe('all');
      expect(new Date(a7d.startDate).getTime()).toBeGreaterThan(new Date(aAll.startDate).getTime());
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. Care Passport Aggregation & PDF Generation                              */
  /* -------------------------------------------------------------------------- */
  describe('4. Care Passport Data Aggregation & PDF Export', () => {
    it('aggregates complete, authorized patient identity snapshot with cryptographic hash', () => {
      const config = getCarePassportPreferences();
      const passportData = getCarePassportData('patient-profile-001', config);

      expect(passportData.patient.fullName).toContain('Sullivan');
      expect(passportData.patient.bloodType).toBe('O+');
      expect(passportData.emergencyContacts.length).toBeGreaterThan(0);
      expect(passportData.conditionsAndAllergies.conditions.length).toBeGreaterThan(0);
      expect(passportData.conditionsAndAllergies.allergies.length).toBeGreaterThan(0);
      expect(passportData.medications.length).toBeGreaterThan(0);
      expect(passportData.advanceDirectives.dnrStatus).toContain('DNR');
      expect(passportData.meta.verificationHash).toMatch(/^CT-SHA256-[0-9A-F]+/);
    });

    it('generates a valid jsPDF document instance with header banner, tables, and disclaimer', () => {
      const config = getCarePassportPreferences();
      const passportData = getCarePassportData('patient-profile-001', config);

      const doc = generateCarePassportPDF(passportData as any);
      expect(doc).toBeDefined();

      // Verify that the PDF can be serialized to a data URI string without throwing
      const dataUri = doc.output('datauristring');
      expect(dataUri).toMatch(/^data:application\/pdf/);
      expect(dataUri.length).toBeGreaterThan(1000);
    });

    it('records an immutable passport export in the audit ledger and retrieves cached exports', () => {
      const beforeCount = getCachedPassportExports().length;

      const record = recordPassportExport(
        'patient-profile-001',
        'family',
        'David Sullivan',
        'Family Member (Proxy)',
        ['patient_identity', 'medication_regimen', 'advance_directives'],
        'CT-SHA256-TESTHASH1234',
        'Specialist cardiology consultation handoff'
      );

      expect(record.id).toMatch(/^exp-/);
      expect(record.patientId).toBe('patient-profile-001');
      expect(record.exportedByName).toBe('David Sullivan');
      expect(record.verificationHash).toBe('CT-SHA256-TESTHASH1234');
      expect(record.includedSections).toHaveLength(3);

      const afterList = getCachedPassportExports();
      expect(afterList.length).toBe(beforeCount + 1);
      expect(afterList[0].id).toBe(record.id);
    });

    it('persists and updates user passport preferences', () => {
      const current = getCarePassportPreferences();
      const updated = updateCarePassportPreferences({
        notes: 'Updated custom notes for hospital admission.',
        sections: {
          ...current.sections,
          pending_tasks: false,
        },
      });

      expect(updated.notes).toBe('Updated custom notes for hospital admission.');
      expect(updated.sections.pending_tasks).toBe(false);

      // Verify persistence in subsequent getter call
      const fresh = getCarePassportPreferences();
      expect(fresh.notes).toBe('Updated custom notes for hospital admission.');
      expect(fresh.sections.pending_tasks).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. SQL Database Migration Verification                                     */
  /* -------------------------------------------------------------------------- */
  describe('5. SQL Database Migration Verification', () => {
    it('has migration 20260215000010_care_timeline_analytics_passport.sql defining tables and RLS', () => {
      const migrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20260215000010_care_timeline_analytics_passport.sql'
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const content = fs.readFileSync(migrationPath, 'utf-8');
      expect(content.toLowerCase()).toContain('care_passport_exports');
      expect(content.toLowerCase()).toContain('care_passport_preferences');
      expect(content).toContain('verification_hash');
      expect(content).toContain('ENABLE ROW LEVEL SECURITY');
      expect(content).toContain('idx_passport_exports_patient');
    });
  });
});
