'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle, 
  HelpCircle, 
  Plus, 
  ShieldCheck, 
  FileText, 
  MessageSquare,
  AlertTriangle,
  Send,
  Calendar
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareCircleNavTabs } from '@/components/features/care-circle/care-circle-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedHandovers, 
  getCachedMembers, 
  getCachedTasks, 
  addHandover, 
  acknowledgeHandover, 
  requestHandoverClarification 
} from '@/lib/data/care-circle-data';
import { CareHandover, CareCircleMember, CareTask, HandoverStatus } from '@/types/caretrace';

export default function ShiftHandoverPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [handovers, setHandovers] = React.useState<CareHandover[]>([]);
  const [members, setMembers] = React.useState<CareCircleMember[]>([]);
  const [tasks, setTasks] = React.useState<CareTask[]>([]);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isAcknowledgeOpen, setIsAcknowledgeOpen] = React.useState(false);
  const [isClarifyOpen, setIsClarifyOpen] = React.useState(false);
  const [selectedHandover, setSelectedHandover] = React.useState<CareHandover | null>(null);

  // Form states for creation
  const [outgoingMemberId, setOutgoingMemberId] = React.useState('member-sarah');
  const [incomingMemberId, setIncomingMemberId] = React.useState('member-david');
  const [shiftPeriod, setShiftPeriod] = React.useState('Morning Shift (08:00 – 12:00)');
  const [responsibilitiesText, setResponsibilitiesText] = React.useState('Morning vitals recorded (BP 124/78, Pulse 68). Morning medications verified.');
  const [notes, setNotes] = React.useState('Patient was alert, had oatmeal breakfast with tea, and completed light walking exercise in the living room.');
  const [createError, setCreateError] = React.useState('');

  // Form states for acknowledge / clarify
  const [ackNotes, setAckNotes] = React.useState('');
  const [clarifyQuestion, setClarifyQuestion] = React.useState('');
  const [dialogError, setDialogError] = React.useState('');
  const [feedback, setFeedback] = React.useState('');

  const loadData = () => {
    setHandovers([...getCachedHandovers()]);
    setMembers(getCachedMembers().filter(m => m.membershipStatus === 'active'));
    setTasks(getCachedTasks());
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const pendingHandovers = handovers.filter(
    h => h.handoverStatus === 'ready_for_handover' || h.handoverStatus === 'needs_clarification'
  );
  const completedHandovers = handovers.filter(h => h.handoverStatus === 'acknowledged');

  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsibilitiesText.trim() || !notes.trim()) {
      setCreateError('Please summarize responsibilities covered and provide observational notes.');
      return;
    }

    const outgoing = members.find(m => m.id === outgoingMemberId);
    const incoming = members.find(m => m.id === incomingMemberId);

    if (!outgoing || !incoming) {
      setCreateError('Please select both outgoing and incoming care circle members.');
      return;
    }

    const newHandover: CareHandover = {
      id: `handover-${Date.now()}`,
      patientId: 'patient-profile-001',
      outgoingMemberId: outgoing.id,
      outgoingMemberName: outgoing.name,
      outgoingMemberRole: outgoing.assignedRole || 'Visiting Nurse',
      incomingMemberId: incoming.id,
      incomingMemberName: incoming.name,
      incomingMemberRole: incoming.assignedRole || 'Family Care Coordinator',
      shiftPeriod,
      handoverDatetime: new Date().toISOString(),
      handoverStatus: 'ready_for_handover',
      relevantResponsibilities: responsibilitiesText.split('\n').filter(Boolean),
      pendingTaskIds: tasks.filter(t => t.status !== 'completed').slice(0, 2).map(t => t.id),
      nonClinicalNotes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addHandover(newHandover);
    loadData();
    setIsCreateOpen(false);
    setCreateError('');
    setFeedback('New shift handover submitted for incoming member review.');
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleOpenAcknowledge = (handover: CareHandover) => {
    setSelectedHandover(handover);
    setAckNotes('');
    setDialogError('');
    setIsAcknowledgeOpen(true);
  };

  const handleConfirmAcknowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandover) return;

    acknowledgeHandover(selectedHandover.id, 'David Sullivan', ackNotes.trim() || undefined);
    loadData();
    setIsAcknowledgeOpen(false);
    setFeedback('Shift handover acknowledged. Active care continuity accepted.');
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleOpenClarify = (handover: CareHandover) => {
    setSelectedHandover(handover);
    setClarifyQuestion('');
    setDialogError('');
    setIsClarifyOpen(true);
  };

  const handleConfirmClarify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHandover) return;
    if (!clarifyQuestion.trim() || clarifyQuestion.trim().length < 5) {
      setDialogError('Please provide a specific question or clarification request (min 5 chars).');
      return;
    }

    requestHandoverClarification(selectedHandover.id, clarifyQuestion.trim(), 'David Sullivan');
    loadData();
    setIsClarifyOpen(false);
    setFeedback('Clarification request posted to outgoing caregiver.');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Caregiver Shift Handover Centre"
        description="Structured transition of care responsibilities between visiting nurses, home aides, and family coordinators to ensure no instruction, vital sign, or task is dropped."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Shift Handover' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setCreateError('');
              setIsCreateOpen(true);
            }}
          >
            Create Shift Handover
          </Button>
        }
      >
        <CareCircleNavTabs />

        {feedback && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Pending Handovers Requiring Attention */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-main">Pending Handover Transitions</h2>
              <p className="text-xs text-secondaryText">Handovers awaiting review, sign-off, or active responsibility assumption.</p>
            </div>
            <Badge variant={pendingHandovers.length > 0 ? 'warning' : 'success'}>
              {pendingHandovers.length} Pending Sign-off
            </Badge>
          </div>

          {pendingHandovers.length === 0 ? (
            <div className="p-8 text-center bg-white border border-subtleBorder rounded-2xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-main">All Shift Transitions Up to Date</h3>
              <p className="text-xs text-secondaryText">No unacknowledged handovers awaiting family or nursing review.</p>
            </div>
          ) : (
            pendingHandovers.map((handover) => (
              <Card key={handover.id} className="border-2 border-amber-300 bg-amber-50/20 shadow-sm">
                <CardContent className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                        <ArrowLeftRight className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                            {handover.shiftPeriod}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(handover.handoverDatetime).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 mt-1">
                          Transition: {handover.outgoingMemberName} &rarr; {handover.incomingMemberName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => handleOpenAcknowledge(handover)}
                      >
                        Acknowledge & Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<HelpCircle className="w-4 h-4" />}
                        onClick={() => handleOpenClarify(handover)}
                      >
                        Ask Question
                      </Button>
                    </div>
                  </div>

                  {/* Clarification banner if requested */}
                  {handover.handoverStatus === 'needs_clarification' && handover.clarificationNotes && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Clarification Requested:</span> &ldquo;{handover.clarificationNotes}&rdquo;
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Responsibilities Covered */}
                    <div className="p-4 bg-white border border-subtleBorder rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Responsibilities Completed During Shift</h4>
                      <ul className="text-xs text-slate-700 space-y-1.5">
                        {handover.relevantResponsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Observational Notes */}
                    <div className="p-4 bg-white border border-subtleBorder rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Shift Notes & Observations</h4>
                      <p className="text-xs text-slate-800 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        &ldquo;{handover.nonClinicalNotes}&rdquo;
                      </p>
                      <p className="text-[10px] text-slate-400">
                        *Care coordination and observation notes. CARETRACE does not issue autonomous clinical orders.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Historical Handover Archive */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-main">Historical Handover Archive</h2>
              <p className="text-xs text-secondaryText">Audited record of prior shift transitions and acknowledgements.</p>
            </div>
            <span className="text-xs text-secondaryText">{completedHandovers.length} Acknowledged</span>
          </div>

          <div className="space-y-3">
            {completedHandovers.length === 0 ? (
              <div className="p-6 text-center text-xs text-secondaryText bg-white border border-subtleBorder rounded-xl">
                No past acknowledged handovers in archive.
              </div>
            ) : (
              completedHandovers.map((h) => (
                <div key={h.id} className="p-4 bg-white border border-subtleBorder rounded-xl shadow-xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <h4 className="font-bold text-sm text-main">
                        {h.outgoingMemberName} &rarr; {h.incomingMemberName}
                      </h4>
                      <Badge variant="success" className="text-[10px] py-0">Acknowledged</Badge>
                    </div>
                    <span className="text-xs text-secondaryText flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(h.handoverDatetime).toLocaleDateString()} &bull; {h.shiftPeriod}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {h.nonClinicalNotes}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-subtleBorder text-[11px] text-slate-500">
                    <span>
                      Acknowledged by: <strong className="text-slate-700">{h.acknowledgedByName || h.incomingMemberName}</strong>
                      {h.acknowledgedAt && ` at ${new Date(h.acknowledgedAt).toLocaleTimeString()}`}
                    </span>
                    {h.relevantResponsibilities && (
                      <span>{h.relevantResponsibilities.length} responsibilities transitioned</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal: Create Shift Handover */}
        <Dialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Submit Care Shift Handover"
          description="Document responsibilities completed and transition pending duties to the incoming care team."
        >
          <form onSubmit={handleCreateHandover} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Outgoing Member (Off-duty)"
                value={outgoingMemberId}
                onChange={(e) => setOutgoingMemberId(e.target.value)}
                options={members.map(m => ({ value: m.id, label: `${m.name} (${m.relationship})` }))}
              />

              <Select
                label="Incoming Member (On-duty)"
                value={incomingMemberId}
                onChange={(e) => setIncomingMemberId(e.target.value)}
                options={members.map(m => ({ value: m.id, label: `${m.name} (${m.relationship})` }))}
              />
            </div>

            <Input
              label="Shift Period"
              placeholder="e.g. Morning Visiting Nurse Shift (08:00 – 12:00)"
              value={shiftPeriod}
              onChange={(e) => setShiftPeriod(e.target.value)}
              required
            />

            <Textarea
              label="Responsibilities Handled (One per line)"
              value={responsibilitiesText}
              onChange={(e) => setResponsibilitiesText(e.target.value)}
              rows={3}
              required
            />

            <Textarea
              label="Shift Observations & Non-Clinical Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required
            />

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span className="font-bold">Clinical Safety Rule:</span> CARETRACE handovers record human-verified care coordination and observational context. They do not alter official physician prescription regimens.
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Submit Handover
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: Acknowledge Handover */}
        <Dialog
          isOpen={isAcknowledgeOpen}
          onClose={() => setIsAcknowledgeOpen(false)}
          title="Acknowledge Shift Handover"
          description={`Sign off on shift transition from ${selectedHandover?.outgoingMemberName}.`}
        >
          <form onSubmit={handleConfirmAcknowledge} className="space-y-4 pt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs">
              By acknowledging, you confirm you have reviewed the shift notes and accept active coordination responsibility for Margaret Sullivan.
            </div>

            <Textarea
              label="Acknowledgement Notes (Optional)"
              placeholder="e.g. Reviewed BP readings. Will monitor evening hydration and administer evening Lisinopril..."
              value={ackNotes}
              onChange={(e) => setAckNotes(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsAcknowledgeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Acknowledge & Assume Care
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: Clarify Question */}
        <Dialog
          isOpen={isClarifyOpen}
          onClose={() => setIsClarifyOpen(false)}
          title="Request Handover Clarification"
          description={`Submit a question to ${selectedHandover?.outgoingMemberName} regarding their shift.`}
        >
          <form onSubmit={handleConfirmClarify} className="space-y-4 pt-2">
            <Textarea
              label="Question / Clarification Details"
              placeholder="e.g. Did Margaret take the full 8oz glass of water with her 9am Metoprolol dose?"
              value={clarifyQuestion}
              onChange={(e) => setClarifyQuestion(e.target.value)}
              error={dialogError}
              rows={3}
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsClarifyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Submit Question
              </Button>
            </div>
          </form>
        </Dialog>

      </PageContainer>
    </AppShell>
  );
}