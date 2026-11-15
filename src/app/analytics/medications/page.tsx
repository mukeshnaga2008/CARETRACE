'use client';

import * as React from 'react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AnalyticsNavTabs } from '@/components/features/analytics/analytics-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCareAnalytics } from '@/lib/data/timeline-analytics-data';

export default function MedicationAnalyticsPage() {
  const analytics = getCareAnalytics('patient-profile-001', '30d');
  const { medications } = analytics;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Analytics', href: '/analytics' }, { label: 'Medications' }]}
      pageTitle="Medication Adherence & Schedule Analytics"
      pageDescription="Operational breakdown of scheduled doses, self-reported taken logs, clinical withholdings, and omissions."
    >
      <PageContainer>
        <AnalyticsNavTabs />

        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-950 space-y-1">
            <span className="font-bold block">Calculation Transparency & Safety Rule</span>
            <p className="leading-relaxed">
              Reported Adherence Rate = <strong>{medications.reportedAdherenceRate}%</strong>.
              Formula: <code className="bg-white px-1.5 py-0.5 rounded border border-purple-200 font-mono">Reported Taken ({medications.reportedTaken}) / ({medications.reportedTaken} Taken + {medications.missed} Missed + {medications.skipped} Withheld)</code>.
              Unconfirmed future doses ({medications.scheduledUpcoming}) are not counted as taken or missed. Self-reported taken logs do not prove biological ingestion or clinical efficacy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Reported Taken</span>
            <div className="text-2xl font-bold text-teal-800 mt-1">{medications.reportedTaken}</div>
            <span className="text-[11px] text-teal-700">Self-reported doses</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Missed Doses</span>
            <div className="text-2xl font-bold text-rose-800 mt-1">{medications.missed}</div>
            <span className="text-[11px] text-rose-700">Omissions logged</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Withheld (Skipped)</span>
            <div className="text-2xl font-bold text-amber-800 mt-1">{medications.skipped}</div>
            <span className="text-[11px] text-amber-700">Protocol withholdings</span>
          </Card>
          <Card className="p-4 border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Unconfirmed Overdue</span>
            <div className="text-2xl font-bold text-slate-700 mt-1">{medications.unconfirmedOverdue}</div>
            <span className="text-[11px] text-slate-500">Past time window</span>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[var(--main-text)]">
              Dose Event Status Distribution
            </CardTitle>
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
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
