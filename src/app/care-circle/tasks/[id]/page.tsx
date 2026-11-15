'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  ArrowLeft, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Pill, 
  Calendar, 
  ShieldCheck, 
  Edit3,
  ArrowRight,
  Repeat,
  FileText
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedTasks, 
  getCachedMembers, 
  updateCareTaskStatus, 
  reassignCareTask 
} from '@/lib/data/care-circle-data';
import { CareTask, CareCircleMember, TaskPriority } from '@/types/caretrace';

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [task, setTask] = React.useState<CareTask | null>(null);
  const [members, setMembers] = React.useState<CareCircleMember[]>([]);

  // Dialogs
  const [isCompleteOpen, setIsCompleteOpen] = React.useState(false);
  const [isReassignOpen, setIsReassignOpen] = React.useState(false);

  // Form states
  const [completionNotes, setCompletionNotes] = React.useState('');
  const [reassignMemberId, setReassignMemberId] = React.useState('');
  const [reassignReason, setReassignReason] = React.useState('');
  const [reassignError, setReassignError] = React.useState('');
  const [feedback, setFeedback] = React.useState('');

  const loadData = () => {
    const found = getCachedTasks().find((t) => t.id === id);
    if (found) setTask({ ...found });
    setMembers(getCachedMembers().filter((m) => m.membershipStatus === 'active'));
  };

  React.useEffect(() => {
    loadData();
  }, [id]);

  if (!task) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Task Not Found"
          description="The requested care task does not exist or has been removed."
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Care Circle', href: '/care-circle' },
            { label: 'Tasks', href: '/care-circle/tasks' },
          ]}
        >
          <div className="p-8 text-center bg-white border border-subtleBorder rounded-2xl space-y-4">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-main">Care Task Not Found</h3>
            <p className="text-sm text-secondaryText">Task ID: {id}</p>
            <Link href="/care-circle/tasks">
              <Button variant="primary">Return to Tasks List</Button>
            </Link>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const handleConfirmComplete = (e: React.FormEvent) => {
    e.preventDefault();
    updateCareTaskStatus(task.id, 'completed', completionNotes.trim() || undefined, 'David Sullivan');
    loadData();
    setIsCompleteOpen(false);
    setFeedback('Task marked as completed.');
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleConfirmReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignReason.trim() || reassignReason.trim().length < 5) {
      setReassignError('A documented reason (min 5 chars) is mandatory.');
      return;
    }

    const targetMember = members.find((m) => m.id === reassignMemberId);
    if (!targetMember) return;

    reassignCareTask(
      task.id,
      targetMember.id,
      targetMember.name,
      targetMember.assignedRole || 'caregiver',
      reassignReason.trim(),
      'David Sullivan'
    );

    loadData();
    setIsReassignOpen(false);
    setFeedback(`Task reassigned to ${targetMember.name}.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleClaimTask = () => {
    const currentDavid = members.find((m) => m.id === 'member-david') || members[0];
    if (currentDavid) {
      reassignCareTask(
        task.id,
        currentDavid.id,
        currentDavid.name,
        currentDavid.assignedRole || 'family_coordinator',
        'Claimed responsibility from open pool',
        'David Sullivan'
      );
      loadData();
      setFeedback('You claimed responsibility for this task.');
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">Urgent</span>;
      case 'high': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">High</span>;
      case 'medium': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">Medium</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">Low</span>;
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={task.title}
        description={`Category: ${task.category.replace('_', ' ')} &bull; Due ${task.dueDate} &bull; Created by ${task.createdByName || 'Care Circle'}`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Care Tasks', href: '/care-circle/tasks' },
          { label: task.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/care-circle/tasks">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                All Tasks
              </Button>
            </Link>
            {task.status !== 'completed' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => setIsCompleteOpen(true)}
              >
                Mark Completed
              </Button>
            )}
          </div>
        }
      >
        {feedback && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md uppercase">
                      {task.category.replace('_', ' ')}
                    </span>
                    <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'mint'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-secondaryText flex items-center gap-1 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Target Due Date: <strong>{task.dueDate}</strong></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Instructions</h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </div>
                </div>

                {/* Linked Health Entities */}
                {(task.relatedMedicationId || task.relatedAppointmentId) && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Connected Clinical Context</h3>
                    <div className="space-y-2">
                      {task.relatedMedicationId && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-950 font-medium">Linked to active medication record</span>
                          </div>
                          <Link href="/medications" className="text-primary font-bold hover:underline">
                            View Medication &rarr;
                          </Link>
                        </div>
                      )}
                      {task.relatedAppointmentId && (
                        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="text-purple-950 font-medium">Linked to cardiology / geriatric clinical visit</span>
                          </div>
                          <Link href="/appointments" className="text-primary font-bold hover:underline">
                            View Appointment &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Completion Status Section */}
                {task.status === 'completed' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Task Completed by {task.completedByName || 'Authorized Member'}</span>
                    </div>
                    {task.completedAt && (
                      <p className="text-[11px] text-emerald-700">Timestamp: {new Date(task.completedAt).toLocaleString()}</p>
                    )}
                    {task.completionNotes && (
                      <p className="italic mt-1 text-emerald-950 bg-white/70 p-2.5 rounded-lg border border-emerald-200/60">
                        &ldquo;{task.completionNotes}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Actions Bar */}
                {task.status !== 'completed' && (
                  <div className="pt-4 border-t border-subtleBorder flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {task.status === 'assigned' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateCareTaskStatus(task.id, 'in_progress', undefined, 'David Sullivan');
                            loadData();
                          }}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => setIsCompleteOpen(true)}
                      >
                        Complete Task
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Repeat className="w-4 h-4" />}
                      onClick={() => {
                        setReassignMemberId(members[0]?.id || '');
                        setReassignReason('');
                        setReassignError('');
                        setIsReassignOpen(true);
                      }}
                    >
                      Reassign Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Assignee & Metadata (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-3">
                <CardTitle className="text-sm font-bold text-main">Responsibility Assignment</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {task.assignedMemberName ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                      {task.assignedMemberName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-main">{task.assignedMemberName}</h4>
                      <p className="text-xs text-secondaryText capitalize">{task.assignedMemberRole?.replace('_', ' ') || 'Care Circle Member'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                    <p className="font-bold">Unassigned Task (Care Pool)</p>
                    <p className="text-[11px] text-amber-800">This task is available for any authorized member to claim.</p>
                    <Button variant="primary" size="sm" className="w-full text-xs" onClick={handleClaimTask}>
                      Claim Responsibility
                    </Button>
                  </div>
                )}

                <div className="pt-3 border-t border-subtleBorder text-xs space-y-2 text-secondaryText">
                  <div className="flex justify-between">
                    <span>Task ID:</span>
                    <span className="font-mono text-slate-700">{task.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created By:</span>
                    <span className="font-semibold text-main">{task.createdByName || 'David Sullivan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created Date:</span>
                    <span className="font-semibold text-main">{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="font-semibold text-main">{task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Initial version'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accountability Info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Continuity Audit Trail</span>
              </div>
              <p>
                Every assignment, status progression, and completion comment is recorded in the immutable Care Circle audit ledger.
              </p>
            </div>
          </div>

        </div>

        {/* Modal: Complete Task */}
        <Dialog
          isOpen={isCompleteOpen}
          onClose={() => setIsCompleteOpen(false)}
          title={`Complete Task: ${task.title}`}
          description="Document completion notes for family members and attending nurses."
        >
          <form onSubmit={handleConfirmComplete} className="space-y-4 pt-2">
            <Textarea
              label="Completion Notes (Optional)"
              placeholder="e.g. Vitals recorded: BP 124/78 mmHg, resting pulse 68 bpm. Logged in vitals chart..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsCompleteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm Completed
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: Reassign Task */}
        <Dialog
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          title={`Reassign Task: ${task.title}`}
          description="Select another verified care circle member and document the operational reason."
        >
          <form onSubmit={handleConfirmReassign} className="space-y-4 pt-2">
            <Select
              label="New Assignee"
              value={reassignMemberId}
              onChange={(e) => setReassignMemberId(e.target.value)}
              options={members.map(m => ({ value: m.id, label: `${m.name} (${m.relationship})` }))}
            />

            <Textarea
              label="Reason for Reassignment (Mandatory)"
              placeholder="e.g. Transport escort needed due to clinical morning shift schedule..."
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              error={reassignError}
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsReassignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Reassignment
              </Button>
            </div>
          </form>
        </Dialog>

      </PageContainer>
    </AppShell>
  );
}