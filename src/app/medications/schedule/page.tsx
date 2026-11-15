'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Pill, 
  UserCheck, 
  Check, 
  X, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  generateDoseEventsForDate, 
  recordDoseAdherence, 
  getCachedMedications 
} from '@/lib/data/medication-lifecycle-data';
import { DoseEvent, MedicationRecord } from '@/types/caretrace';

export default function MedicationSchedulePage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [events, setEvents] = React.useState<DoseEvent[]>([]);
  const [medications, setMedications] = React.useState<MedicationRecord[]>([]);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  // Skip reason modal / state
  const [activeSkippingEventId, setActiveSkippingEventId] = React.useState<string | null>(null);
  const [skipReason, setSkipReason] = React.useState<string>('Nausea / Stomach upset');
  const [customSkipNote, setCustomSkipNote] = React.useState('');

  const loadEvents = React.useCallback(() => {
    const evts = generateDoseEventsForDate('patient-profile-001', selectedDate);
    setEvents([...evts]);
    setMedications(getCachedMedications());
  }, [selectedDate]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleAction = (
    eventId: string, 
    action: 'report_taken' | 'report_skipped' | 'record_missed' | 'mark_awaiting_confirmation',
    notes?: string,
    reason?: string
  ) => {
    const user = USER_PERSPECTIVES[activeRole];
    const res = recordDoseAdherence(
      eventId, 
      action, 
      user.sampleName, 
      user.label, 
      notes, 
      reason
    );
    if (res.success) {
      setActionNotice(`Dose status successfully updated to '${action.replace('_', ' ')}' by ${user.sampleName}.`);
      loadEvents();
      setActiveSkippingEventId(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Group events by scheduled time
  const groupedEvents = React.useMemo(() => {
    const groups: Record<string, DoseEvent[]> = {};
    events.forEach((evt) => {
      const timeKey = evt.scheduledTime || '08:00';
      if (!groups[timeKey]) groups[timeKey] = [];
      groups[timeKey].push(evt);
    });
    return groups;
  }, [events]);

  const totalDoses = events.length;
  const takenCount = events.filter((e) => e.eventStatus === 'reported_taken').length;
  const pendingCount = events.filter((e) => e.eventStatus === 'upcoming' || e.eventStatus === 'due').length;
  const awaitingCount = events.filter((e) => e.eventStatus === 'awaiting_confirmation').length;
  const skippedCount = events.filter((e) => e.eventStatus === 'skipped' || e.eventStatus === 'missed').length;

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Medication Schedule & Daily Dosing"
        description="Daily administration timeline, scheduled dose events, and adherence reporting for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications', href: '/medications' },
          { label: 'Schedule' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
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

        {/* Date Selector & Daily Summary Bar */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--soft-mint)] flex items-center justify-center text-[var(--primary-teal)] shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--main-text)]">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
                {selectedDate === new Date().toISOString().split('T')[0] && (
                  <Badge variant="success">Today</Badge>
                )}
              </div>
              <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                {totalDoses} doses scheduled across {Object.keys(groupedEvents).length} administration windows.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center min-w-[85px]">
              <span className="block text-lg font-bold">{takenCount}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Taken</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-center min-w-[85px]">
              <span className="block text-lg font-bold">{pendingCount}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Upcoming</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-center min-w-[85px]">
              <span className="block text-lg font-bold">{awaitingCount}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider">Awaiting</span>
            </div>
            {skippedCount > 0 && (
              <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-center min-w-[85px]">
                <span className="block text-lg font-bold">{skippedCount}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider">Skipped</span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Timeline */}
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="p-8 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-3">
            <Clock className="w-10 h-10 text-[var(--secondary-text)] mx-auto" />
            <h3 className="text-base font-semibold text-[var(--main-text)]">
              No Doses Scheduled for this Date
            </h3>
            <p className="text-sm text-[var(--secondary-text)]">
              There are no active medication regimens requiring doses on this calendar day.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([time, timeEvents]) => {
              const isMorning = parseInt(time.split(':')[0], 10) < 12;
              const isAfternoon = parseInt(time.split(':')[0], 10) >= 12 && parseInt(time.split(':')[0], 10) < 17;
              const timeLabel = isMorning ? 'Morning Window' : isAfternoon ? 'Afternoon Window' : 'Evening Window';

              return (
                <div key={time} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary-teal)] text-white font-bold text-sm tracking-wide shadow-sm">
                      <Clock className="w-4 h-4" />
                      {time}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--main-text)]">
                      {timeLabel}
                    </h3>
                    <span className="text-xs text-[var(--secondary-text)]">
                      ({timeEvents.length} medication{timeEvents.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {timeEvents.map((evt) => {
                      const med = medications.find((m) => m.id === evt.medicationId);
                      const isTaken = evt.eventStatus === 'reported_taken';
                      const isSkipped = evt.eventStatus === 'skipped';
                      const isMissed = evt.eventStatus === 'missed';
                      const isAwaiting = evt.eventStatus === 'awaiting_confirmation';

                      return (
                        <div
                          key={evt.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isTaken
                              ? 'border-emerald-200 bg-emerald-50/40'
                              : isSkipped
                              ? 'border-rose-200 bg-rose-50/40'
                              : isAwaiting
                              ? 'border-amber-200 bg-amber-50/40'
                              : 'border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-[var(--main-text)]">
                                  {evt.medicationName}
                                </h4>
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-[var(--subtle-border)] text-[var(--secondary-text)]">
                                  {evt.dosage}
                                </span>
                              </div>
                              {med && (
                                <p className="text-xs text-[var(--secondary-text)] mt-1 line-clamp-2">
                                  {med.prescribedInstructions}
                                </p>
                              )}
                            </div>

                            <Badge
                              variant={
                                isTaken
                                  ? 'success'
                                  : isSkipped
                                  ? 'danger'
                                  : isAwaiting
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {isTaken
                                ? 'Reported Taken'
                                : isSkipped
                                ? 'Skipped'
                                : isAwaiting
                                ? 'Awaiting Check-in'
                                : 'Upcoming'}
                            </Badge>
                          </div>

                          {/* Food Instructions / Notes */}
                          {med?.foodInstructions && (
                            <p className="text-xs text-[var(--secondary-teal)] font-medium mt-2">
                              Intake: {med.foodInstructions}
                            </p>
                          )}

                          {/* Logged details if taken or skipped */}
                          {evt.reportedByName && (
                            <div className="mt-3 pt-3 border-t border-[var(--subtle-border)] flex items-center justify-between text-xs text-[var(--secondary-text)]">
                              <span>
                                Logged by <strong className="text-[var(--main-text)]">{evt.reportedByName}</strong> ({evt.reportedByRole})
                              </span>
                              <span>
                                {evt.reportedAt ? new Date(evt.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          )}

                          {evt.adherenceNotes && (
                            <p className="text-xs text-[var(--secondary-text)] italic mt-1">
                              Note: {evt.adherenceNotes}
                            </p>
                          )}

                          {/* Interactive Action Buttons */}
                          <div className="mt-4 pt-3 border-t border-[var(--subtle-border)] flex flex-wrap items-center gap-2">
                            {isTaken ? (
                              <button
                                type="button"
                                onClick={() => handleAction(evt.id, 'mark_awaiting_confirmation')}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--subtle-border)] bg-white text-[var(--secondary-text)] hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Undo / Change Status
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAction(evt.id, 'report_taken')}
                                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] flex items-center gap-1.5 shadow-sm transition-colors focus:ring-2 focus:ring-[var(--primary-teal)]"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Mark Taken
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setActiveSkippingEventId(evt.id)}
                                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Report Skipped
                                </button>

                                {!isAwaiting && (
                                  <button
                                    type="button"
                                    onClick={() => handleAction(evt.id, 'mark_awaiting_confirmation')}
                                    className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--subtle-border)] bg-white text-[var(--secondary-text)] hover:bg-slate-50 transition-colors"
                                  >
                                    Awaiting Check-in
                                  </button>
                                )}
                              </>
                            )}

                            <Link
                              href={`/medications/${evt.medicationId}`}
                              className="ml-auto text-xs font-semibold text-[var(--secondary-teal)] hover:text-[var(--primary-teal)]"
                            >
                              View Details &rarr;
                            </Link>
                          </div>

                          {/* Skip Reason Modal / Expanded Form */}
                          {activeSkippingEventId === evt.id && (
                            <div className="mt-3 p-3 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
                              <label className="block text-xs font-bold text-rose-950">
                                Reason for skipping {evt.medicationName}:
                              </label>
                              <select
                                value={skipReason}
                                onChange={(e) => setSkipReason(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-xs text-[var(--main-text)]"
                              >
                                <option value="Nausea / Stomach upset">Nausea / Stomach upset</option>
                                <option value="Fasting for upcoming blood test">Fasting for upcoming blood test</option>
                                <option value="Patient refused dose">Patient refused dose</option>
                                <option value="Dose delayed / asleep">Dose delayed / patient asleep</option>
                                <option value="Other clinical reason">Other clinical reason</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Additional note (optional)"
                                value={customSkipNote}
                                onChange={(e) => setCustomSkipNote(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-xs text-[var(--main-text)]"
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveSkippingEventId(null)}
                                  className="px-2.5 py-1 text-xs text-rose-800 hover:underline"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(evt.id, 'report_skipped', customSkipNote, skipReason)}
                                  className="px-3 py-1 bg-rose-700 text-white rounded text-xs font-semibold hover:bg-rose-800 transition-colors"
                                >
                                  Confirm Skip
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
