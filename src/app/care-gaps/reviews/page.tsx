'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  Filter,
  FileText,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FolderGit2,
  GitCompare,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareGapsNavTabs } from '@/components/features/care-gaps/care-gaps-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getCachedCareGaps } from '@/lib/data/care-gap-intelligence-data';
import { CareGapRecord } from '@/types/caretrace';

export default function ReviewGapsPage() {
  const [gaps, setGaps] = React.useState<CareGapRecord[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const allGaps = getCachedCareGaps().filter((g) => g.category === 'instruction_continuity');
    setGaps(allGaps);
  }, []);

  const activeGaps = gaps.filter((g) => g.status !== 'resolved' && g.status !== 'dismissed');

  const filteredGaps = activeGaps.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.explanation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Care Gap Radar', href: '/care-gaps' },
        { label: 'Review Gaps' },
      ]}
      pageTitle="Clinical Instruction &amp; Continuity Review Gaps"
      pageDescription="Surveillance of unverified care instructions, missing document provenance, pending continuity reviews, and paused clarifications."
    >
      <PageContainer>
        <CareGapsNavTabs />

        {/* TOP NOTICE */}
        <div className="mb-6 p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg shrink-0 mt-0.5">
            <ClipboardCheck className="w-5 h-5 text-indigo-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900">
              Provenance &amp; Clinical Gate Integrity
            </h3>
            <p className="text-xs text-indigo-800 leading-relaxed mt-0.5">
              Newly recorded clinical orders cannot be safely synchronized downstream until verified.
              CARETRACE highlights pending verifications, missing discharge summaries, and continuity reviews awaiting clinical action.
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-6 max-w-md">
          <Input
            placeholder="Search review gaps by instruction or protocol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-white border-[var(--subtle-border)]"
          />
        </div>

        {/* GAPS FEED */}
        {filteredGaps.length === 0 ? (
          <Card className="p-8 text-center bg-white border-[var(--subtle-border)] rounded-2xl">
            <ClipboardCheck className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--main-text)]">No pending review gaps</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              All clinical instructions and downstream continuity diffs have received authorized review.
            </p>
          </Card>
        ) : (
          <div className="space-y-4 mb-8">
            {filteredGaps.map((gap) => (
              <Card
                key={gap.id}
                className="border-[var(--subtle-border)] hover:border-indigo-400 transition-all bg-white p-5 rounded-2xl shadow-xs"
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

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                      <strong>Priority Rationale: </strong> {gap.priorityReason}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center lg:flex-col justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--subtle-border)]">
                    <Link href={`/care-gaps/${gap.id}`}>
                      <Button size="sm" className="bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white font-semibold text-xs">
                        Inspect &amp; Resolve
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

        {/* BOTTOM SHORTCUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/instructions/review" className="block">
            <Card className="border-[var(--subtle-border)] hover:border-indigo-400 transition-all bg-white p-4 rounded-xl shadow-2xs group">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-indigo-700" />
                <h4 className="text-sm font-bold text-[var(--main-text)] group-hover:text-indigo-700">
                  Instruction Vault Verification Queue
                </h4>
              </div>
              <p className="text-xs text-[var(--secondary-text)]">
                Review newly authored hospital discharge sheets and physician orders before activation.
              </p>
            </Card>
          </Link>

          <Link href="/continuity/reviews" className="block">
            <Card className="border-[var(--subtle-border)] hover:border-indigo-400 transition-all bg-white p-4 rounded-xl shadow-2xs group">
              <div className="flex items-center gap-2 mb-1">
                <GitCompare className="w-4 h-4 text-[var(--primary-teal)]" />
                <h4 className="text-sm font-bold text-[var(--main-text)] group-hover:text-[var(--primary-teal)]">
                  Care Continuity Review Workflows
                </h4>
              </div>
              <p className="text-xs text-[var(--secondary-text)]">
                Evaluate deterministic instruction diffs and authorize downstream non-prescribing task synchronizations.
              </p>
            </Card>
          </Link>
        </div>
      </PageContainer>
    </AppShell>
  );
}
