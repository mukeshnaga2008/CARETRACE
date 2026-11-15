'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  History, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Search, 
  FileText, 
  UserCheck, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/constants';
import { 
  getCachedAppointments, 
  getCachedAppointmentNotes 
} from '@/lib/data/appointment-intelligence-data';
import { AppointmentRecord, AppointmentNote } from '@/types/caretrace';

export default function AppointmentHistoryPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([]);
  const [notes, setNotes] = React.useState<AppointmentNote[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'completed' | 'cancelled'>('all');

  React.useEffect(() => {
    setAppointments(getCachedAppointments());
    setNotes(getCachedAppointmentNotes());
  }, []);

  const historyList = appointments
    .filter((a) => a.appointmentStatus === 'completed' || a.appointmentStatus === 'cancelled')
    .sort((a, b) => new Date(b.appointmentDatetime || '').getTime() - new Date(a.appointmentDatetime || '').getTime());

  const filtered = historyList.filter((appt) => {
    const matchesSearch = 
      appt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appt.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.clinicName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appt.appointmentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Appointment History & Past Outcomes"
        description="Completed clinical consultation outcomes, cancelled visit logs, and provider instruction archives for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: 'History' },
        ]}
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[var(--secondary-text)] uppercase tracking-wider">
              Filter:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              All ({historyList.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Completed Visits
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Cancelled Visits
            </button>
          </div>
        </div>

        {/* History Cards */}
        {filtered.length === 0 ? (
          <div className="p-12 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-3">
            <History className="w-10 h-10 text-[var(--secondary-text)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--main-text)]">
              No Past Visits Matching Filter
            </h3>
            <p className="text-xs text-[var(--secondary-text)]">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((appt) => {
              const isCompleted = appt.appointmentStatus === 'completed';
              const apptNotes = notes.filter((n) => n.appointmentId === appt.id);

              return (
                <div
                  key={appt.id}
                  className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-[var(--main-text)]">
                          {appt.title}
                        </h3>
                        <Badge variant={isCompleted ? 'neutral' : 'danger'}>
                          {isCompleted ? 'Completed' : 'Cancelled'}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-[var(--secondary-teal)]">
                        {appt.providerName} &bull; {appt.clinicName}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs font-bold text-[var(--main-text)] block">
                        {new Date(appt.appointmentDatetime || '').toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-[var(--secondary-text)]">
                        Escort: {appt.assignedAccompanyingName || 'David Sullivan'}
                      </span>
                    </div>
                  </div>

                  {/* If cancelled, show reason */}
                  {!isCompleted && (
                    <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-950 text-xs space-y-1">
                      <strong className="block font-bold">Cancellation Reason:</strong>
                      <p>{appt.cancellationReason || 'Rescheduled by user'}</p>
                    </div>
                  )}

                  {/* If completed, show visit outcome summaries */}
                  {isCompleted && apptNotes.length > 0 && (
                    <div className="space-y-3">
                      {apptNotes.map((note) => (
                        <div key={note.id} className="p-4 rounded-xl border border-teal-100 bg-teal-50/40 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--primary-teal)]">
                              Clinical Summary ({note.visitDate})
                            </span>
                            <Badge variant={note.verificationStatus === 'verified' ? 'success' : 'warning'}>
                              {note.sourceProvenance.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--main-text)] leading-relaxed">
                            &ldquo;{note.summaryText}&rdquo;
                          </p>
                          {note.followUpInstructions && (
                            <p className="text-emerald-900 font-semibold pt-1">
                              Follow-up: {note.followUpInstructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/appointments/${appt.id}`}
                      className="text-xs font-semibold text-[var(--secondary-teal)] hover:underline flex items-center gap-1"
                    >
                      View Full Details & Audit Trail &rarr;
                    </Link>
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
