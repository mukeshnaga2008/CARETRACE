'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Search,
  Filter,
  User,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareGapsNavTabs } from '@/components/features/care-gaps/care-gaps-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getCachedCareGaps } from '@/lib/data/care-gap-intelligence-data';
import { getCachedTasks, getCachedHandovers } from '@/lib/data/care-circle-data';
import { CareGapRecord, CareTask, CareHandover } from '@/types/caretrace';

export default function TaskGapsPage() {
  const [gaps, setGaps] = React.useState<CareGapRecord[]>([]);
  const [tasks, setTasks] = React.useState<CareTask[]>([]);
  const [handovers, setHandovers] = React.useState<CareHandover[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  React.useEffect(() => {
    const allGaps = getCachedCareGaps().filter((g) => g.category === 'responsibility');
    setGaps(allGaps);
    setTasks(getCachedTasks());
    setHandovers(getCachedHandovers());
  }, []);

  const activeGaps = gaps.filter((g) => g.status !== 'resolved' && g.status !== 'dismissed');

  const filteredGaps = activeGaps.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.explanation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || g.gapType === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Care Gap Radar', href: '/care-gaps' },
        { label: 'Responsibility Gaps' },
      ]}
      pageTitle="Care Responsibility &amp; Task Gaps"
      pageDescription="Surveillance of unassigned responsibilities, overdue monitoring tasks, pending acceptances, and unacknowledged shift handovers."
    >
      <PageContainer>
        <CareGapsNavTabs />

        {/* TOP NOTICE */}
        <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-lg shrink-0 mt-0.5">
            <Users className="w-5 h-5 text-teal-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-900">
              Accountability &amp; Care Circle Handoff Integrity
            </h3>
            <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
              Every care responsibility requires an active owner. CARETRACE surfaces tasks with no owner or unacknowledged shift handoffs
              so family members and visiting nurses stay coordinated without dropping duties.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search responsibility gaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-[var(--subtle-border)]"
            />
          </div>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-56 text-xs bg-white border-[var(--subtle-border)]"
            options={[
              { value: 'all', label: 'All Responsibility Types' },
              { value: 'unassigned_care_task', label: 'Unassigned Tasks' },
              { value: 'overdue_task', label: 'Overdue Tasks' },
              { value: 'unacknowledged_shift_handover', label: 'Unacknowledged Handovers' },
              { value: 'assignment_awaiting_acceptance', label: 'Pending Acceptance' },
            ]}
          />
        </div>

        {/* GAPS LIST */}
        {filteredGaps.length === 0 ? (
          <Card className="p-8 text-center bg-white border-[var(--subtle-border)] rounded-2xl">
            <CheckSquare className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--main-text)]">No responsibility gaps found</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              All care tasks have assigned owners and shift handovers have been acknowledged.
            </p>
          </Card>
        ) : (
          <div className="space-y-4 mb-8">
            {filteredGaps.map((gap) => (
              <Card
                key={gap.id}
                className="border-[var(--subtle-border)] hover:border-teal-400 transition-all bg-white p-5 rounded-2xl shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          gap.priority === 'high_priority'
                            ? 'bg-red-50 text-red-900 border-red-300 font-bold text-[10px]'
                            : 'bg-amber-50 text-amber-900 border-amber-300 font-semibold text-[10px]'
                        }
                      >
                        {gap.priority.replace(/_/g, ' ')}
                      </Badge>

                      <Badge variant="outline" className="text-[10px] font-mono bg-slate-50">
                        {gap.gapType}
                      </Badge>

                      <span className="text-xs text-[var(--secondary-text)] ml-auto">
                        Detected: {new Date(gap.detectedAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--main-text)]">
                      {gap.title}
                    </h3>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {gap.explanation}
                    </p>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong>Reason: </strong> {gap.priorityReason}
                      </div>
                      <div>
                        {gap.assignedToName ? (
                          <span className="text-blue-800 font-medium">
                            Owner: <strong>{gap.assignedToName}</strong> ({gap.assignedToRole})
                          </span>
                        ) : (
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unassigned Task
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center lg:flex-col justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--subtle-border)]">
                    <Link href={`/care-gaps/${gap.id}`}>
                      <Button size="sm" className="bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white font-semibold text-xs">
                        Inspect &amp; Assign
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>

                    {gap.actionRoute && (
                      <Link href={gap.actionRoute}>
                        <Button variant="ghost" size="sm" className="text-xs text-[var(--secondary-text)]">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {gap.actionLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* BOTTOM CARE CIRCLE SHORTCUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/care-circle/tasks" className="block">
            <Card className="border-[var(--subtle-border)] hover:border-teal-400 transition-all bg-white p-4 rounded-xl shadow-2xs group">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="w-4 h-4 text-teal-700" />
                <h4 className="text-sm font-bold text-[var(--main-text)] group-hover:text-teal-700">
                  Care Task Registry ({tasks.length} tasks)
                </h4>
              </div>
              <p className="text-xs text-[var(--secondary-text)]">
                Manage day-to-day care tasks, vital checks, and companion duties.
              </p>
            </Card>
          </Link>

          <Link href="/care-circle/handover" className="block">
            <Card className="border-[var(--subtle-border)] hover:border-teal-400 transition-all bg-white p-4 rounded-xl shadow-2xs group">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-700" />
                <h4 className="text-sm font-bold text-[var(--main-text)] group-hover:text-blue-700">
                  Shift Handover Ledger ({handovers.length} handovers)
                </h4>
              </div>
              <p className="text-xs text-[var(--secondary-text)]">
                Review morning and evening caregiver transitions and sign off on reports.
              </p>
            </Card>
          </Link>
        </div>
      </PageContainer>
    </AppShell>
  );
}
