'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Pill, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  History,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  getCachedMedications, 
  updateMedication 
} from '@/lib/data/medication-lifecycle-data';
import { MedicationRecord } from '@/types/caretrace';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditMedicationPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [medication, setMedication] = React.useState<MedicationRecord | null>(null);

  // Form Fields
  const [displayName, setDisplayName] = React.useState('');
  const [strengthText, setStrengthText] = React.useState('');
  const [prescribedInstructions, setPrescribedInstructions] = React.useState('');
  const [scheduledTimes, setScheduledTimes] = React.useState<string[]>(['08:00']);
  const [foodInstructions, setFoodInstructions] = React.useState('');
  const [refillsRemaining, setRefillsRemaining] = React.useState('1');
  const [refillDueDate, setRefillDueDate] = React.useState('');
  const [changeReason, setChangeReason] = React.useState('');
  
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const allMeds = getCachedMedications();
    const found = allMeds.find((m) => m.id === id);
    if (found) {
      setMedication(found);
      setDisplayName(found.displayName);
      setStrengthText(found.strengthText);
      setPrescribedInstructions(found.prescribedInstructions);
      setScheduledTimes([...found.scheduledTimes]);
      setFoodInstructions(found.foodInstructions || '');
      setRefillsRemaining(found.refillsRemaining.toString());
      setRefillDueDate(found.refillDueDate || '');
    }
  }, [id]);

  if (!medication) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Medication Not Found"
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Medications', href: '/medications' },
            { label: 'Edit' },
          ]}
        >
          <div className="p-8 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-4">
            <h2 className="text-lg font-semibold text-[var(--main-text)]">
              Prescription Record Not Found
            </h2>
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

  const handleAddTime = () => {
    if (scheduledTimes.length < 4) {
      setScheduledTimes([...scheduledTimes, '12:00']);
    }
  };

  const handleRemoveTime = (index: number) => {
    if (scheduledTimes.length > 1) {
      setScheduledTimes(scheduledTimes.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...scheduledTimes];
    updated[index] = val;
    setScheduledTimes(updated);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!displayName.trim()) errors.displayName = 'Medication name is required.';
    if (!strengthText.trim()) errors.strengthText = 'Strength is required.';
    if (!prescribedInstructions.trim()) errors.prescribedInstructions = 'Prescribed instructions are required.';
    if (!changeReason.trim() || changeReason.trim().length < 5) {
      errors.changeReason = 'A clinical change reason of at least 5 characters is mandatory for audit logging.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const user = USER_PERSPECTIVES[activeRole];

    const updated = updateMedication(
      medication.id,
      {
        displayName: displayName.trim(),
        strengthText: strengthText.trim(),
        prescribedInstructions: prescribedInstructions.trim(),
        scheduledTimes,
        foodInstructions: foodInstructions.trim() || undefined,
        refillsRemaining: parseInt(refillsRemaining, 10) || 0,
        refillDueDate: refillDueDate || undefined,
      },
      changeReason.trim(),
      user.sampleName,
      user.label
    );

    if (updated) {
      setSuccessMessage(`Prescription updated to Version v${updated.versionNumber}. Changes logged in audit trail.`);
      setTimeout(() => {
        router.push(`/medications/${medication.id}`);
      }, 1500);
    } else {
      setFormErrors({ submit: 'Failed to update medication record.' });
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={`Edit ${medication.displayName}`}
        description={`Modify prescription instructions, schedule times, or refills for Margaret Sullivan. A mandatory change reason will be appended to Version v${medication.versionNumber + 1}.`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications', href: '/medications' },
          { label: medication.displayName, href: `/medications/${medication.id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Link
            href={`/medications/${medication.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--secondary-text)]" />
            Back to Detail
          </Link>
        }
      >
        <MedicationsNavTabs />

        {/* Audit Versioning Notice */}
        <section aria-labelledby="versioning-notice-heading" className="p-4 mb-6 rounded-xl border border-teal-200 bg-teal-50/60 text-teal-950 flex items-start gap-3.5">
          <History className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <h2 id="versioning-notice-heading" className="font-semibold text-[var(--main-text)]">
              Auditable Version Increment (Target: v{medication.versionNumber + 1})
            </h2>
            <p className="text-[var(--secondary-text)]">
              Modifying this prescription does not overwrite Margaret&apos;s previous care history. Version v{medication.versionNumber} will remain accessible in the audit timeline, and all active care-circle members will be notified of instruction modifications.
            </p>
          </div>
        </section>

        {successMessage && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--main-text)] flex items-center gap-2">
                <Pill className="w-5 h-5 text-[var(--primary-teal)]" />
                Prescription Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Medication Name <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
                {formErrors.displayName && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.displayName}</p>
                )}
              </div>

              <div>
                <label htmlFor="strengthText" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Strength / Unit Dose <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="strengthText"
                  type="text"
                  required
                  value={strengthText}
                  onChange={(e) => setStrengthText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
                {formErrors.strengthText && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.strengthText}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="prescribedInstructions" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                Prescribed Instructions (SIG) <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <textarea
                id="prescribedInstructions"
                required
                rows={3}
                value={prescribedInstructions}
                onChange={(e) => setPrescribedInstructions(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
              />
              {formErrors.prescribedInstructions && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.prescribedInstructions}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Scheduled Daily Dose Times
                </label>
                <div className="space-y-2">
                  {scheduledTimes.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(idx, e.target.value)}
                        className="px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-sm text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
                      />
                      {scheduledTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {scheduledTimes.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddTime}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary-teal)] hover:text-[var(--primary-teal)] mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add dose time
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="foodInstructions" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Food & Intake Instructions
                </label>
                <input
                  id="foodInstructions"
                  type="text"
                  value={foodInstructions}
                  onChange={(e) => setFoodInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label htmlFor="refillsRemaining" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Refills Remaining
                </label>
                <input
                  id="refillsRemaining"
                  type="number"
                  min="0"
                  max="12"
                  value={refillsRemaining}
                  onChange={(e) => setRefillsRemaining(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="refillDueDate" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Refill Due Date
                </label>
                <input
                  id="refillDueDate"
                  type="date"
                  value={refillDueDate}
                  onChange={(e) => setRefillDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Change Reason Section */}
          <div className="p-6 rounded-2xl border-2 border-[var(--primary-teal)]/40 bg-[var(--soft-mint)]/20 shadow-sm space-y-4">
            <div>
              <label htmlFor="changeReason" className="block text-base font-bold text-[var(--primary-teal)] mb-1">
                Mandatory Clinical Change Reason <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <p className="text-xs text-[var(--secondary-text)] mb-2">
                Explain who requested this change and why (e.g. &ldquo;Cardiology follow-up titration&rdquo; or &ldquo;Updated pharmacy refill count&rdquo;). This text will be permanently recorded in Version v{medication.versionNumber + 1}.
              </p>
              <textarea
                id="changeReason"
                required
                rows={3}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="e.g. Dose adjusted per Dr. Vance phone consult following Feb 15 blood pressure reading."
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                aria-invalid={!!formErrors.changeReason}
                aria-describedby={formErrors.changeReason ? 'changeReason-error' : undefined}
              />
              {formErrors.changeReason && (
                <p id="changeReason-error" className="text-xs text-rose-600 mt-1 font-medium">
                  {formErrors.changeReason}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--subtle-border)]">
            <Link
              href={`/medications/${medication.id}`}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg border border-[var(--subtle-border)] text-[var(--secondary-text)] hover:bg-[var(--soft-mint)] text-center transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save as Version v{medication.versionNumber + 1}
            </button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
