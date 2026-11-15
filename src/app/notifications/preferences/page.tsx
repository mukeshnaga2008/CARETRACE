'use client';

import * as React from 'react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { NotificationsNavTabs } from '@/components/features/notifications/notifications-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Sliders,
  CheckCircle2,
  Moon,
  Clock,
  Bell,
  Mail,
  Smartphone,
  Shield,
  Save,
  AlertCircle,
  EyeOff,
} from 'lucide-react';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from '@/lib/data/notification-data';
import { NotificationPreference } from '@/types/caretrace';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = React.useState<NotificationPreference>(() =>
    getUserNotificationPreferences('family')
  );
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSaveMessage(null);
    setTimeout(() => {
      const updated = updateUserNotificationPreferences('family', preferences);
      setPreferences(updated);
      setIsSaving(false);
      setSaveMessage('Preferences and quiet hours saved successfully.');
      setTimeout(() => setSaveMessage(null), 4000);
    }, 300);
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Notifications', href: '/notifications' }, { label: 'Preferences' }]}
      pageTitle="Notification Preferences"
      pageDescription="Configure delivery channels, quiet hours, reminder lead times, and lock-screen privacy settings."
    >
      <PageContainer>
        <NotificationsNavTabs />

        {saveMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        <div className="space-y-6 max-w-4xl">
          {/* 1. Delivery Channels */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-700" />
                Active Delivery Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-teal-700">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--main-text)] block">In-App Notification Centre</span>
                    <span className="text-[11px] text-[var(--secondary-text)]">
                      Dependable primary feed. Notifications always post here regardless of quiet hours.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.inAppEnabled}
                  onChange={(e) => setPreferences({ ...preferences, inAppEnabled: e.target.checked })}
                  className="w-4 h-4 accent-teal-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-700">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--main-text)] block">Email Notifications (Resend)</span>
                    <span className="text-[11px] text-[var(--secondary-text)]">
                      External email summaries and appointment prep digests. Suppressed during quiet hours.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled}
                  onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
                  className="w-4 h-4 accent-teal-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-emerald-700">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--main-text)] block">SMS Carrier Notifications</span>
                    <span className="text-[11px] text-[var(--secondary-text)]">
                      Text alerts for time-sensitive missed doses or urgent handover updates.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsEnabled}
                  onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-teal-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-700">Web Push Notifications</span>
                      <Badge variant="outline" className="text-[10px] bg-slate-200 text-slate-700 border-slate-300">
                        Unconfigured
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Requires VAPID_PRIVATE_KEY or FCM_SERVER_KEY configuration in environment.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  className="w-4 h-4 cursor-not-allowed"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Quiet Hours & Timezone */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-700" />
                Quiet Hours & Timezone Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div>
                  <span className="font-bold text-xs text-indigo-950 block">Enable Quiet Hours Suppression</span>
                  <span className="text-[11px] text-indigo-800">
                    When active, external emails and SMS messages are suppressed to prevent nocturnal disturbances.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.quietHoursEnabled}
                  onChange={(e) => setPreferences({ ...preferences, quietHoursEnabled: e.target.checked })}
                  className="w-4 h-4 accent-indigo-700 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Quiet Hours Start</label>
                  <Input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                    className="h-10 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 21:30 (9:30 PM)</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Quiet Hours End</label>
                  <Input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                    className="h-10 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 07:30 (7:30 AM)</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Configured Timezone</label>
                  <Select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="h-10 text-xs"
                    options={[
                      { value: 'America/Chicago', label: 'Central Time (Chicago)' },
                      { value: 'America/New_York', label: 'Eastern Time (New York)' },
                      { value: 'America/Denver', label: 'Mountain Time (Denver)' },
                      { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
                      { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
                    ]}
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Handles DST automatically</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Non-Sensitive Previews (Privacy Guard) */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-teal-700" />
                Lock-Screen & External Preview Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-xs text-[var(--main-text)] block">Strip Sensitive PHI from External Previews</span>
                  <span className="text-[11px] text-[var(--secondary-text)]">
                    Replaces specific drug names, dosage amounts, and clinical diagnoses with generic safe notices on lock-screens and external email subject lines.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.nonSensitivePreviewsOnly}
                  onChange={(e) => setPreferences({ ...preferences, nonSensitivePreviewsOnly: e.target.checked })}
                  className="w-4 h-4 accent-teal-700 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Reminder Lead Times */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                Reminder Lead Times
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Medication Due Notice</label>
                <Select
                  value={String(preferences.reminderLeadMinutes.medication || 15)}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      reminderLeadMinutes: {
                        ...preferences.reminderLeadMinutes,
                        medication: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="h-10 text-xs"
                  options={[
                    { value: '15', label: '15 minutes before' },
                    { value: '30', label: '30 minutes before' },
                    { value: '60', label: '1 hour before' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Appointment Reminder</label>
                <Select
                  value={String(preferences.reminderLeadMinutes.appointment || 120)}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      reminderLeadMinutes: {
                        ...preferences.reminderLeadMinutes,
                        appointment: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="h-10 text-xs"
                  options={[
                    { value: '60', label: '1 hour before' },
                    { value: '120', label: '2 hours before' },
                    { value: '1440', label: '24 hours (1 day) before' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Care Task Due Notice</label>
                <Select
                  value={String(preferences.reminderLeadMinutes.task || 60)}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      reminderLeadMinutes: {
                        ...preferences.reminderLeadMinutes,
                        task: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="h-10 text-xs"
                  options={[
                    { value: '30', label: '30 minutes before' },
                    { value: '60', label: '1 hour before' },
                    { value: '120', label: '2 hours before' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* 5. Notification Category Switches */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-700" />
                Category Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(preferences.enabledCategories).map(([catKey, isEnabled]) => (
                <div
                  key={catKey}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <span className="font-semibold text-slate-800 capitalize">
                    {catKey.replace('_', ' ')} Alerts
                  </span>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        enabledCategories: {
                          ...preferences.enabledCategories,
                          [catKey as any]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-teal-700 cursor-pointer"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs min-h-[44px] px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving Preferences...' : 'Save Notification Preferences'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
