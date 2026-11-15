'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Archive, 
  History, 
  ArrowLeft, 
  Search, 
  FileText, 
  Clock, 
  Lock, 
  GitCommit,
  CheckCircle2
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { InstructionsNavTabs } from '@/components/features/instructions/instructions-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AppRole } from '@/lib/constants';
import { getCachedInstructions, getCachedInstructionSources } from '@/lib/data/instruction-vault-data';
import { CareInstruction } from '@/types/caretrace';

export default function ArchivedInstructionsPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [instructions, setInstructions] = React.useState<CareInstruction[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const all = getCachedInstructions();
    const archivedList = all.filter(
      (i) => i.verificationStatus === 'archived' || i.verificationStatus === 'superseded'
    );
    setInstructions(archivedList);
  }, []);

  const sources = getCachedInstructionSources();

  const filtered = instructions.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Archived & Superseded Instructions"
        description="Historical repository of retired care instructions and previous clinical guidelines. Permanent version records are preserved for complete longitudinal continuity."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault', href: '/instructions' },
          { label: 'Archived Records' },
        ]}
      >
        <InstructionsNavTabs />

        {/* Archival Policy Notice */}
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3.5">
          <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-slate-900">
              Immutable Historical Retention Standard
            </p>
            <p>
              In healthcare continuity, no clinical record is ever deleted. When an instruction is superseded by a newer order or archived due to condition resolution, its complete text, provenance, and review decisions are permanently preserved for medical audits.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border border-subtleBorder rounded-2xl shadow-xs mb-6">
          <Input
            isSearch
            placeholder="Search archived instructions by title or clinical directives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-white border border-subtleBorder rounded-2xl space-y-2">
              <Archive className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-main">No Archived Records Found</h3>
              <p className="text-xs text-secondaryText">No instructions in this repository have been archived or superseded.</p>
            </div>
          ) : (
            filtered.map((inst) => {
              const source = sources.find((s) => s.id === inst.sourceId);

              return (
                <Card key={inst.id} className="border border-subtleBorder bg-white opacity-85 hover:opacity-100 transition-opacity">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-700">
                          {inst.verificationStatus}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded">
                          v{inst.currentVersionNumber}.0
                        </span>
                        <h3 className="font-bold text-base text-main">{inst.title}</h3>
                      </div>
                      <span className="text-xs text-secondaryText flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Retired: {inst.archivedAt ? new Date(inst.archivedAt).toLocaleDateString() : inst.supersededAt ? new Date(inst.supersededAt).toLocaleDateString() : 'Archived'}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {inst.description}
                    </p>

                    {inst.archiveReason && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="font-bold">Archival Rationale:</span> &ldquo;{inst.archiveReason}&rdquo;
                      </div>
                    )}

                    <div className="pt-2 border-t border-subtleBorder flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                      <span>Source: <strong className="text-slate-700">{source?.title || 'Clinical Encounter'}</strong></span>

                      <div className="flex items-center gap-2">
                        <Link href={`/instructions/${inst.id}/history`}>
                          <Button variant="outline" size="sm" className="text-xs h-7" leftIcon={<History className="w-3 h-3" />}>
                            View Version History
                          </Button>
                        </Link>
                        <Link href={`/instructions/${inst.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7">
                            Details &rarr;
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

      </PageContainer>
    </AppShell>
  );
}
