'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Pill, 
  Calendar, 
  CheckSquare, 
  History, 
  FolderGit2, 
  Edit3, 
  Archive, 
  Lock, 
  Paperclip, 
  AlertTriangle,
  UserCheck,
  FileCheck,
  Ban
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInstructions, 
  getCachedInstructionSources, 
  getCachedInstructionVersions, 
  reviewInstruction, 
  archiveInstruction 
} from '@/lib/data/instruction-vault-data';
import { CareInstruction, InstructionSource, CareInstructionVersion } from '@/types/caretrace';

export default function InstructionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [instruction, setInstruction] = React.useState<CareInstruction | null>(null);
  const [source, setSource] = React.useState<InstructionSource | null>(null);
  const [versions, setVersions] = React.useState<CareInstructionVersion[]>([]);

  // Dialogs
  const [isReviewOpen, setIsReviewOpen] = React.useState(false);
  const [reviewDecision, setReviewDecision] = React.useState<'verified' | 'rejected'>('verified');
  const [reviewRationale, setReviewRationale] = React.useState('');
  const [reviewChecklist, setReviewChecklist] = React.useState('');
  const [reviewError, setReviewError] = React.useState('');

  const [isArchiveOpen, setIsArchiveOpen] = React.useState(false);
  const [archiveReason, setArchiveReason] = React.useState('');
  const [archiveError, setArchiveError] = React.useState('');

  const [feedback, setFeedback] = React.useState('');

  const loadData = () => {
    const inst = getCachedInstructions().find((i) => i.id === id);
    if (!inst) return;
    setInstruction({ ...inst });

    const src = getCachedInstructionSources().find((s) => s.id === inst.sourceId);
    setSource(src || null);

    const vers = getCachedInstructionVersions().filter((v) => v.instructionId === id);
    setVersions(vers);
  };

  React.useEffect(() => {
    loadData();
  }, [id]);

  if (!instruction) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Instruction Not Found"
          description="The requested instruction record does not exist or has been removed."
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Instruction Vault', href: '/instructions' },
          ]}
        >
          <div className="p-12 text-center bg-white border border-subtleBorder rounded-2xl space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-main">Instruction Record Not Found</h3>
            <p className="text-xs text-secondaryText">Instruction ID: {id}</p>
            <Link href="/instructions">
              <Button variant="primary">Return to Instruction Vault</Button>
            </Link>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRationale.trim() || reviewRationale.trim().length < 5) {
      setReviewError('A documented review rationale (min 5 chars) is mandatory.');
      return;
    }

    const reviewerName = activeRole === 'caregiver' ? 'Sarah Jenkins, RN' : 'Dr. Eleanor Vance, MD';
    const reviewerRole = activeRole === 'caregiver' ? 'Visiting Nurse' : 'Attending Cardiologist';

    reviewInstruction(
      instruction.id,
      reviewDecision,
      reviewRationale.trim(),
      {
        id: 'member-vance',
        name: reviewerName,
        role: reviewerRole,
      },
      reviewChecklist.trim() || undefined
    );

    loadData();
    setIsReviewOpen(false);
    setReviewRationale('');
    setReviewError('');
    setFeedback(`Instruction successfully marked as ${reviewDecision.toUpperCase()}. Decision recorded in audit log.`);
    setTimeout(() => setFeedback(''), 5000);
  };

  const handleConfirmArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveReason.trim() || archiveReason.trim().length < 5) {
      setArchiveError('A documented reason for archiving (min 5 chars) is mandatory.');
      return;
    }

    archiveInstruction(instruction.id, archiveReason.trim());
    loadData();
    setIsArchiveOpen(false);
    setFeedback('Instruction moved to historical archive. All prior versions preserved.');
    setTimeout(() => setFeedback(''), 5000);
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={instruction.title}
        description={`Category: ${instruction.category.replace('_', ' ')} &bull; Version ${instruction.currentVersionNumber}.0 &bull; ${instruction.effectiveDate ? `Effective ${instruction.effectiveDate}` : 'Continuous'}`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault', href: '/instructions' },
          { label: instruction.title },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/instructions">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                All Instructions
              </Button>
            </Link>
            <Link href={`/instructions/${instruction.id}/history`}>
              <Button variant="outline" size="sm" leftIcon={<History className="w-4 h-4" />}>
                Version History ({versions.length})
              </Button>
            </Link>
            <Link href={`/instructions/${instruction.id}/edit`}>
              <Button variant="primary" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
                Edit New Version
              </Button>
            </Link>
          </div>
        }
      >
        {feedback && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Status Callout Banner */}
        {instruction.verificationStatus === 'awaiting_verification' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Awaiting Clinical Verification</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  This instruction was authored or modified by {instruction.createdByName}. It requires formal clinical verification before downstream activation.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              leftIcon={<ShieldCheck className="w-4 h-4" />}
              onClick={() => {
                setReviewDecision('verified');
                setReviewRationale('');
                setReviewError('');
                setIsReviewOpen(true);
              }}
            >
              Verify / Review Instruction
            </Button>
          </div>
        )}

        {instruction.verificationStatus === 'verified' && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 space-y-0.5">
              <p className="font-bold">
                Clinician Verified Order &bull; Verified by {instruction.verifiedByName || 'Attending Clinician'} ({instruction.verifiedByRole})
              </p>
              <p className="text-emerald-800">
                Rationale: &ldquo;{instruction.verificationRationale || 'Verified against institutional medical record.'}&rdquo;
              </p>
            </div>
          </div>
        )}

        {instruction.verificationStatus === 'rejected' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 space-y-0.5">
              <p className="font-bold">
                Clinical Rejection &bull; Rejected by {instruction.rejectedByName || 'Attending Physician'}
              </p>
              <p className="text-red-800">
                Rationale: &ldquo;{instruction.rejectionRationale || 'Documented contraindication.'}&rdquo;
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Details & Structured Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-main">Instruction Content</CardTitle>
                  <p className="text-xs text-secondaryText mt-0.5">Version {instruction.currentVersionNumber}.0 &bull; Patient: Margaret Sullivan</p>
                </div>
                <Badge variant={instruction.verificationStatus === 'verified' ? 'success' : instruction.verificationStatus === 'rejected' ? 'danger' : 'warning'}>
                  {instruction.verificationStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Plain-Language Directive</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {instruction.description}
                  </div>
                </div>

                {/* Structured Clinical Parameters */}
                {instruction.structuredContent && (
                  <div className="space-y-4 pt-3 border-t border-subtleBorder">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Structured Parameters</h4>

                    {instruction.structuredContent.targetParameter && (
                      <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-950">
                        <span className="font-bold">Target Parameter / Safety Bound:</span> {instruction.structuredContent.targetParameter}
                      </div>
                    )}

                    {instruction.structuredContent.frequency && (
                      <div className="text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Timing & Frequency:</span> {instruction.structuredContent.frequency}
                      </div>
                    )}

                    {instruction.structuredContent.guidelines && instruction.structuredContent.guidelines.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-800 mb-1.5">Administration Guidelines:</p>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {instruction.structuredContent.guidelines.map((g, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold">&bull;</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {instruction.structuredContent.precautions && instruction.structuredContent.precautions.length > 0 && (
                      <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl">
                        <p className="text-xs font-bold text-red-900 mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>Stop Conditions & Precautions:</span>
                        </p>
                        <ul className="space-y-1 text-xs text-red-800">
                          {instruction.structuredContent.precautions.map((p, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span>&bull;</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {instruction.tags && instruction.tags.length > 0 && (
                  <div className="pt-3 border-t border-subtleBorder flex flex-wrap gap-1.5">
                    {instruction.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Downstream Care Connections */}
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-3">
                <CardTitle className="text-sm font-bold text-main">Connected Care Records</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                {instruction.relatedMedicationId ? (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-bold text-blue-950">Linked Medication Regimen</p>
                        <p className="text-blue-800">{instruction.relatedMedicationName || instruction.relatedMedicationId}</p>
                      </div>
                    </div>
                    <Link href={`/medications`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 bg-white">
                        View Med
                      </Button>
                    </Link>
                  </div>
                ) : null}

                {instruction.relatedAppointmentId ? (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-bold text-purple-950">Linked Clinic Consultation</p>
                        <p className="text-purple-800">{instruction.relatedAppointmentTitle || instruction.relatedAppointmentId}</p>
                      </div>
                    </div>
                    <Link href={`/appointments`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 bg-white">
                        View Appt
                      </Button>
                    </Link>
                  </div>
                ) : null}

                {instruction.relatedTaskId ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-emerald-950">Linked Care Circle Task</p>
                        <p className="text-emerald-800">{instruction.relatedTaskTitle || instruction.relatedTaskId}</p>
                      </div>
                    </div>
                    <Link href={`/care-circle/tasks`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 bg-white">
                        View Task
                      </Button>
                    </Link>
                  </div>
                ) : null}

                {!instruction.relatedMedicationId && !instruction.relatedAppointmentId && !instruction.relatedTaskId && (
                  <p className="text-slate-500 italic">No direct entity linkages configured for this instruction.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Source Provenance & Audit Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Provenance Card */}
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-main flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-primary" />
                  <span>Source Provenance</span>
                </CardTitle>
                <Link href="/instructions/sources" className="text-xs font-bold text-primary hover:underline">
                  All Sources &rarr;
                </Link>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-xs">
                {source ? (
                  <>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{source.title}</h4>
                      <p className="text-secondaryText capitalize mt-0.5">{source.sourceType.replace(/_/g, ' ')}</p>
                    </div>

                    <div className="pt-2 border-t border-subtleBorder space-y-1.5 text-slate-600">
                      {source.facilityName && (
                        <div className="flex justify-between">
                          <span>Facility / Institution:</span>
                          <span className="font-semibold text-slate-800">{source.facilityName}</span>
                        </div>
                      )}
                      {source.providerName && (
                        <div className="flex justify-between">
                          <span>Provider / Clinician:</span>
                          <span className="font-semibold text-slate-800">{source.providerName}</span>
                        </div>
                      )}
                      {source.documentReference && (
                        <div className="flex justify-between">
                          <span>Doc Reference:</span>
                          <span className="font-mono text-slate-800">{source.documentReference}</span>
                        </div>
                      )}
                      {source.encounterDate && (
                        <div className="flex justify-between">
                          <span>Encounter Date:</span>
                          <span className="font-semibold text-slate-800">{source.encounterDate}</span>
                        </div>
                      )}
                    </div>

                    {source.attachments && source.attachments.length > 0 && (
                      <div className="pt-2 border-t border-subtleBorder">
                        <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attached Medical Document:</span>
                        </p>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="font-mono truncate max-w-[200px]">{source.attachments[0].fileName}</span>
                          <span className="text-slate-500">{(source.attachments[0].fileSize / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      </div>
                    )}

                    {source.isMissingSourceDetails && (
                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] space-y-1">
                        <p className="font-bold">Missing Documentation Notice:</p>
                        <p>{source.notesAboutMissingSource || 'No formal doctor signature or hospital seal attached.'}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 italic">No linked source record found.</p>
                )}
              </CardContent>
            </Card>

            {/* Audit & Archival Card */}
            <Card className="border border-subtleBorder bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Audit Ledger Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Author:</span>
                  <span className="font-bold text-slate-800">{instruction.createdByName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created Timestamp:</span>
                  <span>{new Date(instruction.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified:</span>
                  <span>{new Date(instruction.updatedAt).toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-700 hover:bg-red-50"
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setArchiveReason('');
                      setArchiveError('');
                      setIsArchiveOpen(true);
                    }}
                  >
                    Archive Instruction
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Modal: Human Verification / Rejection */}
        <Dialog
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          title={`Clinical Review: ${instruction.title}`}
          description="Evaluate the source document and record a non-repudiable clinical verification decision."
        >
          <form onSubmit={handleConfirmReview} className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900">Mandatory Human Review:</span>
              <p>CARETRACE strictly prohibits automated AI or heuristic instruction sign-off. As an authorized clinician or coordinator, you confirm you have verified the underlying medical source.</p>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="reviewDecision"
                  checked={reviewDecision === 'verified'}
                  onChange={() => setReviewDecision('verified')}
                />
                <span className="text-emerald-700">Verify & Approve Instruction</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="reviewDecision"
                  checked={reviewDecision === 'rejected'}
                  onChange={() => setReviewDecision('rejected')}
                />
                <span className="text-red-700">Reject Instruction</span>
              </label>
            </div>

            <Textarea
              label="Review Rationale / Clinical Reason (Mandatory)"
              placeholder="e.g. Verified against hospital discharge summary DISCH-STJUDE-2026-8819..."
              value={reviewRationale}
              onChange={(e) => setReviewRationale(e.target.value)}
              error={reviewError}
              rows={3}
              required
            />

            <Textarea
              label="Checklist & Safety Notes (Optional)"
              placeholder="e.g. Checked for drug interactions with existing Lisinopril..."
              value={reviewChecklist}
              onChange={(e) => setReviewChecklist(e.target.value)}
              rows={2}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className={reviewDecision === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                Submit Decision
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: Archive Instruction */}
        <Dialog
          isOpen={isArchiveOpen}
          onClose={() => setIsArchiveOpen(false)}
          title={`Archive Instruction: ${instruction.title}`}
          description="Move instruction to the historical archive. Historical versions remain accessible for audit."
        >
          <form onSubmit={handleConfirmArchive} className="space-y-4 pt-2">
            <Textarea
              label="Reason for Archiving (Mandatory)"
              placeholder="e.g. Clinical protocol superseded by updated cardiology visit notes..."
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              error={archiveError}
              rows={3}
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsArchiveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-red-600 hover:bg-red-700 text-white">
                Confirm Archival
              </Button>
            </div>
          </form>
        </Dialog>

      </PageContainer>
    </AppShell>
  );
}
