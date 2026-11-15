'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { NotificationsNavTabs } from '@/components/features/notifications/notifications-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Pill,
  Calendar,
  Users,
  FileText,
  Search,
  Filter,
  CheckCheck,
  Archive,
  ExternalLink,
  Moon,
  Sparkles,
  Inbox,
} from 'lucide-react';
import {
  getCachedNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  scanAndScheduleModuleReminders,
  getUserNotificationPreferences,
} from '@/lib/data/notification-data';
import { CareTraceNotification, NotificationCategory } from '@/types/caretrace';
import { isInQuietHours } from '@/lib/services/notification-transport';

export default function NotificationsOverviewPage() {
  const [notifications, setNotifications] = React.useState<CareTraceNotification[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'unread' | 'ack_pending' | 'archived'>('all');
  const [channelFilter, setChannelFilter] = React.useState<string>('all');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState<string | null>(null);

  const preferences = getUserNotificationPreferences('family');
  const inQuiet = isInQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd, preferences.timezone);

  const refreshList = React.useCallback(() => {
    setNotifications(getCachedNotifications());
  }, []);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleMarkRead = (id: string, isRead: boolean) => {
    markNotificationRead(id, isRead);
    refreshList();
  };

  const handleArchive = (id: string) => {
    archiveNotification(id);
    refreshList();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    refreshList();
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setScanMessage(null);
    setTimeout(() => {
      const res = scanAndScheduleModuleReminders();
      refreshList();
      setIsScanning(false);
      setScanMessage(`Discovered ${res.newRemindersCount} new reminder(s) across ${res.evaluatedRecords} clinical records.`);
      setTimeout(() => setScanMessage(null), 5000);
    }, 400);
  };

  // Filtered notifications
  const filtered = notifications.filter((notif) => {
    // Read status filter
    if (statusFilter === 'unread' && notif.isRead) return false;
    if (statusFilter === 'unread' && notif.readStatus === 'archived') return false;
    if (statusFilter === 'ack_pending' && (!notif.requiresAcknowledgement || notif.acknowledgementStatus === 'acknowledged')) return false;
    if (statusFilter === 'archived' && notif.readStatus !== 'archived') return false;
    if (statusFilter !== 'archived' && notif.readStatus === 'archived') return false;

    // Category filter
    if (categoryFilter !== 'all' && notif.category !== categoryFilter) return false;

    // Channel filter
    if (channelFilter !== 'all' && notif.deliveryChannel !== channelFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = notif.title.toLowerCase().includes(q);
      const matchBody = notif.body.toLowerCase().includes(q);
      const matchPreview = notif.previewText.toLowerCase().includes(q);
      const matchRecipient = notif.recipientName.toLowerCase().includes(q);
      if (!matchTitle && !matchBody && !matchPreview && !matchRecipient) return false;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead && n.readStatus !== 'archived').length;
  const pendingAckCount = notifications.filter((n) => n.requiresAcknowledgement && n.acknowledgementStatus === 'pending').length;
  const scheduledCount = notifications.filter((n) => n.deliveryStatus === 'scheduled').length;
  const failedCount = notifications.filter((n) => n.deliveryStatus === 'failed').length;

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'medication':
        return <Pill className="w-4 h-4 text-purple-700" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-700" />;
      case 'care_circle':
        return <Users className="w-4 h-4 text-emerald-700" />;
      case 'instructions':
        return <FileText className="w-4 h-4 text-amber-700" />;
      case 'care_gap':
        return <AlertTriangle className="w-4 h-4 text-teal-700" />;
      case 'account_security':
        return <Shield className="w-4 h-4 text-slate-700" />;
    }
  };

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
            Delivered
          </Badge>
        );
      case 'sent_to_provider':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] font-semibold">
            Sent to Provider
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-semibold">
            Scheduled
          </Badge>
        );
      case 'suppressed':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-[10px] font-semibold">
            Suppressed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] font-semibold">
            Delivery Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Notifications', href: '/notifications' }, { label: 'Overview' }]}
      pageTitle="Proactive Notification Centre"
      pageDescription="State-machine delivery tracking, non-sensitive previews, quiet hours suppression, and explicit responsibility acknowledgements."
    >
      <PageContainer>
        <NotificationsNavTabs />

        {/* Quiet Hours Banner */}
        {preferences.quietHoursEnabled && inQuiet && (
          <div className="mb-6 p-4 bg-slate-900 text-white rounded-xl flex items-start sm:items-center gap-3 shadow-sm border border-slate-800">
            <Moon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 text-xs">
              <span className="font-bold text-amber-400">Quiet Hours Active ({preferences.quietHoursStart} - {preferences.quietHoursEnd} {preferences.timezone})</span>
              <p className="text-slate-300 mt-0.5">
                External email/SMS dispatch is currently suppressed to protect rest. Notifications continue to post live to your In-App Centre without disruption.
              </p>
            </div>
            <Link
              href="/notifications/preferences"
              className="text-xs font-semibold underline text-amber-300 hover:text-white shrink-0 min-h-[44px] flex items-center"
            >
              Configure
            </Link>
          </div>
        )}

        {/* Scan Message */}
        {scanMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Unread Alerts</span>
              <Bell className="w-4 h-4 text-teal-700" />
            </div>
            <div className="text-2xl font-bold text-[var(--main-text)] mt-1">{unreadCount}</div>
            <span className="text-[11px] text-teal-700 font-medium">In-app notifications</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Acks Required</span>
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-bold text-[var(--main-text)] mt-1">{pendingAckCount}</div>
            <span className="text-[11px] text-amber-700 font-medium">Explicit sign-off pending</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Scheduled Reminders</span>
              <Clock className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-[var(--main-text)] mt-1">{scheduledCount}</div>
            <span className="text-[11px] text-blue-700 font-medium">Proactive clinical alerts</span>
          </Card>

          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--secondary-text)] font-medium">Failed Attempts</span>
              <AlertTriangle className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-2xl font-bold text-[var(--main-text)] mt-1">{failedCount}</div>
            <span className="text-[11px] text-rose-700 font-medium">Carrier/provider timeouts</span>
          </Card>
        </div>

        {/* Search, Filter Bar & Quick Actions */}
        <Card className="p-4 border-slate-200 mb-6 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-lg"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all min-h-[32px] ${
                    statusFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({notifications.filter((n) => n.readStatus !== 'archived').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('unread')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all min-h-[32px] ${
                    statusFilter === 'unread' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ack_pending')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all min-h-[32px] ${
                    statusFilter === 'ack_pending' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Needs Ack ({pendingAckCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('archived')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all min-h-[32px] ${
                    statusFilter === 'archived' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Archived
                </button>
              </div>

              {/* Category Select */}
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 text-xs rounded-lg min-w-[140px]"
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'medication', label: 'Medication' },
                  { value: 'appointment', label: 'Appointments' },
                  { value: 'care_circle', label: 'Care Circle' },
                  { value: 'instructions', label: 'Instructions' },
                  { value: 'care_gap', label: 'Care Gaps' },
                  { value: 'account_security', label: 'Security' },
                ]}
              />

              {/* Channel Select */}
              <Select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-10 text-xs rounded-lg min-w-[120px]"
                options={[
                  { value: 'all', label: 'All Channels' },
                  { value: 'in_app', label: 'In-App' },
                  { value: 'email', label: 'Email' },
                  { value: 'sms', label: 'SMS' },
                  { value: 'push', label: 'Push' },
                ]}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="h-10 text-xs rounded-lg min-h-[44px]"
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Mark all read
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunScan}
                disabled={isScanning}
                className="h-10 text-xs bg-teal-700 hover:bg-teal-800 text-white rounded-lg min-h-[44px]"
              >
                <Sparkles className={`w-4 h-4 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Reminders'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Notifications Feed */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[var(--main-text)]">No notifications match your filters</h3>
              <p className="text-xs text-[var(--secondary-text)] max-w-md mx-auto mt-1">
                All care reminders, appointments, and care circle updates for this view are up to date.
              </p>
              {(categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 text-xs min-h-[44px]"
                >
                  Reset Filters
                </Button>
              )}
            </Card>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  notif.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-teal-50/40 border-teal-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5 border border-slate-200">
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/notifications/${notif.id}`}
                          className="font-bold text-sm text-[var(--main-text)] hover:text-teal-700 transition-colors"
                        >
                          {notif.title}
                        </Link>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" aria-label="Unread" />
                        )}
                        {getDeliveryStatusBadge(notif.deliveryStatus)}
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                          {notif.deliveryChannel}
                        </Badge>
                        {notif.requiresAcknowledgement && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              notif.acknowledgementStatus === 'acknowledged'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                            }`}
                          >
                            {notif.acknowledgementStatus === 'acknowledged'
                              ? 'Acknowledged'
                              : 'Sign-off Required'}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-[var(--secondary-text)] line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>

                      {notif.suppressionReason && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-md border border-amber-200">
                          {notif.suppressionReason}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--secondary-text)]">
                        <span>Recipient: <strong className="text-[var(--main-text)]">{notif.recipientName}</strong></span>
                        <span>•</span>
                        <span>{new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {notif.actionUrl && (
                          <>
                            <span>•</span>
                            <Link
                              href={notif.actionUrl}
                              className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
                            >
                              <span>View Source Record</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                    {notif.requiresAcknowledgement && notif.acknowledgementStatus === 'pending' && (
                      <Link href={`/notifications/${notif.id}`}>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold min-h-[44px]"
                        >
                          Sign-off
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notif.id, !notif.isRead)}
                      title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                      className="h-8 text-xs text-slate-600 hover:text-slate-900 min-h-[44px]"
                    >
                      {notif.isRead ? 'Unread' : 'Read'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(notif.id)}
                      title="Archive notification"
                      className="h-8 text-xs text-slate-500 hover:text-slate-800 min-h-[44px]"
                    >
                      <Archive className="w-3.5 h-3.5" />
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
