'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  HelpCircle, 
  FileText, 
  Pill, 
  Car, 
  CheckCircle2, 
  Plus, 
  Check, 
  AlertTriangle,
  Clock,
  Printer,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { AppointmentsNavTabs } from '@/components/features/appointments/appointments-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { 
  getCachedAppointments, 
  getCachedPreparationItems, 
  togglePreparationItem,
  addPreparationItem 
} from '@/lib/data/appointment-intelligence-data';
import { getCachedMedications } from '@/lib/data/medication-lifecycle-data';
import { AppointmentRecord, AppointmentPreparationItem, MedicationRecord } from '@/types/caretrace';

export default function VisitPreparationPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([]);
  const [selectedApptId, setSelectedApptId] = React.useState<string>('appt-001');
  const [prepItems, setPrepItems] = React.useState<AppointmentPreparationItem[]>([]);
  const [medications, setMedications] = React.useState<MedicationRecord[]>([]);

  // Add Item State
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [itemTitle, setItemTitle] = React.useState('');
  const [itemType, setItemType] = React.useState<'question' | 'discussion_topic' | 'document_to_bring' | 'symptom_note'>('question');
  const [itemNotes, setItemNotes] = React.useState('');
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const loadData = React.useCallback(() => {
    const appts = getCachedAppointments().filter(
      (a) => a.appointmentStatus !== 'cancelled' && a.appointmentStatus !== 'completed'
    );
    setAppointments(appts);
    if (appts.length > 0 && !appts.some((a) => a.id === selectedApptId)) {
      setSelectedApptId(appts[0].id);
    }
    setPrepItems(getCachedPreparationItems());
    setMedications(getCachedMedications().filter((m) => m.status === 'active' || m.status === 'awaiting_verification'));
  }, [selectedApptId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAppt = appointments.find((a) => a.id === selectedApptId);
  const currentItems = prepItems.filter((i) => i.appointmentId === selectedApptId);

  const handleToggle = (itemId: string) => {
    togglePreparationItem(itemId);
    loadData();
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !activeAppt) return;

    const user = USER_PERSPECTIVES[activeRole];
    addPreparationItem({
      id: `prep-${Date.now()}`,
      appointmentId: activeAppt.id,
      patientId: 'patient-profile-001',
      itemType,
      title: itemTitle.trim(),
      notes: itemNotes.trim() || undefined,
      isAddressed: false,
      createdByName: user.sampleName,
      createdByRole: user.label,
      createdAt: new Date().toISOString(),
    });

    setItemTitle('');
    setItemNotes('');
    setShowAddForm(false);
    loadData();
    setActionNotice('New preparation question added to visit agenda.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Visit Preparation & Agenda Centre"
        description="Prepare questions, organize discussion topics, verify relevant medications, and review transport plans before Margaret's doctor appointments."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Appointments', href: '/appointments' },
          { label: 'Visit Preparation' },
        ]}
      >
        <AppointmentsNavTabs />

        {actionNotice && (
          <div role="status" className="p-4 mb-6 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium text-sm">{actionNotice}</p>
          </div>
        )}

        {/* Visit Selector Dropdown / Pills */}
        <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="appointmentSelect" className="block text-xs font-bold uppercase tracking-wider text-[var(--secondary-text)] mb-1">
              Select Upcoming Appointment to Prepare For:
            </label>
            <select
              id="appointmentSelect"
              value={selectedApptId}
              onChange={(e) => setSelectedApptId(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-sm font-semibold text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
            >
              {appointments.map((appt) => (
                <option key={appt.id} value={appt.id}>
                  {appt.title} — {appt.providerName} ({new Date(appt.appointmentDatetime || '').toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {activeAppt && (
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-semibold text-[var(--secondary-text)] block">
                Escort & Driver: <strong className="text-[var(--main-text)]">{activeAppt.assignedAccompanyingName || 'David Sullivan'}</strong>
              </span>
              <span className="text-xs text-emerald-700 font-medium">
                {activeAppt.transportationNeeded ? 'Vehicle Transport Confirmed' : 'Independent Attendance'}
              </span>
            </div>
          )}
        </div>

        {activeAppt ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Agenda Questions & Topics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--subtle-border)] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--main-text)] flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[var(--primary-teal)]" />
                      Doctor Visit Agenda ({currentItems.length})
                    </h3>
                    <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                      Check off items during the consultation as Dr. {activeAppt.providerName.split(' ').slice(-1)[0]} answers them.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--primary-teal)] text-white text-xs font-semibold hover:bg-[var(--secondary-teal)] transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Agenda Question
                  </button>
                </div>

                {/* Inline Add Item Form */}
                {showAddForm && (
                  <form onSubmit={handleAddItem} className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                    <h4 className="text-xs font-bold text-[var(--main-text)]">New Preparation Item</h4>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                        Question or Discussion Topic:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Inquire about blood pressure readings and morning Lisinopril timing"
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                          Category:
                        </label>
                        <select
                          value={itemType}
                          onChange={(e) => setItemType(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)]"
                        >
                          <option value="question">Question for Doctor</option>
                          <option value="discussion_topic">Discussion Topic</option>
                          <option value="document_to_bring">Document to Bring</option>
                          <option value="symptom_note">Symptom Observation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--main-text)] mb-1">
                          Additional Context (optional):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. David logged on Feb 13"
                          value={itemNotes}
                          onChange={(e) => setItemNotes(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--subtle-border)] bg-white text-xs text-[var(--main-text)]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1 text-xs text-[var(--secondary-text)] hover:underline"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[var(--primary-teal)] text-white rounded text-xs font-semibold hover:bg-[var(--secondary-teal)]"
                      >
                        Save to Agenda
                      </button>
                    </div>
                  </form>
                )}

                {/* Items List */}
                <div className="space-y-3">
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        item.isAddressed
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-white border-[var(--subtle-border)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                            item.isAddressed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-emerald-600'
                          }`}
                          aria-label={item.isAddressed ? 'Mark unaddressed' : 'Mark answered by doctor'}
                        >
                          {item.isAddressed && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div className="space-y-1 flex-1">
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
                            Recorded by {item.createdByName} ({item.createdByRole})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Active Prescriptions to Bring / Fasting Notice */}
            <div className="space-y-6">
              {/* Preparation Checklist */}
              {activeAppt.preparationNotes && (
                <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/70 text-amber-950 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Required Pre-Visit Instructions
                  </h4>
                  <p className="text-xs font-medium leading-relaxed">
                    {activeAppt.preparationNotes}
                  </p>
                </div>
              )}

              {/* Linked Medications */}
              <div className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm space-y-4">
                <div className="border-b border-[var(--subtle-border)] pb-3">
                  <h4 className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                    <Pill className="w-4 h-4 text-[var(--primary-teal)]" />
                    Active Medications to Review ({medications.length})
                  </h4>
                  <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                    Share current regimen with Dr. {activeAppt.providerName.split(' ').slice(-1)[0]} for review.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className="p-3 rounded-xl border border-[var(--subtle-border)] bg-[var(--warm-background)]/50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--main-text)]">
                          {med.displayName} ({med.strengthText})
                        </span>
                        <Badge variant={med.verificationStatus === 'verified' ? 'success' : 'warning'}>
                          {med.verificationStatus}
                        </Badge>
                      </div>
                      <p className="text-[var(--secondary-text)] line-clamp-1">
                        {med.prescribedInstructions}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/medications"
                  className="block text-xs font-semibold text-[var(--secondary-teal)] hover:underline pt-1 text-center"
                >
                  Manage Full Medication Roster &rarr;
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-3">
            <ClipboardList className="w-10 h-10 text-[var(--secondary-text)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--main-text)]">
              No Upcoming Visits Scheduled
            </h3>
            <p className="text-xs text-[var(--secondary-text)]">
              Schedule an appointment first to prepare visit agendas and question checklists.
            </p>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
