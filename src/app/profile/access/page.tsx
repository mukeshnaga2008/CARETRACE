'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  X, 
  ArrowRight, 
  Info,
  History
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ProfileNavTabs } from '@/components/features/profile/profile-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { SYNTHETIC_CARE_CIRCLE } from '@/lib/data/synthetic-dashboard-data';
import { AppRole } from '@/lib/constants';

interface ActiveConsentRecord {
  id: string;
  granteeName: string;
  role: string;
  scope: string;
  purpose: string;
  grantedDate: string;
  status: 'active' | 'revoked';
}

const INITIAL_CONSENTS: ActiveConsentRecord[] = [
  {
    id: 'consent-001',
    granteeName: 'David Sullivan (Son)',
    role: 'Primary Family Coordinator',
    scope: 'Full Medical & Legal Proxy',
    purpose: 'Assisting Margaret with daily medication coordination, appointments, and care decisions under documented Medical Power of Attorney.',
    grantedDate: '2024-06-15',
    status: 'active',
  },
  {
    id: 'consent-002',
    granteeName: 'Sarah Jenkins, RN',
    role: 'Visiting Home Nurse',
    scope: 'Medication Administration & Tasks',
    purpose: 'Twice-weekly vitals assessment, medication adherence verification, and shift handover logging.',
    grantedDate: '2026-01-12',
    status: 'active',
  },
  {
    id: 'consent-003',
    granteeName: 'St. Jude Geriatric EMS First Responders',
    role: 'Emergency Medical Services',
    scope: 'Emergency Summary & DNR Pass',
    purpose: 'Immediate break-glass access to blood type, allergies, and advance directives during 911 emergencies.',
    grantedDate: '2025-09-01',
    status: 'active',
  },
];

export default function PatientAccessSharingPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');
  const [consents, setConsents] = React.useState(INITIAL_CONSENTS);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [revocationReason, setRevocationReason] = React.useState('');
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isPatient = activeRole === 'patient';

  const handleRevokeConsent = (id: string) => {
    if (!isPatient) {
      setFeedback({
        type: 'error',
        text: 'Only the patient (Margaret Sullivan) or legal healthcare proxy holds authority to revoke consent grants.',
      });
      return;
    }

    if (!revocationReason || revocationReason.length < 5) {
      setFeedback({
        type: 'error',
        text: 'Please provide a clear justification for revocation for clinical audit trail compliance.',
      });
      return;
    }

    setConsents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'revoked' } : c))
    );

    setRevokingId(null);
    setRevocationReason('');
    setFeedback({
      type: 'success',
      text: 'Consent record revoked immediately. Access credentials have been terminated and logged to the Care Audit Timeline.',
    });
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Access, Consent & Sharing Overview"
        description="Review and manage which family members, caregivers, and medical providers hold active access to Margaret Sullivan's health records."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Patient Profile', href: '/profile' },
          { label: 'Access & Sharing' },
        ]}
      >
        <ProfileNavTabs />

        {/* Patient Centric Privacy Notice */}
        <div className="mb-6 p-4 rounded-xl bg-canvas-background border border-subtleBorder flex items-start gap-3 text-xs text-secondaryText">
          <ShieldCheck className="h-4 w-4 text-clinical-success shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-main block mb-0.5">Patient-Centred Privacy Standard:</span>
            <p>
              The elderly patient remains at the centre of care decisions. Family ties do not automatically confer access rights without explicit consent or documented legal directives. Access grants can be revoked with immediate effect.
            </p>
          </div>
        </div>

        {feedback && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-[#EAF4EE] border border-clinical-successBorder text-[#1B6346]'
              : 'bg-clinical-dangerBg border border-clinical-dangerBorder text-[#852D2D]'
          }`} role="status">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{feedback.type === 'success' ? 'Consent Update' : 'Notice'}</p>
              <p className="text-xs mt-0.5">{feedback.text}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Active Consent Records */}
          <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-subtleBorder pb-3">
              <div>
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <Lock className="h-4 w-4 text-secondary" />
                  Active Clinical Consent Grants
                </h3>
                <p className="text-xs text-secondaryText">Authorized scopes of personal health data sharing.</p>
              </div>
              <Badge variant="mint" size="sm">
                {consents.filter((c) => c.status === 'active').length} Active Grants
              </Badge>
            </div>

            <div className="space-y-3">
              {consents.map((consent) => {
                const isActive = consent.status === 'active';
                return (
                  <div
                    key={consent.id}
                    className={`p-4 rounded-xl border text-xs transition-all ${
                      isActive 
                        ? 'border-subtleBorder bg-canvas-background' 
                        : 'border-clinical-dangerBorder/50 bg-red-50/50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-main text-sm">{consent.granteeName}</span>
                          <span className="text-secondaryText">({consent.role})</span>
                          <Badge variant={isActive ? "mint" : "danger"} size="sm">
                            {isActive ? "Active Grant" : "Revoked"}
                          </Badge>
                        </div>
                        <p className="text-secondaryText">
                          Scope: <strong>{consent.scope}</strong> • Granted: {consent.grantedDate}
                        </p>
                        <p className="text-mutedText italic max-w-2xl">
                          &ldquo;{consent.purpose}&rdquo;
                        </p>
                      </div>

                      {isActive && (
                        <div className="shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => setRevokingId(consent.id)}
                            className="px-3 py-1.5 rounded-lg border border-clinical-dangerBorder text-[#852D2D] hover:bg-clinical-dangerBg text-xs font-semibold transition-colors touch-target-min"
                          >
                            Revoke Access
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Break Glass & Emergency EMS Access */}
          <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm space-y-4">
            <h3 className="text-base font-bold text-main border-b border-subtleBorder pb-3 flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Emergency & Break-Glass Audit Trail
            </h3>

            <p className="text-xs text-secondaryText leading-relaxed">
              In severe emergencies, verified first responders can bypass normal access controls using the encrypted emergency pass token. Every break-glass activation is tamper-evidently recorded.
            </p>

            <div className="p-4 rounded-xl bg-canvas-background border border-subtleBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-main block">Last Emergency Access Pass Generation:</span>
                <span className="text-secondaryText">Created for St. Jude Geriatric EMS • Valid through Dec 31, 2026</span>
              </div>
              <Link
                href="/timeline"
                className="inline-flex items-center gap-1.5 text-secondary font-semibold hover:underline"
              >
                <History className="h-3.5 w-3.5" />
                <span>View Access History</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Revocation Modal Dialog */}
        {revokingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-subtleBorder max-w-md w-full p-6 shadow-elevated relative">
              <button
                type="button"
                onClick={() => setRevokingId(null)}
                className="absolute right-4 top-4 text-secondaryText hover:text-main p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-lg font-bold text-main mb-1 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-clinical-danger" />
                Confirm Consent Revocation
              </h2>
              <p className="text-xs text-secondaryText mb-4 leading-relaxed">
                Revoking access will immediately prevent this member from viewing health records, prescriptions, and schedule details.
              </p>

              <div className="mb-4">
                <label htmlFor="revocationReason" className="block text-xs font-bold text-main mb-1.5">
                  Reason for Revocation (Mandatory for Audit Trail) *
                </label>
                <textarea
                  id="revocationReason"
                  rows={3}
                  required
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  placeholder="e.g. Caregiver contract concluded; or caregiver transferred to another facility."
                  className="w-full p-3 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRevokingId(null)}
                  className="px-4 py-2 rounded-xl border border-subtleBorder text-xs font-semibold text-secondaryText hover:bg-canvas-subtle touch-target-min"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRevokeConsent(revokingId)}
                  className="px-4 py-2 rounded-xl bg-clinical-danger text-white text-xs font-semibold hover:bg-red-700 shadow-sm touch-target-min"
                >
                  Confirm & Revoke Access
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
