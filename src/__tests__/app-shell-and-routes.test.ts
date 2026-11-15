import { describe, it, expect } from 'vitest';
import { 
  NAVIGATION_SECTIONS, 
  NAVIGATION_LINKS, 
  USER_PERSPECTIVES, 
  AppRole 
} from '@/lib/constants';
import { 
  SYNTHETIC_PATIENT, 
  SYNTHETIC_METRICS, 
  SYNTHETIC_MEDICATION_SCHEDULE, 
  SYNTHETIC_NEXT_APPOINTMENT, 
  SYNTHETIC_CARE_CIRCLE, 
  SYNTHETIC_ALERTS 
} from '@/lib/data/synthetic-dashboard-data';

describe('CARETRACE Phase 3: Application Shell, Navigation & Routes', () => {
  describe('Navigation Architecture & Information Hierarchy', () => {
    it('should configure exactly the 4 required navigation groups', () => {
      expect(NAVIGATION_SECTIONS).toHaveLength(4);
      expect(NAVIGATION_SECTIONS[0].group).toBe('CARE');
      expect(NAVIGATION_SECTIONS[1].group).toBe('COORDINATION');
      expect(NAVIGATION_SECTIONS[2].group).toBe('RECORDS');
      expect(NAVIGATION_SECTIONS[3].group).toBe('ACCOUNT');
    });

    it('should have all 12 required routes configured with valid paths', () => {
      const routes = NAVIGATION_LINKS.map((item) => item.href);
      expect(routes).toContain('/dashboard');
      expect(routes).toContain('/medications');
      expect(routes).toContain('/appointments');
      expect(routes).toContain('/care-circle');
      expect(routes).toContain('/instructions');
      expect(routes).toContain('/continuity');
      expect(routes).toContain('/care-gaps');
      expect(routes).toContain('/notifications');
      expect(routes).toContain('/timeline');
      expect(routes).toContain('/care-passport');
      expect(routes).toContain('/privacy');
      expect(routes).toContain('/settings');
    });

    it('should define the 3 core healthcare user perspectives', () => {
      const roles: AppRole[] = ['patient', 'family', 'caregiver'];
      roles.forEach((role) => {
        expect(USER_PERSPECTIVES[role]).toBeDefined();
        expect(USER_PERSPECTIVES[role].sampleName).toBeDefined();
        expect(USER_PERSPECTIVES[role].label).toBeDefined();
      });
      expect(USER_PERSPECTIVES.patient.label).toBe('Elder Patient');
      expect(USER_PERSPECTIVES.family.label).toBe('Family Member');
      expect(USER_PERSPECTIVES.caregiver.label).toBe('Caregiver / Nurse');
    });
  });

  describe('Synthetic Dashboard Data Consistency', () => {
    it('should contain complete synthetic patient profile for Margaret Sullivan', () => {
      expect(SYNTHETIC_PATIENT.fullName).toBe('Margaret Sullivan');
      expect(SYNTHETIC_PATIENT.age).toBe(78);
      expect(SYNTHETIC_PATIENT.bloodType).toBe('O+');
      expect(SYNTHETIC_PATIENT.emergencyContact.name).toBe('David Sullivan');
    });

    it('should maintain internal numerical consistency across daily metrics', () => {
      const totalScheduled = SYNTHETIC_MEDICATION_SCHEDULE.length;
      expect(totalScheduled).toBe(3);

      const reportedTaken = SYNTHETIC_MEDICATION_SCHEDULE.filter(
        (d) => d.status === 'reported_taken'
      ).length;
      expect(reportedTaken).toBe(2);

      const upcoming = SYNTHETIC_MEDICATION_SCHEDULE.filter(
        (d) => d.status === 'upcoming'
      ).length;
      expect(upcoming).toBe(1);

      // Verify metrics array matches
      const scheduledMetric = SYNTHETIC_METRICS.find((m) => m.id === 'scheduled-doses');
      expect(scheduledMetric?.value).toBe('3 Doses');

      const takenMetric = SYNTHETIC_METRICS.find((m) => m.id === 'reported-taken');
      expect(takenMetric?.value).toBe('2 of 3');
    });

    it('should specify confirmed next appointment with transport', () => {
      expect(SYNTHETIC_NEXT_APPOINTMENT.specialty).toBe('Cardiology');
      expect(SYNTHETIC_NEXT_APPOINTMENT.status).toBe('confirmed');
      expect(SYNTHETIC_NEXT_APPOINTMENT.companionName).toContain('David Sullivan');
    });

    it('should list all 3 synchronized Care Circle members with distinct responsibilities', () => {
      expect(SYNTHETIC_CARE_CIRCLE).toHaveLength(3);
      const roles = SYNTHETIC_CARE_CIRCLE.map((m) => m.relationship);
      expect(roles).toContain('Son');
      expect(roles).toContain('Visiting Home Nurse');
      expect(roles).toContain('Attending Cardiologist');
    });

    it('should have both warning and info alerts categorized appropriately', () => {
      expect(SYNTHETIC_ALERTS).toHaveLength(2);
      const categories = SYNTHETIC_ALERTS.map((a) => a.category);
      expect(categories).toContain('care_gap');
      expect(categories).toContain('continuity');
    });
  });
});
