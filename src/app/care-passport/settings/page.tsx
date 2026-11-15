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
  Sliders,
  CheckCircle2,
  Save,
  RotateCcw,
  Eye,
  ShieldCheck,
  User,
  HeartPulse,
  AlertTriangle,
  Pill,
  Calendar,
  FileText,
  Users,
  CheckSquare,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';
import {
  getCarePassportPreferences,
  updateCarePassportPreferences,
  DEFAULT_CARE_PASSPORT_CONFIG,
} from '@/lib/data/timeline-analytics-data';
import { CarePassportConfig, CarePassportSectionKey } from '@/types/caretrace';

interface SectionDefinition {
  key: CarePassportSectionKey;
  label: string;
  description: string;
  icon: any;
  recommendation: string;
  isCritical?: boolean;
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    key: 'patient_identity',
    label: 'Patient Identity & Demographics',
    description: 'Legal name, preferred name, DOB, age, blood type, primary physician & facility.',
    icon: User,
    recommendation: 'Mandatory for hospital admission & EMS verification',
    isCritical: true,
  },
  {
    key: 'emergency_contacts',
    label: 'Healthcare Proxy & Emergency Contacts',
    description: 'Designated surrogate decision-makers, family contacts, telephone numbers, and priority order.',
    icon: HeartPulse,
    recommendation: 'Vital for acute triage and surrogate consent',
    isCritical: true,
  },
  {
    key: 'conditions_and_allergies',
    label: 'Active Diagnoses & Allergies',
    description: 'Chronic conditions with diagnosis years, documented adverse drug reactions, and severity grades.',
    icon: AlertTriangle,
    recommendation: 'Critical to prevent drug-drug and drug-allergy interactions',
    isCritical: true,
  },
  {
    key: 'medication_regimen',
    label: 'Active Medication Regimen',
    description: 'Verified drug names, dosages, administration routes, schedules, and prescriber credentials.',
    icon: Pill,
    recommendation: 'Essential for clinical reconciliation and avoiding polypharmacy hazards',
    isCritical: true,
  },
  {
    key: 'advance_directives',
    label: 'Advance Directives & Resuscitation (DNR/POLST)',
    description: 'Resuscitation preferences, POLST/POST forms on file, and medical power of attorney agents.',
    icon: AlertOctagon,
    recommendation: 'Essential for honoring patient autonomy and dignity in emergencies',
    isCritical: true,
  },
  {
    key: 'care_instructions',
    label: 'Care Instructions & Clinical Directives',
    description: 'Cardiology, nephrology, and mobility guidelines from the verified Instruction Vault.',
    icon: FileText,
    recommendation: 'Recommended for specialist visits and home nursing coordination',
  },
  {
    key: 'upcoming_appointments',
    label: 'Upcoming Scheduled Appointments',
    description: 'Future hospital, lab, and clinic visits with scheduled dates, locations, and assigned companions.',
    icon: Calendar,
    recommendation: 'Helpful for hospital care managers and discharge planners',
  },
  {
    key: 'care_circle',
    label: 'Care Circle Members & Delegation Roles',
    description: 'Roster of active family members, professional caregivers, and authorized decision tiers.',
    icon: Users,
    recommendation: 'Helpful for care coordination and social work teams',
  },
  {
    key: 'pending_tasks',
    label: 'Open Care Tasks & Follow-ups',
    description: 'Pending operational duties (vitals logging, prescription pickups, transport arrangement).',
    icon: CheckSquare,
    recommendation: 'Optional operational detail for family sync',
  },
];

export default function CarePassportSettingsPage() {
  const [config, setConfig] = React.useState<CarePassportConfig | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const prefs = getCarePassportPreferences();
    setConfig(prefs);
  }, []);

  const handleToggleSection = (key: CarePassportSectionKey) => {
    if (!config) return;
    setConfig({
      ...config,
      sections: {
        ...config.sections,
        [key]: !config.sections[key],
      },
    });
  };

  const applyPreset = (presetName: string) => {
    if (!config) return;

    if (presetName === 'all') {
      const allTrue = Object.keys(config.sections).reduce((acc, k) => {
        acc[k as CarePassportSectionKey] = true;
        return acc;
      }, {} as Record<CarePassportSectionKey, boolean>);
      setConfig({ ...config, sections: allTrue });
      setFeedbackMessage('Applied "Full Comprehensive" preset: all 9 sections enabled.');
    } else if (presetName === 'emergency') {
      setConfig({
        ...config,
        sections: {
          patient_identity: true,
          emergency_contacts: true,
          conditions_and_allergies: true,
          medication_regimen: true,
          advance_directives: true,
          care_instructions: false,
          upcoming_appointments: false,
          care_circle: false,
          pending_tasks: false,
        },
      });
      setFeedbackMessage('Applied "EMS & Emergency Rapid" preset: clinical essentials only.');
    } else if (presetName === 'specialist') {
      setConfig({
        ...config,
        sections: {
          patient_identity: true,
          emergency_contacts: true,
          conditions_and_allergies: true,
          medication_regimen: true,
          advance_directives: false,
          care_instructions: true,
          upcoming_appointments: true,
          care_circle: false,
          pending_tasks: false,
        },
      });
      setFeedbackMessage('Applied "Specialist Consultation" preset: diagnoses, meds & instructions.');
    } else if (presetName === 'caregiver') {
      setConfig({
        ...config,
        sections: {
          patient_identity: true,
          emergency_contacts: true,
          conditions_and_allergies: false,
          medication_regimen: true,
          advance_directives: false,
          care_instructions: true,
          upcoming_appointments: true,
          care_circle: true,
          pending_tasks: true,
        },
      });
      setFeedbackMessage('Applied "Caregiver Operational" preset: daily schedules and duties.');
    }

    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaveStatus('saving');

    try {
      // 1. Update local cache
      updateCarePassportPreferences(config);

      // 2. Persist to API
      await fetch('/api/care-passport/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      setSaveStatus('saved');
      setFeedbackMessage('Care Passport preferences saved successfully.');
      setTimeout(() => {
        setSaveStatus('idle');
        setFeedbackMessage(null);
      }, 4000);
    } catch (e) {
      setSaveStatus('idle');
      setFeedbackMessage('Preferences saved locally in memory.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CARE_PASSPORT_CONFIG);
    updateCarePassportPreferences(DEFAULT_CARE_PASSPORT_CONFIG);
    setFeedbackMessage('Reset all configuration settings to factory defaults.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  if (!config) return null;

  const enabledCount = Object.values(config.sections).filter(Boolean).length;

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Care Passport', href: '/care-passport' },
        { label: 'Included Sections' },
      ]}
      pageTitle="Passport Section Configuration"
      pageDescription="Customize which clinical domains, contact directories, and directives are bundled into the official Care Passport PDF and print handoff."
    >
      <PageContainer>
        <PassportNavTabs />

        {feedbackMessage && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-300 rounded-xl text-xs text-teal-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Preset Selector Banner */}
        <Card className="mb-6 bg-slate-900 text-white border-slate-800">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  Quick Presets for Handoff Scenarios
                </div>
                <h3 className="text-lg font-bold">Fast Configuration Templates</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pre-configured section bundles tailored for emergency personnel, specialists, or family caregivers.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('emergency')}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
                >
                  EMS Rapid (5)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('specialist')}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
                >
                  Specialist Visit (5)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('caregiver')}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
                >
                  Caregiver Sync (6)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset('all')}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs"
                >
                  Full All (9)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Settings Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section Toggles (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Clinical Domains ({enabledCount} of 9 Included)
              </h2>
              <span className="text-xs text-slate-500">Click any card to toggle inclusion</span>
            </div>

            <div className="space-y-3">
              {SECTION_DEFINITIONS.map((sec) => {
                const Icon = sec.icon;
                const isSelected = config.sections[sec.key];

                return (
                  <div
                    key={sec.key}
                    onClick={() => handleToggleSection(sec.key)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? 'bg-white border-teal-600 ring-1 ring-teal-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900">{sec.label}</span>
                        {isSelected ? (
                          <Badge className="bg-teal-700 text-white text-[10px] font-semibold">
                            INCLUDED
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 text-[10px]">
                            OMITTED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{sec.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-teal-800 font-medium">
                          💡 {sec.recommendation}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Panel (1 Col) */}
          <div className="space-y-6">
            {/* Metadata & Hash Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  Security & Integrity Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Cryptographic Verification Hash
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Embeds non-repudiable SHA-256 stamp for tamper detection.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.includeVerificationHash}
                    onChange={(e) =>
                      setConfig({ ...config, includeVerificationHash: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                </div>

                {/* Custom Handoff Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Custom Handoff Memo / Clinical Caveat:
                  </label>
                  <textarea
                    rows={4}
                    value={config.customNotes || ''}
                    onChange={(e) => setConfig({ ...config, customNotes: e.target.value })}
                    placeholder="e.g. Patient prefers large print questions. Son David holds Medical POA and is reachable 24/7."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Appended to the Care Passport footer notes.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="w-full gap-2 bg-teal-800 hover:bg-teal-900 text-white"
                >
                  <Save className="w-4 h-4" />
                  {saveStatus === 'saving'
                    ? 'Saving...'
                    : saveStatus === 'saved'
                    ? 'Saved!'
                    : 'Save Configuration'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1.5 text-xs text-slate-600"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                  <Link href="/care-passport/preview" className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs text-slate-700">
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </Button>
                  </Link>
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <p className="text-[11px] text-slate-500">
                    Configurations persist across sessions and immediately update PDF output.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
