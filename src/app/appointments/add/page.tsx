'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  ArrowLeft, 
  Clock, 
  MapPin, 
  UserCheck, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Building2,
  Phone,
  FileText
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { addAppointment } from '@/lib/data/appointment-intelligence-data';
import { AppointmentRecord, AppointmentType } from '@/types/caretrace';

export default function AddAppointmentPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');

  // Form State
  const [title, setTitle] = React.useState('');
  const [appointmentType, setAppointmentType] = React.useState<AppointmentType>('doctor_consultation');
  const [providerName, setProviderName] = React.useState('');
  const [clinicName, setClinicName] = React.useState('');
  const [departmentOrSpecialty, setDepartmentOrSpecialty] = React.useState('');
  const [locationText, setLocationText] = React.useState('');
  const [appointmentDate, setAppointmentDate] = React.useState('');
  const [appointmentTime, setAppointmentTime] = React.useState('10:00');
  const [timezone, setTimezone] = React.useState('America/Chicago');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = React.useState('45');
  const [bookingReference, setBookingReference] = React.useState('');
  const [contactInformation, setContactInformation] = React.useState('');
  const [preparationNotes, setPreparationNotes] = React.useState('');
  const [assignedAccompanyingName, setAssignedAccompanyingName] = React.useState('David Sullivan');
  const [transportationNeeded, setTransportationNeeded] = React.useState(true);

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) errors.title = 'Title must be at least 3 characters.';
    if (!providerName.trim()) errors.providerName = 'Doctor or provider name is required.';
    if (!clinicName.trim()) errors.clinicName = 'Clinic or facility name is required.';
    if (!appointmentDate) errors.appointmentDate = 'Appointment date is required.';
    if (!appointmentTime) errors.appointmentTime = 'Appointment time is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const user = USER_PERSPECTIVES[activeRole];

    try {
      const datetimeStr = `${appointmentDate}T${appointmentTime}:00`;

      const newAppointment: AppointmentRecord = {
        id: `appt-${Date.now()}`,
        patientId: 'patient-profile-001',
        title: title.trim(),
        appointmentType,
        providerName: providerName.trim(),
        clinicName: clinicName.trim(),
        departmentOrSpecialty: departmentOrSpecialty.trim() || undefined,
        locationText: locationText.trim() || undefined,
        appointmentDatetime: datetimeStr,
        timezone,
        estimatedDurationMinutes: parseInt(estimatedDurationMinutes, 10) || 45,
        appointmentStatus: 'confirmed',
        bookingReference: bookingReference.trim() || undefined,
        contactInformation: contactInformation.trim() || undefined,
        preparationNotes: preparationNotes.trim() || undefined,
        assignedAccompanyingName,
        assignedAccompanyingRole: assignedAccompanyingName === 'David Sullivan' ? 'Son & Care Coordinator' : 'Visiting Home Nurse',
        transportationNeeded,
        createdBy: user.sampleName,
        updatedBy: user.sampleName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        facility: clinicName.trim(),
        specialty: departmentOrSpecialty.trim() || 'General',
        locationAddress: locationText.trim(),
        appointmentDate: datetimeStr,
        durationMinutes: parseInt(estimatedDurationMinutes, 10) || 45,
        transportNeeded: transportationNeeded,
        companionName: assignedAccompanyingName,
        status: 'confirmed',
      };

      addAppointment(newAppointment);

      setSuccessMessage(`Appointment with ${newAppointment.providerName} successfully scheduled and shared with Margaret's Care Circle.`);
      setTimeout(() => {
        router.push(`/appointments/${newAppointment.id}`);
      }, 1500);
    } catch {
      setFormErrors({ submit: 'Failed to record appointment. Please check inputs and try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Schedule Clinical Visit"
        description="Register a doctor visit, clinic consultation, or therapy intake for Margaret Sullivan with timezone coordination."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: 'Schedule Visit' },
        ]}
        actions={
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--secondary-text)]" />
            Back to Appointments
          </Link>
        }
      >
        <AppointmentsNavTabs />

        {/* Clinical Disclaimer */}
        <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/70 text-teal-950 mb-6 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
          <div className="text-sm space-y-0.5">
            <h2 className="font-semibold text-[var(--main-text)]">
              Factual Appointment Coordination
            </h2>
            <p className="text-xs text-[var(--secondary-text)]">
              Scheduling an appointment coordinates family transportation, visit reminders, and preparation questions. CARETRACE does not prescribe clinical regimens or replace direct provider scheduling systems.
            </p>
          </div>
        </div>

        {successMessage && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Section 1: Visit Details */}
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--primary-teal)]" />
                1. Visit Details & Healthcare Provider
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Appointment Title <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cardiology Follow-up, Annual Wellness Review"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                  aria-invalid={!!formErrors.title}
                />
                {formErrors.title && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.title}</p>}
              </div>

              <div>
                <label htmlFor="appointmentType" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Appointment Category
                </label>
                <select
                  id="appointmentType"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                >
                  <option value="doctor_consultation">Doctor Consultation (General / Primary)</option>
                  <option value="follow_up">Follow-up Visit (Specialist / Cardiology)</option>
                  <option value="diagnostic_visit">Diagnostic Visit (Lab Work / Imaging / Blood draw)</option>
                  <option value="therapy_appointment">Therapy Appointment (Physical / Occupational / Speech)</option>
                  <option value="hospital_visit">Hospital Outpatient / Pre-op Review</option>
                  <option value="other">Other Specialist Consult</option>
                </select>
              </div>

              <div>
                <label htmlFor="providerName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Doctor / Healthcare Provider <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="providerName"
                  type="text"
                  required
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance, MD"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
                {formErrors.providerName && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.providerName}</p>}
              </div>

              <div>
                <label htmlFor="departmentOrSpecialty" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Department / Specialty
                </label>
                <input
                  id="departmentOrSpecialty"
                  type="text"
                  value={departmentOrSpecialty}
                  onChange={(e) => setDepartmentOrSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology, Geriatrics, Physical Therapy"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="clinicName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Clinic or Hospital Name <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="clinicName"
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Metropolitan Heart Centre"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
                {formErrors.clinicName && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.clinicName}</p>}
              </div>

              <div>
                <label htmlFor="locationText" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Location / Suite Address
                </label>
                <input
                  id="locationText"
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g. Suite 300, 450 Health Parkway, Springfield, IL"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Date, Time & Timezone Handling */}
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--primary-teal)]" />
                2. Scheduling & Explicit Timezone
              </h2>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                All appointments are pinned to Margaret&apos;s home timezone (Central Time) to ensure medication and transport synchronization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Appointment Date <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="appointmentDate"
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
                {formErrors.appointmentDate && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.appointmentDate}</p>}
              </div>

              <div>
                <label htmlFor="appointmentTime" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Appointment Time <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="appointmentTime"
                  type="time"
                  required
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                >
                  <option value="America/Chicago">America/Chicago (CST / Central)</option>
                  <option value="America/New_York">America/New_York (EST / Eastern)</option>
                  <option value="America/Denver">America/Denver (MST / Mountain)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST / Pacific)</option>
                </select>
              </div>

              <div>
                <label htmlFor="estimatedDurationMinutes" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Estimated Duration
                </label>
                <select
                  id="estimatedDurationMinutes"
                  value={estimatedDurationMinutes}
                  onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Escort, Care Circle & Transport */}
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <Car className="w-5 h-5 text-[var(--primary-teal)]" />
                3. Care Circle Companion & Logistics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="assignedAccompanyingName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Accompanying Family or Caregiver
                </label>
                <select
                  id="assignedAccompanyingName"
                  value={assignedAccompanyingName}
                  onChange={(e) => setAssignedAccompanyingName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                >
                  <option value="David Sullivan">David Sullivan (Son & Family Coordinator)</option>
                  <option value="Sarah Jenkins, RN">Sarah Jenkins, RN (Visiting Home Nurse)</option>
                  <option value="Margaret Sullivan (Independent)">Patient Attending Independently</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  id="transportationNeeded"
                  type="checkbox"
                  checked={transportationNeeded}
                  onChange={(e) => setTransportationNeeded(e.target.checked)}
                  className="w-5 h-5 rounded text-[var(--primary-teal)] focus:ring-[var(--primary-teal)]"
                />
                <label htmlFor="transportationNeeded" className="text-sm font-semibold text-[var(--main-text)]">
                  Vehicle transport needed (Companion will pick up and escort Margaret)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label htmlFor="bookingReference" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Booking Reference / Confirmation Code
                </label>
                <input
                  id="bookingReference"
                  type="text"
                  value={bookingReference}
                  onChange={(e) => setBookingReference(e.target.value)}
                  placeholder="e.g. MHC-99214"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="contactInformation" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Clinic Phone / Direct Contact
                </label>
                <input
                  id="contactInformation"
                  type="text"
                  value={contactInformation}
                  onChange={(e) => setContactInformation(e.target.value)}
                  placeholder="e.g. (555) 789-2345"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="preparationNotes" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                Preparation Instructions & Fasting Notes
              </label>
              <textarea
                id="preparationNotes"
                rows={2}
                value={preparationNotes}
                onChange={(e) => setPreparationNotes(e.target.value)}
                placeholder="e.g. Fasting required 2 hours prior for lab draw; bring current blood pressure log and reading glasses."
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--subtle-border)]">
            <Link
              href="/appointments"
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg border border-[var(--subtle-border)] text-[var(--secondary-text)] hover:bg-[var(--soft-mint)] text-center transition-colors"
            >
              Cancel & Return
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Schedule Visit
            </button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
