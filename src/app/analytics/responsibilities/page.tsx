'use client';

import * as React from 'react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AnalyticsNavTabs } from '@/components/features/analytics/analytics-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckSquare, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCareAnalytics } from '@/lib/data/timeline-analytics-data';

export default function ResponsibilitiesAnalyticsPage() {
  const analytics = getCareAnalytics('patient-profile-001', '30d');
  const { careCircle } = analytics;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Analytics', href: '/analytics' }, { label: 'Responsibilities' }]}
      pageTitle="Care Circle Responsibility & Task Analytics"
      pageDescription="Care task velocity, overdue responsibility tracking, and caregiver shift handover sign-offs."
    >
      <PageContainer>
        <AnalyticsNavTabs />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Completed Tasks</span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{careCircle.completedTasks}</div>
            <span className="text-[11px] text-emerald-700">{careCircle.taskCompletionRate}% completion rate</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Unassigned Tasks</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{careCircle.unassignedTasks}</div>
            <span className="text-[11px] text-amber-700">Need assignee</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Overdue Tasks</span>
            <div className="text-2xl font-bold text-rose-800 mt-1">{careCircle.overdueTasks}</div>
            <span className="text-[11px] text-rose-700">Require escalation</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Active Collaborators</span>
            <div className="text-2xl font-bold text-teal-800 mt-1">{careCircle.activeMembersCount}</div>
            <span className="text-[11px] text-teal-700">Family & clinicians</span>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[var(--main-text)]">
              Caregiver Shift Handover Synchronization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Signed-off Handovers:</span>
                <strong className="text-emerald-700">{careCircle.handoversAcknowledged} bilateral sign-offs</strong>
              </div>
              <div className="flex justify-between">
                <span>Handovers Awaiting Incoming Sign-off:</span>
                <strong className="text-amber-700">{careCircle.handoversPending} pending</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
