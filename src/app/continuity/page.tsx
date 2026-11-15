'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  GitCompare,
  Network,
  ClipboardCheck,
  History,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Pill,
  Calendar,
  CheckSquare,
  Users,
  Eye,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ContinuityNavTabs } from '@/components/features/continuity/continuity-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getCachedAnalyses,
  getCachedImpacts,
  getCachedContinuityReviews,
  getCachedJobs,
} from '@/lib/data/care-continuity-data';
import { ContinuityAnalysis, ContinuityReview } from '@/types/caretrace';

export default function ContinuityDashboardPage() {
  const [analyses, setAnalyses] = React.useState<ContinuityAnalysis[]>([]);
  const [reviews, setReviews] = React.useState<ContinuityReview[]>([]);
  const [impactCount, setImpactCount] = React.useState(0);
  const [completedJobCount, setCompletedJobCount] = React.useState(0);

  React.useEffect(() => {
    setAnalyses(getCachedAnalyses());
    setReviews(getCachedContinuityReviews());
    setImpactCount(getCachedImpacts().length);
    setCompletedJobCount(getCachedJobs().length);
  }, []);

  // Compute metrics
  const awaitingReviewCount = reviews.filter(
    (r) => r.reviewStatus === 'awaiting_human_review' || r.reviewStatus === 'needs_clarification'
  ).length;

  const changesWithImpactsCount = analyses.filter((a) => a.detectedImpactCount > 0).length;

  const approvedAwaitingImplementation = reviews.filter(
    (r) => r.reviewStatus === 'approved_for_downstream_update'
  ).length;

  const rejectedCount = reviews.filter((r) => r.reviewStatus === 'rejected').length;

  return (
    <AppShell
      breadcrumbs={[{ label: 'Continuity Engine' }]}
      pageTitle="Care Continuity Engine"
      pageDescription="Signature Healthcare Innovation: Continuous downstream awareness, deterministic change diffing, explainable relationship mapping, and mandatory human review gates."
    >
      <PageContainer>
        <ContinuityNavTabs />

        {/* CLINICAL SAFETY BANNER */}
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-900">
                Clinical Non-Prescribing Policy &amp; Zero Autonomous Activation
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                CARETRACE never independently calculates, recommends, or modifies medication dosages, frequencies, or therapy regimens.
                Every detected change is quarantined until explicitly verified by an authorized clinician or caregiver.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-100/60 border-emerald-300 text-emerald-900 text-xs shrink-0 font-semibold px-2.5 py-1">
            Safe Engine v10.0
          </Badge>
        </div>

        {/* UNREVIEWED CONTINUITY ALERT */}
        {awaitingReviewCount > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {awaitingReviewCount} Care Instruction {awaitingReviewCount === 1 ? 'Change' : 'Changes'} Awaiting Human Review
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Downstream care tasks, monitoring guidelines, or medication references may be misaligned with updated clinical instructions.
                  Immediate human sign-off is required before synchronization.
                </p>
              </div>
            </div>
            <Link href="/continuity/reviews" className="shrink-0">
              <Button size="sm" className="bg-amber-800 hover:bg-amber-900 text-white font-semibold flex items-center gap-2">
                Open Review Queue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* SUMMARY METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <Card className="border-[var(--subtle-border)] bg-white p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--secondary-text)] mb-1">
              <span>Analyzed Changes</span>
              <GitCompare className="w-4 h-4 text-[var(--primary-teal)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--main-text)]">{analyses.length}</div>
            <div className="text-[11px] text-[var(--secondary-text)] mt-1">Version diffs captured</div>
          </Card>

          <Card className="border-[var(--subtle-border)] bg-white p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--secondary-text)] mb-1">
              <span>Impacted Records</span>
              <Network className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">{impactCount}</div>
            <div className="text-[11px] text-[var(--secondary-text)] mt-1">Across 4 care modules</div>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
              <span>Awaiting Review</span>
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-bold text-amber-900">{awaitingReviewCount}</div>
            <div className="text-[11px] text-amber-800 mt-1">Human gate required</div>
          </Card>

          <Card className="border-blue-200 bg-blue-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900 mb-1">
              <span>Ready for Sync</span>
              <ClipboardCheck className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{approvedAwaitingImplementation}</div>
            <div className="text-[11px] text-blue-800 mt-1">Clinically approved</div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1">
              <span>Executed Syncs</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-emerald-900">{completedJobCount}</div>
            <div className="text-[11px] text-emerald-800 mt-1">Audit-logged updates</div>
          </Card>

          <Card className="border-[var(--subtle-border)] bg-white p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--secondary-text)] mb-1">
              <span>Rejected / Quarantined</span>
              <Lock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-900">{rejectedCount}</div>
            <div className="text-[11px] text-[var(--secondary-text)] mt-1">Safety block enforced</div>
          </Card>
        </div>

        {/* VISUAL RELATIONSHIP & CONTINUITY FLOW MAP */}
        <Card className="border-[var(--subtle-border)] bg-gradient-to-r from-teal-50/30 via-white to-slate-50 mb-8 overflow-hidden rounded-2xl shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-[var(--subtle-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                  <Network className="w-5 h-5 text-[var(--primary-teal)]" />
                  Deterministic Continuity Mapping &amp; Gate Architecture
                </CardTitle>
                <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                  How CARETRACE connects instruction revisions to downstream operations without prescribing or autonomous modifications.
                </p>
              </div>
              <Link href="/continuity/impact">
                <Button variant="outline" size="sm" className="text-xs font-medium flex items-center gap-1.5">
                  Inspect Impact Matrix
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl border border-teal-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-800 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[11px]">1</span>
                  Instruction Vault
                </div>
                <p className="text-xs font-medium text-[var(--main-text)]">New Version Created</p>
                <p className="text-[11px] text-[var(--secondary-text)] mt-1">
                  E.g., Metoprolol withholding threshold updated from 110 mmHg to 100 mmHg.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-800 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[11px]">2</span>
                  Continuity Engine
                </div>
                <p className="text-xs font-medium text-[var(--main-text)]">Deterministic Diff</p>
                <p className="text-[11px] text-[var(--secondary-text)] mt-1">
                  Identifies modified parameters and queries relational links across records.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-800 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[11px]">3</span>
                  Downstream Matrix
                </div>
                <p className="text-xs font-medium text-[var(--main-text)]">Explainable Impact</p>
                <p className="text-[11px] text-[var(--secondary-text)] mt-1">
                  Maps 4 records: Medication, Morning Dose, Care Task #3, and Shift Handover.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[11px]">4</span>
                  Human Gate
                </div>
                <p className="text-xs font-medium text-[var(--main-text)]">Clinical Review</p>
                <p className="text-[11px] text-[var(--secondary-text)] mt-1">
                  Clinician reviews version diff, approves or excludes records with mandatory rationale.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-white shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[11px]">5</span>
                  Controlled Sync
                </div>
                <p className="text-xs font-medium text-[var(--main-text)]">Non-Prescribing Sync</p>
                <p className="text-[11px] text-[var(--secondary-text)] mt-1">
                  Optimistic version lock checked. Task guidance updated with non-repudiable audit log.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DETECTED CHANGES RECENT FEED */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-[var(--primary-teal)]" />
                Detected Instruction Changes
              </h2>
              <p className="text-xs text-[var(--secondary-text)]">
                Instruction events automatically analyzed for downstream implications.
              </p>
            </div>
            <Link href="/continuity/changes">
              <Button variant="outline" size="sm" className="text-xs">
                View All Changes ({analyses.length})
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {analyses.map((analysis) => {
              const review = reviews.find((r) => r.analysisId === analysis.id);

              return (
                <Card
                  key={analysis.id}
                  className="border-[var(--subtle-border)] hover:border-[var(--primary-teal)]/40 transition-all bg-white p-4 sm:p-5 rounded-xl shadow-2xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
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
                          <Badge variant="outline" className="text-xs font-mono bg-slate-50">
                            v{analysis.previousVersionNumber} → v{analysis.currentVersionNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-mono bg-slate-50">
                            v{analysis.currentVersionNumber}
                          </Badge>
                        )}

                        <span className="text-xs text-[var(--secondary-text)]">
                          Analyzed {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[var(--main-text)]">
                        {analysis.instructionTitle}
                      </h3>

                      {/* Diff preview pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {analysis.diffSummary.map((diff, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-md font-mono ${
                              diff.changeType === 'modified'
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : diff.changeType === 'added'
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                : 'bg-rose-50 text-rose-900 border border-rose-200'
                            }`}
                          >
                            <span className="font-semibold mr-1">{diff.field}:</span> {diff.changeType}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right side status & action */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--subtle-border)]">
                      <div className="text-left lg:text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                          <Network className="w-3.5 h-3.5" />
                          {analysis.detectedImpactCount} Downstream {analysis.detectedImpactCount === 1 ? 'Record' : 'Records'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/continuity/changes/${analysis.id}`}>
                          <Button variant="outline" size="sm" className="text-xs font-medium">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Diff
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
                              {review.reviewStatus === 'awaiting_human_review' ? 'Review Now' : 'View Review'}
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
        </div>

        {/* BOTTOM NAV SHORTCUTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Link href="/continuity/impact" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-[var(--primary-teal)] transition-all bg-white p-4 rounded-xl shadow-2xs group">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg w-fit mb-2 group-hover:bg-purple-100 transition-colors">
                <Network className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--main-text)] group-hover:text-[var(--primary-teal)] transition-colors">
                Downstream Impact Matrix
              </h4>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Explore affected medications, dose events, care tasks, and appointments grouped by relationship type.
              </p>
            </Card>
          </Link>

          <Link href="/continuity/reviews" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-[var(--primary-teal)] transition-all bg-white p-4 rounded-xl shadow-2xs group">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg w-fit mb-2 group-hover:bg-amber-100 transition-colors">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--main-text)] group-hover:text-[var(--primary-teal)] transition-colors">
                Human Review Workflows
              </h4>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Submit clinical approvals, request author clarification, or escalate complex instruction diffs.
              </p>
            </Card>
          </Link>

          <Link href="/continuity/history" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-[var(--primary-teal)] transition-all bg-white p-4 rounded-xl shadow-2xs group">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg w-fit mb-2 group-hover:bg-emerald-100 transition-colors">
                <History className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[var(--main-text)] group-hover:text-[var(--primary-teal)] transition-colors">
                Audit Trail &amp; Sync Jobs
              </h4>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Inspect immutable execution records, optimistic lock verifications, and non-repudiable audit logs.
              </p>
            </Card>
          </Link>
        </div>
      </PageContainer>
    </AppShell>
  );
}
