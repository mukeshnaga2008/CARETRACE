'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Pill, 
  Calendar, 
  ArrowRight,
  Filter,
  UserCheck,
  ChevronRight
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
  getCachedTasks, 
  getCachedMembers, 
  addCareTask, 
  updateCareTaskStatus, 
  reassignCareTask 
} from '@/lib/data/care-circle-data';
import { CareTask, CareCircleMember, TaskCategory, TaskPriority } from '@/types/caretrace';

export default function CareCircleTasksPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [tasks, setTasks] = React.useState<CareTask[]>([]);
  const [members, setMembers] = React.useState<CareCircleMember[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [assigneeFilter, setAssigneeFilter] = React.useState('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = React.useState(false);
  const [isReassignOpen, setIsReassignOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<CareTask | null>(null);

  // Form states for creation
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState<TaskCategory>('medication_refill');
  const [priority, setPriority] = React.useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = React.useState('');
  const [assignedMemberId, setAssignedMemberId] = React.useState('unassigned');
  const [createError, setCreateError] = React.useState('');

  // Form states for completion & reassignment
  const [completionNotes, setCompletionNotes] = React.useState('');
  const [reassignMemberId, setReassignMemberId] = React.useState('');
  const [reassignReason, setReassignReason] = React.useState('');
  const [modalError, setModalError] = React.useState('');
  const [feedback, setFeedback] = React.useState('');

  const loadData = () => {
    setTasks([...getCachedTasks()]);
    setMembers(getCachedMembers().filter(m => m.membershipStatus === 'active'));
  };

  React.useEffect(() => {
    loadData();
    // Default due date: tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedMemberName && t.assignedMemberName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesAssignee = 
      assigneeFilter === 'all' || 
      (assigneeFilter === 'unassigned' ? !t.assignedMemberId : t.assignedMemberId === assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate) {
      setCreateError('Please complete task title, description, and due date.');
      return;
    }

    const assignedMember = members.find(m => m.id === assignedMemberId);

    const newTask: CareTask = {
      id: `task-${Date.now()}`,
      patientId: 'patient-profile-001',
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: assignedMember ? 'assigned' : 'pending',
      assignedMemberId: assignedMember ? assignedMember.id : undefined,
      assignedMemberName: assignedMember ? assignedMember.name : undefined,
      assignedMemberRole: assignedMember ? assignedMember.assignedRole : undefined,
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByName: 'David Sullivan',
    };

    addCareTask(newTask);
    loadData();
    setIsCreateOpen(false);
    setTitle('');
    setDescription('');
    setCreateError('');
    setFeedback(`Task "${newTask.title}" created successfully.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleOpenComplete = (task: CareTask) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setModalError('');
    setIsCompleteOpen(true);
  };

  const handleConfirmComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    updateCareTaskStatus(selectedTask.id, 'completed', completionNotes.trim() || undefined, 'David Sullivan');
    loadData();
    setIsCompleteOpen(false);
    setFeedback(`Task "${selectedTask.title}" marked completed.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleOpenReassign = (task: CareTask) => {
    setSelectedTask(task);
    setReassignMemberId(members[0]?.id || '');
    setReassignReason('');
    setModalError('');
    setIsReassignOpen(true);
  };

  const handleConfirmReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!reassignReason.trim() || reassignReason.trim().length < 5) {
      setModalError('A documented reason (min 5 chars) is mandatory for task reassignment.');
      return;
    }

    const targetMember = members.find(m => m.id === reassignMemberId);
    if (!targetMember) return;

    reassignCareTask(
      selectedTask.id,
      targetMember.id,
      targetMember.name,
      targetMember.assignedRole || 'caregiver',
      reassignReason.trim(),
      'David Sullivan'
    );

    loadData();
    setIsReassignOpen(false);
    setFeedback(`Task "${selectedTask.title}" reassigned to ${targetMember.name}.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">Urgent</span>;
      case 'high': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">High</span>;
      case 'medium': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">Medium</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">Low</span>;
    }
  };

  const getStatusBadge = (s: CareTask['status']) => {
    switch (s) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      case 'assigned': return <Badge variant="mint">Assigned</Badge>;
      default: return <Badge variant="neutral">Pending</Badge>;
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Shared Care Tasks & Responsibilities"
        description="Delegated responsibilities across the care circle including medication pickups, vital sign monitoring, appointment escorting, and daily care routines."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Care Tasks' },
        ]}
        actions={
          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setCreateError('');
              setIsCreateOpen(true);
            }}
          >
            Create Care Task
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

        {/* Filter Bar */}
        <div className="p-4 bg-white border border-subtleBorder rounded-2xl shadow-xs mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <Input
                isSearch
                placeholder="Search tasks by title, details, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'pending', label: 'Pending Pool' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'medication_refill', label: 'Med Refill' },
                  { value: 'vitals_check', label: 'Vitals Check' },
                  { value: 'appointment_escort', label: 'Appt Escort' },
                  { value: 'exercise_routine', label: 'Exercise' },
                  { value: 'dietary_prep', label: 'Dietary' },
                  { value: 'lab_draw', label: 'Lab Work' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Assignees' },
                  { value: 'unassigned', label: 'Unassigned (Pool)' },
                  ...members.map(m => ({ value: m.id, label: m.name })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center bg-white border border-subtleBorder rounded-2xl space-y-3">
              <CheckSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-main">No Matching Tasks Found</h3>
              <p className="text-xs text-secondaryText">Try clearing filters or search keywords.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="border border-subtleBorder bg-white hover:border-primary/40 transition-colors">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPriorityBadge(task.priority)}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                        {task.category.replace('_', ' ')}
                      </span>
                      {getStatusBadge(task.status)}
                      <span className="text-xs text-secondaryText flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due: {task.dueDate}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-main">{task.title}</h3>
                      <p className="text-xs text-secondaryText mt-0.5 leading-relaxed">{task.description}</p>
                    </div>

                    {/* Linked entities or completion note */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {task.relatedMedicationId && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium text-[11px]">
                          <Pill className="w-3 h-3" />
                          <span>Linked Medication Record</span>
                        </span>
                      )}
                      {task.relatedAppointmentId && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-medium text-[11px]">
                          <Calendar className="w-3 h-3" />
                          <span>Linked Appointment</span>
                        </span>
                      )}
                      {task.completionNotes && (
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md italic">
                          Note: &ldquo;{task.completionNotes}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assignee & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-subtleBorder shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-secondaryText uppercase tracking-wider font-semibold">Assigned To</p>
                      <p className="text-xs font-bold text-main mt-0.5">
                        {task.assignedMemberName || <span className="text-amber-600">Unassigned Pool</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/care-circle/tasks/${task.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          Details
                        </Button>
                      </Link>

                      {task.status !== 'completed' && (
                        <>
                          {task.status === 'assigned' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                updateCareTaskStatus(task.id, 'in_progress', undefined, 'David Sullivan');
                                loadData();
                              }}
                            >
                              Start
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleOpenComplete(task)}
                          >
                            Complete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-slate-600 hover:bg-slate-100"
                            onClick={() => handleOpenReassign(task)}
                          >
                            Reassign
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Modal: Create Care Task */}
        <Dialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Shared Care Task"
          description="Assign a clear responsibility to a care circle member or stage it for pool pickup."
        >
          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <Input
              label="Task Title"
              placeholder="e.g. Pick up Lisinopril 10mg refill from Walgreens"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              label="Task Instructions & Context"
              placeholder="Provide exact directions, pharmacy location, or doctor notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Task Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                options={[
                  { value: 'medication_refill', label: 'Medication Refill' },
                  { value: 'vitals_check', label: 'Vitals & BP Check' },
                  { value: 'appointment_escort', label: 'Appointment Escort' },
                  { value: 'exercise_routine', label: 'Exercise & PT Routine' },
                  { value: 'dietary_prep', label: 'Dietary & Hydration' },
                  { value: 'lab_draw', label: 'Lab Draw Prep' },
                  { value: 'general_observation', label: 'General Observation' },
                ]}
              />

              <Select
                label="Priority Level"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                options={[
                  { value: 'urgent', label: 'Urgent (Immediate)' },
                  { value: 'high', label: 'High Priority' },
                  { value: 'medium', label: 'Medium Priority' },
                  { value: 'low', label: 'Low / Routine' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />

              <Select
                label="Assigned Member"
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                options={[
                  { value: 'unassigned', label: 'Unassigned (Care Circle Pool)' },
                  ...members.map(m => ({ value: m.id, label: `${m.name} (${m.relationship})` })),
                ]}
              />
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
                Create & Assign Task
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: Complete Task */}
        <Dialog
          isOpen={isCompleteOpen}
          onClose={() => setIsCompleteOpen(false)}
          title={`Complete Task: ${selectedTask?.title}`}
          description="Confirm completion of this care responsibility for the care audit record."
        >
          <form onSubmit={handleConfirmComplete} className="space-y-4 pt-2">
            <Textarea
              label="Completion Notes (Optional)"
              placeholder="e.g. 90-day refill collected and stored in medication cabinet. Expiration confirmed..."
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
          title={`Reassign Task: ${selectedTask?.title}`}
          description="Transfer responsibility to another verified care circle member."
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
              placeholder="e.g. Schedule conflict with afternoon clinic duty..."
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              error={modalError}
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