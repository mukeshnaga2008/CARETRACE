'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  GitCompare,
  Search,
  Filter,
  Eye,
  ArrowRight,
  ClipboardCheck,
  AlertCircle,
  Network,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ContinuityNavTabs } from '@/components/features/continuity/continuity-nav-tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  getCachedAnalyses,
  getCachedContinuityReviews,
} from '@/lib/data/care-continuity-data';
import { ContinuityAnalysis, ContinuityReview } from '@/types/caretrace';

export default function ContinuityChangesPage() {
  const [analyses, setAnalyses] = React.useState<ContinuityAnalysis[]>([]);
  const [reviews, setReviews] = React.useState<ContinuityReview[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [eventFilter, setEventFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    setAnalyses(getCachedAnalyses());
    setReviews(getCachedContinuityReviews());
  }, []);

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch =
      item.instructionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.diffSummary.some(
        (d) =>
          d.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(d.currentValue || '').toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesEvent = eventFilter === 'all' || item.eventType === eventFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Continuity Engine', href: '/continuity' },
        { label: 'Detected Changes' },
      ]}
      pageTitle="Detected Instruction Changes"
      pageDescription="Comprehensive registry of clinical instruction revisions, deterministic parameter comparisons, and analyzed care impacts."
    >
      <PageContainer>
        <ContinuityNavTabs />

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search changes by title, parameter, or diff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-[var(--subtle-border)]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-44 text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Event Types' },
                { value: 'new_version_created', label: 'New Version Created' },
                { value: 'instruction_rejected', label: 'Instruction Rejected' },
                { value: 'instruction_verified', label: 'Instruction Verified' },
                { value: 'instruction_superseded', label: 'Instruction Superseded' },
              ]}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-44 text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Review Statuses' },
                { value: 'awaiting_human_review', label: 'Awaiting Human Review' },
                { value: 'needs_clarification', label: 'Needs Clarification' },
                { value: 'approved_for_downstream_update', label: 'Approved for Update' },
                { value: 'implementation_completed', label: 'Sync Completed' },
                { value: 'rejected', label: 'Rejected / Blocked' },
              ]}
            />
          </div>
        </div>

        {/* FEED LIST */}
        {filteredAnalyses.length === 0 ? (
          <Card className="p-8 text-center bg-white border-[var(--subtle-border)] rounded-2xl">
            <GitCompare className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--main-text)]">No instruction changes match criteria</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              Try adjusting your search query or clearing status filters.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => {
              const review = reviews.find((r) => r.analysisId === analysis.id);

              return (
                <Card
                  key={analysis.id}
                  className="border-[var(--subtle-border)] hover:border-[var(--primary-teal)]/50 transition-all bg-white p-5 rounded-2xl shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    <div className="space-y-3 flex-1">
                      {/* Top tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            analysis.eventType === 'new_version_created'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : analysis.eventType === 'instruction_rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }
                        >
                          {analysis.eventType.replace(/_/g, ' ')}
                        </Badge>

                        {analysis.previousVersionNumber ? (
                          <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                            v{analysis.previousVersionNumber} → v{analysis.currentVersionNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                            v{analysis.currentVersionNumber}
                          </Badge>
                        )}

                        <span className="text-xs text-[var(--secondary-text)]">
                          Recorded: {new Date(analysis.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-[var(--main-text)]">
                        {analysis.instructionTitle}
                      </h3>

                      {/* Diff summary box */}
                      <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-text)]">
                          Deterministic Field Diffs ({analysis.diffSummary.length})
                        </div>
                        <div className="space-y-1.5">
                          {analysis.diffSummary.map((diff, idx) => (
                            <div key={idx} className="text-xs font-mono grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-baseline">
                              <span className="sm:col-span-3 font-semibold text-slate-700 flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    diff.changeType === 'modified'
                                      ? 'bg-amber-500'
                                      : diff.changeType === 'added'
                                      ? 'bg-emerald-500'
                                      : 'bg-rose-500'
                                  }`}
                                />
                                {diff.field}:
                              </span>
                              <div className="sm:col-span-9 text-slate-800 break-words">
                                {diff.changeType === 'modified' ? (
                                  <span>
                                    <span className="line-through text-rose-800 bg-rose-50 px-1 py-0.5 rounded mr-1.5">
                                      {String(diff.previousValue || '')}
                                    </span>
                                    <span className="text-emerald-900 bg-emerald-50 px-1 py-0.5 rounded font-semibold">
                                      {String(diff.currentValue || '')}
                                    </span>
                                  </span>
                                ) : diff.changeType === 'added' ? (
                                  <span className="text-emerald-900 bg-emerald-50 px-1 py-0.5 rounded font-semibold">
                                    + {Array.isArray(diff.currentValue) ? diff.currentValue.join(', ') : String(diff.currentValue || '')}
                                  </span>
                                ) : (
                                  <span className="text-rose-900 bg-rose-50 px-1 py-0.5 rounded line-through">
                                    - {String(diff.previousValue || '')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right column status & CTAs */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--subtle-border)]">
                      <div className="space-y-1 text-left lg:text-right">
                        <Badge
                          variant="outline"
                          className={
                            analysis.status === 'awaiting_human_review'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : analysis.status === 'needs_clarification'
                              ? 'bg-blue-50 text-blue-900 border-blue-300'
                              : analysis.status === 'implementation_completed'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-rose-50 text-rose-900 border-rose-300'
                          }
                        >
                          {analysis.status.replace(/_/g, ' ')}
                        </Badge>
                        <div className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                          <Network className="w-3.5 h-3.5" />
                          {analysis.detectedImpactCount} downstream {analysis.detectedImpactCount === 1 ? 'record' : 'records'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/continuity/changes/${analysis.id}`}>
                          <Button variant="outline" size="sm" className="text-xs font-medium">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Detail Diff
                          </Button>
                        </Link>

                        {review && (
                          <Link href={`/continuity/reviews/${review.id}`}>
                            <Button
                              size="sm"
                              className={
                                review.reviewStatus === 'awaiting_human_review'
                                  ? 'bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold'
                                  : 'bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white text-xs font-semibold'
                              }
                            >
                              {review.reviewStatus === 'awaiting_human_review' ? 'Review Change' : 'View Decision'}
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
