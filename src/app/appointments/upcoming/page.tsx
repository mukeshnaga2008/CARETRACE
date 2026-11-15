'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Clock, 
  MapPin, 
  UserCheck, 
  Car, 
  Calendar, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ClipboardList,
  Edit3
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/constants';
import { 
  getCachedAppointments, 
  getCachedPreparationItems 
} from '@/lib/data/appointment-intelligence-data';
import { AppointmentRecord, AppointmentPreparationItem } from '@/types/caretrace';

export default function UpcomingAppointmentsPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([]);
  const [prepItems, setPrepItems] = React.useState<AppointmentPreparationItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  React.useEffect(() => {
    setAppointments(getCachedAppointments());
    setPrepItems(getCachedPreparationItems());
  }, []);

  const upcomingList = appointments
    .filter((a) => a.appointmentStatus !== 'completed' && a.appointmentStatus !== 'cancelled')
    .sort((a, b) => new Date(a.appointmentDatetime || '').getTime() - new Date(b.appointmentDatetime || '').getTime());

  const filtered = upcomingList.filter((appt) => {
    const matchesSearch = 
      appt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.clinicName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || appt.appointmentType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Upcoming Doctor Visits"
        description="All planned and confirmed appointments for Margaret Sullivan with preparation checklists and escort coordination."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: 'Upcoming' },
        ]}
        actions={
          <Link
            href="/appointments/add"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule New Visit
          </Link>
        }
      >
        <AppointmentsNavTabs />

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[var(--secondary-text)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search provider, clinic, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-sm text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[var(--secondary-text)] uppercase tracking-wider shrink-0">
              Category:
            </span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                typeFilter === 'all'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              All ({upcomingList.length})
            </button>
            <button
              onClick={() => setTypeFilter('follow_up')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                typeFilter === 'follow_up'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Follow-ups
            </button>
            <button
              onClick={() => setTypeFilter('doctor_consultation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                typeFilter === 'doctor_consultation'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Consultations
            </button>
            <button
              onClick={() => setTypeFilter('therapy_appointment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                typeFilter === 'therapy_appointment'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Physical Therapy
            </button>
          </div>
        </div>

        {/* List of Upcoming Visits */}
        {filtered.length === 0 ? (
          <div className="p-12 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-3">
            <Calendar className="w-10 h-10 text-[var(--secondary-text)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--main-text)]">
              No Upcoming Visits Matching Filter
            </h3>
            <p className="text-xs text-[var(--secondary-text)]">
              Try adjusting your search terms or schedule a new appointment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((appt) => {
              const prepCount = prepItems.filter((p) => p.appointmentId === appt.id).length;

              return (
                <div
                  key={appt.id}
                  className="p-6 rounded-2xl border border-[var(--subtle-border)] hover:border-[var(--secondary-teal)] transition-all bg-[var(--white-surface)] shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[var(--soft-mint)] border border-teal-200 flex flex-col items-center justify-center shrink-0 text-center text-[var(--primary-teal)]">
                        <span className="text-[10px] font-bold uppercase">
                          {new Date(appt.appointmentDatetime || '').toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {new Date(appt.appointmentDatetime || '').getDate()}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-[var(--main-text)]">
                            {appt.title}
                          </h3>
                          <Badge variant={appt.appointmentStatus === 'confirmed' ? 'success' : 'warning'}>
                            {appt.appointmentStatus}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-[var(--secondary-teal)]">
                          {appt.providerName} &bull; {appt.clinicName}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs font-bold text-[var(--main-text)] block">
                        {new Date(appt.appointmentDatetime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.timezone || 'Central'})
                      </span>
                      <span className="text-xs text-[var(--secondary-text)]">
                        {appt.estimatedDurationMinutes} minutes
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--secondary-text)]">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[var(--secondary-teal)] shrink-0 mt-0.5" />
                      <span>{appt.locationText || appt.clinicName}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Car className="w-4 h-4 text-[var(--secondary-teal)] shrink-0 mt-0.5" />
                      <span>Escort: <strong className="text-[var(--main-text)]">{appt.assignedAccompanyingName || 'David Sullivan'}</strong> ({appt.transportationNeeded ? 'Driving' : 'Independent'})</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <ClipboardList className="w-4 h-4 text-[var(--secondary-teal)] shrink-0 mt-0.5" />
                      <span>Agenda: <strong className="text-[var(--main-text)]">{prepCount}</strong> question(s) prepared</span>
                    </div>
                  </div>

                  {appt.preparationNotes && (
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span><strong>Preparation notice: </strong>{appt.preparationNotes}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[var(--subtle-border)] flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href="/appointments/preparation"
                      className="text-xs font-semibold text-[var(--secondary-teal)] hover:underline flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Prepare Agenda Questions &rarr;
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/appointments/${appt.id}/edit`}
                        className="px-3.5 py-1.5 rounded-lg border border-[var(--subtle-border)] bg-white text-xs font-semibold text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <Link
                        href={`/appointments/${appt.id}`}
                        className="px-4 py-1.5 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)] transition-colors"
                      >
                        Visit Details &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
