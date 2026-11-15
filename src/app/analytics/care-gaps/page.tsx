'use client';

import * as React from 'react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AnalyticsNavTabs } from '@/components/features/analytics/analytics-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { getCareAnalytics } from '@/lib/data/timeline-analytics-data';

export default function CareGapsAnalyticsPage() {
  const analytics = getCareAnalytics('patient-profile-001', '30d');
  const { careGaps } = analytics;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Analytics', href: '/analytics' }, { label: 'Care Gaps' }]}
      pageTitle="Care Gap Radar Analytics & Resolution Trends"
      pageDescription="Detection rates, resolution velocity, and category distribution across medication and coordination gaps."
    >
      <PageContainer>
        <AnalyticsNavTabs />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Total Detected</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{careGaps.totalDetected}</div>
            <span className="text-[11px] text-slate-600">Surveillance triggers</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Active Open Gaps</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{careGaps.openGaps}</div>
            <span className="text-[11px] text-amber-700">Awaiting coordination</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Resolved Gaps</span>
            <div className="text-2xl font-bold text-emerald-800 mt-1">{careGaps.resolvedGaps}</div>
            <span className="text-[11px] text-emerald-700">Documented resolution</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Overdue Gaps</span>
            <div className="text-2xl font-bold text-rose-800 mt-1">{careGaps.overdueGaps}</div>
            <span className="text-[11px] text-rose-700">Attention required</span>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[var(--main-text)]">
              Category Distribution Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-3">
              {careGaps.categoryBreakdown.map((item) => {
                const total = careGaps.totalDetected || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.category}</span>
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
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
