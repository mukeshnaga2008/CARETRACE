'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  UserCheck, 
  Car, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  ArrowRight,
  ShieldAlert,
  ClipboardList,
  CheckSquare
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/constants';
import { 
  getCachedAppointments, 
  getCachedPreparationItems, 
  getCachedFollowUpTasks 
} from '@/lib/data/appointment-intelligence-data';
import { AppointmentRecord, AppointmentPreparationItem, AppointmentFollowUpTask } from '@/types/caretrace';

export default function AppointmentsOverviewPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([]);
  const [prepItems, setPrepItems] = React.useState<AppointmentPreparationItem[]>([]);
  const [tasks, setTasks] = React.useState<AppointmentFollowUpTask[]>([]);

  React.useEffect(() => {
    setAppointments(getCachedAppointments());
    setPrepItems(getCachedPreparationItems());
    setTasks(getCachedFollowUpTasks());
  }, []);

  const now = new Date();

  // Metrics calculation
  const upcomingAppointments = appointments
    .filter((a) => a.appointmentStatus !== 'completed' && a.appointmentStatus !== 'cancelled')
    .sort((a, b) => new Date(a.appointmentDatetime || '').getTime() - new Date(b.appointmentDatetime || '').getTime());

  const nextAppt = upcomingAppointments[0];
  const confirmedCount = appointments.filter((a) => a.appointmentStatus === 'confirmed').length;
  const pendingTasksCount = tasks.filter((t) => t.taskStatus !== 'completed' && t.taskStatus !== 'cancelled').length;
  const completedVisitsCount = appointments.filter((a) => a.appointmentStatus === 'completed').length;

  const awaitingConfirmationAppts = appointments.filter((a) => a.appointmentStatus === 'awaiting_confirmation');
  const prepRequiredAppts = appointments.filter((a) => a.preparationNotes && a.appointmentStatus !== 'completed' && a.appointmentStatus !== 'cancelled');

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Appointment Intelligence Centre"
        description="Clinician visit coordination, escort transport planning, visit agenda preparation, and post-consultation follow-up tracking for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/appointments/calendar"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
            >
              <CalendarIcon className="w-4 h-4 text-[var(--secondary-text)]" />
              Calendar View
            </Link>
            <Link
              href="/appointments/add"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-teal)]"
            >
              <Plus className="w-4 h-4" />
              Schedule Visit
            </Link>
          </div>
        }
      >
        <AppointmentsNavTabs />

        {/* Clinical Disclaimer */}
        <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/60 mb-6 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
          <div className="text-sm space-y-0.5">
            <h2 className="font-semibold text-[var(--main-text)]">
              Appointment Coordination & Clinical Boundary
            </h2>
            <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
              CARETRACE organizes logistics, question agendas, and follow-up responsibilities for Margaret&apos;s care circle. It does not provide medical diagnoses, treatment plans, or alter medication regimens without verified clinician orders.
            </p>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text)]">
              Upcoming Visits
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--primary-teal)]">
                {upcomingAppointments.length}
              </span>
              <span className="text-xs text-[var(--secondary-text)]">scheduled</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text)]">
              Confirmed Visits
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700">
                {confirmedCount}
              </span>
              <span className="text-xs text-emerald-800">ready</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text)]">
              Pending Follow-ups
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-700">
                {pendingTasksCount}
              </span>
              <span className="text-xs text-amber-800">tasks active</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text)]">
              Completed Visits
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-700">
                {completedVisitsCount}
              </span>
              <span className="text-xs text-slate-600">recorded</span>
            </div>
          </div>
        </div>

        {/* Next Appointment Hero Card */}
        {nextAppt && (
          <div className="p-6 rounded-2xl border-2 border-[var(--primary-teal)]/30 bg-[var(--soft-mint)]/20 shadow-sm mb-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--primary-teal)] text-white shadow-xs">
                  Next Scheduled Visit
                </span>
                <h3 className="text-2xl font-bold text-[var(--main-text)] mt-2">
                  {nextAppt.title}
                </h3>
                <p className="text-sm font-semibold text-[var(--secondary-teal)]">
                  {nextAppt.providerName} &bull; {nextAppt.clinicName}
                </p>
              </div>

              <Badge variant={nextAppt.appointmentStatus === 'confirmed' ? 'success' : 'warning'}>
                {nextAppt.appointmentStatus === 'confirmed' ? 'Confirmed Visit' : 'Awaiting Confirmation'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold uppercase text-[var(--secondary-text)]">Date & Time</span>
                  <span className="text-sm font-bold text-[var(--main-text)]">
                    {new Date(nextAppt.appointmentDatetime || '').toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="block text-xs text-[var(--secondary-text)]">
                    {new Date(nextAppt.appointmentDatetime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({nextAppt.timezone || 'Central Time'}) &bull; {nextAppt.estimatedDurationMinutes} mins
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold uppercase text-[var(--secondary-text)]">Location</span>
                  <span className="text-sm font-semibold text-[var(--main-text)]">
                    {nextAppt.clinicName}
                  </span>
                  <span className="block text-xs text-[var(--secondary-text)]">
                    {nextAppt.locationText || 'Clinic address on file'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold uppercase text-[var(--secondary-text)]">Care Circle Escort</span>
                  <span className="text-sm font-semibold text-[var(--main-text)]">
                    {nextAppt.assignedAccompanyingName || 'David Sullivan'}
                  </span>
                  <span className="block text-xs text-emerald-700 font-medium">
                    {nextAppt.transportationNeeded ? 'Transport confirmed (Son driving)' : 'Transport independent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preparation Notes Banner */}
            {nextAppt.preparationNotes && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-950 flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Preparation Required: </strong>
                  {nextAppt.preparationNotes}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--subtle-border)]">
              <div className="flex items-center gap-2 text-xs text-[var(--secondary-text)]">
                <ClipboardList className="w-4 h-4 text-[var(--secondary-teal)]" />
                <span>
                  {prepItems.filter(p => p.appointmentId === nextAppt.id).length} agenda question(s) prepared for Dr. Vance
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/appointments/preparation"
                  className="px-3.5 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs font-semibold text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
                >
                  View Agenda Questions
                </Link>
                <Link
                  href={`/appointments/${nextAppt.id}`}
                  className="px-4 py-2 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)] transition-colors flex items-center gap-1.5"
                >
                  Full Visit Details &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Attention Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Action Item: Preparation Required */}
          <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Attention: Preparation & Pre-Orders
              </h3>
              <Badge variant="warning">{prepRequiredAppts.length} active</Badge>
            </div>

            <div className="space-y-2.5">
              {prepRequiredAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="p-3 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--main-text)]">{appt.providerName}</span>
                    <span className="text-[var(--secondary-text)]">
                      {new Date(appt.appointmentDatetime || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-amber-900 font-medium">{appt.preparationNotes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Item: Follow-up Tasks */}
          <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Follow-up Tasks Pending
              </h3>
              <Link href="/appointments/follow-ups" className="text-xs font-semibold text-[var(--secondary-teal)] hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.filter(t => t.taskStatus !== 'completed').slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--main-text)] line-clamp-1">{task.title}</span>
                    <span className="text-rose-700 font-semibold shrink-0 ml-2">Due {task.dueAt}</span>
                  </div>
                  <p className="text-[var(--secondary-text)] line-clamp-1">Assigned: {task.assignedToName || 'Care Circle'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments List */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--subtle-border)] pb-3">
            <div>
              <h3 className="text-base font-bold text-[var(--main-text)]">
                Upcoming Doctor Visits ({upcomingAppointments.length})
              </h3>
              <p className="text-xs text-[var(--secondary-text)]">
                Confirmed and planned visits coordinated with Margaret&apos;s family and medical team.
              </p>
            </div>

            <Link
              href="/appointments/upcoming"
              className="text-xs font-semibold text-[var(--secondary-teal)] hover:underline flex items-center gap-1"
            >
              See All Upcoming &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-4 rounded-xl border border-[var(--subtle-border)] hover:border-[var(--secondary-teal)] transition-all bg-[var(--warm-background)]/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[var(--subtle-border)] flex flex-col items-center justify-center shrink-0 text-center">
                    <span className="text-[10px] font-bold uppercase text-[var(--secondary-teal)]">
                      {new Date(appt.appointmentDatetime || '').toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-lg font-black text-[var(--main-text)] leading-none">
                      {new Date(appt.appointmentDatetime || '').getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-[var(--main-text)]">
                        {appt.title}
                      </h4>
                      <Badge variant={appt.appointmentStatus === 'confirmed' ? 'success' : 'warning'}>
                        {appt.appointmentStatus === 'confirmed' ? 'Confirmed' : 'Awaiting Confirmation'}
                      </Badge>
                      <span className="text-xs text-[var(--secondary-text)]">
                        {appt.departmentOrSpecialty || 'General'}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--secondary-text)]">
                      {appt.providerName} &bull; {appt.clinicName}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--secondary-text)] pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(appt.appointmentDatetime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.estimatedDurationMinutes}m)
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[var(--primary-teal)]" />
                        Escort: {appt.assignedAccompanyingName || 'Family Coordinator'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link
                    href={`/appointments/${appt.id}`}
                    className="px-3.5 py-1.5 rounded-lg border border-[var(--subtle-border)] bg-white text-xs font-semibold text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
                  >
                    Details & Prep
                  </Link>
                  <Link
                    href={`/appointments/${appt.id}/edit`}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)] transition-colors"
                  >
                    Edit / Reschedule
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
