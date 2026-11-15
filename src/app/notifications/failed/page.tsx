'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { NotificationsNavTabs } from '@/components/features/notifications/notifications-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Inbox,
  Send,
} from 'lucide-react';
import {
  getCachedNotifications,
  retryFailedNotification,
} from '@/lib/data/notification-data';
import { CareTraceNotification } from '@/types/caretrace';

export default function FailedDeliveriesPage() {
  const [failedList, setFailedList] = React.useState<CareTraceNotification[]>([]);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);

  const refreshList = React.useCallback(() => {
    const list = getCachedNotifications({ status: 'failed' });
    setFailedList(list);
  }, []);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setActionMessage(null);
    const res = await retryFailedNotification(id);
    if (res.success) {
      refreshList();
      setActionMessage('Delivery attempt re-queued and sent to transport broker.');
    } else {
      setActionMessage(`Retry failed: ${res.error || 'Unknown error'}`);
    }
    setRetryingId(null);
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Notifications', href: '/notifications' }, { label: 'Failed Deliveries' }]}
      pageTitle="Failed Delivery Attempts"
      pageDescription="External transport audit console tracking carrier network timeouts, gateway errors, and delivery reconciliation."
    >
      <PageContainer>
        <NotificationsNavTabs />

        {actionMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Security & Audit Notice */}
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-950">
            <span className="font-bold block mb-0.5">Authorized Coordinator Console</span>
            <p className="leading-relaxed">
              External delivery failures are recorded safely with carrier error codes. In-app notification copies remain active for all recipients regardless of external SMS or email transport failures.
            </p>
          </div>
        </div>

        {/* Failed items list */}
        <div className="space-y-4">
          {failedList.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[var(--main-text)]">All notification transports healthy</h3>
              <p className="text-xs text-[var(--secondary-text)] max-w-md mx-auto mt-1">
                Zero failed external deliveries. In-app, email, and SMS channels are delivering normally.
              </p>
            </Card>
          ) : (
            failedList.map((notif) => (
              <Card key={notif.id} className="border-rose-200 bg-rose-50/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/notifications/${notif.id}`}
                          className="font-bold text-sm text-[var(--main-text)] hover:text-rose-700"
                        >
                          {notif.title}
                        </Link>
                        <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-900 border-rose-300">
                          Failed
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {notif.deliveryChannel}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {notif.body}
                      </p>

                      {notif.providerResponse?.message && (
                        <div className="p-2.5 bg-rose-100/70 border border-rose-200 rounded-lg text-xs font-mono text-rose-900">
                          {notif.providerResponse.message}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--secondary-text)]">
                        <span>Recipient: <strong className="text-[var(--main-text)]">{notif.recipientName}</strong></span>
                        <span>•</span>
                        <span>Attempts: <strong className="text-rose-800">{notif.deliveryAttemptCount} of 3</strong></span>
                        <span>•</span>
                        <span>Last attempt: {notif.lastDeliveryAttempt ? new Date(notif.lastDeliveryAttempt).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      <Button
                        size="sm"
                        onClick={() => handleRetry(notif.id)}
                        disabled={retryingId === notif.id}
                        className="text-xs bg-rose-700 hover:bg-rose-800 text-white min-h-[44px]"
                      >
                        <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${retryingId === notif.id ? 'animate-spin' : ''}`} />
                        {retryingId === notif.id ? 'Retrying...' : 'Re-attempt Delivery'}
                      </Button>
                      <Link href={`/notifications/${notif.id}`}>
                        <Button variant="outline" size="sm" className="text-xs min-h-[44px]">
                          <span>Inspect</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
