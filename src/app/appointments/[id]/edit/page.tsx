'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  ArrowLeft, 
  Clock, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  History,
  Car
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  getCachedAppointments, 
  updateAppointment 
} from '@/lib/data/appointment-intelligence-data';
import { AppointmentRecord, AppointmentType } from '@/types/caretrace';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditAppointmentPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [appointment, setAppointment] = React.useState<AppointmentRecord | null>(null);

  // Form Fields
  const [title, setTitle] = React.useState('');
  const [appointmentType, setAppointmentType] = React.useState<AppointmentType>('doctor_consultation');
  const [providerName, setProviderName] = React.useState('');
  const [clinicName, setClinicName] = React.useState('');
  const [departmentOrSpecialty, setDepartmentOrSpecialty] = React.useState('');
  const [locationText, setLocationText] = React.useState('');
  const [appointmentDate, setAppointmentDate] = React.useState('');
  const [appointmentTime, setAppointmentTime] = React.useState('');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = React.useState('45');
  const [preparationNotes, setPreparationNotes] = React.useState('');
  const [assignedAccompanyingName, setAssignedAccompanyingName] = React.useState('David Sullivan');
  const [transportationNeeded, setTransportationNeeded] = React.useState(true);
  const [changeReason, setChangeReason] = React.useState('');

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const all = getCachedAppointments();
    const appt = all.find((a) => a.id === id);
    if (appt) {
      setAppointment(appt);
      setTitle(appt.title);
      setAppointmentType(appt.appointmentType || 'doctor_consultation');
      setProviderName(appt.providerName);
      setClinicName(appt.clinicName || appt.facility || '');
      setDepartmentOrSpecialty(appt.departmentOrSpecialty || appt.specialty || '');
      setLocationText(appt.locationText || appt.locationAddress || '');

      const dt = appt.appointmentDatetime || appt.appointmentDate || '';
      if (dt.includes('T')) {
        const parts = dt.split('T');
        setAppointmentDate(parts[0]);
        setAppointmentTime(parts[1].substring(0, 5));
      }
      setEstimatedDurationMinutes((appt.estimatedDurationMinutes || appt.durationMinutes || 45).toString());
      setPreparationNotes(appt.preparationNotes || appt.preparationInstructions || '');
      setAssignedAccompanyingName(appt.assignedAccompanyingName || appt.companionName || 'David Sullivan');
      setTransportationNeeded(appt.transportationNeeded ?? appt.transportNeeded ?? true);
    }
  }, [id]);

  if (!appointment) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Appointment Not Found"
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Appointments', href: '/appointments' },
            { label: 'Edit' },
          ]}
        >
          <div className="p-8 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-4">
            <h2 className="text-lg font-bold text-[var(--main-text)]">
              Appointment Record Not Found
            </h2>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-teal)] text-white text-sm font-semibold hover:bg-[var(--secondary-teal)] transition-colors"
            >
              Return to Appointment List
            </Link>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Title is required.';
    if (!providerName.trim()) errors.providerName = 'Provider name is required.';
    if (!clinicName.trim()) errors.clinicName = 'Clinic name is required.';
    if (!appointmentDate) errors.appointmentDate = 'Date is required.';
    if (!appointmentTime) errors.appointmentTime = 'Time is required.';
    if (!changeReason.trim() || changeReason.trim().length < 5) {
      errors.changeReason = 'A clinical change reason of at least 5 characters is mandatory for audit logging.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const user = USER_PERSPECTIVES[activeRole];

    const datetimeStr = `${appointmentDate}T${appointmentTime}:00`;

    const updated = updateAppointment(
      appointment.id,
      {
        title: title.trim(),
        appointmentType,
        providerName: providerName.trim(),
        clinicName: clinicName.trim(),
        departmentOrSpecialty: departmentOrSpecialty.trim() || undefined,
        locationText: locationText.trim() || undefined,
        appointmentDatetime: datetimeStr,
        appointmentDate: datetimeStr,
        estimatedDurationMinutes: parseInt(estimatedDurationMinutes, 10) || 45,
        preparationNotes: preparationNotes.trim() || undefined,
        assignedAccompanyingName,
        transportationNeeded,
      },
      changeReason.trim(),
      user.sampleName,
      user.label
    );

    if (updated) {
      setSuccessMessage('Appointment changes successfully saved and recorded in audit history.');
      setTimeout(() => {
        router.push(`/appointments/${appointment.id}`);
      }, 1500);
    } else {
      setFormErrors({ submit: 'Failed to update appointment record.' });
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={`Edit ${appointment.title}`}
        description={`Modify visit details, reschedule appointment time, or update escort logistics for Margaret Sullivan.`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: appointment.title, href: `/appointments/${appointment.id}` },
          { label: 'Edit' },
        ]}
        actions={
          <Link
            href={`/appointments/${appointment.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--secondary-text)]" />
            Back to Detail
          </Link>
        }
      >
        <AppointmentsNavTabs />

        {/* Audit Versioning Notice */}
        <div className="p-4 mb-6 rounded-xl border border-teal-200 bg-teal-50/60 text-teal-950 flex items-start gap-3.5">
          <History className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
          <div className="text-sm space-y-0.5">
            <h2 className="font-semibold text-[var(--main-text)]">
              Auditable Rescheduling & Modification
            </h2>
            <p className="text-xs text-[var(--secondary-text)]">
              Changes to appointment date, time, or provider are permanently recorded with your mandatory reason. Previous appointment history is preserved for medical continuity.
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
          <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-6">
            <div className="border-b border-[var(--subtle-border)] pb-4">
              <h2 className="text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--primary-teal)]" />
                Visit Details
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
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
                {formErrors.title && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.title}</p>}
              </div>

              <div>
                <label htmlFor="appointmentType" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Category
                </label>
                <select
                  id="appointmentType"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                >
                  <option value="doctor_consultation">Doctor Consultation</option>
                  <option value="follow_up">Follow-up Visit</option>
                  <option value="diagnostic_visit">Diagnostic / Lab Work</option>
                  <option value="therapy_appointment">Physical / Rehab Therapy</option>
                  <option value="hospital_visit">Hospital Outpatient</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="providerName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Doctor / Provider <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="providerName"
                  type="text"
                  required
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="clinicName" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Clinic or Hospital <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="clinicName"
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Date <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="appointmentDate"
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label htmlFor="appointmentTime" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                  Time (24-hour) <span className="text-rose-600" aria-hidden="true">*</span>
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
            </div>

            <div>
              <label htmlFor="preparationNotes" className="block text-sm font-semibold text-[var(--main-text)] mb-1">
                Preparation Notes
              </label>
              <textarea
                id="preparationNotes"
                rows={2}
                value={preparationNotes}
                onChange={(e) => setPreparationNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
              />
            </div>
          </div>

          {/* Mandatory Change Reason Section */}
          <div className="p-6 rounded-2xl border-2 border-[var(--primary-teal)]/40 bg-[var(--soft-mint)]/20 shadow-sm space-y-4">
            <div>
              <label htmlFor="changeReason" className="block text-base font-bold text-[var(--primary-teal)] mb-1">
                Mandatory Change / Reschedule Reason <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <p className="text-xs text-[var(--secondary-text)] mb-2">
                Provide a clear justification for this change (e.g. &ldquo;Rescheduled by clinic due to doctor surgery schedule&rdquo; or &ldquo;Updated driver companion&rdquo;). This is logged in the permanent audit trail.
              </p>
              <textarea
                id="changeReason"
                required
                rows={3}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="e.g. Rescheduled from Feb 15 to Feb 20 to allow fasting blood draw on the same morning."
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] text-sm focus:ring-2 focus:ring-[var(--primary-teal)]"
                aria-invalid={!!formErrors.changeReason}
              />
              {formErrors.changeReason && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.changeReason}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--subtle-border)]">
            <Link
              href={`/appointments/${appointment.id}`}
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
              Save Modifications
            </button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
