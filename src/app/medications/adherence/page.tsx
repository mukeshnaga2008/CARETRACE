'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Pill, 
  Info, 
  ShieldCheck, 
  UserCheck,
  BarChart3
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/constants';
import { 
  getCachedMedications, 
  getCachedDoseEvents, 
  calculateAdherenceMetrics 
} from '@/lib/data/medication-lifecycle-data';
import { DoseEvent, MedicationRecord } from '@/types/caretrace';

export default function MedicationAdherencePage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [medications, setMedications] = React.useState<MedicationRecord[]>([]);
  const [events, setEvents] = React.useState<DoseEvent[]>([]);

  React.useEffect(() => {
    setMedications(getCachedMedications());
    setEvents(getCachedDoseEvents());
  }, []);

  const metrics = calculateAdherenceMetrics(events);

  // 7-day synthetic breakdown for visual continuity
  const past7Days = [
    { day: 'Sun, Feb 09', scheduled: 4, taken: 4, skipped: 0, missed: 0, pct: 100 },
    { day: 'Mon, Feb 10', scheduled: 4, taken: 4, skipped: 0, missed: 0, pct: 100 },
    { day: 'Tue, Feb 11', scheduled: 4, taken: 3, skipped: 1, missed: 0, pct: 75, note: 'Skipped CoQ10 (upset stomach)' },
    { day: 'Wed, Feb 12', scheduled: 4, taken: 4, skipped: 0, missed: 0, pct: 100 },
    { day: 'Thu, Feb 13', scheduled: 4, taken: 4, skipped: 0, missed: 0, pct: 100 },
    { day: 'Fri, Feb 14', scheduled: 4, taken: 3, skipped: 0, missed: 1, pct: 75, note: 'Evening dose delayed 2 hrs' },
    { day: 'Sat, Feb 15 (Today)', scheduled: 4, taken: 2, skipped: 0, missed: 0, pct: 100, note: 'Morning doses completed' },
  ];

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Medication Adherence Tracking"
        description="Transparent adherence analytics, logged administration audits, and trend analysis for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications', href: '/medications' },
          { label: 'Adherence' },
        ]}
      >
        <MedicationsNavTabs />

        {/* Primary Metric Banner */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary-teal)] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              7-Day Adherence Performance
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-[var(--primary-teal)]">
                {metrics.adherenceRatePercentage}%
              </span>
              <span className="text-sm font-semibold text-emerald-700">
                Optimal Care Tier (Target &gt; 80%)
              </span>
            </div>
            <p className="text-xs text-[var(--secondary-text)] max-w-xl">
              Margaret has maintained consistent blood pressure and vitamin regimen completion, with prompt family check-ins logged by David Sullivan and Nurse Jenkins.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="block text-xl font-bold text-emerald-950">{metrics.reportedTaken}</span>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Taken</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-bold text-slate-900">{metrics.totalScheduled}</span>
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Scheduled</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <span className="block text-xl font-bold text-amber-950">{metrics.awaitingConfirmation}</span>
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Awaiting</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="block text-xl font-bold text-rose-950">{metrics.skipped + metrics.missed}</span>
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Skipped/Miss</span>
            </div>
          </div>
        </div>

        {/* Transparent Calculation Explanation */}
        <div className="p-5 rounded-2xl border border-teal-200 bg-teal-50/50 mb-6 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-[var(--primary-teal)] shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <h2 className="font-semibold text-[var(--main-text)]">
              Transparent Adherence Formula & Clinical Boundary
            </h2>
            <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
              <strong>Calculation Method: </strong>
              <code className="bg-white px-2 py-0.5 rounded border border-teal-200 text-[var(--primary-teal)]">
                (Reported Taken Doses ÷ Total Scheduled Non-Cancelled Doses) × 100
              </code>
            </p>
            <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
              {metrics.explanation}
            </p>
          </div>
        </div>

        {/* 7-Day Daily Breakdown Table */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 space-y-4">
          <div className="border-b border-[var(--subtle-border)] pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--main-text)] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--primary-teal)]" />
              7-Day Daily Adherence Breakdown
            </h2>
            <span className="text-xs text-[var(--secondary-text)]">
              Feb 09, 2026 – Feb 15, 2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--subtle-border)] text-xs font-semibold text-[var(--secondary-text)] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Scheduled</th>
                  <th className="py-2.5 px-3 text-center">Taken</th>
                  <th className="py-2.5 px-3 text-center">Skipped</th>
                  <th className="py-2.5 px-3 text-center">Rate</th>
                  <th className="py-2.5 px-3">Clinical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--subtle-border)]">
                {past7Days.map((d, idx) => (
                  <tr key={idx} className="hover:bg-[var(--warm-background)]/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-[var(--main-text)]">
                      {d.day}
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--secondary-text)]">
                      {d.scheduled}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-800">
                      {d.taken}
                    </td>
                    <td className="py-3 px-3 text-center text-rose-700">
                      {d.skipped > 0 ? d.skipped : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        d.pct >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.pct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-[var(--secondary-text)]">
                      {d.note || 'All doses confirmed as scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medication-by-Medication Adherence Comparison */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-4">
          <div className="border-b border-[var(--subtle-border)] pb-3">
            <h2 className="text-base font-semibold text-[var(--main-text)] flex items-center gap-2">
              <Pill className="w-5 h-5 text-[var(--primary-teal)]" />
              Medication-Specific Performance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => {
              const rate = med.displayName.includes('CoQ10') ? 75 : med.displayName.includes('Metoprolol') ? 88 : 100;
              return (
                <div
                  key={med.id}
                  className="p-4 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--main-text)]">
                        {med.displayName} ({med.strengthText})
                      </h4>
                      <p className="text-xs text-[var(--secondary-text)]">
                        {med.form} • Assigned: {med.assignedMemberName || 'David Sullivan'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      rate >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rate}% Adherence
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rate >= 90 ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--secondary-text)]">
                    <span>Times: {med.scheduledTimes.join(', ')}</span>
                    <Link
                      href={`/medications/${med.id}`}
                      className="font-semibold text-[var(--secondary-teal)] hover:underline"
                    >
                      Prescription Detail &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
