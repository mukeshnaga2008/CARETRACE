'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  Car, 
  ArrowLeft, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ClipboardList, 
  CheckSquare, 
  History, 
  Phone, 
  Building2, 
  Plus, 
  Check, 
  X, 
  Share2,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  getCachedAppointments, 
  getCachedPreparationItems, 
  getCachedAppointmentNotes, 
  getCachedFollowUpTasks, 
  getCachedAppointmentHistory,
  togglePreparationItem,
  addPreparationItem,
  recordVisitOutcome,
  cancelAppointment
} from '@/lib/data/appointment-intelligence-data';
import { 
  AppointmentRecord, 
  AppointmentPreparationItem, 
  AppointmentNote, 
  AppointmentFollowUpTask, 
  AppointmentHistoryEntry 
} from '@/types/caretrace';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AppointmentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');

  const [appointment, setAppointment] = React.useState<AppointmentRecord | null>(null);
  const [prepItems, setPrepItems] = React.useState<AppointmentPreparationItem[]>([]);
  const [notes, setNotes] = React.useState<AppointmentNote[]>([]);
  const [tasks, setTasks] = React.useState<AppointmentFollowUpTask[]>([]);
  const [history, setHistory] = React.useState<AppointmentHistoryEntry[]>([]);
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  // New Question / Agenda item form state
  const [showAddPrep, setShowAddPrep] = React.useState(false);
  const [newPrepTitle, setNewPrepTitle] = React.useState('');
  const [newPrepType, setNewPrepType] = React.useState<'question' | 'discussion_topic' | 'document_to_bring' | 'symptom_note'>('question');

  // Visit Outcome form state
  const [showRecordOutcome, setShowRecordOutcome] = React.useState(false);
  const [outcomeSummary, setOutcomeSummary] = React.useState('');
  const [outcomeInstructions, setOutcomeInstructions] = React.useState('');

  // Cancel Modal state
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');

  const loadData = React.useCallback(() => {
    const all = getCachedAppointments();
    const appt = all.find((a) => a.id === id);
    if (appt) {
      setAppointment({ ...appt });
      setPrepItems([...getCachedPreparationItems(id)]);
      setNotes([...getCachedAppointmentNotes(id)]);
      setTasks([...getCachedFollowUpTasks(id)]);
      setHistory([...getCachedAppointmentHistory(id)]);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (!appointment) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Appointment Not Found"
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Appointments', href: '/appointments' },
            { label: 'Detail' },
          ]}
        >
          <div className="p-8 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-4">
            <h2 className="text-lg font-bold text-[var(--main-text)]">
              Appointment Record Not Found
            </h2>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-teal)] text-white text-sm font-semibold hover:bg-[var(--secondary-teal)] transition-colors"
            >
              Return to Appointment List
            </Link>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const handleTogglePrep = (itemId: string) => {
    togglePreparationItem(itemId);
    loadData();
  };

  const handleAddPrepItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrepTitle.trim()) return;

    const user = USER_PERSPECTIVES[activeRole];
    addPreparationItem({
      id: `prep-${Date.now()}`,
      appointmentId: appointment.id,
      patientId: 'patient-profile-001',
      itemType: newPrepType,
      title: newPrepTitle.trim(),
      isAddressed: false,
      createdByName: user.sampleName,
      createdByRole: user.label,
      createdAt: new Date().toISOString(),
    });

    setNewPrepTitle('');
    setShowAddPrep(false);
    loadData();
    setActionNotice('New item added to visit agenda.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRecordOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeSummary.trim() || outcomeSummary.trim().length < 10) return;

    const user = USER_PERSPECTIVES[activeRole];
    recordVisitOutcome({
      id: `note-${Date.now()}`,
      appointmentId: appointment.id,
      patientId: 'patient-profile-001',
      visitDate: new Date().toISOString().split('T')[0],
      providerName: appointment.providerName,
      summaryText: outcomeSummary.trim(),
      authorName: user.sampleName,
      authorRole: user.label,
      sourceProvenance: 'family_entered',
      verificationStatus: 'unverified',
      followUpInstructions: outcomeInstructions.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    setShowRecordOutcome(false);
    loadData();
    setActionNotice('Visit outcome recorded. Appointment marked as completed.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCancelAppointment = () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) return;

    const user = USER_PERSPECTIVES[activeRole];
    cancelAppointment(appointment.id, cancelReason.trim(), user.sampleName, user.label);
    setShowCancelModal(false);
    loadData();
    setActionNotice('Appointment has been cancelled and logged in audit history.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const isCompleted = appointment.appointmentStatus === 'completed';
  const isCancelled = appointment.appointmentStatus === 'cancelled';

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={appointment.title}
        description={`Clinical visit coordination, escort logistics, agenda questions, and audit logs for Margaret Sullivan.`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: appointment.title },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-[var(--main-text)] hover:bg-[var(--soft-mint)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--secondary-text)]" />
              Appointment List
            </Link>
            {!isCancelled && !isCompleted && (
              <Link
                href={`/appointments/${appointment.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--primary-teal)] text-white hover:bg-[var(--secondary-teal)] transition-colors shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit / Reschedule
              </Link>
            )}
          </div>
        }
      >
        <AppointmentsNavTabs />

        {actionNotice && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{actionNotice}</p>
          </div>
        )}

        {/* Cancellation Notice */}
        {isCancelled && (
          <div className="p-4 mb-6 rounded-xl border border-rose-300 bg-rose-50 text-rose-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <strong className="font-bold">This appointment was cancelled.</strong>
              <p className="text-xs text-rose-900">
                Reason: {appointment.cancellationReason || 'No reason recorded'}
              </p>
            </div>
          </div>
        )}

        {/* Main Appointment Card */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--subtle-border)] pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-bold text-[var(--main-text)]">
                  {appointment.providerName}
                </h2>
                <Badge variant={isCompleted ? 'neutral' : isCancelled ? 'danger' : appointment.appointmentStatus === 'confirmed' ? 'success' : 'warning'}>
                  {appointment.appointmentStatus}
                </Badge>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                  {appointment.appointmentType?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--secondary-teal)] mt-1">
                {appointment.departmentOrSpecialty || 'Clinical Care'} &bull; {appointment.clinicName}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-[var(--secondary-text)]">
              <span>Timezone: <strong className="text-[var(--main-text)]">{appointment.timezone || 'America/Chicago'}</strong></span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text)]">
                Date & Time
              </span>
              <p className="text-base font-bold text-[var(--main-text)]">
                {new Date(appointment.appointmentDatetime || '').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-[var(--secondary-text)]">
                {new Date(appointment.appointmentDatetime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {appointment.estimatedDurationMinutes} mins duration
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text)]">
                Facility & Location
              </span>
              <p className="text-sm font-bold text-[var(--main-text)]">
                {appointment.clinicName}
              </p>
              <p className="text-xs text-[var(--secondary-text)]">
                {appointment.locationText || 'Suite address on file'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text)]">
                Care Circle Escort & Driver
              </span>
              <p className="text-sm font-bold text-[var(--main-text)] flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[var(--primary-teal)]" />
                {appointment.assignedAccompanyingName || 'David Sullivan'}
              </p>
              <p className="text-xs text-emerald-700 font-medium">
                {appointment.transportationNeeded ? 'Transport confirmed (Driving Margaret)' : 'Independent'}
              </p>
            </div>
          </div>

          {/* Preparation Notes Banner */}
          {appointment.preparationNotes && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <strong className="block font-bold">Preparation & Pre-Appointment Instructions:</strong>
                <p>{appointment.preparationNotes}</p>
              </div>
            </div>
          )}

          {/* Secondary Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--subtle-border)] text-xs text-[var(--secondary-text)]">
            <div>
              Booking Reference: <strong className="text-[var(--main-text)]">{appointment.bookingReference || 'N/A'}</strong>
            </div>
            <div>
              Direct Contact: <strong className="text-[var(--main-text)]">{appointment.contactInformation || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Visit Preparation & Agenda Checklist Section */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[var(--primary-teal)]" />
                Visit Preparation Agenda ({prepItems.length})
              </h3>
              <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                Questions, discussion topics, and symptoms prepared by Margaret and her Care Circle for Dr. {appointment.providerName.split(' ').slice(-1)[0]}.
              </p>
            </div>

            {!isCancelled && !isCompleted && (
              <button
                type="button"
                onClick={() => setShowAddPrep(!showAddPrep)}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--subtle-border)] bg-white text-xs font-semibold text-[var(--main-text)] hover:bg-[var(--soft-mint)] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-[var(--primary-teal)]" />
                Add Question / Topic
              </button>
            )}
          </div>

          {/* Inline Add Item Form */}
          {showAddPrep && (
            <form onSubmit={handleAddPrepItem} className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
              <h4 className="text-xs font-bold text-[var(--main-text)]">New Visit Agenda Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ask about Lisinopril morning dosage or dizziness upon standing"
                    value={newPrepTitle}
                    onChange={(e) => setNewPrepTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
                  />
                </div>
                <div>
                  <select
                    value={newPrepType}
                    onChange={(e) => setNewPrepType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)]"
                  >
                    <option value="question">Question for Clinician</option>
                    <option value="discussion_topic">Discussion Topic</option>
                    <option value="document_to_bring">Document to Bring</option>
                    <option value="symptom_note">Symptom Observation</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPrep(false)}
                  className="px-3 py-1.5 text-xs text-[var(--secondary-text)] hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)]"
                >
                  Add to Agenda
                </button>
              </div>
            </form>
          )}

          {/* Prep Items List */}
          {prepItems.length === 0 ? (
            <p className="text-xs text-[var(--secondary-text)] italic">
              No questions or topics prepared yet. Click &ldquo;Add Question / Topic&rdquo; to prepare items for the visit.
            </p>
          ) : (
            <div className="space-y-3">
              {prepItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                    item.isAddressed
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : 'bg-white border-[var(--subtle-border)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePrep(item.id)}
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                        item.isAddressed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-emerald-600'
                      }`}
                      aria-label={item.isAddressed ? 'Mark unaddressed' : 'Mark addressed'}
                    >
                      {item.isAddressed && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${item.isAddressed ? 'line-through text-slate-500' : 'text-[var(--main-text)]'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.itemType.replace('_', ' ')}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-[var(--secondary-text)]">{item.notes}</p>
                      )}
                      <span className="block text-[11px] text-[var(--secondary-text)]">
                        Added by {item.createdByName} ({item.createdByRole})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visit Outcomes / Clinical Notes Section */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--primary-teal)]" />
                Visit Outcome & Post-Consultation Notes
              </h3>
              <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                Official visit summaries, physician instructions, and documents recorded following the appointment.
              </p>
            </div>

            {!isCompleted && !isCancelled && (
              <button
                type="button"
                onClick={() => setShowRecordOutcome(!showRecordOutcome)}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)] transition-colors self-start sm:self-auto"
              >
                Record Visit Outcome
              </button>
            )}
          </div>

          {/* Outcome Input Form */}
          {showRecordOutcome && (
            <form onSubmit={handleRecordOutcome} className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
              <h4 className="text-xs font-bold text-[var(--main-text)]">Record Post-Visit Outcome</h4>
              <textarea
                required
                rows={3}
                placeholder="Enter doctor's assessment, advice, findings, and clinical notes..."
                value={outcomeSummary}
                onChange={(e) => setOutcomeSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
              />
              <textarea
                rows={2}
                placeholder="Follow-up instructions or next steps (optional)..."
                value={outcomeInstructions}
                onChange={(e) => setOutcomeInstructions(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordOutcome(false)}
                  className="px-3 py-1.5 text-xs text-[var(--secondary-text)] hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)]"
                >
                  Save Outcome & Complete Visit
                </button>
              </div>
            </form>
          )}

          {notes.length === 0 ? (
            <p className="text-xs text-[var(--secondary-text)] italic">
              No visit outcome recorded yet. Visit outcome can be entered once the consultation has concluded.
            </p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--primary-teal)]">
                      Recorded on {note.visitDate} by {note.authorName} ({note.authorRole})
                    </span>
                    <Badge variant={note.verificationStatus === 'verified' ? 'success' : 'warning'}>
                      {note.sourceProvenance.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--main-text)] leading-relaxed">
                    &ldquo;{note.summaryText}&rdquo;
                  </p>
                  {note.followUpInstructions && (
                    <div className="text-xs text-emerald-800 pt-1 font-medium">
                      <strong>Follow-up Instructions:</strong> {note.followUpInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Follow-up Tasks Section */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--subtle-border)] pb-3">
            <h3 className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[var(--primary-teal)]" />
              Linked Follow-up Tasks ({tasks.length})
            </h3>
            <Link href="/appointments/follow-ups" className="text-xs font-semibold text-[var(--secondary-teal)] hover:underline">
              Manage all tasks &rarr;
            </Link>
          </div>

          {tasks.length === 0 ? (
            <p className="text-xs text-[var(--secondary-text)] italic">
              No follow-up tasks linked to this appointment.
            </p>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-[var(--main-text)]">{task.title}</span>
                    <p className="text-[var(--secondary-text)]">{task.description}</p>
                    <span className="text-[11px] text-[var(--secondary-text)]">
                      Assigned to: <strong className="text-[var(--main-text)]">{task.assignedToName || 'Care Circle'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-rose-700">Due {task.dueAt}</span>
                    <Badge variant={task.taskStatus === 'completed' ? 'success' : 'warning'}>
                      {task.taskStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auditable History Timeline */}
        <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 space-y-4">
          <div className="border-b border-[var(--subtle-border)] pb-3">
            <h3 className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--primary-teal)]" />
              Auditable Appointment History ({history.length})
            </h3>
          </div>

          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--primary-teal)] uppercase">
                      [{entry.changeType}]
                    </span>
                    <span className="font-semibold text-[var(--main-text)]">
                      {entry.changeReason}
                    </span>
                  </div>
                  <p className="text-[var(--secondary-text)]">
                    By {entry.changedByName} ({entry.changedByRole})
                  </p>
                </div>
                <span className="text-[var(--secondary-text)] shrink-0">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Consequential Cancellation Action */}
        {!isCancelled && !isCompleted && (
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-rose-950">Cancel Appointment</h4>
              <p className="text-xs text-rose-800">
                Requires mandatory explanation. Preserves full audit trail and notifies Care Circle.
              </p>
            </div>

            {showCancelModal ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Cancellation reason (mandatory)..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-xs text-[var(--main-text)] flex-1 sm:w-64"
                />
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3 py-1.5 text-xs text-rose-800 hover:underline"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  className="px-3.5 py-1.5 bg-rose-700 text-white text-xs font-bold rounded-lg hover:bg-rose-800 transition-colors"
                >
                  Confirm Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 border border-rose-300 bg-white text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
              >
                Cancel Visit
              </button>
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
