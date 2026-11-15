'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  GitCompare,
  Network,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Pill,
  Calendar,
  CheckSquare,
  Users,
  AlertCircle,
  Share2,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ContinuityNavTabs } from '@/components/features/continuity/continuity-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getCachedContinuityReviews,
  getCachedAnalyses,
  getCachedImpacts,
  submitReviewDecision,
  executeControlledImplementation,
} from '@/lib/data/care-continuity-data';
import {
  ContinuityReview,
  ContinuityAnalysis,
  ContinuityImpactRecord,
  ContinuityImplementationJob,
} from '@/types/caretrace';

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ContinuityReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = React.use(params);
  const router = useRouter();

  const [review, setReview] = React.useState<ContinuityReview | null>(null);
  const [analysis, setAnalysis] = React.useState<ContinuityAnalysis | null>(null);
  const [impacts, setImpacts] = React.useState<ContinuityImpactRecord[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Decision Form State
  const [decision, setDecision] = React.useState<'approved' | 'rejected' | 'needs_clarification'>('approved');
  const [rationale, setRationale] = React.useState('');
  const [selectedRecordIds, setSelectedRecordIds] = React.useState<string[]>([]);
  const [recordExclusionReasons, setRecordExclusionReasons] = React.useState<Record<string, string>>({});
  const [isSubmittingDecision, setIsSubmittingDecision] = React.useState(false);
  const [decisionError, setDecisionError] = React.useState('');
  const [decisionSuccess, setDecisionSuccess] = React.useState('');

  // Implementation State
  const [isImplementing, setIsImplementing] = React.useState(false);
  const [implementationError, setImplementationError] = React.useState('');
  const [implementationJob, setImplementationJob] = React.useState<ContinuityImplementationJob | null>(null);

  // Clarification / Escalation Drawer State
  const [showClarificationModal, setShowClarificationModal] = React.useState(false);
  const [clarificationQuestion, setClarificationQuestion] = React.useState('');
  const [showEscalationModal, setShowEscalationModal] = React.useState(false);
  const [escalateTo, setEscalateTo] = React.useState('Dr. Eleanor Vance, MD');
  const [escalationReason, setEscalationReason] = React.useState('');

  React.useEffect(() => {
    const allReviews = getCachedContinuityReviews();
    const rev = allReviews.find((r) => r.id === id);
    if (rev) {
      setReview(rev);
      const allAnalyses = getCachedAnalyses();
      const ana = allAnalyses.find((a) => a.id === rev.analysisId);
      setAnalysis(ana || null);

      const revImpacts = getCachedImpacts().filter((imp) => imp.analysisId === rev.analysisId);
      setImpacts(revImpacts);

      // Default all non-excluded records to selected
      const initiallySelected = revImpacts
        .filter((imp) => imp.reviewStatus !== 'excluded')
        .map((imp) => imp.id);
      setSelectedRecordIds(initiallySelected);
    }
    setIsLoaded(true);
  }, [id]);

  if (isLoaded && !review) {
    return notFound();
  }

  if (!review || !analysis) {
    return (
      <AppShell breadcrumbs={[{ label: 'Continuity Engine', href: '/continuity' }, { label: 'Loading...' }]}>
        <PageContainer>
          <div className="p-8 text-center text-sm text-[var(--secondary-text)]">Loading review workflow...</div>
        </PageContainer>
      </AppShell>
    );
  }

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recordId) ? prev.filter((i) => i !== recordId) : [...prev, recordId]
    );
  };

  const handleExclusionReasonChange = (recordId: string, reason: string) => {
    setRecordExclusionReasons((prev) => ({
      ...prev,
      [recordId]: reason,
    }));
  };

  // Submit Decision Handler
  const handleSubmitDecision = async () => {
    setDecisionError('');
    setDecisionSuccess('');

    if (rationale.trim().length < 5) {
      setDecisionError('A clinical decision rationale of at least 5 characters is mandatory.');
      return;
    }

    // Prepare excluded records
    const unselectedRecords = impacts.filter((imp) => !selectedRecordIds.includes(imp.id));
    const excludedRecordsPayload = unselectedRecords.map((imp) => ({
      recordId: imp.id,
      exclusionReason:
        recordExclusionReasons[imp.id] ||
        'Excluded by human reviewer during continuity verification review.',
    }));

    setIsSubmittingDecision(true);

    try {
      const res = await fetch(`/api/continuity/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          decision,
          rationale: rationale.trim(),
          approvedRecordIds: selectedRecordIds,
          excludedRecords: excludedRecordsPayload,
          optimisticVersionLock: review.optimisticVersionLock,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDecisionError(data.error || 'Failed to submit review decision');
        setIsSubmittingDecision(false);
        return;
      }

      setReview(data.review);
      setDecisionSuccess(
        decision === 'approved'
          ? 'Review approved for controlled downstream synchronization.'
          : decision === 'rejected'
          ? 'Change rejected. Downstream records will remain quarantined.'
          : 'Clarification request logged.'
      );
    } catch {
      // Local fallback
      const updated = submitReviewDecision(
        review.id,
        decision,
        rationale.trim(),
        selectedRecordIds,
        excludedRecordsPayload,
        'Sarah Jenkins, RN',
        review.optimisticVersionLock
      );
      if (updated.success && updated.review) {
        setReview({ ...updated.review });
        setDecisionSuccess('Decision submitted successfully.');
      }
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Submit Clarification Handler
  const handleSubmitClarification = async () => {
    if (clarificationQuestion.trim().length < 5) {
      setDecisionError('Please provide a specific clarification question (min 5 characters).');
      return;
    }

    try {
      const res = await fetch(`/api/continuity/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clarification',
          question: clarificationQuestion.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReview(data.review);
        setShowClarificationModal(false);
        setDecisionSuccess('Clarification request sent to instruction author.');
      }
    } catch (e) {
      setDecisionError('Failed to send clarification request.');
    }
  };

  // Submit Escalation Handler
  const handleSubmitEscalation = async () => {
    if (escalationReason.trim().length < 5) {
      setDecisionError('Please provide an escalation rationale (min 5 characters).');
      return;
    }

    try {
      const res = await fetch(`/api/continuity/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'escalate',
          escalateTo,
          escalationReason: escalationReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReview(data.review);
        setShowEscalationModal(false);
        setDecisionSuccess(`Review successfully escalated to ${escalateTo}.`);
      }
    } catch (e) {
      setDecisionError('Failed to escalate review.');
    }
  };

  // Execute Downstream Implementation Handler
  const handleExecuteImplementation = async () => {
    setIsImplementing(true);
    setImplementationError('');

    try {
      const res = await fetch(`/api/continuity/reviews/${review.id}/implement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimisticVersionLock: review.optimisticVersionLock,
          approvedRecordIds: selectedRecordIds.length > 0 ? selectedRecordIds : impacts.map((i) => i.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setImplementationError(data.error || 'Failed to execute downstream implementation');
        setIsImplementing(false);
        return;
      }

      setImplementationJob(data.job);
      setReview((prev) => (prev ? { ...prev, reviewStatus: 'implementation_completed' } : null));
    } catch {
      // Local fallback
      const result = executeControlledImplementation(
        review.id,
        'Sarah Jenkins, RN',
        review.optimisticVersionLock
      );
      if (result.success && result.job) {
        setImplementationJob(result.job);
        setReview((prev) => (prev ? { ...prev, reviewStatus: 'implementation_completed' } : null));
      } else {
        setImplementationError(result.error || 'Failed to execute implementation');
      }
    } finally {
      setIsImplementing(false);
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Continuity Engine', href: '/continuity' },
        { label: 'Review Queue', href: '/continuity/reviews' },
        { label: `Review ${review.id}` },
      ]}
      pageTitle="Clinical Continuity Review"
      pageDescription="Mandatory human-in-the-loop review. Verify instruction diff, inspect downstream records, and sign off on synchronization."
    >
      <PageContainer>
        <ContinuityNavTabs />

        {/* TOP BACK LINK & STATUS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link
            href="/continuity/reviews"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary-text)] hover:text-[var(--main-text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Review Queue
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--secondary-text)]">
              Optimistic Lock: v{review.optimisticVersionLock}
            </span>
            <Badge
              variant="outline"
              className={
                review.reviewStatus === 'awaiting_human_review'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                  : review.reviewStatus === 'approved_for_downstream_update'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                  : review.reviewStatus === 'implementation_completed'
                  ? 'bg-teal-50 text-teal-900 border-teal-300 font-semibold'
                  : 'bg-rose-50 text-rose-900 border-rose-300 font-semibold'
              }
            >
              {review.reviewStatus.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* INSTRUCTION CHANGE SUMMARY CARD */}
        <Card className="border-[var(--subtle-border)] bg-white p-5 sm:p-6 rounded-2xl mb-6 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              {analysis.eventType.replace(/_/g, ' ')}
            </Badge>

            {review.previousVersionNumber ? (
              <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                v{review.previousVersionNumber} → v{review.currentVersionNumber}
              </Badge>
            ) : (
              <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                v{review.currentVersionNumber}
              </Badge>
            )}

            <span className="text-xs text-[var(--secondary-text)] ml-auto">
              Assigned: {review.assignedReviewerName || review.assignedReviewerRole}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-[var(--main-text)] mb-2">
            {review.instructionTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--secondary-text)] pt-2 border-t border-[var(--subtle-border)]">
            <div className="flex items-center gap-1.5">
              <GitCompare className="w-4 h-4 text-blue-600" />
              <span>Diff Fields: <strong>{analysis.diffSummary.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Network className="w-4 h-4 text-purple-600" />
              <span>Downstream Records: <strong>{impacts.length}</strong></span>
            </div>
          </div>
        </Card>

        {/* DETERMINISTIC PARAMETER DIFF BOX */}
        <Card className="border-[var(--subtle-border)] bg-white rounded-2xl mb-8 overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-[var(--subtle-border)] bg-slate-50/50">
            <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[var(--primary-teal)]" />
              Instruction Parameter Diff (v{analysis.previousVersionNumber || 1} vs v{analysis.currentVersionNumber})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            {analysis.diffSummary.map((diff, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        diff.changeType === 'modified'
                          ? 'bg-amber-500'
                          : diff.changeType === 'added'
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    {diff.field}
                  </span>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {diff.changeType}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-sans">
                  <div className="p-2.5 bg-white rounded border border-rose-200 text-rose-900 text-xs">
                    <span className="font-semibold block text-[10px] text-rose-700">Previous:</span>
                    {diff.previousValue ? String(diff.previousValue) : <em className="text-slate-400">None</em>}
                  </div>
                  <div className="p-2.5 bg-white rounded border border-emerald-200 text-emerald-950 text-xs font-medium">
                    <span className="font-semibold block text-[10px] text-emerald-700">New Value:</span>
                    {Array.isArray(diff.currentValue)
                      ? diff.currentValue.join(', ')
                      : String(diff.currentValue || '')}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* DOWNSTREAM IMPACT SELECTION & EXCLUSION TOGGLES */}
        <Card className="border-[var(--subtle-border)] bg-white rounded-2xl mb-8 overflow-hidden shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-[var(--subtle-border)] bg-purple-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-700" />
                  Downstream Records Review &amp; Selection ({impacts.length})
                </CardTitle>
                <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                  Select which records will receive safe downstream synchronization. Uncheck to exclude with a reason.
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-900 border-purple-300">
                {selectedRecordIds.length} of {impacts.length} Approved
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            {impacts.map((impact) => {
              const isSelected = selectedRecordIds.includes(impact.id);

              return (
                <div
                  key={impact.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`chk-${impact.id}`}
                      checked={isSelected}
                      onChange={() => toggleRecordSelection(impact.id)}
                      disabled={review.reviewStatus === 'implementation_completed'}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--primary-teal)] focus:ring-[var(--primary-teal)] cursor-pointer"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={`chk-${impact.id}`}
                          className="text-sm font-bold text-[var(--main-text)] cursor-pointer"
                        >
                          {impact.relatedRecordTitle}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-text)]">
                            {impact.relatedRecordType.replace(/_/g, ' ')}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              (impact.classification || impact.impactClassification) === 'directly_linked'
                                ? 'bg-purple-50 text-purple-800 border-purple-300 text-[10px]'
                                : 'bg-blue-50 text-blue-800 border-blue-300 text-[10px]'
                            }
                          >
                            {(impact.classification || impact.impactClassification || 'directly_linked').replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        <strong>Reason: </strong>
                        {impact.explainableReason || impact.reasonIdentified}
                      </p>

                      {impact.proposedDownstreamAdjustment && (
                        <p className="text-xs text-teal-900 font-medium">
                          <strong>Proposed Adjustment: </strong>
                          {impact.proposedDownstreamAdjustment}
                        </p>
                      )}

                      {!isSelected && (
                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-rose-900 mb-1">
                            Reason for excluding this record:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Dose handled directly by visiting physician"
                            value={recordExclusionReasons[impact.id] || ''}
                            onChange={(e) => handleExclusionReasonChange(impact.id, e.target.value)}
                            disabled={review.reviewStatus === 'implementation_completed'}
                            className="w-full text-xs p-2 rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* DECISION SUBMISSION WORKFLOW */}
        {review.reviewStatus !== 'implementation_completed' ? (
          <Card className="border-[var(--subtle-border)] bg-white rounded-2xl mb-8 p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-[var(--main-text)] mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--primary-teal)]" />
              Human Clinical Decision &amp; Rationale
            </h3>
            <p className="text-xs text-[var(--secondary-text)] mb-4">
              Select your review determination. A documented rationale is required for non-repudiable audit logging.
            </p>

            {/* Decision Radio Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                  decision === 'approved'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/30'
                    : 'border-[var(--subtle-border)] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="approved"
                    checked={decision === 'approved'}
                    onChange={() => setDecision('approved')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold">Approve for Update</span>
                </div>
                <span className="text-[11px] text-[var(--secondary-text)]">
                  Verify change and approve selected downstream records.
                </span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                  decision === 'rejected'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-950 ring-2 ring-rose-500/30'
                    : 'border-[var(--subtle-border)] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="rejected"
                    checked={decision === 'rejected'}
                    onChange={() => setDecision('rejected')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-950">Reject Change</span>
                </div>
                <span className="text-[11px] text-[var(--secondary-text)]">
                  Quarantine instruction and halt all downstream synchronization.
                </span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                  decision === 'needs_clarification'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-950 ring-2 ring-blue-500/30'
                    : 'border-[var(--subtle-border)] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="needs_clarification"
                    checked={decision === 'needs_clarification'}
                    onChange={() => setDecision('needs_clarification')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-blue-950">Needs Clarification</span>
                </div>
                <span className="text-[11px] text-[var(--secondary-text)]">
                  Pause review until author clarifies clinical questions.
                </span>
              </label>
            </div>

            {/* Clinical Rationale Textarea */}
            <div className="space-y-2 mb-4">
              <label className="block text-xs font-bold text-[var(--main-text)]">
                Clinical Review Rationale <span className="text-rose-600">*</span>
              </label>
              <textarea
                className="w-full h-24 p-3 text-xs rounded-xl border border-[var(--subtle-border)] focus:ring-2 focus:ring-[var(--primary-teal)] focus:outline-none"
                placeholder="Document clinical justification for this review decision (minimum 5 characters)..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
              />
            </div>

            {decisionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                {decisionError}
              </div>
            )}

            {decisionSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                {decisionSuccess}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClarificationModal(true)}
                  className="text-xs text-blue-800 border-blue-200 hover:bg-blue-50"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  Ask Question
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEscalationModal(true)}
                  className="text-xs text-purple-800 border-purple-200 hover:bg-purple-50"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Escalate Review
                </Button>
              </div>

              <Button
                size="sm"
                onClick={handleSubmitDecision}
                disabled={isSubmittingDecision}
                className={
                  decision === 'approved'
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs'
                    : decision === 'rejected'
                    ? 'bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs'
                    : 'bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs'
                }
              >
                {isSubmittingDecision ? 'Submitting Decision...' : 'Sign & Submit Clinical Decision'}
              </Button>
            </div>
          </Card>
        ) : null}

        {/* CONTROLLED IMPLEMENTATION TRIGGER (When Approved) */}
        {review.reviewStatus === 'approved_for_downstream_update' && (
          <Card className="border-2 border-emerald-400 bg-emerald-50/40 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-950">
                    Controlled Downstream Implementation Ready
                  </h3>
                </div>
                <p className="text-xs text-emerald-800 max-w-xl">
                  Human approval is complete. You can now execute safe, non-prescribing synchronization of care tasks,
                  dose prompts, and caregiver handovers. An optimistic version lock will protect against concurrent updates.
                </p>
              </div>

              <Button
                onClick={handleExecuteImplementation}
                disabled={isImplementing}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 shrink-0 flex items-center gap-2 shadow-xs"
              >
                <Zap className="w-4 h-4" />
                {isImplementing ? 'Executing Synchronization...' : 'Execute Downstream Sync'}
              </Button>
            </div>

            {implementationError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                {implementationError}
              </div>
            )}
          </Card>
        )}

        {/* IMPLEMENTATION COMPLETION CONFIRMATION & AUDIT */}
        {(review.reviewStatus === 'implementation_completed' || implementationJob) && (
          <Card className="border-teal-200 bg-teal-50/50 rounded-2xl p-6 mb-8 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-teal-950">
                  Downstream Implementation Completed &amp; Audit Logged
                </h3>
                <p className="text-xs text-teal-800">
                  All approved care tasks, prompts, and handovers have been safely synchronized.
                </p>
              </div>
            </div>

            {implementationJob?.executedAuditRecords && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  Executed Audit Records ({implementationJob.executedAuditRecords.length})
                </div>
                {implementationJob.executedAuditRecords.map((aud, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-lg border border-teal-200 text-xs font-mono">
                    <span className="font-bold text-teal-900">{aud.action}</span> on {aud.recordType} ({aud.recordId})
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-teal-200/60 flex items-center justify-between">
              <span className="text-xs text-teal-800">
                Executed by {review.decisionSubmittedByName || review.decidedByName || 'Sarah Jenkins, RN'} on {new Date().toLocaleDateString()}
              </span>
              <Link href="/continuity/history">
                <Button variant="outline" size="sm" className="text-xs text-teal-900 border-teal-300">
                  View Full Audit Ledger
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* CLARIFICATION MODAL */}
        {showClarificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <Card className="max-w-md w-full bg-white border-[var(--subtle-border)] rounded-2xl shadow-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--main-text)]">Request Author Clarification</h3>
                  <p className="text-xs text-[var(--secondary-text)]">
                    Direct a clinical inquiry to the author of this instruction.
                  </p>
                </div>
              </div>

              <textarea
                className="w-full h-24 p-3 text-xs rounded-xl border border-[var(--subtle-border)] focus:ring-2 focus:ring-[var(--primary-teal)] focus:outline-none"
                placeholder="What clinical details need clarification before you can approve this change?"
                value={clarificationQuestion}
                onChange={(e) => setClarificationQuestion(e.target.value)}
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowClarificationModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitClarification}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs"
                >
                  Send Clarification
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ESCALATION MODAL */}
        {showEscalationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <Card className="max-w-md w-full bg-white border-[var(--subtle-border)] rounded-2xl shadow-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-lg">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--main-text)]">Escalate Continuity Review</h3>
                  <p className="text-xs text-[var(--secondary-text)]">
                    Transfer review responsibility to a supervisory clinician.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--main-text)]">Escalate To</label>
                <Input
                  value={escalateTo}
                  onChange={(e) => setEscalateTo(e.target.value)}
                  className="text-xs bg-white border-[var(--subtle-border)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--main-text)]">Escalation Reason</label>
                <textarea
                  className="w-full h-20 p-2.5 text-xs rounded-xl border border-[var(--subtle-border)] focus:ring-2 focus:ring-[var(--primary-teal)] focus:outline-none"
                  placeholder="Explain why this review requires escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowEscalationModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitEscalation}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs"
                >
                  Confirm Escalation
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
