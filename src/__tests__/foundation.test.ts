import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';
import { 
  patientProfileSchema, 
  medicationSchema, 
  changeReviewSchema, 
  appointmentSchema 
} from '@/lib/validations';
import { APP_NAME, USER_ROLES, INSTRUCTION_STATUS } from '@/lib/constants';

describe('CARETRACE Phase 1 Foundation Verification', () => {
  describe('Constants & Core Integrity', () => {
    it('should have core application brand constants configured', () => {
      expect(APP_NAME).toBe('CARETRACE');
      expect(USER_ROLES.PATIENT).toBe('patient');
      expect(INSTRUCTION_STATUS.PENDING_REVIEW).toBe('pending_review');
    });
  });

  describe('Utility Functions', () => {
    it('cn should merge class names cleanly and resolve conflicts', () => {
      const merged = cn('bg-red-500 text-white', 'bg-blue-500', undefined, null, false);
      expect(merged).toBe('text-white bg-blue-500');
    });
  });

  describe('Validation Schemas (Input Safety)', () => {
    it('should validate a valid patient profile', () => {
      const validProfile = {
        fullName: 'Margaret Sullivan',
        email: 'margaret.sullivan@example.com',
        phone: '+1-555-0192',
        dateOfBirth: '1948-06-14',
        bloodType: 'O+' as const,
        primaryDoctorName: 'Dr. Robert Chen',
        primaryClinic: 'St. Jude Geriatric Care',
        preferredLanguage: 'en',
      };

      const result = patientProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject an invalid patient profile with bad date format', () => {
      const invalidProfile = {
        fullName: 'M', // Too short
        dateOfBirth: 'June 14, 1948', // Non-standard format
        bloodType: 'XYZ',
        primaryDoctorName: '',
        primaryClinic: '',
      };

      const result = patientProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should strictly validate medication schedule parameters', () => {
      const validMed = {
        name: 'Lisinopril',
        dosage: '10mg',
        form: 'Tablet' as const,
        route: 'Oral',
        frequency: 'Once daily in morning',
        scheduledTimes: ['08:00'],
        prescribingDoctor: 'Dr. Robert Chen',
        pharmacy: 'CVS Pharmacy #412',
        rxNumber: 'RX-992812',
        refillsRemaining: 2,
        startDate: '2026-01-15',
        sideEffectWarnings: ['Dizziness', 'Dry cough'],
      };

      const result = medicationSchema.safeParse(validMed);
      expect(result.success).toBe(true);
    });

    it('should enforce clinical rationale on change review decisions', () => {
      const reviewWithEmptyRationale = {
        instructionVersionId: '550e8400-e29b-41d4-a716-446655440000',
        decision: 'approved' as const,
        rationale: 'ok', // too short (<10 chars)
        checklistVerification: [{ item: 'Verified dosage', verified: true }],
      };

      const result = changeReviewSchema.safeParse(reviewWithEmptyRationale);
      expect(result.success).toBe(false);
    });

    it('should validate appointment timing and structures', () => {
      const appointment = {
        title: 'Cardiology 6-Month Review',
        specialty: 'Cardiology',
        providerName: 'Dr. Eleanor Vance',
        facility: 'Metropolitan Heart Centre',
        locationAddress: '450 Health Parkway, Suite 300',
        appointmentDate: '2026-03-12T14:30:00Z',
        durationMinutes: 45,
        transportNeeded: true,
        agendaQuestions: ['Review blood pressure log', 'Discuss mild ankle swelling'],
      };

      const result = appointmentSchema.safeParse(appointment);
      expect(result.success).toBe(true);
    });
  });
});
