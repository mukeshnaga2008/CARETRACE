'use client';

import * as React from 'react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AnalyticsNavTabs } from '@/components/features/analytics/analytics-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { getCareAnalytics } from '@/lib/data/timeline-analytics-data';

export default function AppointmentAnalyticsPage() {
  const analytics = getCareAnalytics('patient-profile-001', '30d');
  const { appointments } = analytics;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Analytics', href: '/analytics' }, { label: 'Appointments' }]}
      pageTitle="Clinical Appointment Intelligence & Readiness Analytics"
      pageDescription="Consultation completion velocity, pre-visit checklist preparation rates, and post-visit order fulfillment."
    >
      <PageContainer>
        <AnalyticsNavTabs />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Upcoming Visits</span>
            <div className="text-2xl font-bold text-blue-800 mt-1">{appointments.upcomingCount}</div>
            <span className="text-[11px] text-blue-700">Scheduled consultations</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Completed Visits</span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{appointments.completedCount}</div>
            <span className="text-[11px] text-emerald-700">With documented notes</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Cancelled/Rescheduled</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{appointments.cancelledCount + appointments.rescheduledCount}</div>
            <span className="text-[11px] text-amber-700">Visit changes</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Prep Completion</span>
            <div className="text-2xl font-bold text-teal-800 mt-1">{appointments.prepCompletionRate}%</div>
            <span className="text-[11px] text-teal-700">Pre-visit checklists</span>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[var(--main-text)]">
              Follow-up Task Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Total Clinical Follow-up Tasks:</span>
                <strong>{appointments.totalFollowUpTasks} orders</strong>
              </div>
              <div className="flex justify-between">
                <span>Completed / Scheduled Follow-ups:</span>
                <strong className="text-emerald-700">{appointments.completedFollowUps} fulfilled</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
