'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  Clock, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Filter, 
  RotateCcw,
  Check,
  Building2
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  getCachedAppointments, 
  getCachedFollowUpTasks, 
  addFollowUpTask, 
  updateFollowUpTaskStatus 
} from '@/lib/data/appointment-intelligence-data';
import { AppointmentFollowUpTask, AppointmentRecord } from '@/types/caretrace';

export default function AppointmentFollowUpsPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [tasks, setTasks] = React.useState<AppointmentFollowUpTask[]>([]);
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  // New task modal state
  const [showNewTaskForm, setShowNewTaskForm] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskDescription, setTaskDescription] = React.useState('');
  const [taskDueAt, setTaskDueAt] = React.useState('');
  const [taskApptId, setTaskApptId] = React.useState('appt-001');
  const [assignedToName, setAssignedToName] = React.useState('David Sullivan');

  const loadData = React.useCallback(() => {
    setTasks(getCachedFollowUpTasks());
    setAppointments(getCachedAppointments());
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (
    taskId: string, 
    newStatus: AppointmentFollowUpTask['taskStatus'],
    notes?: string
  ) => {
    const updated = updateFollowUpTaskStatus(taskId, newStatus, notes);
    if (updated) {
      loadData();
      setActionNotice(`Task status updated to '${newStatus.replace('_', ' ')}'.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDescription.trim()) return;

    const user = USER_PERSPECTIVES[activeRole];
    const appt = appointments.find((a) => a.id === taskApptId);

    const newTask: AppointmentFollowUpTask = {
      id: `task-${Date.now()}`,
      patientId: 'patient-profile-001',
      appointmentId: taskApptId,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      dueAt: taskDueAt || undefined,
      assignedToName,
      assignedToRole: assignedToName === 'David Sullivan' ? 'Family Care Coordinator' : assignedToName === 'Sarah Jenkins, RN' ? 'Visiting Home Nurse' : 'Patient',
      taskStatus: 'pending',
      sourceReference: appt ? `Follow-up from ${appt.title}` : 'Clinical Consultation Follow-up',
      createdByName: user.sampleName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addFollowUpTask(newTask);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueAt('');
    setShowNewTaskForm(false);
    loadData();
    setActionNotice('New follow-up task registered and assigned.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return t.taskStatus !== 'completed' && t.taskStatus !== 'cancelled';
    return t.taskStatus === statusFilter;
  });

  const pendingCount = tasks.filter((t) => t.taskStatus !== 'completed' && t.taskStatus !== 'cancelled').length;
  const completedCount = tasks.filter((t) => t.taskStatus === 'completed').length;

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Doctor Visit Follow-up Tasks"
        description="Action items, lab pre-orders, prescription refills, and monitoring tasks assigned following Margaret's clinical appointments."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: 'Follow-ups' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Follow-up Task
          </button>
        }
      >
        <AppointmentsNavTabs />

        {actionNotice && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{actionNotice}</p>
          </div>
        )}

        {/* Quick Summary Pill Bar */}
        <div className="p-4 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              {pendingCount} Active Tasks
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              {completedCount} Completed
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--secondary-text)] uppercase tracking-wider">
              Filter:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* New Task Form Drawer / Inline Form */}
        {showNewTaskForm && (
          <form onSubmit={handleCreateTask} className="p-6 rounded-2xl border-2 border-teal-200 bg-[var(--white-surface)] shadow-sm mb-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--main-text)]">
              Create Appointment Follow-up Task
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                  Task Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule fasting lab draw, Refill blood pressure prescription"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] text-xs text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                  Linked Doctor Visit
                </label>
                <select
                  value={taskApptId}
                  onChange={(e) => setTaskApptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)]"
                >
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.providerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                  Assignee in Care Circle
                </label>
                <select
                  value={assignedToName}
                  onChange={(e) => setAssignedToName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)]"
                >
                  <option value="David Sullivan">David Sullivan (Son & Family Coordinator)</option>
                  <option value="Sarah Jenkins, RN">Sarah Jenkins, RN (Visiting Home Nurse)</option>
                  <option value="Margaret Sullivan">Margaret Sullivan (Patient Self-Action)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueAt}
                  onChange={(e) => setTaskDueAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] text-xs text-[var(--main-text)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                Description & Detailed Clinical Instructions <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Specific instructions given by the doctor..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] text-xs text-[var(--main-text)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--subtle-border)]">
              <button
                type="button"
                onClick={() => setShowNewTaskForm(false)}
                className="px-4 py-2 text-xs font-medium text-[var(--secondary-text)] hover:underline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[var(--primary-teal)] text-white text-xs font-bold rounded-lg hover:bg-[var(--secondary-teal)]"
              >
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isDone = task.taskStatus === 'completed';
            const linkedAppt = appointments.find((a) => a.id === task.appointmentId);

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : 'bg-[var(--white-surface)] border-[var(--subtle-border)] shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-base font-bold ${isDone ? 'line-through text-slate-500' : 'text-[var(--main-text)]'}`}>
                        {task.title}
                      </h4>
                      <Badge variant={isDone ? 'success' : task.taskStatus === 'in_progress' ? 'info' : 'warning'}>
                        {task.taskStatus.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--secondary-text)] pt-1">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-[var(--primary-teal)]" />
                        Assigned to: <strong className="text-[var(--main-text)]">{task.assignedToName || 'Care Circle'}</strong> ({task.assignedToRole || 'Coordinator'})
                      </span>
                      {linkedAppt && (
                        <span>
                          Source: <Link href={`/appointments/${linkedAppt.id}`} className="text-[var(--secondary-teal)] hover:underline font-semibold">{linkedAppt.title}</Link>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    {task.dueAt && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        Due {task.dueAt}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          className="px-3 py-1.5 rounded-lg border border-[var(--subtle-border)] bg-white text-xs font-medium text-[var(--secondary-text)] hover:bg-slate-100 flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reopen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(task.id, 'completed', 'Completed by user')}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </AppShell>
  );
}
