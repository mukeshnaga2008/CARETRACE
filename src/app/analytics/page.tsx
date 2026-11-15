'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AnalyticsNavTabs } from '@/components/features/analytics/analytics-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  BarChart3,
  Pill,
  Calendar,
  CheckSquare,
  Layers,
  AlertTriangle,
  Info,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { getCareAnalytics } from '@/lib/data/timeline-analytics-data';
import { CareAnalyticsSummary, AnalyticsDateRange } from '@/types/caretrace';

export default function AnalyticsOverviewPage() {
  const [dateRange, setDateRange] = React.useState<AnalyticsDateRange>('30d');
  const [analytics, setAnalytics] = React.useState<CareAnalyticsSummary>(() =>
    getCareAnalytics('patient-profile-001', '30d')
  );

  React.useEffect(() => {
    const updated = getCareAnalytics('patient-profile-001', dateRange);
    setAnalytics(updated);
  }, [dateRange]);

  const { medications, appointments, careCircle, continuity, careGaps } = analytics;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Analytics', href: '/analytics' }, { label: 'Operational Overview' }]}
      pageTitle="Care Analytics & Coordination Insights"
      pageDescription="Operational intelligence across medication schedules, doctor visit readiness, continuity transitions, and care gaps."
    >
      <PageContainer>
        <AnalyticsNavTabs />

        {/* Clinical Non-Efficacy Safety Disclaimer */}
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-950 space-y-1">
            <span className="font-bold block">Clinical Boundary & Metric Methodology</span>
            <p className="leading-relaxed">
              CARETRACE analytics measure coordination activity and self-reported adherence. Reported dose logs do not prove biological ingestion or clinical efficacy. Adherence rates reflect eligible past scheduled doses: <code className="bg-white px-1.5 py-0.5 rounded border border-teal-200 font-mono">Reported Taken / (Taken + Missed + Skipped)</code>. Cancelled and future doses are excluded from adherence denominators.
            </p>
          </div>
        </div>

        {/* Toolbar with Date Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="text-xs text-[var(--secondary-text)]">
            Viewing analytics period: <strong className="text-[var(--main-text)]">{new Date(analytics.startDate).toLocaleDateString()}</strong> through <strong className="text-[var(--main-text)]">{new Date(analytics.endDate).toLocaleDateString()}</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Time Window:</span>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as AnalyticsDateRange)}
              className="h-9 text-xs rounded-lg min-w-[140px]"
              options={[
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
                { value: 'all', label: 'All-Time Record' },
              ]}
            />
          </div>
        </div>

        {/* 4 Primary Operational KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Reported Adherence</span>
              <Pill className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-3xl font-bold text-purple-950 mt-1">
              {medications.reportedAdherenceRate}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {medications.reportedTaken} of {medications.reportedTaken + medications.missed + medications.skipped} eligible doses
            </span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Visit Prep Readiness</span>
              <Calendar className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-3xl font-bold text-blue-950 mt-1">
              {appointments.prepCompletionRate}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Pre-visit checklists addressed
            </span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Task Completion</span>
              <CheckSquare className="w-4 h-4 text-teal-700" />
            </div>
            <div className="text-3xl font-bold text-teal-950 mt-1">
              {careCircle.taskCompletionRate}%
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {careCircle.completedTasks} of {careCircle.totalTasks} responsibilities
            </span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Open Care Gaps</span>
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-3xl font-bold text-amber-950 mt-1">
              {careGaps.openGaps}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {careGaps.resolvedGaps} resolved in period
            </span>
          </Card>
        </div>

        {/* Detailed Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medication Status Breakdown Chart */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-700" />
                Medication Dose Event Breakdown
              </CardTitle>
              <Link href="/analytics/medications" className="text-xs text-teal-700 hover:underline font-semibold">
                View Full
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                {medications.statusDistribution.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <span className="text-slate-500">{item.count} events ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Reported Taken:</span>
                  <strong className="text-teal-700">{medications.reportedTaken}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Missed Omissions:</span>
                  <strong className="text-rose-700">{medications.missed}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Withheld (Skipped):</span>
                  <strong className="text-amber-700">{medications.skipped}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Unconfirmed Past Window:</span>
                  <strong className="text-slate-600">{medications.unconfirmedOverdue}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Care Gap Categories Breakdown */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-teal-700" />
                Care Gap Radar Distribution
              </CardTitle>
              <Link href="/analytics/care-gaps" className="text-xs text-teal-700 hover:underline font-semibold">
                View Full
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                {careGaps.categoryBreakdown.map((item) => {
                  const total = careGaps.totalDetected || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{item.category} Gaps</span>
                        <span className="text-slate-500">{item.count} items ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-700 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-2 gap-2 text-slate-700">
                <div>Total Flagged: <strong>{careGaps.totalDetected}</strong></div>
                <div>Resolved: <strong className="text-emerald-700">{careGaps.resolvedGaps}</strong></div>
                <div>Unassigned Gaps: <strong className="text-amber-700">{careGaps.unassignedGaps}</strong></div>
                <div>Overdue Gaps: <strong className="text-rose-700">{careGaps.overdueGaps}</strong></div>
              </div>
            </CardContent>
          </Card>

          {/* Care Circle Responsibilities & Shift Handover Sync */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                Care Circle Responsibility Coordination
              </CardTitle>
              <Link href="/analytics/responsibilities" className="text-xs text-teal-700 hover:underline font-semibold">
                View Full
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-xl font-bold text-emerald-950 block">{careCircle.completedTasks}</span>
                  <span className="text-[11px] text-emerald-800">Tasks Completed</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xl font-bold text-amber-950 block">{careCircle.unassignedTasks}</span>
                  <span className="text-[11px] text-amber-800">Unassigned</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="text-xl font-bold text-rose-950 block">{careCircle.overdueTasks}</span>
                  <span className="text-[11px] text-rose-800">Overdue</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span>Shift Handovers Signed-off:</span>
                  <strong className="text-emerald-700">{careCircle.handoversAcknowledged}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Handovers Awaiting Sign-off:</span>
                  <strong className="text-amber-700">{careCircle.handoversPending}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Active Care Circle Collaborators:</span>
                  <strong className="text-slate-800">{careCircle.activeMembersCount} members</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Care Continuity & Instruction Governance */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-700" />
                Care Continuity & Protocol Governance
              </CardTitle>
              <Link href="/analytics/continuity" className="text-xs text-teal-700 hover:underline font-semibold">
                View Full
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="text-xl font-bold text-indigo-950 block">{continuity.verifiedInstructions}</span>
                  <span className="text-[11px] text-indigo-800">Verified Protocols</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xl font-bold text-amber-950 block">{continuity.pendingInstructions}</span>
                  <span className="text-[11px] text-amber-800">Pending Review</span>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <span className="text-xl font-bold text-teal-950 block">{continuity.approvedImplementations}</span>
                  <span className="text-[11px] text-teal-800">Synchronized</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span>Total Continuity Transition Reviews:</span>
                  <strong className="text-slate-800">{continuity.totalReviews}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Reviews in Clarification:</span>
                  <strong className="text-amber-700">{continuity.clarificationsRequested}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Rejected Transitions:</span>
                  <strong className="text-rose-700">{continuity.rejectedReviews}</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
