'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  UserCheck, 
  Car, 
  Plus, 
  CalendarDays,
  List,
  Grid
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/constants';
import { getCachedAppointments } from '@/lib/data/appointment-intelligence-data';
import { AppointmentRecord } from '@/types/caretrace';

export default function AppointmentCalendarPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([]);
  const [currentDate, setCurrentDate] = React.useState(new Date(2026, 1, 15)); // Feb 2026 baseline
  const [viewMode, setViewMode] = React.useState<'month' | 'agenda'>('month');

  React.useEffect(() => {
    setAppointments(getCachedAppointments());
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid helpers
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Map appointments by YYYY-MM-DD
  const appointmentsByDate = React.useMemo(() => {
    const map: Record<string, AppointmentRecord[]> = {};
    appointments.forEach((appt) => {
      const dt = appt.appointmentDatetime || appt.appointmentDate || '';
      if (dt) {
        const dateKey = dt.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(appt);
      }
    });
    return map;
  }, [appointments]);

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Appointment Calendar"
        description="Comprehensive calendar timeline for Margaret Sullivan. Rendered in America/Chicago timezone with accessible agenda listing."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: 'Calendar' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-[var(--subtle-border)] rounded-lg p-0.5 bg-white">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'month' ? 'bg-[var(--primary-teal)] text-white shadow-xs' : 'text-[var(--secondary-text)]'
                }`}
                aria-pressed={viewMode === 'month'}
              >
                <Grid className="w-3.5 h-3.5" />
                Month View
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'agenda' ? 'bg-[var(--primary-teal)] text-white shadow-xs' : 'text-[var(--secondary-text)]'
                }`}
                aria-pressed={viewMode === 'agenda'}
              >
                <List className="w-3.5 h-3.5" />
                Accessible Agenda
              </button>
            </div>

            <Link
              href="/appointments/add"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Visit
            </Link>
          </div>
        }
      >
        <AppointmentsNavTabs />

        {/* Calendar Header & Month Navigation */}
        <div className="p-4 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[var(--main-text)]">
              {monthName}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[var(--soft-mint)] text-[var(--primary-teal)] border border-teal-200">
              Central Time (CST)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg border border-[var(--subtle-border)] hover:bg-[var(--soft-mint)] transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--subtle-border)] hover:bg-[var(--soft-mint)] transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg border border-[var(--subtle-border)] hover:bg-[var(--soft-mint)] transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode: Month Grid */}
        {viewMode === 'month' && (
          <div className="p-4 sm:p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-8 overflow-x-auto">
            <div className="min-w-[650px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[var(--secondary-text)] uppercase tracking-wider">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for leading days */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] p-2 rounded-xl bg-slate-50/50 border border-transparent" />
                ))}

                {/* Actual days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayAppts = appointmentsByDate[dateStr] || [];
                  const isToday = new Date().toISOString().startsWith(dateStr);

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                        isToday
                          ? 'border-[var(--primary-teal)] bg-teal-50/30'
                          : dayAppts.length > 0
                          ? 'border-teal-200 bg-white'
                          : 'border-[var(--subtle-border)] bg-white/70 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? 'w-6 h-6 rounded-full bg-[var(--primary-teal)] text-white flex items-center justify-center'
                              : 'text-[var(--main-text)]'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>

                      <div className="space-y-1.5 my-1">
                        {dayAppts.map((appt) => (
                          <Link
                            key={appt.id}
                            href={`/appointments/${appt.id}`}
                            className="block p-1.5 rounded-lg bg-[var(--soft-mint)]/70 hover:bg-[var(--soft-mint)] text-[11px] leading-tight text-[var(--primary-teal)] font-semibold transition-colors truncate"
                            title={`${appt.title} with ${appt.providerName}`}
                          >
                            <span className="font-bold">
                              {new Date(appt.appointmentDatetime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>{' '}
                            {appt.providerName.split(' ').slice(-1)[0]}
                          </Link>
                        ))}
                      </div>

                      <div className="text-[10px] text-[var(--secondary-text)]">
                        {dayAppts.length > 0 ? `${dayAppts.length} visit` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Accessible List Alternative / Agenda View (always visible or in agenda mode) */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-4">
          <div className="border-b border-[var(--subtle-border)] pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[var(--primary-teal)]" />
              Chronological Agenda List (Accessible View)
            </h3>
            <span className="text-xs text-[var(--secondary-text)]">
              Screen-reader friendly schedule
            </span>
          </div>

          <div className="space-y-3">
            {appointments
              .sort((a, b) => new Date(a.appointmentDatetime || '').getTime() - new Date(b.appointmentDatetime || '').getTime())
              .map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                        <Badge variant={appt.appointmentStatus === 'completed' ? 'neutral' : appt.appointmentStatus === 'cancelled' ? 'danger' : 'success'}>
                          {appt.appointmentStatus}
                        </Badge>
                      </div>

                      <p className="text-xs text-[var(--secondary-text)]">
                        {appt.providerName} &bull; {appt.clinicName}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--secondary-text)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(appt.appointmentDatetime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appt.timezone || 'Central Time'})
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-[var(--primary-teal)]" />
                          Escort: {appt.assignedAccompanyingName || 'David Sullivan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/appointments/${appt.id}`}
                    className="self-end md:self-center px-4 py-2 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)] transition-colors shrink-0"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
