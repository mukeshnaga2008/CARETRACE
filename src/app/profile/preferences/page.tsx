'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Sliders, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  Eye, 
  Clock, 
  Phone, 
  Bell, 
  Moon,
  Sparkles,
  Lock
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ProfileNavTabs } from '@/components/features/profile/profile-nav-tabs';
import { INITIAL_PATIENT_PREFERENCES } from '@/lib/data/patient-profile-data';
import { AppRole } from '@/lib/constants';

export default function PatientPreferencesPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');

  const [preferredName, setPreferredName] = React.useState(INITIAL_PATIENT_PREFERENCES.preferredName);
  const [preferredLanguage, setPreferredLanguage] = React.useState(INITIAL_PATIENT_PREFERENCES.preferredLanguage);
  const [preferredCommunicationMethod, setPreferredCommunicationMethod] = React.useState(INITIAL_PATIENT_PREFERENCES.preferredCommunicationMethod);
  const [timeFormat, setTimeFormat] = React.useState(INITIAL_PATIENT_PREFERENCES.timeFormat);
  const [largerText, setLargerText] = React.useState(INITIAL_PATIENT_PREFERENCES.largerText);
  const [highContrast, setHighContrast] = React.useState(INITIAL_PATIENT_PREFERENCES.highContrast);
  const [reducedMotion, setReducedMotion] = React.useState(INITIAL_PATIENT_PREFERENCES.reducedMotion);
  const [voiceReadoutEnabled, setVoiceReadoutEnabled] = React.useState(INITIAL_PATIENT_PREFERENCES.voiceReadoutEnabled);
  const [timezone, setTimezone] = React.useState(INITIAL_PATIENT_PREFERENCES.timezone);
  const [accessibilityNotes, setAccessibilityNotes] = React.useState(INITIAL_PATIENT_PREFERENCES.accessibilityNotes || '');

  // Notifications
  const [medicationReminders, setMedicationReminders] = React.useState(INITIAL_PATIENT_PREFERENCES.notificationPreferences.medicationReminders);
  const [appointmentReminders, setAppointmentReminders] = React.useState(INITIAL_PATIENT_PREFERENCES.notificationPreferences.appointmentReminders);
  const [careGapAlerts, setCareGapAlerts] = React.useState(INITIAL_PATIENT_PREFERENCES.notificationPreferences.careGapAlerts);
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(INITIAL_PATIENT_PREFERENCES.notificationPreferences.quietHoursEnabled);
  const [quietHoursStart, setQuietHoursStart] = React.useState(INITIAL_PATIENT_PREFERENCES.notificationPreferences.quietHoursStart);
  const [quietHoursEnd, setQuietHoursEnd] = React.useState(INITIAL_PATIENT_PREFERENCES.notificationPreferences.quietHoursEnd);

  const [isLoading, setIsLoading] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isCaregiver = activeRole === 'caregiver';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCaregiver) {
      setStatusMessage({
        type: 'error',
        text: 'Caregiver accounts hold read-only permissions for patient preferences.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/patient/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredName,
          preferredLanguage,
          preferredCommunicationMethod,
          timeFormat,
          largerText,
          highContrast,
          reducedMotion,
          voiceReadoutEnabled,
          timezone,
          accessibilityNotes,
          notificationPreferences: {
            medicationReminders,
            appointmentReminders,
            careGapAlerts,
            quietHoursEnabled,
            quietHoursStart,
            quietHoursEnd,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update preferences.' });
        setIsLoading(false);
        return;
      }

      setStatusMessage({ type: 'success', text: 'Care and accessibility preferences saved successfully.' });
      setIsLoading(false);
    } catch {
      setStatusMessage({ type: 'error', text: 'Network connection failure.' });
      setIsLoading(false);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Communication & Accessibility Preferences"
        description="Tailor display sizing, voice readouts, notification quiet hours, and daily care interaction modes."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Patient Profile', href: '/profile' },
          { label: 'Preferences' },
        ]}
      >
        <ProfileNavTabs />

        {isCaregiver && (
          <div className="mb-6 p-4 rounded-xl bg-clinical-warningBg border border-clinical-warningBorder flex items-start gap-3 text-sm text-[#8C5D17]">
            <Lock className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Read-Only Permission Tier</p>
              <p className="text-xs mt-0.5">
                Caregivers cannot modify patient communication preferences or quiet hours.
              </p>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-[#EAF4EE] border border-clinical-successBorder text-[#1B6346]'
              : 'bg-clinical-dangerBg border border-clinical-dangerBorder text-[#852D2D]'
          }`} role="status">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{statusMessage.type === 'success' ? 'Saved' : 'Notice'}</p>
              <p className="text-xs mt-0.5">{statusMessage.text}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Group 1: Communication Methods & Naming */}
          <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-main border-b border-subtleBorder pb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-secondary" />
              1. Communication & Greeting Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="preferredName" className="block text-xs font-bold text-main mb-1.5">
                  Greeting Name *
                </label>
                <input
                  id="preferredName"
                  type="text"
                  required
                  disabled={isCaregiver}
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="e.g. Peggy"
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                />
                <p className="text-[11px] text-mutedText mt-1">Used on dashboard greetings and voice summaries.</p>
              </div>

              <div>
                <label htmlFor="commMethod" className="block text-xs font-bold text-main mb-1.5">
                  Preferred Contact Method
                </label>
                <select
                  id="commMethod"
                  disabled={isCaregiver}
                  value={preferredCommunicationMethod}
                  onChange={(e) => setPreferredCommunicationMethod(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                >
                  <option value="phone">Telephone Call (Best for Margaret)</option>
                  <option value="sms">Text Message (SMS)</option>
                  <option value="email">Email</option>
                  <option value="in_person">In-Person Coordination Only</option>
                </select>
                <p className="text-[11px] text-mutedText mt-1">Care circle members will be prompted to use this channel.</p>
              </div>
            </div>
          </div>

          {/* Group 2: Elder Accessibility & Display Controls */}
          <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-main border-b border-subtleBorder pb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              2. Elder Accessibility Controls
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-canvas-background border border-subtleBorder hover:bg-canvas-subtle transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-main block">Larger Text & High Legibility</span>
                  <span className="text-xs text-secondaryText">Increases font sizes to 18px minimum for high contrast reading on elder devices.</span>
                </div>
                <input
                  type="checkbox"
                  disabled={isCaregiver}
                  checked={largerText}
                  onChange={(e) => setLargerText(e.target.checked)}
                  className="h-5 w-5 rounded border-subtleBorder text-secondary focus:ring-secondary"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-canvas-background border border-subtleBorder hover:bg-canvas-subtle transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-main block">One-Touch Voice Readouts</span>
                  <span className="text-xs text-secondaryText">Enables audible text-to-speech briefing of daily medications and doctor visits at a comfortable 0.9x speed.</span>
                </div>
                <input
                  type="checkbox"
                  disabled={isCaregiver}
                  checked={voiceReadoutEnabled}
                  onChange={(e) => setVoiceReadoutEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-subtleBorder text-secondary focus:ring-secondary"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-canvas-background border border-subtleBorder hover:bg-canvas-subtle transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-main block">Reduced Motion</span>
                  <span className="text-xs text-secondaryText">Minimizes smooth scrolling and page transition animations to avoid disorientation.</span>
                </div>
                <input
                  type="checkbox"
                  disabled={isCaregiver}
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="h-5 w-5 rounded border-subtleBorder text-secondary focus:ring-secondary"
                />
              </label>

              <div className="pt-2">
                <label htmlFor="timeFormat" className="block text-xs font-bold text-main mb-1.5">
                  Time Display Format
                </label>
                <select
                  id="timeFormat"
                  disabled={isCaregiver}
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value as any)}
                  className="w-full sm:w-72 h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                >
                  <option value="12h">12-Hour Format (e.g. 8:00 AM, 1:00 PM)</option>
                  <option value="24h">24-Hour Military Format (e.g. 08:00, 13:00)</option>
                </select>
              </div>

              <div>
                <label htmlFor="accessibilityNotes" className="block text-xs font-bold text-main mb-1.5">
                  Special Accessibility & Care Notes
                </label>
                <textarea
                  id="accessibilityNotes"
                  rows={2}
                  disabled={isCaregiver}
                  value={accessibilityNotes}
                  onChange={(e) => setAccessibilityNotes(e.target.value)}
                  placeholder="e.g. Mild hearing impairment in left ear. Speak clearly during telephone calls."
                  className="w-full p-3 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Quiet Hours & Notification Timing */}
          <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-main border-b border-subtleBorder pb-3 flex items-center gap-2">
              <Moon className="h-4 w-4 text-secondary" />
              3. Quiet Hours & Rest Periods
            </h3>

            <p className="text-xs text-secondaryText">
              During quiet hours, routine care tasks and refill reminders are silenced. Critical emergency alerts always bypass quiet hours.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-main">
                  <input
                    type="checkbox"
                    disabled={isCaregiver}
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-subtleBorder text-secondary focus:ring-secondary"
                  />
                  <span>Enable Rest Quiet Hours</span>
                </label>
              </div>

              <div>
                <label htmlFor="quietStart" className="block text-[11px] font-bold text-secondaryText mb-1">
                  Bedtime Silence Starts
                </label>
                <input
                  id="quietStart"
                  type="time"
                  disabled={isCaregiver || !quietHoursEnabled}
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="quietEnd" className="block text-[11px] font-bold text-secondaryText mb-1">
                  Morning Resumption Time
                </label>
                <input
                  id="quietEnd"
                  type="time"
                  disabled={isCaregiver || !quietHoursEnabled}
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href="/profile"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-subtleBorder bg-white hover:bg-canvas-subtle text-secondaryText hover:text-main text-xs sm:text-sm font-semibold transition-colors touch-target-min"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              disabled={isLoading || isCaregiver}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 touch-target-min"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving Preferences...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
