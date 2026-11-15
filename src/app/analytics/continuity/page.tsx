'use client';

import * as React from 'react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AnalyticsNavTabs } from '@/components/features/analytics/analytics-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import { getCareAnalytics } from '@/lib/data/timeline-analytics-data';

export default function ContinuityAnalyticsPage() {
  const analytics = getCareAnalytics('patient-profile-001', '30d');
  const { continuity } = analytics;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Analytics', href: '/analytics' }, { label: 'Continuity Engine' }]}
      pageTitle="Care Continuity & Directive Governance Analytics"
      pageDescription="Clinical instruction verifications, downstream impact reviews, and synchronization status."
    >
      <PageContainer>
        <AnalyticsNavTabs />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Verified Directives</span>
            <div className="text-2xl font-bold text-indigo-800 mt-1">{continuity.verifiedInstructions}</div>
            <span className="text-[11px] text-indigo-700">Active protocols</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Pending Review</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{continuity.pendingInstructions}</div>
            <span className="text-[11px] text-amber-700">Awaiting clinical verification</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Synchronized Reviews</span>
            <div className="text-2xl font-bold text-teal-800 mt-1">{continuity.approvedImplementations}</div>
            <span className="text-[11px] text-teal-700">Approved downstream updates</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">In Clarification</span>
            <div className="text-2xl font-bold text-rose-800 mt-1">{continuity.clarificationsRequested}</div>
            <span className="text-[11px] text-rose-700">Author query pending</span>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[var(--main-text)]">
              Protocol Governance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Total Stored Instructions:</span>
                <strong>{continuity.totalInstructions}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Continuity Reviews:</span>
                <strong>{continuity.totalReviews}</strong>
              </div>
              <div className="flex justify-between">
                <span>Rejected Changes:</span>
                <strong className="text-rose-700">{continuity.rejectedReviews}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
