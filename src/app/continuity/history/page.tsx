'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Network,
  GitCompare,
  User,
  ArrowRight,
  Zap,
  Lock,
  ClipboardCheck,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ContinuityNavTabs } from '@/components/features/continuity/continuity-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  getCachedContinuityReviews,
  getCachedJobs,
  getCachedAnalyses,
} from '@/lib/data/care-continuity-data';
import {
  ContinuityReview,
  ContinuityImplementationJob,
  ContinuityAnalysis,
} from '@/types/caretrace';

export default function ContinuityAuditHistoryPage() {
  const [reviews, setReviews] = React.useState<ContinuityReview[]>([]);
  const [jobs, setJobs] = React.useState<ContinuityImplementationJob[]>([]);
  const [analyses, setAnalyses] = React.useState<ContinuityAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [tabView, setTabView] = React.useState<'all' | 'jobs' | 'reviews'>('all');

  React.useEffect(() => {
    setReviews(getCachedContinuityReviews());
    setJobs(getCachedJobs());
    setAnalyses(getCachedAnalyses());
  }, []);

  const completedReviews = reviews.filter(
    (r) => r.reviewStatus === 'implementation_completed' || r.reviewStatus === 'rejected'
  );

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Continuity Engine', href: '/continuity' },
        { label: 'Audit History' },
      ]}
      pageTitle="Continuity Audit History &amp; Execution Ledger"
      pageDescription="Complete, non-repudiable audit trail of detected instruction revisions, human clinical reviews, and controlled downstream synchronizations."
    >
      <PageContainer>
        <ContinuityNavTabs />

        {/* INTEGRITY GUARANTEE BANNER */}
        <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-teal-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-900">
              Non-Repudiable Clinical Audit Trail &amp; Concurrency Ledger
            </h3>
            <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
              Every detected diff, review decision rationale, reviewer signature, and downstream synchronization is permanently recorded.
              CARETRACE verifies optimistic version locks before executing any synchronization to prevent race conditions and stale instruction application.
            </p>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-2 mb-6 border-b border-[var(--subtle-border)] pb-3">
          <button
            onClick={() => setTabView('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabView === 'all'
                ? 'bg-[var(--primary-teal)] text-white shadow-xs'
                : 'text-[var(--secondary-text)] hover:bg-slate-100'
            }`}
          >
            All Activity ({jobs.length + reviews.length})
          </button>
          <button
            onClick={() => setTabView('jobs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabView === 'jobs'
                ? 'bg-[var(--primary-teal)] text-white shadow-xs'
                : 'text-[var(--secondary-text)] hover:bg-slate-100'
            }`}
          >
            Executed Sync Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setTabView('reviews')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tabView === 'reviews'
                ? 'bg-[var(--primary-teal)] text-white shadow-xs'
                : 'text-[var(--secondary-text)] hover:bg-slate-100'
            }`}
          >
            Clinical Review Decisions ({reviews.length})
          </button>
        </div>

        {/* EXECUTED SYNC JOBS SECTION */}
        {(tabView === 'all' || tabView === 'jobs') && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Executed Downstream Synchronization Jobs ({jobs.length})
              </h2>
            </div>

            {jobs.length === 0 ? (
              <Card className="p-6 text-center text-xs text-[var(--secondary-text)] bg-white border-[var(--subtle-border)]">
                No implementation jobs executed yet.
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const jobReview = reviews.find((r) => r.id === job.reviewId);

                  return (
                    <Card
                      key={job.id}
                      className="border-[var(--subtle-border)] bg-white p-5 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-800">Job: {job.id}</span>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                                {job.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-[var(--secondary-text)] mt-0.5">
                              Executed on {new Date(job.executedAt || job.createdAt).toLocaleString()} by <strong>{job.executedByName}</strong>
                            </div>
                          </div>
                        </div>

                        {jobReview && (
                          <Link href={`/continuity/reviews/${jobReview.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Inspect Review
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Audit records table */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          Executed Non-Prescribing Audit Records ({job.executedAuditRecords.length})
                        </div>
                        <div className="space-y-1.5">
                          {job.executedAuditRecords.map((aud, i) => (
                            <div
                              key={i}
                              className="text-xs font-mono p-2 bg-white rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                            >
                              <div>
                                <span className="font-bold text-teal-800">{aud.action}</span>
                                <span className="text-slate-600 ml-1">
                                  on {aud.recordType} ({aud.recordId})
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">Lock Verified</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CLINICAL REVIEWS DECISION LEDGER */}
        {(tabView === 'all' || tabView === 'reviews') && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[var(--primary-teal)]" />
              Clinical Review Determinations ({reviews.length})
            </h2>

            <div className="space-y-3">
              {reviews.map((rev) => (
                <Card
                  key={rev.id}
                  className="border-[var(--subtle-border)] bg-white p-5 rounded-2xl shadow-xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          rev.reviewStatus === 'implementation_completed'
                            ? 'bg-teal-50 text-teal-800 border-teal-300 text-xs'
                            : rev.reviewStatus === 'approved_for_downstream_update'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 text-xs'
                            : rev.reviewStatus === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-300 text-xs'
                            : 'bg-amber-50 text-amber-800 border-amber-300 text-xs'
                        }
                      >
                        {rev.reviewStatus.replace(/_/g, ' ')}
                      </Badge>

                      <span className="text-xs font-bold text-[var(--main-text)]">
                        {rev.instructionTitle}
                      </span>
                    </div>

                    <span className="text-xs text-[var(--secondary-text)]">
                      Updated: {new Date(rev.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {rev.decisionRationale && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800">
                      <strong>Documented Rationale: </strong>
                      {rev.decisionRationale}
                      {(rev.decisionSubmittedByName || rev.decidedByName) && (
                        <span className="text-slate-500 ml-1">
                          (signed by {rev.decisionSubmittedByName || rev.decidedByName})
                        </span>
                      )}
                    </div>
                  )}

                  {rev.clarificationQuestion && (
                    <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900">
                      <strong>Clarification Requested: </strong>
                      {rev.clarificationQuestion}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs text-[var(--secondary-text)]">
                    <span>
                      Reviewer: <strong>{rev.assignedReviewerName || rev.assignedReviewerRole}</strong>
                    </span>
                    <Link href={`/continuity/reviews/${rev.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Review Details
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
