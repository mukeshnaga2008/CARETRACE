'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Pill,
  CheckSquare,
  Calendar,
  ClipboardCheck,
  Bell,
  User,
  ExternalLink,
  MessageSquare,
  Check,
  RotateCcw,
  AlertCircle,
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
  getCareGapById,
  assignCareGap,
  respondToAssignment,
  resolveCareGap,
  dismissCareGap,
  updateCareGapStatus,
} from '@/lib/data/care-gap-intelligence-data';
import { getCachedMembers } from '@/lib/data/care-circle-data';
import { CareGapRecord, CareCircleMember } from '@/types/caretrace';

interface GapDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CareGapDetailPage({ params }: GapDetailPageProps) {
  const { id } = React.use(params);
  const router = useRouter();

  const [gap, setGap] = React.useState<CareGapRecord | null>(null);
  const [members, setMembers] = React.useState<CareCircleMember[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Assignment State
  const [selectedMemberId, setSelectedMemberId] = React.useState('');
  const [assignmentNote, setAssignmentNote] = React.useState('');
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Resolution Modal State
  const [showResolveModal, setShowResolveModal] = React.useState(false);
  const [resolutionAction, setResolutionAction] = React.useState('');
  const [resolutionDetails, setResolutionDetails] = React.useState('');
  const [resolutionError, setResolutionError] = React.useState('');
  const [isResolving, setIsResolving] = React.useState(false);

  // Dismissal Modal State
  const [showDismissModal, setShowDismissModal] = React.useState(false);
  const [dismissReason, setDismissReason] = React.useState('');
  const [dismissError, setDismissError] = React.useState('');
  const [isDismissing, setIsDismissing] = React.useState(false);

  // Clarification Inquiry State
  const [showClarificationInput, setShowClarificationInput] = React.useState(false);
  const [clarificationText, setClarificationText] = React.useState('');

  // Status feedback
  const [actionSuccess, setActionSuccess] = React.useState('');
  const [actionError, setActionError] = React.useState('');

  React.useEffect(() => {
    const found = getCareGapById(id);
    if (found) {
      setGap({ ...found });
    }
    setMembers(getCachedMembers());
    setIsLoaded(true);
  }, [id]);

  if (isLoaded && !gap) {
    return notFound();
  }

  if (!gap) {
    return (
      <AppShell breadcrumbs={[{ label: 'Care Gap Radar', href: '/care-gaps' }, { label: 'Loading...' }]}>
        <PageContainer>
          <div className="p-8 text-center text-sm text-[var(--secondary-text)]">Loading care gap details...</div>
        </PageContainer>
      </AppShell>
    );
  }

  // Handle Assign
  const handleAssign = async () => {
    if (!selectedMemberId) {
      setActionError('Please select a Care Circle member to assign this responsibility.');
      return;
    }
    const target = members.find((m) => m.id === selectedMemberId);
    if (!target) return;

    setIsAssigning(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/care-gaps/${gap.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: gap.id,
          assignedToId: target.id,
          assignedToName: target.name,
          assignedToRole: target.relationship,
          note: assignmentNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to assign care gap');
        setIsAssigning(false);
        return;
      }

      setGap(data.gap);
      setActionSuccess(`Responsibility assigned to ${target.name}.`);
      setAssignmentNote('');
    } catch {
      // Local fallback
      const updated = assignCareGap(
        gap.id,
        target.id,
        target.name,
        target.relationship,
        'Sarah Jenkins, RN',
        'Visiting Nurse',
        assignmentNote.trim() || undefined
      );
      if (updated) {
        setGap({ ...updated });
        setActionSuccess(`Responsibility assigned to ${target.name}.`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Accept/Decline Assignment
  const handleAssignmentResponse = async (action: 'accept' | 'decline') => {
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/care-gaps/${gap.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: gap.id,
          action,
        }),
      });
      const data = await res.json();
      if (res.ok && data.gap) {
        setGap(data.gap);
        setActionSuccess(data.message || `Assignment ${action}ed.`);
      }
    } catch {
      const updated = respondToAssignment(gap.id, action, 'David Sullivan', 'Family Coordinator');
      if (updated) setGap({ ...updated });
    }
  };

  // Handle Status Update (e.g. In Progress, Acknowledge)
  const handleStatusUpdate = async (newStatus: CareGapRecord['status']) => {
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/care-gaps/${gap.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: gap.id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.gap) {
        setGap(data.gap);
        setActionSuccess(`Status updated to ${newStatus}.`);
      }
    } catch {
      const updated = updateCareGapStatus(gap.id, newStatus, 'Sarah Jenkins, RN', 'Visiting Nurse');
      if (updated) setGap({ ...updated });
    }
  };

  // Handle Clarification Submit
  const handleClarificationSubmit = async () => {
    if (clarificationText.trim().length < 5) {
      setActionError('A clarification question (min 5 characters) is required.');
      return;
    }

    try {
      const res = await fetch(`/api/care-gaps/${gap.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: gap.id,
          status: 'awaiting_clarification',
          clarificationRequest: clarificationText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.gap) {
        setGap(data.gap);
        setShowClarificationInput(false);
        setClarificationText('');
        setActionSuccess('Clarification request logged.');
      }
    } catch {
      const updated = updateCareGapStatus(
        gap.id,
        'awaiting_clarification',
        'Sarah Jenkins, RN',
        'Visiting Nurse',
        undefined,
        clarificationText.trim()
      );
      if (updated) {
        setGap({ ...updated });
        setShowClarificationInput(false);
        setClarificationText('');
      }
    }
  };

  // Handle Resolve
  const handleResolve = async () => {
    if (resolutionAction.trim().length < 3) {
      setResolutionError('Resolution action must be at least 3 characters.');
      return;
    }
    if (resolutionDetails.trim().length < 5) {
      setResolutionError('Documented resolution details (min 5 characters) are required for audit trail.');
      return;
    }

    setIsResolving(true);
    setResolutionError('');

    try {
      const res = await fetch(`/api/care-gaps/${gap.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: gap.id,
          resolutionAction: resolutionAction.trim(),
          resolutionDetails: resolutionDetails.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResolutionError(data.error || 'Failed to resolve care gap');
        setIsResolving(false);
        return;
      }

      setGap(data.gap);
      setShowResolveModal(false);
      setActionSuccess('Care gap marked resolved with documented justification.');
    } catch {
      const updated = resolveCareGap(
        gap.id,
        resolutionAction.trim(),
        resolutionDetails.trim(),
        'Sarah Jenkins, RN',
        'Visiting Nurse'
      );
      if (updated) {
        setGap({ ...updated });
        setShowResolveModal(false);
        setActionSuccess('Care gap resolved successfully.');
      }
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Dismiss
  const handleDismiss = async () => {
    if (dismissReason.trim().length < 5) {
      setDismissError('A documented dismissal reason of at least 5 characters is mandatory.');
      return;
    }

    setIsDismissing(true);
    setDismissError('');

    try {
      const res = await fetch(`/api/care-gaps/${gap.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gapId: gap.id,
          action: 'dismiss',
          dismissedReason: dismissReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDismissError(data.error || 'Failed to dismiss care gap');
        setIsDismissing(false);
        return;
      }

      setGap(data.gap);
      setShowDismissModal(false);
      setActionSuccess('Care gap dismissed with recorded justification.');
    } catch {
      const updated = dismissCareGap(
        gap.id,
        dismissReason.trim(),
        'David Sullivan',
        'Family Coordinator'
      );
      if (updated) {
        setGap({ ...updated });
        setShowDismissModal(false);
        setActionSuccess('Care gap dismissed.');
      }
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Care Gap Radar', href: '/care-gaps' },
        { label: `Gap ${gap.id}` },
      ]}
      pageTitle={gap.title}
      pageDescription="Explainable coordination gap breakdown, source module provenance, ownership assignment, and auditable resolution."
    >
      <PageContainer>
        <CareGapsNavTabs />

        {/* TOP BACK LINK & STATUS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <Link
            href="/care-gaps"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--secondary-text)] hover:text-[var(--main-text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Care Gap Radar
          </Link>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                gap.priority === 'high_priority'
                  ? 'bg-red-50 text-red-900 border-red-300 font-bold text-xs'
                  : gap.priority === 'attention_required'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold text-xs'
                  : 'bg-blue-50 text-blue-900 border-blue-300 font-semibold text-xs'
              }
            >
              {gap.priority.replace(/_/g, ' ')}
            </Badge>

            <Badge
              variant="outline"
              className={
                gap.status === 'resolved'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold text-xs'
                  : gap.status === 'dismissed'
                  ? 'bg-slate-100 text-slate-800 border-slate-300 text-xs'
                  : gap.status === 'assigned'
                  ? 'bg-blue-50 text-blue-900 border-blue-300 text-xs'
                  : 'bg-amber-50 text-amber-900 border-amber-300 text-xs'
              }
            >
              {gap.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* CLINICAL SAFETY BANNER */}
        <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-teal-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-900">
              Care Coordination &amp; Safety Rule
            </h3>
            <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
              CARETRACE alerts coordinators to potential lapses. Never independently calculate, recommend, or modify medication dosages or schedules
              in response to missed or skipped events. Consult the prescribing clinician for therapy modifications.
            </p>
          </div>
        </div>

        {actionSuccess && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            {actionSuccess}
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700" />
            {actionError}
          </div>
        )}

        {/* GAP HEADER OVERVIEW CARD */}
        <Card className="border-[var(--subtle-border)] bg-white p-5 sm:p-6 rounded-2xl mb-6 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider bg-slate-50">
              {gap.category.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs font-mono text-[var(--secondary-text)]">
              Type: {gap.gapType}
            </span>
            <span className="text-xs text-[var(--secondary-text)] ml-auto">
              Detected on {new Date(gap.detectedAt).toLocaleString()}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-[var(--main-text)] mb-3">
            {gap.title}
          </h1>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 space-y-2">
            <div>
              <strong className="text-slate-900">What Happened: </strong>
              {gap.explanation}
            </div>
            <div>
              <strong className="text-slate-900">Why CARETRACE Flagged This: </strong>
              {gap.priorityReason}
            </div>
            {gap.clarificationRequest && (
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-blue-900 font-medium">
                <strong>Pending Clarification Inquiry: </strong>
                {gap.clarificationRequest}
              </div>
            )}
            {gap.resolutionDetails && (
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 font-medium">
                <strong>Documented Resolution: </strong>
                {gap.resolutionDetails}
                {gap.resolvedByName && (
                  <span className="text-emerald-800 ml-1">
                    (by {gap.resolvedByName} on {gap.resolvedAt ? new Date(gap.resolvedAt).toLocaleDateString() : ''})
                  </span>
                )}
              </div>
            )}
            {gap.dismissedReason && (
              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-300 text-slate-800 font-medium">
                <strong>Dismissal Justification: </strong>
                {gap.dismissedReason}
                {gap.dismissedByName && (
                  <span className="text-slate-600 ml-1">
                    (by {gap.dismissedByName} on {gap.dismissedAt ? new Date(gap.dismissedAt).toLocaleDateString() : ''})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Contextual Source Entity Bar */}
          <div className="mt-4 pt-3 border-t border-[var(--subtle-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[var(--secondary-text)] space-x-2">
              <span>Source Module: <strong>{gap.sourceModule.replace(/_/g, ' ')}</strong></span>
              <span>•</span>
              <span>Related Entity: <strong>{gap.relatedRecordTitle}</strong> ({gap.relatedRecordType})</span>
            </div>

            {gap.actionRoute && (
              <Link href={gap.actionRoute}>
                <Button variant="outline" size="sm" className="text-xs font-semibold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {gap.actionLabel}
                </Button>
              </Link>
            )}
          </div>
        </Card>

        {/* OWNERSHIP & ASSIGNMENT WORKFLOW */}
        <Card className="border-[var(--subtle-border)] bg-white rounded-2xl mb-6 p-5 sm:p-6 shadow-xs">
          <CardTitle className="text-base font-bold text-[var(--main-text)] mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--primary-teal)]" />
            Responsibility &amp; Care Circle Ownership
          </CardTitle>
          <p className="text-xs text-[var(--secondary-text)] mb-4">
            Assign accountability to an eligible Care Circle member with documented handoff notes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Current Ownership Status */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--secondary-text)]">
                Current Assigned Owner
              </span>
              {gap.assignedToName ? (
                <div>
                  <div className="text-sm font-bold text-[var(--main-text)] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    {gap.assignedToName}
                  </div>
                  <div className="text-xs text-[var(--secondary-text)]">
                    Role: {gap.assignedToRole || 'Care Circle Member'}
                  </div>
                  <div className="text-[11px] text-[var(--secondary-text)] mt-1">
                    Assigned: {gap.assignedAt ? new Date(gap.assignedAt).toLocaleString() : 'N/A'}
                  </div>

                  {/* Accept / Decline actions if status is assigned */}
                  {gap.status === 'assigned' && (
                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAssignmentResponse('accept')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept Responsibility
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignmentResponse('decline')}
                        className="text-xs text-rose-800 border-rose-200 hover:bg-rose-50"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Currently Unassigned — No member has taken responsibility for this care gap.
                  </div>
                </div>
              )}
            </div>

            {/* Reassign / Assign Form */}
            {gap.status !== 'resolved' && gap.status !== 'dismissed' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[var(--main-text)]">
                  {gap.assignedToName ? 'Reassign Responsibility' : 'Assign to Member'}
                </label>
                <Select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="text-xs bg-white border-[var(--subtle-border)]"
                  options={[
                    { value: '', label: 'Select eligible Care Circle member...' },
                    ...members.map((m) => ({
                      value: m.id,
                      label: `${m.name} (${m.relationship})`,
                    })),
                  ]}
                />
                <Input
                  placeholder="Optional assignment instructions or notes..."
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  className="text-xs bg-white border-[var(--subtle-border)]"
                />
                <Button
                  size="sm"
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedMemberId}
                  className="bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white font-semibold text-xs"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* STATUS ACTIONS & RESOLUTION CONTROLS */}
        {gap.status !== 'resolved' && gap.status !== 'dismissed' ? (
          <Card className="border-[var(--subtle-border)] bg-white rounded-2xl mb-6 p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-[var(--main-text)] mb-1">
              Care Gap Resolution &amp; Actions
            </h3>
            <p className="text-xs text-[var(--secondary-text)] mb-4">
              Advance gap state, record clinical clarification, or document verified resolution.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {gap.status !== 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="text-xs"
                >
                  Mark In Progress
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClarificationInput(!showClarificationInput)}
                className="text-xs text-blue-800 border-blue-200 hover:bg-blue-50"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Inquire Clarification
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setShowResolveModal(true);
                  setResolutionError('');
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve Gap
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDismissModal(true);
                  setDismissError('');
                }}
                className="text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Dismiss Gap
              </Button>
            </div>

            {showClarificationInput && (
              <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <label className="block text-xs font-bold text-blue-950">
                  Clinical or Coordination Clarification Inquiry
                </label>
                <textarea
                  className="w-full h-20 p-2.5 text-xs rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                  placeholder="What details are missing or need physician/coordinator confirmation?"
                  value={clarificationText}
                  onChange={(e) => setClarificationText(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowClarificationInput(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleClarificationSubmit}
                    className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                  >
                    Send Clarification Inquiry
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="border-[var(--subtle-border)] bg-slate-50 rounded-2xl mb-6 p-5 sm:p-6 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--main-text)]">
                This care gap is {gap.status}.
              </h3>
              <p className="text-xs text-[var(--secondary-text)]">
                {gap.status === 'resolved'
                  ? 'All required coordination actions were recorded in the audit ledger.'
                  : 'This alert was dismissed with documented rationale.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('reopened')}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reopen Gap
            </Button>
          </Card>
        )}

        {/* AUDIT HISTORY TRAIL */}
        <Card className="border-[var(--subtle-border)] bg-white rounded-2xl p-5 sm:p-6 shadow-xs">
          <CardTitle className="text-base font-bold text-[var(--main-text)] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--primary-teal)]" />
            Non-Repudiable Audit History ({gap.auditHistory.length})
          </CardTitle>

          <div className="space-y-3">
            {gap.auditHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs space-y-1"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-900">
                    {item.action.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-[11px] text-[var(--secondary-text)]">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-700">
                  Actor: <strong>{item.actorName}</strong> ({item.actorRole})
                </div>
                {item.note && (
                  <div className="text-slate-800 italic pt-0.5 border-t border-slate-200/50">
                    &ldquo;{item.note}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* RESOLUTION MODAL */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <Card className="max-w-lg w-full bg-white border-[var(--subtle-border)] rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--main-text)]">Resolve Care Gap</h3>
                  <p className="text-xs text-[var(--secondary-text)]">
                    A documented action and resolution details are required for the clinical audit trail.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--main-text)] mb-1">
                    Resolution Action Taken <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Spoke with patient and verified dose taken"
                    value={resolutionAction}
                    onChange={(e) => setResolutionAction(e.target.value)}
                    className="text-xs bg-white border-[var(--subtle-border)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--main-text)] mb-1">
                    Documented Resolution Details <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    className="w-full h-24 p-2.5 text-xs rounded-xl border border-[var(--subtle-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                    placeholder="Provide specific coordination notes, confirmation channels, or next steps..."
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                  />
                </div>

                {resolutionError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {resolutionError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--subtle-border)]">
                <Button variant="outline" size="sm" onClick={() => setShowResolveModal(false)} disabled={isResolving}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
                >
                  {isResolving ? 'Resolving...' : 'Confirm Resolution'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* DISMISSAL MODAL */}
        {showDismissModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <Card className="max-w-md w-full bg-white border-[var(--subtle-border)] rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--main-text)]">Dismiss Care Gap</h3>
                  <p className="text-xs text-[var(--secondary-text)]">
                    Audit ledger mandates a justification for dismissing active care alerts.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--main-text)]">
                  Dismissal Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  className="w-full h-24 p-2.5 text-xs rounded-xl border border-[var(--subtle-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                  placeholder="Explain why this care gap is no longer applicable or was superseded..."
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                />
                {dismissError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {dismissError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--subtle-border)]">
                <Button variant="outline" size="sm" onClick={() => setShowDismissModal(false)} disabled={isDismissing}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDismiss}
                  disabled={isDismissing}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs"
                >
                  {isDismissing ? 'Dismissing...' : 'Confirm Dismissal'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
