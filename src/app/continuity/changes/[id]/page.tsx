'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  GitCompare,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Network,
  Clock,
  CheckCircle2,
  Lock,
  Pill,
  Calendar,
  CheckSquare,
  Users,
  FileText,
  ClipboardCheck,
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
} from '@/lib/data/care-continuity-data';
import {
  ContinuityAnalysis,
  ContinuityImpactRecord,
  ContinuityReview,
} from '@/types/caretrace';

interface ChangeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ContinuityChangeDetailPage({ params }: ChangeDetailPageProps) {
  const { id } = React.use(params);
  const [analysis, setAnalysis] = React.useState<ContinuityAnalysis | null>(null);
  const [impacts, setImpacts] = React.useState<ContinuityImpactRecord[]>([]);
  const [review, setReview] = React.useState<ContinuityReview | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const allAnalyses = getCachedAnalyses();
    const found = allAnalyses.find((a) => a.id === id);
    if (found) {
      setAnalysis(found);
      const allImpacts = getCachedImpacts().filter((imp) => imp.analysisId === id);
      setImpacts(allImpacts);
      const allReviews = getCachedContinuityReviews();
      const r = allReviews.find((rev) => rev.analysisId === id);
      setReview(r || null);
    }
    setIsLoaded(true);
  }, [id]);

  if (isLoaded && !analysis) {
    return notFound();
  }

  if (!analysis) {
    return (
      <AppShell breadcrumbs={[{ label: 'Continuity Engine', href: '/continuity' }, { label: 'Loading...' }]}>
        <PageContainer>
          <div className="p-8 text-center text-sm text-[var(--secondary-text)]">Loading change analysis...</div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Continuity Engine', href: '/continuity' },
        { label: 'Detected Changes', href: '/continuity/changes' },
        { label: `Change ${analysis.id}` },
      ]}
      pageTitle={analysis.instructionTitle}
      pageDescription="Deterministic diff breakdown and downstream affected records awaiting human clinical review."
    >
      <PageContainer>
        <ContinuityNavTabs />

        {/* TOP BAR / BACK LINK & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link
            href="/continuity/changes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary-text)] hover:text-[var(--main-text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Detected Changes
          </Link>

          {review && (
            <div className="flex items-center gap-2">
              <Link href={`/continuity/reviews/${review.id}`}>
                <Button
                  className={
                    review.reviewStatus === 'awaiting_human_review'
                      ? 'bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs flex items-center gap-2'
                      : 'bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white font-semibold text-xs flex items-center gap-2'
                  }
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {review.reviewStatus === 'awaiting_human_review' ? 'Proceed to Review Workflow' : 'View Human Review'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* OVERVIEW HEADER CARD */}
        <Card className="border-[var(--subtle-border)] bg-white p-5 sm:p-6 rounded-2xl mb-6 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-3">
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

            <Badge
              variant="outline"
              className={
                analysis.status === 'awaiting_human_review'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : analysis.status === 'implementation_completed'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-blue-50 text-blue-900 border-blue-300'
              }
            >
              Status: {analysis.status.replace(/_/g, ' ')}
            </Badge>

            <span className="text-xs text-[var(--secondary-text)] ml-auto">
              ID: {analysis.id} • Analyzed on {new Date(analysis.createdAt).toLocaleString()}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-[var(--main-text)] mb-2">
            {analysis.instructionTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--secondary-text)] pt-2 border-t border-[var(--subtle-border)]">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[var(--primary-teal)]" />
              <span>Instruction ID: <strong>{analysis.instructionId}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="w-4 h-4 text-purple-600" />
              <span>Downstream Impacts: <strong>{analysis.detectedImpactCount} records identified</strong></span>
            </div>
            {analysis.previousVersionNumber && (
              <div className="flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-blue-600" />
                <span>Diff Parameters: <strong>{analysis.diffSummary.length} fields modified</strong></span>
              </div>
            )}
          </div>
        </Card>

        {/* DETERMINISTIC PARAMETER DIFF SECTION */}
        <Card className="border-[var(--subtle-border)] bg-white rounded-2xl mb-8 overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-[var(--subtle-border)] bg-slate-50/50">
            <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[var(--primary-teal)]" />
              Deterministic Instruction Diff Breakdown
            </CardTitle>
            <p className="text-xs text-[var(--secondary-text)] mt-0.5">
              Field-by-field mathematical comparison between previous verified state and newly submitted instruction version.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {analysis.diffSummary.map((diff, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        diff.changeType === 'modified'
                          ? 'bg-amber-500'
                          : diff.changeType === 'added'
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    {diff.field}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] capitalize ${
                      diff.changeType === 'modified'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : diff.changeType === 'added'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border-rose-300'
                    }`}
                  >
                    {diff.changeType}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-lg border border-rose-200/80">
                    <div className="text-[11px] font-bold text-rose-900 mb-1 flex items-center gap-1">
                      <span className="text-rose-800">−</span> Previous State (v{analysis.previousVersionNumber || 1})
                    </div>
                    <div className="text-rose-900 font-sans text-xs break-words">
                      {diff.previousValue ? String(diff.previousValue) : <em className="text-slate-400">None</em>}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-emerald-200/80">
                    <div className="text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
                      <span className="text-emerald-800">+</span> Current Version State (v{analysis.currentVersionNumber})
                    </div>
                    <div className="text-emerald-950 font-sans text-xs break-words">
                      {Array.isArray(diff.currentValue)
                        ? diff.currentValue.join(', ')
                        : String(diff.currentValue || '')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* DOWNSTREAM AFFECTED RECORDS SECTION */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-600" />
                Downstream Impacted Care Records ({impacts.length})
              </h2>
              <p className="text-xs text-[var(--secondary-text)]">
                Relational mapping detected the following care operations potentially influenced by this change.
              </p>
            </div>
            <Link href="/continuity/impact">
              <Button variant="outline" size="sm" className="text-xs">
                Inspect in Impact Matrix
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {impacts.map((impact) => {
              const recordIcon =
                impact.relatedRecordType === 'medication' ? (
                  <Pill className="w-4 h-4 text-purple-700" />
                ) : impact.relatedRecordType === 'dose_event' ? (
                  <Clock className="w-4 h-4 text-blue-700" />
                ) : impact.relatedRecordType === 'care_task' ? (
                  <CheckSquare className="w-4 h-4 text-teal-700" />
                ) : (
                  <Users className="w-4 h-4 text-amber-700" />
                );

              return (
                <Card
                  key={impact.id}
                  className="border-[var(--subtle-border)] bg-white p-4 sm:p-5 rounded-xl shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg">{recordIcon}</div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary-text)]">
                          {impact.relatedRecordType.replace(/_/g, ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-[var(--main-text)]">
                          {impact.relatedRecordTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          (impact.classification || impact.impactClassification) === 'directly_linked'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }
                      >
                        {(impact.classification || impact.impactClassification || 'directly_linked').replace(/_/g, ' ')}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          impact.reviewStatus === 'approved_for_update'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : impact.reviewStatus === 'excluded'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }
                      >
                        {impact.reviewStatus.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Explainable Rationale */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-800 space-y-1.5">
                    <div>
                      <strong className="text-slate-900">Why was this record identified? </strong>
                      {impact.explainableReason || impact.reasonIdentified}
                    </div>
                    {impact.proposedDownstreamAdjustment && (
                      <div className="text-teal-900 pt-1 border-t border-slate-200/60">
                        <strong className="text-teal-950">Proposed non-prescribing synchronization: </strong>
                        {impact.proposedDownstreamAdjustment}
                      </div>
                    )}
                    {impact.exclusionReason && (
                      <div className="text-rose-900 pt-1 border-t border-slate-200/60">
                        <strong className="text-rose-950">Exclusion Reason: </strong>
                        {impact.exclusionReason}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
