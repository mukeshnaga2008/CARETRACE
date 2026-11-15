'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  History, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  GitCompare, 
  Calendar, 
  User, 
  FileText, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  Info,
  GitCommit
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInstructions, 
  getCachedInstructionVersions, 
  compareInstructionVersions 
} from '@/lib/data/instruction-vault-data';
import { CareInstruction, CareInstructionVersion } from '@/types/caretrace';

export default function InstructionHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [instruction, setInstruction] = React.useState<CareInstruction | null>(null);
  const [versions, setVersions] = React.useState<CareInstructionVersion[]>([]);
  
  // Comparison selectors
  const [selectedVerA, setSelectedVerA] = React.useState<number>(1);
  const [selectedVerB, setSelectedVerB] = React.useState<number>(2);

  React.useEffect(() => {
    const inst = getCachedInstructions().find((i) => i.id === id);
    if (!inst) return;
    setInstruction(inst);

    const vers = getCachedInstructionVersions()
      .filter((v) => v.instructionId === id)
      .sort((a, b) => b.versionNumber - a.versionNumber);

    setVersions(vers);

    if (vers.length >= 2) {
      setSelectedVerA(vers[vers.length - 1].versionNumber); // older
      setSelectedVerB(vers[0].versionNumber); // newest
    } else if (vers.length === 1) {
      setSelectedVerA(vers[0].versionNumber);
      setSelectedVerB(vers[0].versionNumber);
    }
  }, [id]);

  if (!instruction) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Instruction Not Found"
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Instruction Vault', href: '/instructions' },
          ]}
        >
          <div className="p-8 text-center text-xs text-secondaryText">Instruction record not found.</div>
        </PageContainer>
      </AppShell>
    );
  }

  const comparison = compareInstructionVersions(instruction.id, selectedVerA, selectedVerB);

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={`Version History & Diffs: ${instruction.title}`}
        description={`Immutable audit trail of all revisions, clinical justifications, and human review decisions for this care instruction.`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault', href: '/instructions' },
          { label: instruction.title, href: `/instructions/${instruction.id}` },
          { label: 'Version History' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/instructions/${instruction.id}`}>
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Current Version (v{instruction.currentVersionNumber}.0)
              </Button>
            </Link>
            <Link href={`/instructions/${instruction.id}/edit`}>
              <Button variant="primary" size="sm">
                Edit New Version
              </Button>
            </Link>
          </div>
        }
      >
        {/* Version Comparison Section */}
        <div className="mb-10 space-y-4">
          <div className="p-5 bg-white border border-subtleBorder rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtleBorder">
              <div>
                <h3 className="font-bold text-base text-main flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-primary" />
                  <span>Deterministic Version Comparison</span>
                </h3>
                <p className="text-xs text-secondaryText mt-0.5">
                  Select any two versions to inspect exact textual, categorical, and parameter modifications.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-600">Base:</span>
                  <select
                    className="h-8 rounded-lg border border-subtleBorder text-xs px-2 font-mono"
                    value={selectedVerA}
                    onChange={(e) => setSelectedVerA(Number(e.target.value))}
                  >
                    {versions.map(v => (
                      <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber}.0</option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400" />

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-600">Target:</span>
                  <select
                    className="h-8 rounded-lg border border-subtleBorder text-xs px-2 font-mono"
                    value={selectedVerB}
                    onChange={(e) => setSelectedVerB(Number(e.target.value))}
                  >
                    {versions.map(v => (
                      <option key={v.versionNumber} value={v.versionNumber}>v{v.versionNumber}.0</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comparison Side-by-Side Cards */}
            {comparison.versionA && comparison.versionB ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Version A Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-800 font-mono font-bold text-xs rounded-md">
                        Version {comparison.versionA.versionNumber}.0
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(comparison.versionA.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{comparison.versionA.title}</h4>
                      <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{comparison.versionA.description}</p>
                    </div>
                    {comparison.versionA.structuredContent?.targetParameter && (
                      <div className="p-2 bg-white rounded border border-slate-200 text-xs">
                        <strong className="text-slate-900">Target:</strong> {comparison.versionA.structuredContent.targetParameter}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                      Editor: <strong>{comparison.versionA.editorName}</strong> ({comparison.versionA.editorRole})
                    </div>
                  </div>

                  {/* Version B Card */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-primary/20 text-primary font-mono font-bold text-xs rounded-md">
                        Version {comparison.versionB.versionNumber}.0 (Target)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(comparison.versionB.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{comparison.versionB.title}</h4>
                      <p className="text-xs text-slate-800 mt-1 whitespace-pre-wrap font-medium">{comparison.versionB.description}</p>
                    </div>
                    {comparison.versionB.structuredContent?.targetParameter && (
                      <div className="p-2 bg-white rounded border border-primary/20 text-xs text-primary font-semibold">
                        <strong>Target:</strong> {comparison.versionB.structuredContent.targetParameter}
                      </div>
                    )}
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <span className="font-bold">Reason for Revision:</span> &ldquo;{comparison.versionB.changeReason}&rdquo;
                    </div>
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-primary/10">
                      Editor: <strong>{comparison.versionB.editorName}</strong> ({comparison.versionB.editorRole})
                    </div>
                  </div>
                </div>

                {/* Differences Breakdown Table */}
                <div className="p-4 bg-white border border-subtleBorder rounded-xl text-xs space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Field Diff Analysis</h4>
                  <div className="divide-y divide-subtleBorder">
                    {comparison.differences.map((d) => (
                      <div key={d.field} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-mono text-slate-600 font-semibold capitalize">{d.field.replace(/([A-Z])/g, ' $1')}:</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${d.changed ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                            {d.changed ? 'Modified' : 'Unchanged'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    *Differences describe stored record updates and clinical rationale. CARETRACE does not make automated medical conclusions.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Only 1 version exists on record.</p>
            )}
          </div>
        </div>

        {/* Chronological Version Timeline */}
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-main">Complete Immutable Version Timeline</h3>
            <p className="text-xs text-secondaryText">Chronological record of every iteration from initial hospital discharge.</p>
          </div>

          <div className="space-y-4">
            {versions.map((ver, idx) => (
              <Card key={ver.id} className="border border-subtleBorder bg-white shadow-xs">
                <CardContent className="p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 bg-primary/10 text-primary font-mono font-bold text-xs rounded-lg">
                        v{ver.versionNumber}.0
                      </span>
                      <h4 className="font-bold text-sm text-main">{ver.title}</h4>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">
                          Current Live Version
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-secondaryText flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(ver.createdAt).toLocaleString()}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {ver.description}
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <GitCommit className="w-3.5 h-3.5 text-primary" />
                      <span>Documented Revision Rationale:</span>
                    </div>
                    <p className="italic text-slate-700">&ldquo;{ver.changeReason}&rdquo;</p>
                  </div>

                  <div className="pt-2.5 border-t border-subtleBorder flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div>
                      Editor: <strong className="text-slate-800">{ver.editorName}</strong> ({ver.editorRole})
                    </div>
                    {ver.verifiedByName && (
                      <div className="flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified by {ver.verifiedByName} on {new Date(ver.verifiedAt || '').toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </PageContainer>
    </AppShell>
  );
}
