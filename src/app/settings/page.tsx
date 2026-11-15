'use client';

import { AppShell } from '@/components/common/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Eye, Bell, Volume2, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AppShell
      breadcrumbs={[{ label: 'Settings' }]}
      pageTitle="Settings & Preferences"
      pageDescription="Customize accessibility, quiet hours, notification channels, and elder visual display modes."
    >
      <div className="space-y-6 text-left max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Elder Accessibility Preferences</CardTitle>
            <CardDescription>Visual and auditory assistance controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-subtleBorder">
              <div>
                <span className="font-semibold text-sm text-main">Large Typography Scale</span>
                <p className="text-xs text-secondaryText">Increases base font size across all views for comfortable reading.</p>
              </div>
              <span className="text-xs font-bold text-secondary">Active (Large A+)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-subtleBorder">
              <div>
                <span className="font-semibold text-sm text-main">Voice Schedule Readout</span>
                <p className="text-xs text-secondaryText">Enables one-tap speech synthesis of daily medication schedules.</p>
              </div>
              <span className="text-xs font-bold text-clinical-success">Enabled</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-sm text-main">High Contrast Mode</span>
                <p className="text-xs text-secondaryText">Maximizes edge contrast and utilizes prominent focus rings.</p>
              </div>
              <span className="text-xs font-semibold text-secondaryText">Available via Header</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Care Circle Notifications & Quiet Hours</CardTitle>
            <CardDescription>Alert timing and emergency override preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-subtleBorder">
              <div>
                <span className="font-semibold text-sm text-main">Nighttime Quiet Hours</span>
                <p className="text-xs text-secondaryText">Suppresses non-urgent notifications between 9:30 PM and 7:30 AM.</p>
              </div>
              <span className="text-xs font-bold text-secondary">21:30 &ndash; 07:30</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-sm text-main">Emergency Break-Through</span>
                <p className="text-xs text-secondaryText">Urgent safety alerts and missed critical doses always bypass quiet hours.</p>
              </div>
              <span className="text-xs font-bold text-clinical-success">Always Active</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
