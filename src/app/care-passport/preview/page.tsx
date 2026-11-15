'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { PassportNavTabs } from '@/components/features/passport/passport-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Printer,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Pill,
  Calendar,
  Users,
  AlertOctagon,
  CheckCircle,
  Copy,
  Info,
} from 'lucide-react';
import {
  getCarePassportData,
  getCarePassportPreferences,
  recordPassportExport,
} from '@/lib/data/timeline-analytics-data';
import { generateCarePassportPDF } from '@/lib/services/passport-pdf-service';

export default function CarePassportPreviewPage() {
  const [data, setData] = React.useState<any>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [copiedHash, setCopiedHash] = React.useState(false);
  const [exportNotice, setExportNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    let activeId = 'DEMO-001';
    try {
      const match = document.cookie.match(/caretrace_active_patient=([^;]+)/);
      const saved = match ? match[1] : localStorage.getItem('caretrace_active_patient');
      if (saved) activeId = saved;
    } catch {
      // fallback
    }
    const config = getCarePassportPreferences();
    const passportData = getCarePassportData(activeId, config);
    setData(passportData);
  }, []);

  const handleDownloadPDF = () => {
    if (!data) return;
    setIsExporting(true);
    setExportNotice(null);

    setTimeout(() => {
      const doc = generateCarePassportPDF(data);
      doc.save(`CARETRACE_Passport_${data.patient.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      const rec = recordPassportExport(
        'patient-profile-001',
        'family',
        'David Sullivan',
        'Family Member (Proxy)',
        data.meta.includedSections,
        data.meta.verificationHash,
        'Downloaded from Care Passport Preview screen'
      );

      setIsExporting(false);
      setExportNotice(`Care Passport PDF successfully downloaded! Verification Hash: ${rec.verificationHash}`);
      setTimeout(() => setExportNotice(null), 6000);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    if (!data?.meta?.verificationHash) return;
    navigator.clipboard.writeText(data.meta.verificationHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  if (!data) return null;

  const isIncluded = (section: string) => data.meta.includedSections.includes(section);

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Care Passport', href: '/care-passport' },
        { label: 'Document Preview' },
      ]}
      pageTitle="Care Passport Preview"
      pageDescription="Full visual preview of the print-ready clinical handoff packet, formatted for emergency responders, hospital admissions, and specialist consultations."
    >
      <PageContainer>
        <div className="print:hidden">
          <PassportNavTabs />
        </div>

        {exportNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              <strong>Cryptographic Stamp:</strong> {data.meta.verificationHash}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyHash}
              className="gap-1.5 text-xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              {copiedHash ? 'Hash Copied!' : 'Copy Hash'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              Print Document
            </Button>
            <Link href="/care-passport/settings">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-700" />
                Customize Sections
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="gap-1.5 text-xs bg-teal-800 hover:bg-teal-900 text-white"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Generating PDF...' : 'Download Official PDF'}
            </Button>
          </div>
        </div>

        {/* Printable Document Paper Sheet */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl max-w-4xl mx-auto overflow-hidden print:border-none print:shadow-none print:m-0 print:max-w-none text-slate-900">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 border-b-4 border-teal-600">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-2 uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Official Clinical Handoff Record
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  CARETRACE — AUTHORISED CARE PASSPORT
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Intelligent Healthcare Continuity Network • Emergency & Specialist Handoff Summary
                </p>
              </div>
              <div className="text-right sm:border-l sm:border-slate-700 sm:pl-6 space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Verification Stamp
                </div>
                <div className="font-mono text-xs font-bold text-teal-300">
                  {data.meta.verificationHash}
                </div>
                <div className="text-[10px] text-slate-400">
                  Snapshot: {new Date(data.meta.generatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Section 1: Patient Identity */}
            {isIncluded('patient_identity') && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{data.patient.fullName}</h2>
                    <p className="text-xs text-slate-600">
                      Preferred: <span className="font-semibold text-slate-800">{data.patient.preferredName}</span> • Primary Language: {data.patient.preferredLanguage}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 text-xs font-semibold">
                      Blood Type: {data.patient.bloodType}
                    </Badge>
                    <Badge variant="neutral" className="text-xs">
                      Age {data.patient.age} (DOB: {data.patient.dateOfBirth})
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-700 font-medium">Attending Clinician:</span>{' '}
                    <span className="font-bold text-slate-900">{data.patient.primaryDoctor}</span>
                  </div>
                  <div>
                    <span className="text-slate-700 font-medium">Primary Facility:</span>{' '}
                    <span className="font-semibold text-slate-900">{data.patient.primaryClinic}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Healthcare Proxy & Emergency Contacts */}
            {isIncluded('emergency_contacts') && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  Designated Healthcare Proxy & Emergency Contacts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.emergencyContacts.map((contact: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border ${
                        contact.isHealthcareProxy
                          ? 'bg-rose-50/60 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900">{contact.name}</span>
                        {contact.isHealthcareProxy ? (
                          <Badge className="bg-rose-600 text-white text-[10px] font-bold">
                            HEALTHCARE PROXY (POA)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Priority {contact.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{contact.relationship}</p>
                      <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                        📞 {contact.phone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Advance Directives & Resuscitation */}
            {isIncluded('advance_directives') && (
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2 mb-2">
                  <AlertOctagon className="w-4 h-4 text-amber-700" />
                  Advance Directives & Resuscitation Preferences
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-amber-800 font-medium block">Resuscitation Status:</span>
                    <span className="font-bold text-slate-900">{data.advanceDirectives.dnrStatus}</span>
                  </div>
                  <div>
                    <span className="text-amber-800 font-medium block">POLST / POST Record:</span>
                    <span className="font-bold text-slate-900">
                      {data.advanceDirectives.polstOnFile ? 'Verified On File (Springfield)' : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-800 font-medium block">Legal Power of Attorney:</span>
                    <span className="font-bold text-slate-900">{data.advanceDirectives.medicalPowerOfAttorney}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Diagnoses & Allergies */}
            {isIncluded('conditions_and_allergies') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Diagnoses */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-700" />
                    Active Chronic Conditions
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {data.conditionsAndAllergies.conditions.map((cond: any, idx: number) => (
                      <li key={idx} className="flex items-center justify-between pb-1.5 border-b border-slate-200 last:border-none">
                        <span className="font-semibold text-slate-900">{cond.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Since {cond.diagnosedYear}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {cond.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Verified Allergies */}
                <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-2.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Documented Allergies & Sensitivities
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {data.conditionsAndAllergies.allergies.map((allg: any, idx: number) => (
                      <li key={idx} className="pb-1.5 border-b border-rose-100 last:border-none">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-950">{allg.allergen}</span>
                          <Badge className="bg-rose-600 text-white text-[10px] px-1.5 py-0 font-semibold">
                            {allg.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-rose-800 mt-0.5">Reaction: {allg.reaction}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 5: Current Medication Regimen */}
            {isIncluded('medication_regimen') && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <Pill className="w-4 h-4 text-teal-700" />
                  Active Medication Regimen
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Medication & Strength</th>
                        <th className="p-2.5">Dose & Frequency</th>
                        <th className="p-2.5">Scheduled Times</th>
                        <th className="p-2.5">Prescriber</th>
                        <th className="p-2.5 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {data.medications.map((med: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{med.name}</td>
                          <td className="p-2.5 text-slate-700">
                            {med.dosage} • {med.frequency}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">
                            {med.scheduledTimes?.join(', ') || 'As directed'}
                          </td>
                          <td className="p-2.5 text-slate-600">{med.prescribingDoctor || 'Primary Care'}</td>
                          <td className="p-2.5 text-right">
                            <Badge variant="outline" className="text-[10px] bg-teal-50 text-teal-800 border-teal-200">
                              Clinician Verified
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 6: Care Instructions & Directives */}
            {isIncluded('care_instructions') && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <FileText className="w-4 h-4 text-teal-700" />
                  Active Care Instructions & Directives
                </h3>
                <div className="space-y-3">
                  {data.careInstructions.map((ins: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{ins.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{ins.version}</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                        {ins.directives.map((dir: string, dIdx: number) => (
                          <li key={dIdx}>{dir}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 7: Upcoming Appointments */}
            {isIncluded('upcoming_appointments') && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  Upcoming Clinical Appointments
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.upcomingAppointments.map((appt: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                      <div className="font-bold text-slate-900">{appt.title}</div>
                      <p className="text-slate-600 mt-0.5">
                        {appt.provider} • {appt.clinic}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>🗓️ {new Date(appt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {appt.companion && (
                          <span className="font-medium text-slate-700">Companion: {appt.companion}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 8: Care Circle */}
            {isIncluded('care_circle') && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2 border-b border-slate-200 pb-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Authorised Care Circle Members
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {data.careCircle.map((member: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className="font-bold text-slate-900 block">{member.name}</span>
                      <span className="text-[11px] text-slate-600 block">{member.relationship}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold uppercase block mt-1">
                        {member.role} ({member.permissionTier})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 9: Pending Tasks */}
            {isIncluded('pending_tasks') && data.pendingTasks && data.pendingTasks.length > 0 && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Active Care Coordination Tasks
                </h3>
                <div className="space-y-1.5 text-xs">
                  {data.pendingTasks.map((task: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <span>• {task.title}</span>
                      <span className="text-[11px] text-slate-500">
                        Due: {task.dueDate} • {task.assignee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Boundary & Legal Disclaimer */}
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Info className="w-3.5 h-3.5 text-slate-600" />
                Operational Handoff Disclaimer & Provenance Notice
              </div>
              <p>
                This document is a snapshot generated from the CARETRACE Care Continuity Network for the explicit purpose of emergency handoffs and clinical coordination. It compiles records supplied by authorized clinicians, family members, and caregivers.
              </p>
              <p className="font-semibold text-slate-700">
                It does not replace primary hospital charts, laboratory results, or the professional medical judgment of an attending physician. In an acute medical emergency, verify critical medication and resuscitation status directly.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
