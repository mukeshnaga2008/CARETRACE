'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Pill, 
  ArrowLeft, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  UserCheck, 
  HelpCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { addMedication } from '@/lib/data/medication-lifecycle-data';
import { MedicationRecord, MedicationSourceType, MedicationVerificationStatus } from '@/types/caretrace';

export default function AddMedicationPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  
  // Form State
  const [displayName, setDisplayName] = React.useState('');
  const [genericName, setGenericName] = React.useState('');
  const [strengthText, setStrengthText] = React.useState('');
  const [form, setForm] = React.useState('Tablet');
  const [routeText, setRouteText] = React.useState('Oral');
  const [prescribedInstructions, setPrescribedInstructions] = React.useState('');
  const [prescribingProvider, setPrescribingProvider] = React.useState('');
  const [pharmacy, setPharmacy] = React.useState('');
  const [rxNumber, setRxNumber] = React.useState('');
  const [refillsRemaining, setRefillsRemaining] = React.useState('2');
  const [refillDueDate, setRefillDueDate] = React.useState('');
  const [effectiveStartDate, setEffectiveStartDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduledTimes, setScheduledTimes] = React.useState<string[]>(['08:00']);
  const [sourceType, setSourceType] = React.useState<MedicationSourceType>('family_entered');
  const [sourceReference, setSourceReference] = React.useState('');
  const [foodInstructions, setFoodInstructions] = React.useState('');
  const [sideEffects, setSideEffects] = React.useState('');
  const [assignedMemberName, setAssignedMemberName] = React.useState('David Sullivan');
  const [notes, setNotes] = React.useState('');

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Time pill helpers
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
    if (!strengthText.trim()) errors.strengthText = 'Strength/dosage is required (e.g. 10mg).';
    if (!prescribedInstructions.trim()) errors.prescribedInstructions = 'Prescribed instruction text is required.';
    if (!effectiveStartDate) errors.effectiveStartDate = 'Start date is required.';
    if (scheduledTimes.some(t => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) {
      errors.scheduledTimes = 'Times must be valid 24-hour format (HH:MM).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Determine verification status based on source
      const isClinician = sourceType === 'physician_prescribed';
      const verificationStatus: MedicationVerificationStatus = isClinician ? 'verified' : 'awaiting_review';
      const initialStatus = isClinician ? 'active' : 'awaiting_verification';

      const newMed: MedicationRecord = {
        id: `med-${Date.now()}`,
        patientId: 'patient-profile-001',
        displayName: displayName.trim(),
        genericName: genericName.trim() || undefined,
        strengthText: strengthText.trim(),
        form,
        routeText,
        prescribedInstructions: prescribedInstructions.trim(),
        prescribingProvider: prescribingProvider.trim() || undefined,
        pharmacy: pharmacy.trim() || undefined,
        rxNumber: rxNumber.trim() || undefined,
        refillsRemaining: parseInt(refillsRemaining, 10) || 0,
        refillDueDate: refillDueDate || undefined,
        effectiveStartDate,
        sourceType,
        sourceReference: sourceReference.trim() || 'Prescription bottle label verified by family coordinator',
        verificationStatus,
        status: initialStatus,
        scheduledTimes,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        foodInstructions: foodInstructions.trim() || undefined,
        sideEffects: sideEffects ? sideEffects.split(',').map(s => s.trim()) : undefined,
        assignedMemberName,
        assignedMemberRole: 'Care Circle Coordinator',
        notes: notes.trim() || undefined,
        versionNumber: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to data store
      addMedication(newMed);

      setSuccessMessage(
        verificationStatus === 'verified'
          ? `Prescription for ${newMed.displayName} (${newMed.strengthText}) successfully activated and scheduled.`
          : `Prescription for ${newMed.displayName} added and placed in the Review Vault for clinical verification.`
      );

      setTimeout(() => {
        router.push(verificationStatus === 'awaiting_review' ? '/medications/review' : '/medications');
      }, 1800);
    } catch {
      setFormErrors({ submit: 'Failed to record medication. Please verify fields and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Add Medication Record"
        description="Enter prescription instructions, dosing schedule, source provenance, and pharmacy information for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications', href: '/medications' },
          { label: 'Add Medication' },
        ]}
        actions={
          <Link
            href="/medications"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--secondary-text)]" />
            Back to Medications
          </Link>
        }
      >
        <MedicationsNavTabs />

        {/* Clinical Safety Disclaimer */}
        <section aria-labelledby="clinical-safety-heading" className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 mb-6 flex gap-3.5 items-start">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <h2 id="clinical-safety-heading" className="font-semibold text-amber-950">
              Clinical Non-Prescribing Policy & Human Verification
            </h2>
            <p className="text-amber-800 leading-relaxed">
              CARETRACE does not formulate, calculate, or alter medical dosages. All medication entries must stem from an authentic prescription or human observation. Entries recorded by family or caregivers without immediate clinical provenance will be marked as <strong className="font-semibold">Awaiting Review</strong> until verified by a licensed clinician.
            </p>
          </div>
        </section>

        {successMessage && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{successMessage}</p>
          </div>
        )}

        {formErrors.submit && (
          <div role="alert" className="p-4 mb-6 rounded-xl border border-rose-300 bg-rose-50 text-rose-950 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-medium text-sm">{formErrors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Section 1: Prescription Details */}
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--main-text)] flex items-center gap-2">
                <Pill className="w-5 h-5 text-[var(--primary-teal)]" />
                1. Prescription Details
              </h2>
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Enter the medication name and precise strength exactly as printed on the pharmacy label.
              </p>
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
                  placeholder="e.g. Lisinopril, Atorvastatin, Metformin"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                  aria-invalid={!!formErrors.displayName}
                  aria-describedby={formErrors.displayName ? 'displayName-error' : undefined}
                />
                {formErrors.displayName && (
                  <p id="displayName-error" className="text-xs text-rose-600 mt-1 font-medium">
                    {formErrors.displayName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="genericName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Generic or Chemical Name <span className="text-xs font-normal text-[var(--secondary-text)]">(Optional)</span>
                </label>
                <input
                  id="genericName"
                  type="text"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Lisinopril USP"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
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
                  placeholder="e.g. 10mg, 2000 IU, 50mcg, 5mL"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                  aria-invalid={!!formErrors.strengthText}
                  aria-describedby={formErrors.strengthText ? 'strengthText-error' : undefined}
                />
                {formErrors.strengthText && (
                  <p id="strengthText-error" className="text-xs text-rose-600 mt-1 font-medium">
                    {formErrors.strengthText}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="form" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                    Dosage Form
                  </label>
                  <select
                    id="form"
                    value={form}
                    onChange={(e) => setForm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Injection">Injection</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Patch">Patch</option>
                    <option value="Drops">Eye/Ear Drops</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="routeText" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                    Administration Route
                  </label>
                  <select
                    id="routeText"
                    value={routeText}
                    onChange={(e) => setRouteText(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                  >
                    <option value="Oral">Oral (by mouth)</option>
                    <option value="Sublingual">Sublingual (under tongue)</option>
                    <option value="Topical">Topical (skin)</option>
                    <option value="Subcutaneous">Subcutaneous (injection)</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Ophthalmic">Ophthalmic (eyes)</option>
                  </select>
                </div>
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
                placeholder="e.g. Take 1 tablet by mouth once daily in the morning with a full glass of water."
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                aria-invalid={!!formErrors.prescribedInstructions}
                aria-describedby={formErrors.prescribedInstructions ? 'instructions-error' : undefined}
              />
              {formErrors.prescribedInstructions && (
                <p id="instructions-error" className="text-xs text-rose-600 mt-1 font-medium">
                  {formErrors.prescribedInstructions}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Timing & Schedule */}
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--main-text)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--primary-teal)]" />
                2. Administration Schedule
              </h2>
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Configure daily dose times to drive the idempotent adherence tracking engine.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="effectiveStartDate" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Start Date <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="effectiveStartDate"
                  type="date"
                  required
                  value={effectiveStartDate}
                  onChange={(e) => setEffectiveStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

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
                        aria-label={`Dose time ${idx + 1}`}
                      />
                      <span className="text-xs text-[var(--secondary-text)]">
                        {idx === 0 ? 'Morning' : idx === 1 ? 'Midday/Evening' : `Dose ${idx + 1}`}
                      </span>
                      {scheduledTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          aria-label={`Remove dose time ${idx + 1}`}
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
                      Add another daily dose time
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label htmlFor="foodInstructions" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Food & Intake Instructions
                </label>
                <input
                  id="foodInstructions"
                  type="text"
                  value={foodInstructions}
                  onChange={(e) => setFoodInstructions(e.target.value)}
                  placeholder="e.g. Take with breakfast; avoid grapefruit"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="sideEffects" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Side Effect Alerts <span className="text-xs font-normal text-[var(--secondary-text)]">(Comma separated)</span>
                </label>
                <input
                  id="sideEffects"
                  type="text"
                  value={sideEffects}
                  onChange={(e) => setSideEffects(e.target.value)}
                  placeholder="e.g. Dizziness upon standing, Dry cough"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Source Provenance & Verification */}
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--main-text)] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[var(--primary-teal)]" />
                3. Source Provenance & Care Circle Responsibility
              </h2>
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Record who is providing this instruction and designate the primary reminder coordinator.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sourceType" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Information Provenance
                </label>
                <select
                  id="sourceType"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as MedicationSourceType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                >
                  <option value="physician_prescribed">Physician Prescribed (Hospital / Clinic discharge or visit)</option>
                  <option value="family_entered">Family Member Entered (Coordinated by family)</option>
                  <option value="caregiver_entered">Caregiver Logged (Visiting nurse / aide record)</option>
                  <option value="patient_provided">Patient Self-Reported (Elderly patient account)</option>
                  <option value="imported_external">External Health Network Import (EHR FHIR feed)</option>
                </select>
                <p className="text-xs text-[var(--secondary-text)] mt-1.5">
                  {sourceType === 'physician_prescribed'
                    ? 'Records with physician provenance can be activated immediately.'
                    : 'Non-physician records will enter the Verification Vault for clinician review.'}
                </p>
              </div>

              <div>
                <label htmlFor="sourceReference" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Source Reference Document or Event
                </label>
                <input
                  id="sourceReference"
                  type="text"
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  placeholder="e.g. St. Jude Hospital Discharge #DS-2024-118, Pill bottle label"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="prescribingProvider" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Prescribing Physician / Specialist
                </label>
                <input
                  id="prescribingProvider"
                  type="text"
                  value={prescribingProvider}
                  onChange={(e) => setPrescribingProvider(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance, MD (Cardiology)"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="assignedMemberName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Assigned Care Circle Reminding Partner
                </label>
                <select
                  id="assignedMemberName"
                  value={assignedMemberName}
                  onChange={(e) => setAssignedMemberName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                >
                  <option value="David Sullivan">David Sullivan (Son & Family Coordinator)</option>
                  <option value="Sarah Jenkins, RN">Sarah Jenkins, RN (Visiting Home Nurse)</option>
                  <option value="Margaret Sullivan">Margaret Sullivan (Patient Self-Administers)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Pharmacy & Refills */}
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--main-text)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--primary-teal)]" />
                4. Pharmacy & Refill Tracking
              </h2>
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Refill details power the Care Gap Radar to prevent treatment interruptions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="pharmacy" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Dispensing Pharmacy
                </label>
                <input
                  id="pharmacy"
                  type="text"
                  value={pharmacy}
                  onChange={(e) => setPharmacy(e.target.value)}
                  placeholder="e.g. Walgreens #4821, (555) 234-5678"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="rxNumber" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Prescription Rx Number
                </label>
                <input
                  id="rxNumber"
                  type="text"
                  value={rxNumber}
                  onChange={(e) => setRxNumber(e.target.value)}
                  placeholder="e.g. RX-994101"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

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
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                Clinical Coordination Notes
              </label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Monitor blood pressure weekly; check with cardiologist at next follow-up."
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--subtle-border)]">
            <Link
              href="/medications"
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg border border-[var(--subtle-border)] text-[var(--secondary-text)] hover:bg-[var(--soft-mint)] text-center transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
            >
              Cancel & Return
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-teal)]"
            >
              {isSubmitting ? (
                <span>Recording Prescription...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Prescription Record
                </>
              )}
            </button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
