'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Clock, 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  ArrowRight, 
  FolderGit2, 
  UserCheck, 
  History,
  Info
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { InstructionsNavTabs } from '@/components/features/instructions/instructions-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInstructions, 
  getCachedInstructionSources, 
  reviewInstruction 
} from '@/lib/data/instruction-vault-data';
import { CareInstruction, InstructionSource } from '@/types/caretrace';

export default function InstructionReviewQueuePage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('caregiver');
  const [instructions, setInstructions] = React.useState<CareInstruction[]>([]);
  const [sources, setSources] = React.useState<InstructionSource[]>([]);

  // Review Dialog
  const [selectedInstruction, setSelectedInstruction] = React.useState<CareInstruction | null>(null);
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [decision, setDecision] = React.useState<'verified' | 'rejected'>('verified');
  const [rationale, setRationale] = React.useState('');
  const [checklistNotes, setChecklistNotes] = React.useState('');
  const [reviewError, setReviewError] = React.useState('');
  const [feedback, setFeedback] = React.useState('');

  const loadData = () => {
    setInstructions([...getCachedInstructions()]);
    setSources(getCachedInstructionSources());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const pendingInstructions = instructions.filter((i) => i.verificationStatus === 'awaiting_verification');
  const reviewedInstructions = instructions.filter((i) => i.verificationStatus === 'verified' || i.verificationStatus === 'rejected');

  const handleOpenReview = (inst: CareInstruction, defaultDecision: 'verified' | 'rejected' = 'verified') => {
    setSelectedInstruction(inst);
    setDecision(defaultDecision);
    setRationale('');
    setChecklistNotes('');
    setReviewError('');
    setIsReviewOpen(true);
  };

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstruction) return;
    if (!rationale.trim() || rationale.trim().length < 5) {
      setReviewError('A documented rationale (minimum 5 characters) is mandatory.');
      return;
    }

    const reviewerName = activeRole === 'caregiver' ? 'Sarah Jenkins, RN' : 'Dr. Eleanor Vance, MD';
    const reviewerRole = activeRole === 'caregiver' ? 'Visiting Nurse' : 'Attending Cardiologist';

    reviewInstruction(
      selectedInstruction.id,
      decision,
      rationale.trim(),
      {
        id: 'member-vance',
        name: reviewerName,
        role: reviewerRole,
      },
      checklistNotes.trim() || undefined
    );

    loadData();
    setIsReviewOpen(false);
    setFeedback(`Instruction "${selectedInstruction.title}" successfully marked as ${decision.toUpperCase()}.`);
    setTimeout(() => setFeedback(''), 5000);
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Clinical Instruction Review Queue"
        description="Mandatory human authorization gate for all incoming care instructions, revisions, and dietary directives before clinical activation."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault', href: '/instructions' },
          { label: 'Review Queue' },
        ]}
      >
        <InstructionsNavTabs />

        {feedback && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Clinical Gate Principles Notice */}
        <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed space-y-1">
            <p className="font-bold">Human Verification Requirement (Zero Automated Activation)</p>
            <p>
              In accordance with CARETRACE clinical safety boundaries, instructions authored by family members, visiting aides, or OCR extraction must be explicitly verified by an authorized clinician or care coordinator with a recorded rationale.
            </p>
          </div>
        </div>

        {/* Pending Instructions Queue */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-main">Pending Review ({pendingInstructions.length})</h2>
              <p className="text-xs text-secondaryText">Instructions requiring clinical assessment and decision logging.</p>
            </div>
            <Badge variant={pendingInstructions.length > 0 ? 'warning' : 'success'}>
              {pendingInstructions.length} Awaiting Sign-off
            </Badge>
          </div>

          {pendingInstructions.length === 0 ? (
            <div className="p-10 text-center bg-white border border-subtleBorder rounded-2xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-main">Review Queue Clear</h3>
              <p className="text-xs text-secondaryText">All current patient care instructions have been evaluated and verified.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInstructions.map((inst) => {
                const source = sources.find((s) => s.id === inst.sourceId);

                return (
                  <Card key={inst.id} className="border-2 border-amber-300 bg-amber-50/20 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg uppercase">
                            {inst.category.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-xs font-mono font-bold rounded">
                            v{inst.currentVersionNumber}.0
                          </span>
                          <h3 className="font-bold text-base text-slate-900">{inst.title}</h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                            onClick={() => handleOpenReview(inst, 'verified')}
                          >
                            Verify & Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-700 border-red-300 hover:bg-red-50"
                            leftIcon={<XCircle className="w-4 h-4" />}
                            onClick={() => handleOpenReview(inst, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>

                      {/* Directive Text */}
                      <p className="text-xs text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-amber-200">
                        {inst.description}
                      </p>

                      {/* Provenance Box */}
                      {source && (
                        <div className="p-3 bg-white/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Source:</span> <strong className="text-slate-900">{source.title}</strong>
                            {source.providerName && <span className="text-slate-600"> &bull; {source.providerName}</span>}
                          </div>
                          <span className="text-slate-500 font-mono text-[11px]">{source.documentReference || 'No Doc ID'}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200 text-[11px] text-slate-600">
                        <span>Submitted by: <strong>{inst.createdByName}</strong> ({inst.createdByRole})</span>
                        <Link href={`/instructions/${inst.id}`} className="text-primary font-bold hover:underline">
                          Full Inspection &rarr;
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Evaluated Instructions */}
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-main">Recently Evaluated Instructions</h3>
            <p className="text-xs text-secondaryText">Audited clinical decisions recorded in the immutable review log.</p>
          </div>

          <div className="space-y-3">
            {reviewedInstructions.slice(0, 4).map((inst) => (
              <div key={inst.id} className="p-4 bg-white border border-subtleBorder rounded-xl shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-main">{inst.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inst.verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {inst.verificationStatus}
                    </span>
                  </div>
                  <span className="text-xs text-secondaryText">
                    {inst.verifiedAt || inst.rejectedAt ? new Date(inst.verifiedAt || inst.rejectedAt || '').toLocaleDateString() : 'Active'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1">
                  Rationale: &ldquo;{inst.verificationRationale || inst.rejectionRationale || 'Clinical protocol confirmed.'}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-subtleBorder text-[11px] text-slate-500">
                  <span>Decision logged by: <strong>{inst.verifiedByName || inst.rejectedByName || 'Attending Clinician'}</strong></span>
                  <Link href={`/instructions/${inst.id}`} className="text-primary font-bold hover:underline">
                    Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Verification Decision */}
        <Dialog
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          title={`Clinical Evaluation: ${selectedInstruction?.title}`}
          description="Record a clinical verification or rejection decision with mandatory rationale."
        >
          <form onSubmit={handleConfirmReview} className="space-y-4 pt-2">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'verified'}
                  onChange={() => setDecision('verified')}
                />
                <span className="text-emerald-700">Verify & Approve Instruction</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'rejected'}
                  onChange={() => setDecision('rejected')}
                />
                <span className="text-red-700">Reject Instruction</span>
              </label>
            </div>

            <Textarea
              label="Clinical Review Rationale (Mandatory for Audit)"
              placeholder={decision === 'verified' 
                ? 'e.g. Verified against hospital discharge summary DISCH-STJUDE-2026-8819 and attending consultation...'
                : 'e.g. Contraindicated due to negative inotropic interaction with prescribed beta-blocker...'}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              error={reviewError}
              rows={3}
              required
            />

            <Textarea
              label="Safety Verification Checklist Notes (Optional)"
              placeholder="e.g. Checked for duplicate instructions, dose thresholds, and patient allergies..."
              value={checklistNotes}
              onChange={(e) => setChecklistNotes(e.target.value)}
              rows={2}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className={decision === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                Submit Decision
              </Button>
            </div>
          </form>
        </Dialog>

      </PageContainer>
    </AppShell>
  );
}
