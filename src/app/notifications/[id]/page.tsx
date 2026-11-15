'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ArrowLeft,
  ExternalLink,
  Archive,
  RotateCw,
  Send,
  UserCheck,
  Building,
  Layers,
} from 'lucide-react';
import {
  getNotificationById,
  getDeliveryAttemptsForNotification,
  markNotificationRead,
  archiveNotification,
  acknowledgeNotification,
  retryFailedNotification,
} from '@/lib/data/notification-data';
import { CareTraceNotification, NotificationDeliveryAttempt } from '@/types/caretrace';

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [notification, setNotification] = React.useState<CareTraceNotification | null>(null);
  const [deliveryAttempts, setDeliveryAttempts] = React.useState<NotificationDeliveryAttempt[]>([]);
  const [ackNote, setAckNote] = React.useState('');
  const [isSubmittingAck, setIsSubmittingAck] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);

  const loadData = React.useCallback(() => {
    if (!id) return;
    const notif = getNotificationById(id);
    if (notif) {
      setNotification({ ...notif });
      setDeliveryAttempts(getDeliveryAttemptsForNotification(id));
      if (!notif.isRead) {
        markNotificationRead(id, true);
      }
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (!notification) {
    return (
      <AppShell
        breadcrumbs={[{ label: 'Notifications', href: '/notifications' }, { label: 'Details' }]}
        pageTitle="Notification Details"
      >
        <PageContainer>
          <Card className="p-8 text-center border-slate-200">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-[var(--main-text)]">Notification Not Found</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              The requested notification record could not be found or has been removed.
            </p>
            <Link href="/notifications">
              <Button size="sm" variant="outline" className="mt-4 text-xs min-h-[44px]">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Return to Notification Feed
              </Button>
            </Link>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  const handleAcknowledge = () => {
    setIsSubmittingAck(true);
    setActionMessage(null);
    setTimeout(() => {
      const res = acknowledgeNotification(
        notification.id,
        notification.recipientId,
        notification.recipientName,
        notification.recipientRole || 'Care Circle Member',
        ackNote.trim() || undefined
      );

      if (res.success && res.notification) {
        setNotification(res.notification);
        setActionMessage({ text: 'Care coordination responsibility successfully acknowledged and signed off.' });
      } else {
        setActionMessage({ text: res.error || 'Failed to acknowledge.', isError: true });
      }
      setIsSubmittingAck(false);
    }, 400);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setActionMessage(null);
    const res = await retryFailedNotification(notification.id);
    if (res.success && res.notification) {
      setNotification(res.notification);
      setDeliveryAttempts(getDeliveryAttemptsForNotification(notification.id));
      setActionMessage({ text: 'Delivery re-attempted and submitted to transport broker.' });
    } else {
      setActionMessage({ text: res.error || 'Retry attempt failed.', isError: true });
    }
    setIsRetrying(false);
  };

  const handleArchive = () => {
    archiveNotification(notification.id);
    router.push('/notifications');
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Notifications', href: '/notifications' }, { label: notification.title }]}
      pageTitle={notification.title}
      pageDescription={`Notification record for ${notification.recipientName} (${notification.category} category).`}
    >
      <PageContainer>
        {/* Back navigation & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link href="/notifications">
            <Button variant="outline" size="sm" className="text-xs min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Notifications
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {notification.deliveryStatus === 'failed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 min-h-[44px]"
              >
                <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry Delivery'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              className="text-xs text-slate-600 hover:text-slate-900 min-h-[44px]"
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Archive
            </Button>
          </div>
        </div>

        {/* Action message */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-2 ${
              actionMessage.isError
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            {actionMessage.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Notification Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                      {notification.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {notification.deliveryChannel}
                    </Badge>
                  </div>
                  <span className="text-xs text-[var(--secondary-text)]">
                    {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-[var(--main-text)] mt-2">
                  {notification.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-semibold text-slate-700 block mb-1">Non-Sensitive Preview (Lock-Screen / Push):</span>
                  <p className="text-slate-600">{notification.previewText}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Full Content</h4>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm leading-relaxed text-[var(--main-text)]">
                    {notification.body}
                  </div>
                </div>

                {notification.suppressionReason && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <strong className="block mb-0.5">Delivery Suppression Notice:</strong>
                    {notification.suppressionReason}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Explicit Acknowledgement Card */}
            {notification.requiresAcknowledgement && (
              <Card className="border-amber-200 bg-amber-50/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-700" />
                      Explicit Responsibility Sign-off
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        notification.acknowledgementStatus === 'acknowledged'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-950 border-amber-300'
                      }`}
                    >
                      {notification.acknowledgementStatus === 'acknowledged' ? 'Acknowledged' : 'Pending Sign-off'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notification.acknowledgementStatus === 'acknowledged' ? (
                    <div className="p-3 bg-white border border-emerald-200 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-900 font-semibold">
                        <span>Acknowledged by {notification.acknowledgedByName}</span>
                        <span>{notification.acknowledgedAt ? new Date(notification.acknowledgedAt).toLocaleString() : ''}</span>
                      </div>
                      {notification.acknowledgementNote && (
                        <p className="text-slate-600 pt-1 border-t border-slate-100">
                          Note: &ldquo;{notification.acknowledgementNote}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        This clinical coordination item requires bilateral sign-off to ensure care continuity. Opening or reading this alert does not constitute acknowledgement.
                      </p>
                      <Textarea
                        placeholder="Optional sign-off notes (e.g. 'Confirmed medication administered and vitals checked')..."
                        value={ackNote}
                        onChange={(e) => setAckNote(e.target.value)}
                        className="text-xs min-h-[70px] bg-white"
                      />
                      <Button
                        onClick={handleAcknowledge}
                        disabled={isSubmittingAck}
                        className="text-xs bg-amber-700 hover:bg-amber-800 text-white font-semibold min-h-[44px]"
                      >
                        <UserCheck className="w-4 h-4 mr-1.5" />
                        {isSubmittingAck ? 'Recording Sign-off...' : 'Sign-off & Acknowledge Responsibility'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delivery Attempts Ledger */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[var(--main-text)] flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-700" />
                  Delivery Attempts & Carrier Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {deliveryAttempts.length === 0 ? (
                  <p className="text-xs text-[var(--secondary-text)]">No external delivery attempts recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {deliveryAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              Attempt #{attempt.attemptNumber} via {attempt.channel.toUpperCase()}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                attempt.status === 'failed'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {attempt.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Provider: {attempt.providerName}
                            {attempt.providerResponseCode && ` (HTTP ${attempt.providerResponseCode})`}
                          </div>
                          {attempt.errorMessage && (
                            <div className="text-[11px] text-rose-700 font-mono mt-1">
                              Error: {attempt.errorMessage}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0">
                          {new Date(attempt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Metadata Column */}
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[var(--main-text)]">
                  Delivery Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[var(--secondary-text)] block">Recipient</span>
                  <span className="font-semibold text-[var(--main-text)]">
                    {notification.recipientName} ({notification.recipientRole || 'Care Circle Member'})
                  </span>
                </div>

                <div>
                  <span className="text-[var(--secondary-text)] block">Delivery Status</span>
                  <span className="font-semibold text-[var(--main-text)]">
                    {notification.deliveryStatus} (Attempts: {notification.deliveryAttemptCount})
                  </span>
                </div>

                <div>
                  <span className="text-[var(--secondary-text)] block">Delivery Channel</span>
                  <span className="font-semibold text-[var(--main-text)] uppercase font-mono">
                    {notification.deliveryChannel}
                  </span>
                </div>

                {notification.scheduledFor && (
                  <div>
                    <span className="text-[var(--secondary-text)] block">Scheduled Timestamp</span>
                    <span className="font-semibold text-[var(--main-text)]">
                      {new Date(notification.scheduledFor).toLocaleString()}
                    </span>
                  </div>
                )}

                {notification.providerReference && (
                  <div>
                    <span className="text-[var(--secondary-text)] block">Provider Reference</span>
                    <span className="font-mono text-[11px] text-slate-700 break-all">
                      {notification.providerReference}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[var(--secondary-text)] block">Idempotency Key</span>
                  <span className="font-mono text-[11px] text-slate-500 break-all">
                    {notification.idempotencyKey}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Related Record Deep Link */}
            {notification.actionUrl && (
              <Card className="border-teal-200 bg-teal-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-700" />
                    Source Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-slate-600">
                    This notification connects directly to an underlying clinical record in the {notification.relatedRecordType || 'clinical'} module.
                  </p>
                  <Link href={notification.actionUrl} className="block mt-2">
                    <Button size="sm" className="w-full text-xs bg-teal-700 hover:bg-teal-800 text-white min-h-[44px]">
                      <span>Open Related Record</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
