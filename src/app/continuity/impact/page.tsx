'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Network,
  Filter,
  Search,
  Pill,
  Clock,
  CheckSquare,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  FileText,
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
  getCachedImpacts,
  getCachedAnalyses,
  excludeImpactRecord,
} from '@/lib/data/care-continuity-data';
import { ContinuityImpactRecord, ContinuityAnalysis } from '@/types/caretrace';

export default function ContinuityImpactMatrixPage() {
  const [impacts, setImpacts] = React.useState<ContinuityImpactRecord[]>([]);
  const [analyses, setAnalyses] = React.useState<ContinuityAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Exclusion modal state
  const [excludingImpact, setExcludingImpact] = React.useState<ContinuityImpactRecord | null>(null);
  const [exclusionReason, setExclusionReason] = React.useState('');
  const [exclusionError, setExclusionError] = React.useState('');
  const [isSubmittingExclusion, setIsSubmittingExclusion] = React.useState(false);

  React.useEffect(() => {
    setImpacts(getCachedImpacts());
    setAnalyses(getCachedAnalyses());
  }, []);

  const handleOpenExclusion = (impact: ContinuityImpactRecord) => {
    setExcludingImpact(impact);
    setExclusionReason('');
    setExclusionError('');
  };

  const handleConfirmExclusion = async () => {
    if (!excludingImpact) return;
    if (exclusionReason.trim().length < 5) {
      setExclusionError('A reason of at least 5 characters is required for auditable exclusion.');
      return;
    }

    setIsSubmittingExclusion(true);
    setExclusionError('');

    try {
      const res = await fetch('/api/continuity/impacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impactRecordId: excludingImpact.id,
          exclusionReason: exclusionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExclusionError(data.error || 'Failed to exclude record');
        setIsSubmittingExclusion(false);
        return;
      }

      // Update local state
      setImpacts((prev) =>
        prev.map((item) =>
          item.id === excludingImpact.id
            ? { ...item, reviewStatus: 'excluded', exclusionReason: exclusionReason.trim() }
            : item
        )
      );

      setExcludingImpact(null);
      setExclusionReason('');
    } catch {
      // Local fallback
      excludeImpactRecord(excludingImpact.id, exclusionReason.trim());
      setImpacts((prev) =>
        prev.map((item) =>
          item.id === excludingImpact.id
            ? { ...item, reviewStatus: 'excluded', exclusionReason: exclusionReason.trim() }
            : item
        )
      );
      setExcludingImpact(null);
    } finally {
      setIsSubmittingExclusion(false);
    }
  };

  const filteredImpacts = impacts.filter((imp) => {
    const reasonText = imp.explainableReason || imp.reasonIdentified || '';
    const matchesSearch =
      imp.relatedRecordTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reasonText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (imp.proposedDownstreamAdjustment &&
        imp.proposedDownstreamAdjustment.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || imp.relatedRecordType === typeFilter;
    const matchesStatus = statusFilter === 'all' || imp.reviewStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-4 h-4 text-purple-700" />;
      case 'dose_event':
        return <Clock className="w-4 h-4 text-blue-700" />;
      case 'care_task':
        return <CheckSquare className="w-4 h-4 text-teal-700" />;
      case 'shift_handover':
        return <Users className="w-4 h-4 text-amber-700" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-rose-700" />;
      default:
        return <Network className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Continuity Engine', href: '/continuity' },
        { label: 'Downstream Impact Matrix' },
      ]}
      pageTitle="Downstream Care Impact Matrix"
      pageDescription="Every care record, task, and schedule mapped to clinical instructions with plain-language explanations and exclusion controls."
    >
      <PageContainer>
        <ContinuityNavTabs />

        {/* CLINICAL POLICY NOTE */}
        <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-blue-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900">
              Explainable Relational Impact Mapping
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed mt-0.5">
              Each record below was detected because it shares an explicit clinical relationship with an altered instruction.
              No record is modified until a human reviewer verifies the decision. Records can be selectively excluded with an auditable clinical rationale.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search affected records by name, reason, or adjustment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-[var(--subtle-border)]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-44 text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Record Types' },
                { value: 'medication', label: 'Medications' },
                { value: 'dose_event', label: 'Dose Events' },
                { value: 'care_task', label: 'Care Tasks' },
                { value: 'shift_handover', label: 'Shift Handovers' },
                { value: 'appointment', label: 'Appointments' },
              ]}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-44 text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Review Statuses' },
                { value: 'analysis_pending', label: 'Analysis Pending' },
                { value: 'approved_for_update', label: 'Approved for Update' },
                { value: 'excluded', label: 'Excluded' },
              ]}
            />
          </div>
        </div>

        {/* IMPACT RECORDS LIST */}
        {filteredImpacts.length === 0 ? (
          <Card className="p-8 text-center bg-white border-[var(--subtle-border)] rounded-2xl">
            <Network className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--main-text)]">No impacted records match criteria</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              Try adjusting your search query or reset type and status filters.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredImpacts.map((impact) => {
              const analysis = analyses.find((a) => a.id === impact.analysisId);

              return (
                <Card
                  key={impact.id}
                  className="border-[var(--subtle-border)] hover:border-purple-300 transition-all bg-white p-5 rounded-2xl shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      {/* Top tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg">
                          {getRecordIcon(impact.relatedRecordType)}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary-text)]">
                          {impact.relatedRecordType.replace(/_/g, ' ')}
                        </span>

                        <Badge
                          variant="outline"
                          className={
                            (impact.classification || impact.impactClassification) === 'directly_linked'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
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

                        {analysis && (
                          <span className="text-xs text-[var(--secondary-text)] ml-auto font-mono">
                            Instruction: {analysis.instructionTitle}
                          </span>
                        )}
                      </div>

                      {/* Record Title */}
                      <h3 className="text-base font-bold text-[var(--main-text)]">
                        {impact.relatedRecordTitle}
                      </h3>

                      {/* Explainable Reasoning Card */}
                      <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 text-xs text-slate-800 space-y-2">
                        <div>
                          <strong className="text-slate-900">Explainable Detection Rationale: </strong>
                          {impact.explainableReason || impact.reasonIdentified}
                        </div>

                        {impact.proposedDownstreamAdjustment && (
                          <div className="text-teal-900 pt-1.5 border-t border-slate-200/60">
                            <strong className="text-teal-950">Proposed Non-Prescribing Adjustment: </strong>
                            {impact.proposedDownstreamAdjustment}
                          </div>
                        )}

                        {impact.exclusionReason && (
                          <div className="text-rose-900 pt-1.5 border-t border-slate-200/60 font-medium">
                            <strong className="text-rose-950">Documented Exclusion Rationale: </strong>
                            {impact.exclusionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions on right */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--subtle-border)]">
                      {impact.reviewStatus !== 'excluded' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenExclusion(impact)}
                          className="text-xs text-rose-800 border-rose-200 hover:bg-rose-50"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-700" />
                          Exclude Record
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Excluded from sync</span>
                      )}

                      {analysis && (
                        <Link href={`/continuity/changes/${analysis.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-[var(--secondary-text)]">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Origin Diff
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* EXCLUSION MODAL */}
        {excludingImpact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <Card className="max-w-lg w-full bg-white border-[var(--subtle-border)] rounded-2xl shadow-xl overflow-hidden p-6 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--main-text)]">Exclude Care Record</h3>
                  <p className="text-xs text-[var(--secondary-text)]">
                    Audit trail mandates a clinical reason to exclude downstream updates.
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="text-[var(--secondary-text)] uppercase font-bold text-[10px]">Record:</div>
                <div className="font-semibold text-[var(--main-text)] mt-0.5">{excludingImpact.relatedRecordTitle}</div>
                <div className="text-[11px] text-[var(--secondary-text)] mt-1">
                  Type: {excludingImpact.relatedRecordType}
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <label className="block text-xs font-bold text-[var(--main-text)]">
                  Clinical Exclusion Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  className="w-full h-24 p-2.5 text-xs rounded-xl border border-[var(--subtle-border)] focus:ring-2 focus:ring-[var(--primary-teal)] focus:outline-none"
                  placeholder="Explain why this downstream record should NOT be synchronized with the updated instruction..."
                  value={exclusionReason}
                  onChange={(e) => setExclusionReason(e.target.value)}
                />
                {exclusionError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {exclusionError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExcludingImpact(null)}
                  disabled={isSubmittingExclusion}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmExclusion}
                  disabled={isSubmittingExclusion}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs"
                >
                  {isSubmittingExclusion ? 'Saving Exclusion...' : 'Confirm Exclusion'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
