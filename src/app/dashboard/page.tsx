'use client';

import * as React from 'react';
import { 
  Heart, 
  Pill, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Volume2, 
  PhoneCall, 
  FileCheck,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Clock,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, MetricCard } from '@/components/ui/card';
import { MedicationScheduleItem } from '@/components/features/dashboard/medication-schedule-item';
import { AppointmentItem } from '@/components/features/dashboard/appointment-item';
import { CareCircleMemberCard } from '@/components/features/dashboard/care-circle-member-card';
import { CareAlertCard } from '@/components/features/dashboard/care-alert-card';
import { ActivityTimelineItem } from '@/components/features/dashboard/activity-timeline-item';
import { 
  getSyntheticDashboardData, 
  SYNTHETIC_PATIENTS_DATASET 
} from '@/lib/data/synthetic-dashboard-data';
import { cn } from '@/lib/utils/cn';

export default function DashboardPage() {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [activePatientId, setActivePatientId] = React.useState<string>('DEMO-001');

  // Read selected patient from cookie or localStorage on initial mount
  React.useEffect(() => {
    try {
      const match = document.cookie.match(/caretrace_active_patient=([^;]+)/);
      const saved = match ? match[1] : localStorage.getItem('caretrace_active_patient');
      if (saved && SYNTHETIC_PATIENTS_DATASET[saved]) {
        setActivePatientId(saved);
      }
    } catch {
      // fallback to DEMO-001
    }
  }, []);

  const bundle = getSyntheticDashboardData(activePatientId);
  const patient = bundle.patient;
  const metrics = bundle.metrics;
  const [schedule, setSchedule] = React.useState(bundle.medicationSchedule);

  // Update schedule whenever active patient changes
  React.useEffect(() => {
    setSchedule(bundle.medicationSchedule);
  }, [activePatientId]);

  const handleSelectPatient = (id: string) => {
    setActivePatientId(id);
    const targetBundle = getSyntheticDashboardData(id);
    setSchedule(targetBundle.medicationSchedule);
    try {
      document.cookie = `caretrace_active_patient=${id}; path=/; max-age=604800`;
      localStorage.setItem('caretrace_active_patient', id);
      localStorage.setItem('caretrace_active_patient_name', targetBundle.patient.fullName);
      window.dispatchEvent(new CustomEvent('caretrace_patient_changed', { 
        detail: { patientId: id, patientName: targetBundle.patient.fullName } 
      }));
    } catch {
      // fallback
    }
  };

  const handleVoiceBriefing = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const nextApptText = bundle.nextAppointment ? `Your next appointment is ${bundle.nextAppointment.title} with ${bundle.nextAppointment.providerName}.` : '';
      const text = `Good day, ${patient.fullName}. Today is Sunday, November 15. You have ${schedule.length} scheduled medication items. ${nextApptText} Your primary emergency contact is ${patient.emergencyContact.name}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLogAction = (doseId: string, action: string) => {
    setSchedule((prev) =>
      prev.map((dose) => {
        if (dose.id === doseId) {
          return {
            ...dose,
            status: 'reported_taken',
            statusLabel: `Reported Taken just now`,
            loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            loggedBy: `${patient.fullName} (Patient report)`,
          };
        }
        return dose;
      })
    );
  };

  const patientInitials = patient.fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Overview' }]}
      pageTitle="Elder Care Overview"
      pageDescription={`Intelligent daily coordination overview centred on ${patient.fullName}'s health continuity, schedules, and active care circle.`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="mint"
            size="md"
            leftIcon={<Volume2 className="h-4 w-4" />}
            onClick={handleVoiceBriefing}
            className={isPlayingAudio ? "ring-2 ring-secondary" : ""}
          >
            {isPlayingAudio ? "Reading Briefing..." : "Listen to Daily Briefing"}
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<FileCheck className="h-4 w-4" />}
            onClick={() => window.location.href = '/care-passport'}
          >
            Care Passport
          </Button>
        </div>
      }
    >
      {/* Dynamic Synthetic Dataset Patient Selector */}
      <section className="mb-6 p-4 rounded-2xl border-2 border-secondary/20 bg-white dark:bg-slate-900 shadow-sm" aria-label="Synthetic Dataset Selector">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              SYNTHETIC DEMO DATASET
            </span>
            <span className="text-xs font-semibold text-secondaryText hidden sm:inline">
              Click any patient to load their verified reports and records:
            </span>
          </div>
          <span className="text-xs font-mono text-mutedText">
            Patient ID: <strong>{patient.patientId}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'DEMO-001', name: 'Margaret Sullivan', age: '84y', coordinator: 'David (Son)' },
            { id: 'DEMO-002', name: 'Arthur Bennett', age: '88y', coordinator: 'Helen (Daughter)' },
            { id: 'DEMO-003', name: 'Leela Raman', age: '81y', coordinator: 'Kavitha (Daughter)' },
            { id: 'DEMO-004', name: 'Josephine Carter', age: '86y', coordinator: 'Michael (Son)' },
            { id: 'DEMO-005', name: 'Ravi Narayanan', age: '83y', coordinator: 'Meena (Daughter)' },
          ].map((p) => {
            const isSelected = p.id === activePatientId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPatient(p.id)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border touch-target-min",
                  isSelected
                    ? "bg-primary text-white border-primary shadow-md ring-2 ring-primary/20"
                    : "bg-canvas-background hover:bg-mint hover:text-primary border-subtleBorder text-main"
                )}
                aria-pressed={isSelected}
              >
                <span className={cn("h-2 w-2 rounded-full", isSelected ? "bg-white animate-pulse" : "bg-secondary")} />
                <span>{p.name} ({p.age})</span>
                <span className={cn(
                  "text-[10px] font-normal px-1.5 py-0.5 rounded",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-secondaryText"
                )}>
                  {p.coordinator}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* A. Welcome & Patient Health Identity Section */}
      <section className="mb-8" aria-label="Welcome and Patient Identity">
        <div className="rounded-2xl border border-subtleBorder bg-white p-6 sm:p-7 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-sm">
                  {patientInitials}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-clinical-success border-2 border-white flex items-center justify-center text-white"
                  title="Care Status: Active Synthetic Demo Record"
                >
                  <CheckCircle2 className="h-3 w-3 stroke-[3]" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
                    {patient.fullName}
                  </h2>
                  <Badge variant="mint" size="md">
                    Age {patient.age}
                  </Badge>
                  <Badge variant="outline" size="md">
                    Blood Type: {patient.bloodType}
                  </Badge>
                  <Badge variant="default" size="md">
                    Language: {patient.preferredLanguage}
                  </Badge>
                </div>
                <p className="text-sm text-secondaryText leading-relaxed">
                  Managing <strong>{patient.conditions.join(', ')}</strong> &bull; Attending: <strong>{patient.primaryDoctor}</strong> ({patient.primaryClinic})
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-mutedText">
                  <span>Advance Directives: <strong className="text-main">{patient.advanceDirectivesStatus}</strong></span>
                  {patient.allergies.length > 0 && (
                    <>
                      <span>&bull;</span>
                      <span>Allergies: <strong className="text-clinical-danger">{patient.allergies[0].allergen} ({patient.allergies[0].severity})</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-subtleBorder">
              <div className="p-3 rounded-xl bg-canvas-background border border-subtleBorder text-left min-w-[150px]">
                <span className="block text-[11px] font-semibold text-secondaryText uppercase tracking-wider">
                  Emergency Contact
                </span>
                <span className="block text-sm font-bold text-main mt-0.5">
                  {patient.emergencyContact.name}
                </span>
                <span className="block text-xs text-secondaryText">
                  {patient.emergencyContact.relationship} &bull; {patient.emergencyContact.phone}
                </span>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={() => alert(`Direct contact line connecting to ${patient.emergencyContact.name} (${patient.emergencyContact.phone}).`)}
                className="text-clinical-danger hover:bg-clinical-dangerBg hover:border-clinical-dangerBorder"
              >
                <PhoneCall className="h-4 w-4 mr-1.5" />
                Contact Circle
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* B. Today's Care Overview Metric Cards */}
      <section className="mb-8" aria-label="Today's Care Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              subValue={metric.subValue}
              trend={
                metric.trendLabel
                  ? { direction: metric.trendDirection || 'neutral', label: metric.trendLabel }
                  : undefined
              }
              icon={
                metric.id.includes('medication') || metric.id.includes('doses') ? (
                  <Pill className="h-5 w-5" />
                ) : metric.id.includes('appointment') || metric.id.includes('visit') ? (
                  <Calendar className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )
              }
            />
          ))}
        </div>
      </section>

      {/* F. Care Alerts Section */}
      <section className="mb-8 space-y-3" aria-label="Care Alerts and Continuity Notices">
        {bundle.alerts.map((alert) => (
          <CareAlertCard
            key={alert.id}
            alert={alert}
            onAction={(a) => {
              if (a.category === 'care_gap') {
                window.location.href = '/care-gaps';
              } else {
                window.location.href = '/continuity';
              }
            }}
          />
        ))}
      </section>

      {/* Two-Column Core Layout: Schedules on Left, Circle & Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column (2 Cols): C. Medication Schedule & D. Appointment Preview */}
        <div className="lg:col-span-2 space-y-8">
          {/* C. Medication Schedule Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Today&apos;s Medication Schedule</CardTitle>
                <CardDescription>
                  Active doses for {patient.fullName} &bull; Self-reported logs do not confirm physiological ingestion
                </CardDescription>
              </div>
              <Badge variant="mint" size="md">
                {schedule.length} {schedule.length === 1 ? 'Dose' : 'Doses'} Active
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-4">
              {schedule.length === 0 ? (
                <div className="p-6 text-center text-xs text-secondaryText">
                  No scheduled medication doses recorded for this patient.
                </div>
              ) : (
                schedule.map((dose) => (
                  <MedicationScheduleItem
                    key={dose.id}
                    dose={dose}
                    onLogAction={handleLogAction}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* D. Appointment Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Next Clinical Appointment</CardTitle>
                <CardDescription>
                  Confirmed clinic visit with companion logistics and preparation requirements
                </CardDescription>
              </div>
              <Badge variant="info" size="md">
                {bundle.nextAppointment ? bundle.nextAppointment.status.replace('_', ' ') : 'None scheduled'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              {bundle.nextAppointment ? (
                <AppointmentItem
                  appointment={bundle.nextAppointment}
                  onViewDetails={() => (window.location.href = '/appointments')}
                />
              ) : (
                <div className="p-6 text-center text-xs text-secondaryText">
                  No upcoming appointments scheduled.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): E. Care Circle & G. Recent Activity */}
        <div className="space-y-8">
          {/* E. Care Circle Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Care Circle</CardTitle>
                <CardDescription>Care partners for {patient.fullName}</CardDescription>
              </div>
              <Badge variant="mint" size="sm">
                {bundle.careCircle.length} Synchronized
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              {bundle.careCircle.map((member) => (
                <CareCircleMemberCard
                  key={member.id}
                  member={member}
                  onContact={(m) => alert(`Direct contact line connecting to ${m.name} (${m.phone}).`)}
                />
              ))}
            </CardContent>
          </Card>

          {/* G. Recent Activity Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Care Activity</CardTitle>
              <CardDescription>Verified chronological care events (Sample Records)</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2">
                {bundle.timelineEvents.map((evt, idx) => (
                  <ActivityTimelineItem
                    key={evt.id}
                    event={evt}
                    isLast={idx === bundle.timelineEvents.length - 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
