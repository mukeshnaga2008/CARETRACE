import { describe, it, expect, beforeEach } from 'vitest';
import { authenticateUser, registerUser, getUserByEmail } from '@/lib/auth/registered-users';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as assistantHandler } from '@/app/api/assistant/chat/route';

describe('CARETRACE Final Authentication & Quality Gates', () => {
  describe('User Repository & Password Verification', () => {
    it('authenticates synthetic family administrator David Sullivan', () => {
      const user = authenticateUser('david@caretrace.health', 'Caretrace2026!');
      expect(user).not.toBeNull();
      expect(user?.fullName).toBe('David Sullivan');
      expect(user?.role).toBe('family');
      expect(user?.email).toBe('david@caretrace.health');
    });

    it('authenticates synthetic patient Margaret Sullivan', () => {
      const user = authenticateUser('margaret@caretrace.health', 'Caretrace2026!');
      expect(user).not.toBeNull();
      expect(user?.fullName).toBe('Margaret Sullivan');
      expect(user?.role).toBe('patient');
    });

    it('authenticates synthetic caregiver Nurse Sarah Jenkins', () => {
      const user = authenticateUser('nurse.sarah@caretrace.health', 'Caretrace2026!');
      expect(user).not.toBeNull();
      expect(user?.role).toBe('caregiver');
    });

    it('rejects invalid passwords safely', () => {
      const user = authenticateUser('david@caretrace.health', 'WrongPassword123!');
      expect(user).toBeNull();
    });

    it('rejects non-existent emails safely', () => {
      const user = authenticateUser('unknown.user@caretrace.health', 'Caretrace2026!');
      expect(user).toBeNull();
    });

    it('registers a new user and allows immediate subsequent authentication', () => {
      const testEmail = `new.caregiver.${Date.now()}@caretrace.health`;
      const reg = registerUser({
        fullName: 'Dr. Evelyn Reed',
        email: testEmail,
        password: 'Caretrace2026!',
        role: 'caregiver',
      });

      expect(reg.success).toBe(true);
      if (reg.success) {
        expect(reg.user.fullName).toBe('Dr. Evelyn Reed');
        expect(reg.user.role).toBe('caregiver');
      }

      // Verify authentication works immediately
      const auth = authenticateUser(testEmail, 'Caretrace2026!');
      expect(auth).not.toBeNull();
      expect(auth?.fullName).toBe('Dr. Evelyn Reed');
    });

    it('rejects duplicate email registrations', () => {
      const dup = registerUser({
        fullName: 'David Sullivan Duplicate',
        email: 'david@caretrace.health',
        password: 'Caretrace2026!',
        role: 'family',
      });

      expect(dup.success).toBe(false);
      if (!dup.success) {
        expect(dup.error).toContain('already registered');
      }
    });
  });

  describe('Authentication Route Handlers', () => {
    it('rejects login with malformed payload (HTTP 400)', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validation error');
    });

    it('rejects invalid credentials with HTTP 401', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'david@caretrace.health',
          password: 'IncorrectPassword999!',
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Invalid email or password');
    });

    it('authenticates valid synthetic user with HTTP 200 and session data', async () => {
      const req = new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'david@caretrace.health',
          password: 'Caretrace2026!',
        }),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('david@caretrace.health');
      expect(data.user.role).toBe('family');
    });
  });

  describe('Mini CARETRACE AI Navigation Assistant', () => {
    it('provides medication navigation when queried about meds or doses', async () => {
      const req = new Request('http://localhost:3000/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Where can I find the scheduled medication doses?' }),
      });

      const res = await assistantHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.reply).toContain('Medications');
      expect(data.suggestedLinks.some((l: any) => l.href === '/medications')).toBe(true);
      expect(data.isClinicalBoundaryNote).toBe(false);
    });

    it('provides appointment navigation when queried about visits', async () => {
      const req = new Request('http://localhost:3000/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'How do I check the next doctor visit?' }),
      });

      const res = await assistantHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.reply).toContain('Appointments');
      expect(data.suggestedLinks.some((l: any) => l.href.includes('/appointments'))).toBe(true);
    });

    it('strictly enforces clinical boundary when asked for medical diagnoses or dosage changes', async () => {
      const req = new Request('http://localhost:3000/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Should I stop taking Metoprolol or change my dose?' }),
      });

      const res = await assistantHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.isClinicalBoundaryNote).toBe(true);
      expect(data.reply).toContain('SAFETY NOTICE');
      expect(data.reply).toContain('not a medical doctor');
    });
  });
});
