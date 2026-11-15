'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  User,
  GitCompare,
  Network,
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
  getCachedContinuityReviews,
  getCachedAnalyses,
  getCachedImpacts,
} from '@/lib/data/care-continuity-data';
import { ContinuityReview, ContinuityAnalysis, ContinuityImpactRecord } from '@/types/caretrace';

export default function ContinuityReviewQueuePage() {
  const [reviews, setReviews] = React.useState<ContinuityReview[]>([]);
  const [analyses, setAnalyses] = React.useState<ContinuityAnalysis[]>([]);
  const [impacts, setImpacts] = React.useState<ContinuityImpactRecord[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    setReviews(getCachedContinuityReviews());
    setAnalyses(getCachedAnalyses());
    setImpacts(getCachedImpacts());
  }, []);

  const filteredReviews = reviews.filter((rev) => {
    const matchesSearch =
      rev.instructionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rev.assignedReviewerName && rev.assignedReviewerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rev.decisionRationale && rev.decisionRationale.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || rev.reviewStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ContinuityReview['reviewStatus']) => {
    switch (status) {
      case 'awaiting_human_review':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-semibold">
            <Clock className="w-3 h-3 mr-1" />
            Awaiting Review
          </Badge>
        );
      case 'needs_clarification':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300 font-semibold">
            <HelpCircle className="w-3 h-3 mr-1" />
            Needs Clarification
          </Badge>
        );
      case 'approved_for_downstream_update':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved for Sync
          </Badge>
        );
      case 'implementation_completed':
        return (
          <Badge variant="outline" className="bg-teal-50 text-teal-900 border-teal-300 font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sync Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-900 border-rose-300 font-semibold">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-300">
            {status.replace(/_/g, ' ')}
          </Badge>
        );
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Continuity Engine', href: '/continuity' },
        { label: 'Review Queue' },
      ]}
      pageTitle="Continuity Human Review Queue"
      pageDescription="Mandatory human-in-the-loop clinical gates. Reviews must be completed before downstream care records can be synchronized."
    >
      <PageContainer>
        <ContinuityNavTabs />

        {/* TOP SAFETY NOTICE */}
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Human Reviewer Authority &amp; Clinical Safety Gate
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
              Care Continuity reviews verify that clinical instruction changes are safely reflected in care tasks, schedules, and caregiver notes.
              A decision rationale is mandatory for every action to ensure an auditable chain of custody.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search reviews by title, reviewer, or rationale..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-[var(--subtle-border)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-52 text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Review Statuses' },
                { value: 'awaiting_human_review', label: 'Awaiting Human Review' },
                { value: 'needs_clarification', label: 'Needs Clarification' },
                { value: 'approved_for_downstream_update', label: 'Approved for Update' },
                { value: 'implementation_completed', label: 'Sync Completed' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
        </div>

        {/* REVIEWS LIST */}
        {filteredReviews.length === 0 ? (
          <Card className="p-8 text-center bg-white border-[var(--subtle-border)] rounded-2xl">
            <ClipboardCheck className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--main-text)]">No reviews match the selected filter</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              Select another status filter or clear the search query.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const reviewImpacts = impacts.filter((imp) => imp.analysisId === review.analysisId);

              return (
                <Card
                  key={review.id}
                  className="border-[var(--subtle-border)] hover:border-[var(--primary-teal)]/50 transition-all bg-white p-5 rounded-2xl shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    <div className="space-y-3 flex-1">
                      {/* Top badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(review.reviewStatus)}

                        {review.previousVersionNumber ? (
                          <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                            v{review.previousVersionNumber} → v{review.currentVersionNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                            v{review.currentVersionNumber}
                          </Badge>
                        )}

                        <span className="text-xs text-[var(--secondary-text)]">
                          Created {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-[var(--main-text)]">
                        {review.instructionTitle}
                      </h3>

                      {/* Review details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--secondary-text)]">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>
                            Assigned to: <strong>{review.assignedReviewerName || review.assignedReviewerRole}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Network className="w-4 h-4 text-purple-600" />
                          <span>
                            Affected Records: <strong>{reviewImpacts.length}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Clarification or Decision notice */}
                      {review.clarificationQuestion && (
                        <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900">
                          <strong>Clarification Requested: </strong>
                          {review.clarificationQuestion}
                        </div>
                      )}

                      {review.decisionRationale && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                          <strong>Clinical Decision Rationale: </strong>
                          {review.decisionRationale}
                          {(review.decisionSubmittedByName || review.decidedByName) && (
                            <span className="text-[var(--secondary-text)] ml-1">
                              (signed by {review.decisionSubmittedByName || review.decidedByName})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right action button */}
                    <div className="shrink-0 flex items-center lg:items-end lg:flex-col justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--subtle-border)]">
                      <Link href={`/continuity/reviews/${review.id}`}>
                        <Button
                          className={
                            review.reviewStatus === 'awaiting_human_review'
                              ? 'bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs flex items-center gap-2'
                              : 'bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white font-semibold text-xs flex items-center gap-2'
                          }
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          {review.reviewStatus === 'awaiting_human_review'
                            ? 'Begin Clinical Review'
                            : 'View Review Details'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
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
