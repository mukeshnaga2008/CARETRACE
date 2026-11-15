'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Pill, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  PhoneCall, 
  ShieldCheck, 
  ArrowRight, 
  Printer, 
  Info,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ProfileNavTabs } from '@/components/features/profile/profile-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { 
  INITIAL_PATIENT_PROFILE, 
  INITIAL_HEALTH_SOURCES, 
  INITIAL_EMERGENCY_CONTACTS 
} from '@/lib/data/patient-profile-data';
import { 
  SYNTHETIC_MEDICATION_SCHEDULE, 
  SYNTHETIC_NEXT_APPOINTMENT, 
  SYNTHETIC_CARE_CIRCLE 
} from '@/lib/data/synthetic-dashboard-data';
import { AppRole } from '@/lib/constants';

export default function PatientHealthSummaryPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Authorised Health Summary"
        description="Comprehensive clinical overview compiled from verified electronic records, care circle logs, and attending clinician notes."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Patient Profile', href: '/profile' },
          { label: 'Health Summary' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/care-passport"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm touch-target-min"
            >
              <FileCheck className="h-4 w-4" />
              <span>Export Care Passport</span>
            </Link>
          </div>
        }
      >
        <ProfileNavTabs />

        {/* Regulatory & Provenance Notice */}
        <div className="mb-6 p-4 rounded-xl bg-canvas-background border border-subtleBorder flex items-start gap-3 text-xs text-secondaryText">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-main block mb-0.5">Healthcare Continuity & Provenance Notice:</span>
            <p>
              Information in this summary reflects verified patient-reported logs, attending physician notes, and family coordination updates. 
              <strong>CARETRACE does not diagnose conditions, modify prescription dosages, or make treatment determinations.</strong> Unverified items are visibly marked with pending review badges.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Patient Clinical Header */}
          <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold">
                MS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-main">{INITIAL_PATIENT_PROFILE.fullName}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-mint text-primary border border-mint-border text-xs font-semibold">
                    &ldquo;{INITIAL_PATIENT_PROFILE.preferredName}&rdquo;
                  </span>
                </div>
                <p className="text-xs text-secondaryText mt-1">
                  Age 78 • Blood Group: <strong>{INITIAL_PATIENT_PROFILE.bloodType}</strong> • {INITIAL_PATIENT_PROFILE.primaryDoctorName} ({INITIAL_PATIENT_PROFILE.primaryClinic})
                </p>
              </div>
            </div>

            <div className="text-xs text-secondaryText md:text-right shrink-0">
              <div>Advance Directives: <strong className="text-clinical-success">POLST Documented</strong></div>
              <div>Healthcare Proxy: <strong>{INITIAL_PATIENT_PROFILE.healthcareProxyName}</strong></div>
              <div className="text-[11px] text-mutedText mt-1">
                Verified on {new Date(INITIAL_PATIENT_PROFILE.lastReviewedAt).toLocaleDateString()} by {INITIAL_PATIENT_PROFILE.lastReviewedByName}
              </div>
            </div>
          </div>

          {/* Section 2: Chronic Conditions & Allergies (with Provenance) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-subtleBorder pb-3">
                <h3 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-clinical-danger" />
                  Known Allergies & Contraindications
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#1B6346] border border-clinical-successBorder text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Clinician Verified
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-canvas-background border border-subtleBorder text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-main">Penicillin</span>
                    <Badge variant="warning" size="sm">Moderate</Badge>
                  </div>
                  <p className="text-secondaryText mt-1">Reaction: Diffuse urticarial rash and facial pruritus.</p>
                  <p className="text-[10px] text-mutedText mt-1">Source: St. Jude Health Network Clinical Summary (2024)</p>
                </div>

                <div className="p-3 rounded-xl bg-canvas-background border border-subtleBorder text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-main">Shellfish / Iodine Radiocontrast</span>
                    <Badge variant="danger" size="sm">Severe / Anaphylaxis</Badge>
                  </div>
                  <p className="text-secondaryText mt-1">Reaction: Acute bronchospasm and facial angioedema.</p>
                  <p className="text-[10px] text-mutedText mt-1">Source: Attending Cardiologist Dr. Eleanor Vance (2025)</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-subtleBorder pb-3">
                <h3 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-secondary" />
                  Diagnosed Chronic Conditions
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF4EE] text-[#1B6346] border border-clinical-successBorder text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Clinician Verified
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-canvas-background border border-subtleBorder text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-main">Primary Essential Hypertension</span>
                    <Badge variant="mint" size="sm">Active (Controlled)</Badge>
                  </div>
                  <p className="text-secondaryText mt-1">ICD-10: I10 • Diagnosed 2014 • Managed with Lisinopril 10mg daily.</p>
                  <p className="text-[10px] text-mutedText mt-1">Source: St. Jude Cardiology Associates</p>
                </div>

                <div className="p-3 rounded-xl bg-canvas-background border border-subtleBorder text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-main">Osteoarthritis (Bilateral Knees)</span>
                    <Badge variant="neutral" size="sm">Managed</Badge>
                  </div>
                  <p className="text-secondaryText mt-1">ICD-10: M17.0 • Diagnosed 2018 • Assistive cane used for distance walks.</p>
                  <p className="text-[10px] text-mutedText mt-1">Source: Orthopedic Consultation Summary</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Current Prescriptions (Module 4/5 integration preview) */}
          <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-subtleBorder pb-3">
              <div>
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  Current Prescriptions & Supplement Regimen
                </h3>
                <p className="text-xs text-secondaryText">Synchronized with daily adherence tracking.</p>
              </div>
              <Link href="/medications" className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1">
                View Medication Manager <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SYNTHETIC_MEDICATION_SCHEDULE.map((med) => (
                <div key={med.id} className="p-4 rounded-xl border border-subtleBorder bg-canvas-background text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-main text-sm">{med.medicationName}</span>
                    <Badge variant="mint" size="sm">{med.dosage}</Badge>
                  </div>
                  <p className="text-secondaryText font-medium">Instructions: {med.instructions}</p>
                  <p className="text-mutedText">Scheduled: {med.scheduledTime} • Route: Oral with water</p>
                  <div className="pt-2 border-t border-subtleBorder flex items-center justify-between text-[11px]">
                    <span className="text-secondaryText">Status:</span>
                    <span className="font-bold text-clinical-success">Active & Verified</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Unverified Supplement Callout */}
            <div className="mt-4 p-3.5 rounded-xl bg-clinical-warningBg border border-clinical-warningBorder flex items-start gap-3 text-xs text-[#8C5D17]">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Patient / Family Reported Supplement (Awaiting Review):</span>
                <p className="mt-0.5">
                  David Sullivan reported addition of <strong>CoQ10 100mg daily</strong> with breakfast. Not yet reviewed by Dr. Vance. A review item is queued for the Feb 20 cardiology visit.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Upcoming Visits & Transportation */}
          <div className="p-6 rounded-2xl border border-subtleBorder bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-subtleBorder pb-3">
              <div>
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" />
                  Next Scheduled Clinical Appointment
                </h3>
                <p className="text-xs text-secondaryText">Clinician visit details, transport companion, and preparation notices.</p>
              </div>
              <Link href="/appointments" className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1">
                All Appointments <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-4 rounded-xl border border-subtleBorder bg-canvas-background flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-main">{SYNTHETIC_NEXT_APPOINTMENT.specialty} Follow-Up</span>
                  <Badge variant="mint" size="sm">Confirmed</Badge>
                </div>
                <p className="text-secondaryText font-medium">
                  {SYNTHETIC_NEXT_APPOINTMENT.providerName} • {SYNTHETIC_NEXT_APPOINTMENT.facility}
                </p>
                <p className="text-mutedText">
                  {SYNTHETIC_NEXT_APPOINTMENT.dateTimeFormatted} ({SYNTHETIC_NEXT_APPOINTMENT.durationMinutes} mins)
                </p>
                <p className="text-mutedText">
                  Transport Escort: <strong>{SYNTHETIC_NEXT_APPOINTMENT.companionName}</strong> • {SYNTHETIC_NEXT_APPOINTMENT.preparationNotice}
                </p>
              </div>

              <Link
                href="/appointments"
                className="px-4 py-2 rounded-xl bg-white border border-subtleBorder hover:bg-canvas-subtle text-main font-semibold text-xs transition-colors shrink-0 touch-target-min text-center"
              >
                View Appointment Briefing
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
