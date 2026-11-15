'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  UserCheck, 
  Pill, 
  FileText, 
  Check, 
  X, 
  ArrowRight,
  Info
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  getCachedMedications, 
  verifyMedicationRecord 
} from '@/lib/data/medication-lifecycle-data';
import { MedicationRecord } from '@/types/caretrace';

export default function MedicationReviewVaultPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('caregiver');
  const [pendingMeds, setPendingMeds] = React.useState<MedicationRecord[]>([]);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  // Clarification modal state
  const [activeClarificationId, setActiveClarificationId] = React.useState<string | null>(null);
  const [clarificationText, setClarificationText] = React.useState('');

  const loadData = React.useCallback(() => {
    const all = getCachedMedications();
    const filtered = all.filter(
      (m) => m.verificationStatus === 'awaiting_review' || m.verificationStatus === 'needs_clarification'
    );
    setPendingMeds([...filtered]);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerify = (medId: string, medName: string) => {
    const user = USER_PERSPECTIVES[activeRole];
    const res = verifyMedicationRecord(
      medId,
      'verified',
      user.sampleName,
      user.label
    );

    if (res) {
      setActionNotice(`Prescription for ${medName} has been verified by ${user.sampleName} (${user.label}) and is now active.`);
      loadData();
      setTimeout(() => setActionNotice(null), 4500);
    }
  };

  const handleRequestClarification = (medId: string, medName: string) => {
    if (!clarificationText.trim()) return;

    const user = USER_PERSPECTIVES[activeRole];
    const res = verifyMedicationRecord(
      medId,
      'needs_clarification',
      user.sampleName,
      user.label,
      clarificationText.trim()
    );

    if (res) {
      setActionNotice(`Clarification request logged for ${medName}. Notified family care circle.`);
      setActiveClarificationId(null);
      setClarificationText('');
      loadData();
      setTimeout(() => setActionNotice(null), 4500);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Medication Verification Vault"
        description="Clinical review queue for medications recorded by family or caregivers requiring physician validation."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications', href: '/medications' },
          { label: 'Review Vault' },
        ]}
      >
        <MedicationsNavTabs />

        {actionNotice && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{actionNotice}</p>
          </div>
        )}

        {/* Clinical Guardrail Explanation */}
        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50/70 mb-6 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <h2 className="font-semibold text-amber-950">
              Clinical Non-Prescribing Governance
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              To protect elderly patient safety, CARETRACE segregates unconfirmed dietary supplements and OTC entries entered by family members from physician-prescribed orders until an authorized clinician reviews and marks them verified.
            </p>
          </div>
        </div>

        {/* Review Queue Items */}
        {pendingMeds.length === 0 ? (
          <div className="p-12 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-4">
            <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-[var(--main-text)]">
              All Medication Instructions Verified
            </h3>
            <p className="text-sm text-[var(--secondary-text)] max-w-md mx-auto">
              There are currently no unverified prescriptions or pending family additions requiring clinical review for Margaret Sullivan.
            </p>
            <Link
              href="/medications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-teal)] text-white text-sm font-semibold hover:bg-[var(--secondary-teal)] transition-colors"
            >
              Return to Medication Roster
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--main-text)]">
                Items Requiring Review ({pendingMeds.length})
              </h2>
              <span className="text-xs text-[var(--secondary-text)]">
                Reviewing as: <strong className="text-[var(--main-text)]">{USER_PERSPECTIVES[activeRole].sampleName}</strong> ({USER_PERSPECTIVES[activeRole].label})
              </span>
            </div>

            {pendingMeds.map((med) => (
              <div
                key={med.id}
                className="p-6 rounded-2xl border-2 border-amber-200 bg-[var(--white-surface)] shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-xl font-bold text-[var(--main-text)]">
                        {med.displayName} ({med.strengthText})
                      </h3>
                      <Badge variant="warning">
                        {med.verificationStatus === 'needs_clarification' ? 'Clarification Requested' : 'Awaiting Clinical Review'}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--secondary-text)]">
                      {med.form} • Route: {med.routeText} • Scheduled Daily at: {med.scheduledTimes.join(', ')}
                    </p>
                  </div>

                  <span className="text-xs text-[var(--secondary-text)]">
                    Recorded {new Date(med.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Instruction Callout */}
                <div className="p-4 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)] space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary-teal)]">
                    Reported Instructions
                  </span>
                  <p className="text-sm font-semibold text-[var(--main-text)]">
                    &ldquo;{med.prescribedInstructions}&rdquo;
                  </p>
                </div>

                {/* Provenance & Coordinator Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[var(--secondary-text)]">
                  <div className="p-3 rounded-lg border border-[var(--subtle-border)] bg-slate-50 space-y-1">
                    <strong className="block text-[var(--main-text)]">Entered by Care Circle Coordinator:</strong>
                    <p>{med.assignedMemberName || 'David Sullivan'} ({med.assignedMemberRole || 'Family Coordinator'})</p>
                    <p className="italic">Note: {med.notes || 'No notes provided'}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--subtle-border)] bg-slate-50 space-y-1">
                    <strong className="block text-[var(--main-text)]">Source Provenance:</strong>
                    <p>{med.sourceType.replace('_', ' ')}</p>
                    <p>{med.sourceReference || 'Over-the-counter retail bottle'}</p>
                  </div>
                </div>

                {/* Clinical Review Actions */}
                <div className="pt-2 border-t border-[var(--subtle-border)] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerify(med.id, med.displayName)}
                      className="px-5 py-2.5 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)] flex items-center gap-2 shadow-sm transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
                    >
                      <Check className="w-4 h-4" />
                      Verify Instructions as Clinician
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveClarificationId(med.id)}
                      className="px-4 py-2.5 rounded-lg border border-amber-300 bg-white text-amber-800 text-xs font-semibold hover:bg-amber-50 flex items-center gap-2 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Request Clarification
                    </button>
                  </div>

                  <Link
                    href={`/medications/${med.id}`}
                    className="text-xs font-semibold text-[var(--secondary-teal)] hover:underline flex items-center gap-1"
                  >
                    View Full Profile &rarr;
                  </Link>
                </div>

                {/* Clarification Input Box */}
                {activeClarificationId === med.id && (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                    <label className="block text-xs font-bold text-amber-950">
                      Specify Clinical Clarification Required:
                    </label>
                    <textarea
                      rows={2}
                      value={clarificationText}
                      onChange={(e) => setClarificationText(e.target.value)}
                      placeholder="e.g. Please confirm whether cardiologist Dr. Vance approved CoQ10 100mg alongside Lisinopril."
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveClarificationId(null)}
                        className="px-3 py-1.5 text-xs text-amber-900 hover:underline"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestClarification(med.id, med.displayName)}
                        className="px-4 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors"
                      >
                        Submit Clarification Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
