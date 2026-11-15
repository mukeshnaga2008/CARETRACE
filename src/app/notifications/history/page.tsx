'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { NotificationsNavTabs } from '@/components/features/notifications/notifications-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  History,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  getCachedDeliveryAttempts,
  getCachedAcknowledgements,
  getCachedNotifications,
} from '@/lib/data/notification-data';
import { NotificationDeliveryAttempt, NotificationAcknowledgement } from '@/types/caretrace';

export default function NotificationHistoryPage() {
  const [attempts, setAttempts] = React.useState<NotificationDeliveryAttempt[]>([]);
  const [acknowledgements, setAcknowledgements] = React.useState<NotificationAcknowledgement[]>([]);
  const [channelFilter, setChannelFilter] = React.useState('all');
  const [activeTab, setActiveTab] = React.useState<'attempts' | 'acknowledgements'>('attempts');

  React.useEffect(() => {
    setAttempts(getCachedDeliveryAttempts());
    setAcknowledgements(getCachedAcknowledgements());
  }, []);

  const notifications = getCachedNotifications();
  const getNotificationTitle = (notifId: string) => {
    const notif = notifications.find((n) => n.id === notifId);
    return notif?.title || `Notification ${notifId}`;
  };

  const filteredAttempts = attempts.filter((att) => {
    if (channelFilter !== 'all' && att.channel !== channelFilter) return false;
    return true;
  });

  return (
    <AppShell
      breadcrumbs={[{ label: 'Notifications', href: '/notifications' }, { label: 'History' }]}
      pageTitle="Notification Delivery & Activity History"
      pageDescription="Immutable audit trail of multi-channel dispatches, provider acceptance receipts, and explicit responsibility sign-offs."
    >
      <PageContainer>
        <NotificationsNavTabs />

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('attempts')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all min-h-[36px] flex items-center gap-1.5 ${
                activeTab === 'attempts'
                  ? 'bg-white shadow-xs text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-teal-700" />
              <span>Transport Delivery Attempts ({attempts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acknowledgements')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all min-h-[36px] flex items-center gap-1.5 ${
                activeTab === 'acknowledgements'
                  ? 'bg-white shadow-xs text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Explicit Sign-offs ({acknowledgements.length})</span>
            </button>
          </div>

          {activeTab === 'attempts' && (
            <Select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-10 text-xs rounded-lg min-w-[140px]"
              options={[
                { value: 'all', label: 'All Channels' },
                { value: 'in_app', label: 'In-App' },
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
              ]}
            />
          )}
        </div>

        {/* Content based on tab */}
        {activeTab === 'attempts' ? (
          <div className="space-y-3">
            {filteredAttempts.length === 0 ? (
              <Card className="p-8 text-center border-slate-200">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-[var(--secondary-text)]">No delivery attempts recorded for this channel.</p>
              </Card>
            ) : (
              filteredAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/notifications/${attempt.notificationId}`}
                        className="font-bold text-slate-900 hover:text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <span>{getNotificationTitle(attempt.notificationId)}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {attempt.channel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          attempt.status === 'failed'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {attempt.status === 'sent_to_provider'
                          ? 'Sent to Provider (Accepted)'
                          : attempt.status === 'confirmed_delivered'
                          ? 'Confirmed Delivered'
                          : attempt.status}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                      <span>Provider: <strong className="text-slate-800">{attempt.providerName}</strong></span>
                      {attempt.providerResponseCode && <span>• HTTP Code: <strong>{attempt.providerResponseCode}</strong></span>}
                      <span>• Attempt #{attempt.attemptNumber}</span>
                    </div>

                    {attempt.errorMessage && (
                      <p className="text-[11px] text-rose-700 font-mono bg-rose-50 p-1.5 rounded-md border border-rose-200">
                        {attempt.errorMessage}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                    {new Date(attempt.timestamp).toLocaleDateString()} at {new Date(attempt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {acknowledgements.length === 0 ? (
              <Card className="p-8 text-center border-slate-200">
                <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-[var(--secondary-text)]">No explicit sign-offs recorded yet.</p>
              </Card>
            ) : (
              acknowledgements.map((ack) => (
                <div
                  key={ack.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/notifications/${ack.notificationId}`}
                        className="font-bold text-slate-900 hover:text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <span>{getNotificationTitle(ack.notificationId)}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                        Signed-off
                      </Badge>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {new Date(ack.acknowledgedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    Sign-off verified by <strong className="text-slate-800">{ack.acknowledgedByName}</strong> ({ack.acknowledgedByRole})
                  </div>

                  {ack.note && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-200 italic">
                      &ldquo;{ack.note}&rdquo;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
