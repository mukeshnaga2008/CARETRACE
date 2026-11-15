'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Pill, 
  ArrowLeft, 
  Edit3, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  AlertCircle, 
  History, 
  UserCheck, 
  Building2, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  getCachedMedications, 
  getCachedVersions, 
  updateMedication 
} from '@/lib/data/medication-lifecycle-data';
import { MedicationRecord, MedicationVersion } from '@/types/caretrace';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MedicationDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');
  const [medication, setMedication] = React.useState<MedicationRecord | null>(null);
  const [versions, setVersions] = React.useState<MedicationVersion[]>([]);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);
  const [isDiscontinuing, setIsDiscontinuing] = React.useState(false);

  const loadData = React.useCallback(() => {
    const allMeds = getCachedMedications();
    const found = allMeds.find((m) => m.id === id);
    if (found) {
      setMedication({ ...found });
      const allVers = getCachedVersions().filter((v) => v.medicationId === id);
      setVersions(allVers.sort((a, b) => b.versionNumber - a.versionNumber));
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (!medication) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Medication Not Found"
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Medications', href: '/medications' },
            { label: 'Detail' },
          ]}
        >
          <div className="p-8 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <h2 className="text-lg font-semibold text-[var(--main-text)]">
              Prescription Record Not Found
            </h2>
            <p className="text-sm text-[var(--secondary-text)]">
              The medication record with ID <code className="bg-slate-100 px-1.5 py-0.5 rounded">{id}</code> could not be found or may have been archived.
            </p>
            <Link
              href="/medications"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-teal)] text-white text-sm font-semibold hover:bg-[var(--secondary-teal)] transition-colors"
            >
              Return to Medication Roster
            </Link>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const handleDiscontinue = () => {
    const user = USER_PERSPECTIVES[activeRole];
    const updated = updateMedication(
      medication.id,
      { status: 'discontinued' },
      'Medication discontinued by user request in care coordination portal.',
      user.sampleName,
      user.label
    );
    if (updated) {
      setMedication({ ...updated });
      setActionNotice(`Medication ${medication.displayName} has been marked as Discontinued.`);
      setIsDiscontinuing(false);
      loadData();
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={`${medication.displayName} ${medication.strengthText}`}
        description={`Prescription lifecycle, provenance audit, dosing schedules, and version history for Margaret Sullivan.`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications', href: '/medications' },
          { label: medication.displayName },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/medications"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--secondary-text)]" />
              Medication Roster
            </Link>
            <Link
              href={`/medications/${medication.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit Prescription
            </Link>
          </div>
        }
      >
        <MedicationsNavTabs />

        {actionNotice && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{actionNotice}</p>
          </div>
        )}

        {/* Verification Alert Banner if unverified */}
        {medication.verificationStatus === 'awaiting_review' && (
          <div className="p-4 mb-6 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-amber-950">
                  Instruction Awaiting Clinical Review (Version {medication.versionNumber})
                </p>
                <p className="text-amber-800">
                  This medication was recorded by an authorized family coordinator and is waiting for clinician review at Margaret's next cardiology appointment.
                </p>
              </div>
            </div>
            <Link
              href="/medications/review"
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-medium text-xs hover:bg-amber-700 transition-colors shrink-0"
            >
              Open Review Vault
            </Link>
          </div>
        )}

        {/* Prescription Overview Card */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--subtle-border)] pb-5">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-[var(--main-text)]">
                  {medication.displayName}
                </h2>
                <Badge variant={medication.status === 'active' ? 'success' : medication.status === 'awaiting_verification' ? 'warning' : 'neutral'}>
                  {medication.status === 'active' ? 'Active Prescription' : medication.status === 'awaiting_verification' ? 'Awaiting Verification' : medication.status}
                </Badge>
                <Badge variant={medication.verificationStatus === 'verified' ? 'success' : 'warning'}>
                  {medication.verificationStatus === 'verified' ? 'Verified by Clinician' : 'Awaiting Review'}
                </Badge>
              </div>
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                {medication.genericName ? `${medication.genericName} • ` : ''}{medication.form} • {medication.routeText} route • Version v{medication.versionNumber}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--secondary-text)]">
                Last modified: {new Date(medication.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Clinical Instruction (SIG) Callout */}
          <div className="p-4 rounded-xl border border-[var(--subtle-border)] bg-[var(--soft-mint)]/40 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary-teal)]">
              Prescribed Instruction (SIG)
            </span>
            <p className="text-base font-semibold text-[var(--main-text)] leading-relaxed">
              &ldquo;{medication.prescribedInstructions}&rdquo;
            </p>
          </div>

          {/* Key Prescription Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wider">
                Schedule & Times
              </span>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {medication.scheduledTimes.map((time, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {time} ({idx === 0 ? 'Morning' : 'Evening'})
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wider">
                Prescribing Physician
              </span>
              <p className="text-sm font-semibold text-[var(--main-text)] pt-1">
                {medication.prescribingProvider || 'Not specified'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wider">
                Assigned Reminding Partner
              </span>
              <div className="flex items-center gap-2 pt-1">
                <UserCheck className="w-4 h-4 text-[var(--primary-teal)]" />
                <span className="text-sm font-semibold text-[var(--main-text)]">
                  {medication.assignedMemberName || 'David Sullivan'}
                </span>
                <span className="text-xs text-[var(--secondary-text)]">
                  ({medication.assignedMemberRole || 'Family Care Coordinator'})
                </span>
              </div>
            </div>
          </div>

          {/* Pharmacy & Refill Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--subtle-border)]">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wider">
                Dispensing Pharmacy & Rx
              </span>
              <p className="text-sm text-[var(--main-text)]">
                {medication.pharmacy || 'Walgreens Pharmacy #4821'}
              </p>
              <p className="text-xs text-[var(--secondary-text)]">
                Rx Number: {medication.rxNumber || 'RX-994101'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wider">
                Refill Status
              </span>
              <p className="text-sm font-semibold text-[var(--main-text)]">
                {medication.refillsRemaining} refill{medication.refillsRemaining !== 1 ? 's' : ''} remaining
              </p>
              {medication.refillDueDate && (
                <p className="text-xs text-amber-700 font-medium">
                  Refill due by: {medication.refillDueDate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wider">
                Effective Timeline
              </span>
              <p className="text-sm text-[var(--main-text)]">
                Started: {medication.effectiveStartDate}
              </p>
              <p className="text-xs text-[var(--secondary-text)]">
                Status: {medication.effectiveEndDate ? `Ended ${medication.effectiveEndDate}` : 'Ongoing daily therapy'}
              </p>
            </div>
          </div>

          {/* Food and Side Effect Warnings */}
          {(medication.foodInstructions || (medication.sideEffects && medication.sideEffects.length > 0)) && (
            <div className="p-4 rounded-xl border border-[var(--subtle-border)] bg-slate-50 space-y-2">
              {medication.foodInstructions && (
                <p className="text-sm text-[var(--main-text)]">
                  <strong className="font-semibold text-[var(--secondary-teal)]">Food & Intake: </strong>
                  {medication.foodInstructions}
                </p>
              )}
              {medication.sideEffects && medication.sideEffects.length > 0 && (
                <p className="text-sm text-[var(--main-text)]">
                  <strong className="font-semibold text-rose-700">Side Effect Warnings: </strong>
                  {medication.sideEffects.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Source Provenance Info */}
          <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/50 flex items-start gap-3">
            <FileText className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-[var(--main-text)]">
                Instruction Provenance & Authority
              </p>
              <p className="text-xs text-[var(--secondary-text)]">
                Source: <span className="font-medium text-[var(--main-text)]">{medication.sourceType.replace('_', ' ')}</span>
                {medication.sourceReference ? ` • Document: ${medication.sourceReference}` : ''}
              </p>
              {medication.verifiedByName && (
                <p className="text-xs text-emerald-800 font-medium">
                  Clinically verified by: {medication.verifiedByName} on {new Date(medication.verifiedAt || '').toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Auditable Version History Timeline */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--subtle-border)] pb-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--main-text)] flex items-center gap-2">
                <History className="w-5 h-5 text-[var(--primary-teal)]" />
                Auditable Version History
              </h2>
              <p className="text-sm text-[var(--secondary-text)] mt-0.5">
                Every modification to prescribed instructions creates an immutable version log with required reason.
              </p>
            </div>
            <Badge variant="neutral">
              {versions.length} recorded version{versions.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-4">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="p-4 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-[var(--primary-teal)] bg-white px-2 py-0.5 rounded border border-[var(--subtle-border)]">
                      Version v{ver.versionNumber}
                    </span>
                    <span className="text-xs font-semibold text-[var(--main-text)]">
                      {ver.displayName} ({ver.strengthText})
                    </span>
                    <Badge variant={ver.verificationStatus === 'verified' ? 'success' : 'warning'}>
                      {ver.verificationStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--main-text)] italic">
                    &ldquo;{ver.prescribedInstructions}&rdquo;
                  </p>
                  <p className="text-xs text-[var(--secondary-text)]">
                    <strong className="text-[var(--main-text)]">Reason:</strong> {ver.changeReason}
                  </p>
                </div>

                <div className="text-left md:text-right text-xs text-[var(--secondary-text)] shrink-0 space-y-0.5">
                  <p className="font-medium text-[var(--main-text)]">
                    {ver.changedByName}
                  </p>
                  <p>{ver.changedByRole}</p>
                  <p>{new Date(ver.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discontinue / Archive Safety Section */}
        {medication.status === 'active' && (
          <div className="mt-8 p-6 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-rose-950">
                Discontinue Medication Record
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Discontinuing removes future scheduled doses while strictly preserving historical adherence logs and audit versions.
              </p>
            </div>

            {isDiscontinuing ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDiscontinuing(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--subtle-border)] bg-white text-xs font-medium text-[var(--main-text)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDiscontinue}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
                >
                  Confirm Discontinue
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsDiscontinuing(true)}
                className="px-4 py-2 rounded-lg border border-rose-300 bg-white text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors shrink-0"
              >
                Discontinue Therapy
              </button>
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
