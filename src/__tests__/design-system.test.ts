import { describe, it, expect } from 'vitest';
import { tokens } from '@/lib/constants/tokens';
import { NAVIGATION_SECTIONS, NAVIGATION_LINKS, APP_CORE_MOTTO } from '@/lib/constants';

describe('CARETRACE Phase 2 Design System Verification', () => {
  describe('Design Tokens & Palette Consistency', () => {
    it('should have exact healthcare palette values configured', () => {
      expect(tokens.colors.primary.DEFAULT).toBe('#123C43');
      expect(tokens.colors.secondary.DEFAULT).toBe('#247C78');
      expect(tokens.colors.mint.DEFAULT).toBe('#E8F4EF');
      expect(tokens.colors.canvas.background).toBe('#F7F8F5');
      expect(tokens.colors.canvas.surface).toBe('#FFFFFF');
      expect(tokens.colors.text.main).toBe('#172B2B');
      expect(tokens.colors.text.secondary).toBe('#627270');
      expect(tokens.colors.border.subtle).toBe('#E2E9E5');
      expect(tokens.colors.feedback.success.DEFAULT).toBe('#237A57');
      expect(tokens.colors.feedback.warning.DEFAULT).toBe('#B7791F');
      expect(tokens.colors.feedback.danger.DEFAULT).toBe('#B54747');
      expect(tokens.colors.feedback.info.DEFAULT).toBe('#3478A5');
    });

    it('should mandate minimum touch targets of 44px for accessibility', () => {
      expect(tokens.touchTarget.min).toBe('44px');
      expect(tokens.touchTarget.elder).toBe('54px');
    });

    it('should have core tagline motto matching specification', () => {
      expect(APP_CORE_MOTTO).toBe(
        'Every instruction connected. Every responsibility visible. Every care transition accounted for.'
      );
    });
  });

  describe('Navigation Information Architecture', () => {
    it('should define navigation links including all core modules and patient profile', () => {
      expect(NAVIGATION_LINKS.length).toBeGreaterThanOrEqual(12);

      const sectionLabels = NAVIGATION_LINKS.map((item) => item.label);
      expect(sectionLabels).toContain('Overview');
      expect(sectionLabels).toContain('Medications');
      expect(sectionLabels).toContain('Appointments');
      expect(sectionLabels).toContain('Care Circle');
      expect(sectionLabels).toContain('Instructions');
      expect(sectionLabels).toContain('Continuity Engine');
      expect(sectionLabels).toContain('Care Gap Radar');
      expect(sectionLabels).toContain('Notifications');
      expect(sectionLabels).toContain('Care Timeline');
      expect(sectionLabels).toContain('Care Passport');
      expect(sectionLabels).toContain('Privacy & Access');
      expect(sectionLabels).toContain('Settings');
      expect(sectionLabels).toContain('Patient Profile');
    });

    it('should organize navigation into 4 logical groups', () => {
      expect(NAVIGATION_SECTIONS).toHaveLength(4);
      expect(NAVIGATION_SECTIONS[0].group).toBe('CARE');
      expect(NAVIGATION_SECTIONS[1].group).toBe('COORDINATION');
      expect(NAVIGATION_SECTIONS[2].group).toBe('RECORDS');
      expect(NAVIGATION_SECTIONS[3].group).toBe('ACCOUNT');
    });
  });
});
