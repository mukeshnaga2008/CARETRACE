'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Pill, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Plus, 
  ChevronRight, 
  AlertTriangle, 
  Info,
  ShieldCheck,
  UserCheck,
  Check
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { 
  getCachedMedications, 
  generateDoseEventsForDate, 
  calculateAdherenceMetrics,
  recordDoseAdherence 
} from '@/lib/data/medication-lifecycle-data';
import { MedicationRecord, DoseEvent } from '@/types/caretrace';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';

export default function MedicationsOverviewPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');
  const [medications, setMedications] = React.useState<MedicationRecord[]>([]);
  const [todayEvents, setTodayEvents] = React.useState<DoseEvent[]>([]);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadData = React.useCallback(() => {
    const meds = getCachedMedications();
    setMedications([...meds]);
    const events = generateDoseEventsForDate('patient-profile-001', todayStr);
    setTodayEvents([...events]);
  }, [todayStr]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = calculateAdherenceMetrics(todayEvents);

  const activeMeds = medications.filter((m) => m.status === 'active');
  const unverifiedMeds = medications.filter(
    (m) => m.verificationStatus === 'awaiting_review' || m.verificationStatus === 'needs_clarification'
  );
  const refillAlertMeds = medications.filter(
    (m) => m.refillsRemaining <= 1 && m.status === 'active'
  );

  const handleQuickReport = async (eventId: string, medId: string, action: 'report_taken' | 'report_skipped') => {
    const user = USER_PERSPECTIVES[activeRole];
    const res = recordDoseAdherence(eventId, action, user.sampleName, user.label);
    if (res.success) {
      setActionNotice(`Dose status marked as '${action.replace('_', ' ')}' by ${user.sampleName}.`);
      loadData();
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Medication Lifecycle Manager"
        description="Comprehensive prescription coordination, schedule tracking, refill forecasting, and clinical instruction provenance for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications' },
        ]}
      >
        <MedicationsNavTabs />

        {/* Clinical Safety Banner */}
        <div className="mb-6 p-4 rounded-xl bg-canvas-background border border-subtleBorder flex items-start gap-3 text-xs text-secondaryText">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-main block mb-0.5">Clinical Safety & Non-Prescribing Policy:</span>
            <p>
              CARETRACE coordinates schedules and records adherence reported by authorized users. 
              <strong>It never calculates dosages, recommends treatments, or substitutes medications.</strong> All clinical instructions originate from licensed healthcare providers.
            </p>
          </div>
        </div>

        {actionNotice && (
          <div className="mb-6 p-4 rounded-xl bg-[#EAF4EE] border border-clinical-successBorder flex items-center gap-3 text-xs text-[#1B6346] animate-in fade-in duration-150" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Section 1: Top Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
          <div className="p-4 rounded-2xl border border-subtleBorder bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mutedText block">Active Regimen</span>
            <div className="text-xl sm:text-2xl font-black text-main mt-1">{activeMeds.length}</div>
            <span className="text-[11px] text-secondaryText mt-0.5 block">Approved Rx</span>
          </div>

          <div className="p-4 rounded-2xl border border-subtleBorder bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mutedText block">Today Scheduled</span>
            <div className="text-xl sm:text-2xl font-black text-primary mt-1">{metrics.totalScheduled}</div>
            <span className="text-[11px] text-secondaryText mt-0.5 block">Dose Events</span>
          </div>

          <div className="p-4 rounded-2xl border border-subtleBorder bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mutedText block">Reported Taken</span>
            <div className="text-xl sm:text-2xl font-black text-clinical-success mt-1">{metrics.reportedTaken}</div>
            <span className="text-[11px] text-secondaryText mt-0.5 block">Logged by Circle</span>
          </div>

          <div className="p-4 rounded-2xl border border-subtleBorder bg-white shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mutedText block">Awaiting Confirm</span>
            <div className="text-xl sm:text-2xl font-black text-clinical-warning mt-1">{metrics.awaitingConfirmation}</div>
            <span className="text-[11px] text-secondaryText mt-0.5 block">Pending Check-in</span>
          </div>

          <div className="p-4 rounded-2xl border border-subtleBorder bg-white shadow-sm col-span-2 md:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mutedText block">Review Needed</span>
            <div className="text-xl sm:text-2xl font-black text-[#8C5D17] mt-1">{unverifiedMeds.length}</div>
            <span className="text-[11px] text-secondaryText mt-0.5 block">Unverified Prescriptions</span>
          </div>
        </div>

        {/* Section 2: Clinical Attention & Refill Radar */}
        {(unverifiedMeds.length > 0 || refillAlertMeds.length > 0) && (
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondaryText flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-clinical-warning" />
              Items Requiring Care Circle Attention
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unverifiedMeds.map((med) => (
                <div key={med.id} className="p-4 rounded-2xl border border-clinical-warningBorder bg-clinical-warningBg/50 text-xs flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-main text-sm">{med.displayName} ({med.strengthText})</span>
                      <Badge variant="warning" size="sm">Awaiting Clinical Review</Badge>
                    </div>
                    <p className="text-secondaryText leading-relaxed">
                      Entered by <strong>{med.assignedMemberName}</strong> ({med.sourceType.replace('_', ' ')}). 
                      Clinical instructions must be confirmed by Dr. Vance before automatic schedule activation.
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link
                      href="/medications/review"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-subtleBorder font-semibold text-secondaryText hover:text-main text-xs transition-colors"
                    >
                      <span>Review in Verification Vault</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}

              {refillAlertMeds.map((med) => (
                <div key={med.id} className="p-4 rounded-2xl border border-clinical-warningBorder bg-clinical-warningBg/50 text-xs flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-main text-sm">{med.displayName} ({med.strengthText})</span>
                      <Badge variant="danger" size="sm">{med.refillsRemaining} Refill Remaining</Badge>
                    </div>
                    <p className="text-secondaryText leading-relaxed">
                      Prescription due for refill on <strong>{med.refillDueDate || 'Soon'}</strong> at {med.pharmacy || 'primary pharmacy'}. 
                      Rx Number: {med.rxNumber}.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-mutedText">Assigned to: {med.assignedMemberName}</span>
                    <Link
                      href={`/medications/${med.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-subtleBorder font-semibold text-secondaryText hover:text-main text-xs transition-colors"
                    >
                      <span>View Refill Details</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Today's Schedule & Dose Tracking */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-subtleBorder pb-3">
                <div>
                  <h3 className="text-base font-bold text-main flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Today&apos;s Medication Schedule ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})
                  </h3>
                  <p className="text-xs text-secondaryText">Synchronized dose events with one-touch adherence logging.</p>
                </div>
                <Link
                  href="/medications/schedule"
                  className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
                >
                  Full Weekly Schedule <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {todayEvents.length === 0 ? (
                  <div className="p-8 text-center text-secondaryText text-sm">
                    No scheduled doses found for today.
                  </div>
                ) : (
                  todayEvents.map((event) => {
                    const isTaken = event.eventStatus === 'reported_taken';
                    const isAwaiting = event.eventStatus === 'awaiting_confirmation';
                    const isUpcoming = event.eventStatus === 'upcoming';
                    const isDue = event.eventStatus === 'due';

                    return (
                      <div
                        key={event.id}
                        className={`p-4 rounded-xl border text-xs transition-all ${
                          isTaken 
                            ? 'border-clinical-successBorder/60 bg-[#F4F9F6]'
                            : isAwaiting
                            ? 'border-clinical-warningBorder/60 bg-[#FEFBF6]'
                            : 'border-subtleBorder bg-canvas-background'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {event.scheduledTime}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-main text-sm">{event.medicationName}</span>
                                <Badge variant="mint" size="sm">{event.dosage}</Badge>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isTaken
                                    ? 'bg-[#EAF4EE] text-[#1B6346]'
                                    : isAwaiting
                                    ? 'bg-clinical-warningBg text-[#8C5D17]'
                                    : 'bg-canvas-subtle text-secondaryText'
                                }`}>
                                  {event.eventStatus.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>

                              {event.reportedByName && (
                                <p className="text-secondaryText text-[11px]">
                                  Reported by <strong>{event.reportedByName}</strong> ({event.reportedByRole})
                                  {event.reportedAt && ` at ${new Date(event.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </p>
                              )}

                              {event.adherenceNotes && (
                                <p className="text-mutedText italic text-[11px]">&ldquo;{event.adherenceNotes}&rdquo;</p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                            {!isTaken ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickReport(event.id, event.medicationId, 'report_taken')}
                                  className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-1.5 touch-target-min"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Report Taken</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickReport(event.id, event.medicationId, 'report_skipped')}
                                  className="px-2.5 py-1.5 rounded-xl border border-subtleBorder text-secondaryText hover:text-main text-xs font-semibold hover:bg-canvas-subtle transition-colors touch-target-min"
                                >
                                  Skip
                                </button>
                              </>
                            ) : (
                              <span className="text-clinical-success font-bold text-xs flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                Logged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Section 3: Full Active Medication Roster */}
            <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-subtleBorder pb-3">
                <div>
                  <h3 className="text-base font-bold text-main flex items-center gap-2">
                    <Pill className="h-4 w-4 text-secondary" />
                    Complete Prescription Roster
                  </h3>
                  <p className="text-xs text-secondaryText">All verified medications and dietary supplements.</p>
                </div>
                <Link
                  href="/medications/add"
                  className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add New</span>
                </Link>
              </div>

              <div className="space-y-3">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="p-4 rounded-xl border border-subtleBorder bg-canvas-background hover:border-mint-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/medications/${med.id}`} className="text-sm font-bold text-main hover:text-primary transition-colors">
                          {med.displayName}
                        </Link>
                        <Badge variant="mint" size="sm">{med.strengthText}</Badge>
                        <span className="text-secondaryText font-medium">({med.form} • {med.routeText})</span>
                        <Badge variant={med.verificationStatus === 'verified' ? "mint" : "warning"} size="sm">
                          {med.verificationStatus.replace('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-secondaryText leading-relaxed max-w-2xl font-medium">
                        {med.prescribedInstructions}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-mutedText pt-0.5">
                        <span>Provider: <strong>{med.prescribingProvider || 'Self/Family Recorded'}</strong></span>
                        <span>•</span>
                        <span>Rx: {med.rxNumber || 'N/A'}</span>
                        <span>•</span>
                        <span>Refills: <strong>{med.refillsRemaining} remaining</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/medications/${med.id}`}
                        className="px-3 py-1.5 rounded-lg border border-subtleBorder bg-white hover:bg-canvas-subtle text-secondaryText hover:text-main font-semibold text-xs transition-colors"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/medications/${med.id}/edit`}
                        className="px-3 py-1.5 rounded-lg border border-subtleBorder bg-white hover:bg-canvas-subtle text-secondaryText hover:text-main font-semibold text-xs transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Refills, Adherence Snapshot & Care Circle */}
          <div className="space-y-6">
            {/* Adherence Rate Snapshot Card */}
            <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-subtleBorder pb-3">
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-clinical-success" />
                  Adherence Consistency
                </h3>
                <Link href="/medications/adherence" className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1">
                  Details <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="text-center py-2">
                <div className="text-4xl font-black text-main">{metrics.adherenceRatePercentage}%</div>
                <div className="text-xs font-semibold text-clinical-success mt-1">Excellent Care Continuity</div>
                <p className="text-[11px] text-mutedText mt-2 leading-relaxed">
                  Calculated from {metrics.totalScheduled} scheduled doses today. ({metrics.reportedTaken} reported taken, {metrics.awaitingConfirmation} pending).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-canvas-background border border-subtleBorder text-[11px] text-secondaryText space-y-1">
                <span className="font-bold text-main block">Formula Transparency:</span>
                <p>{metrics.explanation}</p>
              </div>
            </div>

            {/* Refill Forecast Radar */}
            <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-subtleBorder pb-3">
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  Prescription Refill Radar
                </h3>
                <span className="text-xs text-mutedText">Forecast</span>
              </div>

              <div className="space-y-3 text-xs">
                {medications.filter((m) => m.refillDueDate).map((med) => (
                  <div key={med.id} className="p-3 rounded-xl bg-canvas-background border border-subtleBorder space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-main">{med.displayName}</span>
                      <Badge variant={med.refillsRemaining <= 1 ? "warning" : "mint"} size="sm">
                        {med.refillsRemaining} Refills Left
                      </Badge>
                    </div>
                    <p className="text-secondaryText">Due: <strong>{med.refillDueDate}</strong></p>
                    <p className="text-[11px] text-mutedText">{med.pharmacy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Caregiver Delegation */}
            <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm space-y-3">
              <h3 className="text-base font-bold text-main flex items-center gap-2 border-b border-subtleBorder pb-3">
                <UserCheck className="h-4 w-4 text-primary" />
                Medication Coordination Circle
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-canvas-background border border-subtleBorder flex items-center justify-between">
                  <div>
                    <span className="font-bold text-main block">David Sullivan</span>
                    <span className="text-[11px] text-secondaryText">Morning Dispensing (08:00)</span>
                  </div>
                  <Badge variant="mint" size="sm">Primary</Badge>
                </div>

                <div className="p-2.5 rounded-xl bg-canvas-background border border-subtleBorder flex items-center justify-between">
                  <div>
                    <span className="font-bold text-main">Sarah Jenkins, RN</span>
                    <span className="text-[11px] text-secondaryText block">Evening Administration & Vitals</span>
                  </div>
                  <Badge variant="neutral" size="sm">Visiting RN</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
