'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { NotificationsNavTabs } from '@/components/features/notifications/notifications-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Pill,
  Users,
  FileText,
  AlertTriangle,
  ExternalLink,
  XCircle,
  Inbox,
} from 'lucide-react';
import {
  getCachedNotifications,
  scanAndScheduleModuleReminders,
  cancelScheduledNotification,
} from '@/lib/data/notification-data';
import { CareTraceNotification } from '@/types/caretrace';

export default function ScheduledRemindersPage() {
  const [scheduled, setScheduled] = React.useState<CareTraceNotification[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [isScanning, setIsScanning] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const refreshList = React.useCallback(() => {
    const list = getCachedNotifications({ status: 'scheduled' });
    setScheduled(list);
  }, []);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleRunScan = () => {
    setIsScanning(true);
    setFeedbackMessage(null);
    setTimeout(() => {
      const res = scanAndScheduleModuleReminders();
      refreshList();
      setIsScanning(false);
      setFeedbackMessage(`Discovered ${res.newRemindersCount} new reminders across ${res.evaluatedRecords} clinical records.`);
      setTimeout(() => setFeedbackMessage(null), 5000);
    }, 400);
  };

  const handleCancelReminder = (idempotencyKey: string) => {
    const success = cancelScheduledNotification(idempotencyKey);
    if (success) {
      refreshList();
      setFeedbackMessage('Scheduled reminder was cancelled.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const filtered = scheduled.filter((notif) => {
    if (categoryFilter !== 'all' && notif.category !== categoryFilter) return false;
    return true;
  });

  return (
    <AppShell
      breadcrumbs={[{ label: 'Notifications', href: '/notifications' }, { label: 'Scheduled' }]}
      pageTitle="Scheduled Clinical Reminders"
      pageDescription="Upcoming proactive alerts synchronized with medication timetables, doctor consultations, and care circle handovers."
    >
      <PageContainer>
        <NotificationsNavTabs />

        {feedbackMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Toolbar & Summary */}
        <Card className="p-4 border-slate-200 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-800">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm text-[var(--main-text)] block">
                  {scheduled.length} Scheduled Proactive Reminders
                </span>
                <span className="text-xs text-[var(--secondary-text)]">
                  Reminders are evaluated ahead of time based on user lead times and timezones.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 text-xs rounded-lg min-w-[140px]"
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'appointment', label: 'Appointments' },
                  { value: 'medication', label: 'Medications' },
                  { value: 'care_circle', label: 'Care Tasks' },
                  { value: 'instructions', label: 'Instructions' },
                ]}
              />

              <Button
                size="sm"
                onClick={handleRunScan}
                disabled={isScanning}
                className="h-10 text-xs bg-teal-700 hover:bg-teal-800 text-white min-h-[44px]"
              >
                <Sparkles className={`w-4 h-4 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Upcoming'}
              </Button>
            </div>
          </div>
        </Card>

        {/* List of Scheduled Items */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[var(--main-text)]">No upcoming reminders scheduled</h3>
              <p className="text-xs text-[var(--secondary-text)] max-w-md mx-auto mt-1">
                Click &ldquo;Scan Upcoming&rdquo; to scan existing clinical schedules and register reminders.
              </p>
            </Card>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[var(--main-text)]">{item.title}</span>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">
                        {item.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {item.deliveryChannel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                        Scheduled
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--secondary-text)]">
                      <span>Scheduled for: <strong className="text-[var(--main-text)]">{item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : 'Pending'}</strong></span>
                      <span>•</span>
                      <span>Recipient: <strong className="text-[var(--main-text)]">{item.recipientName}</strong></span>
                      {item.actionUrl && (
                        <>
                          <span>•</span>
                          <Link href={item.actionUrl} className="text-teal-700 hover:underline font-semibold flex items-center gap-1">
                            <span>View Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelReminder(item.idempotencyKey)}
                      className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 min-h-[44px]"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel Reminder
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
