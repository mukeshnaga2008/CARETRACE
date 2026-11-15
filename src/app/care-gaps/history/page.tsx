'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  History,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareGapsNavTabs } from '@/components/features/care-gaps/care-gaps-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  getCachedCareGaps,
  updateCareGapStatus,
} from '@/lib/data/care-gap-intelligence-data';
import { CareGapRecord } from '@/types/caretrace';

export default function CareGapsHistoryPage() {
  const [gaps, setGaps] = React.useState<CareGapRecord[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [reopenMessage, setReopenMessage] = React.useState('');

  React.useEffect(() => {
    const historical = getCachedCareGaps().filter(
      (g) => g.status === 'resolved' || g.status === 'dismissed'
    );
    setGaps(historical);
  }, []);

  const handleReopen = async (gapId: string) => {
    try {
      const res = await fetch(`/api/care-gaps/${gapId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId,
          status: 'reopened',
          note: 'Reopened from historical ledger for recurring coordination review.',
        }),
      });
      if (res.ok) {
        setGaps((prev) => prev.filter((g) => g.id !== gapId));
        setReopenMessage('Care gap reopened and returned to active surveillance.');
      }
    } catch {
      updateCareGapStatus(
        gapId,
        'reopened',
        'Sarah Jenkins, RN',
        'Visiting Nurse',
        'Reopened from history.'
      );
      setGaps((prev) => prev.filter((g) => g.id !== gapId));
      setReopenMessage('Care gap reopened.');
    }
  };

  const filteredGaps = gaps.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.resolutionDetails && g.resolutionDetails.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || g.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Care Gap Radar', href: '/care-gaps' },
        { label: 'Resolved History' },
      ]}
      pageTitle="Care Gap Audit History &amp; Resolution Ledger"
      pageDescription="Permanent, non-repudiable audit ledger of all resolved coordination gaps, documented clinician actions, and dismissed alerts."
    >
      <PageContainer>
        <CareGapsNavTabs />

        {/* TOP NOTICE */}
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900">
              Audit Integrity &amp; Non-Destructive Resolution Ledger
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
              Care gaps are never marked resolved merely because someone opened an alert. Every closed gap below contains documented resolution actions,
              verifier identity logs, and timestamps. Historical records are preserved permanently.
            </p>
          </div>
        </div>

        {reopenMessage && (
          <div className="mb-6 p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-teal-700" />
            {reopenMessage}
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search historical resolutions by action or patient note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-[var(--subtle-border)]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40 text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Closed Gaps' },
                { value: 'resolved', label: 'Resolved Only' },
                { value: 'dismissed', label: 'Dismissed Only' },
              ]}
            />

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-40 text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'medication', label: 'Medications' },
                { value: 'responsibility', label: 'Responsibilities' },
                { value: 'appointment', label: 'Appointments' },
                { value: 'instruction_continuity', label: 'Reviews' },
                { value: 'notification', label: 'Notifications' },
              ]}
            />
          </div>
        </div>

        {/* HISTORICAL GAPS LIST */}
        {filteredGaps.length === 0 ? (
          <Card className="p-8 text-center bg-white border-[var(--subtle-border)] rounded-2xl">
            <History className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--main-text)]">No closed care gaps match filter</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              Resolved and dismissed gaps will automatically appear here as care team members resolve items.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGaps.map((gap) => (
              <Card
                key={gap.id}
                className="border-[var(--subtle-border)] bg-white p-5 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          gap.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold text-xs'
                            : 'bg-slate-100 text-slate-800 border-slate-300 text-xs'
                        }
                      >
                        {gap.status.toUpperCase()}
                      </Badge>

                      <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider bg-slate-50">
                        {gap.category.replace(/_/g, ' ')}
                      </Badge>

                      <span className="text-xs font-mono text-[var(--secondary-text)]">
                        {gap.id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--main-text)]">
                      {gap.title}
                    </h3>

                    {gap.resolutionDetails && (
                      <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                        <strong>Documented Resolution: </strong>
                        {gap.resolutionDetails}
                        {gap.resolvedByName && (
                          <span className="text-emerald-800 ml-1">
                            (verified by {gap.resolvedByName} on {gap.resolvedAt ? new Date(gap.resolvedAt).toLocaleDateString() : ''})
                          </span>
                        )}
                      </div>
                    )}

                    {gap.dismissedReason && (
                      <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-800">
                        <strong>Dismissal Reason: </strong>
                        {gap.dismissedReason}
                        {gap.dismissedByName && (
                          <span className="text-slate-600 ml-1">
                            (dismissed by {gap.dismissedByName} on {gap.dismissedAt ? new Date(gap.dismissedAt).toLocaleDateString() : ''})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center sm:flex-col justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--subtle-border)]">
                    <Link href={`/care-gaps/${gap.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Audit Trail Details
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReopen(gap.id)}
                      className="text-xs text-[var(--secondary-text)] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reopen
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
