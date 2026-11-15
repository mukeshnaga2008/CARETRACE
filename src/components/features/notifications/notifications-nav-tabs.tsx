'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Clock,
  AlertTriangle,
  History,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { getCachedNotifications } from '@/lib/data/notification-data';

export function NotificationsNavTabs() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [pendingAckCount, setPendingAckCount] = React.useState(0);
  const [failedCount, setFailedCount] = React.useState(0);
  const [scheduledCount, setScheduledCount] = React.useState(0);

  React.useEffect(() => {
    const all = getCachedNotifications();
    const unread = all.filter((n) => !n.isRead && n.readStatus !== 'archived').length;
    const acks = all.filter((n) => n.requiresAcknowledgement && n.acknowledgementStatus === 'pending').length;
    const failed = all.filter((n) => n.deliveryStatus === 'failed').length;
    const scheduled = all.filter((n) => n.deliveryStatus === 'scheduled').length;

    setUnreadCount(unread);
    setPendingAckCount(acks);
    setFailedCount(failed);
    setScheduledCount(scheduled);
  }, [pathname]);

  const tabs = [
    {
      label: 'Notification Feed',
      href: '/notifications',
      icon: Bell,
      isActive: pathname === '/notifications',
      badge: unreadCount > 0 ? `${unreadCount} new` : undefined,
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-200',
    },
    {
      label: 'Scheduled Reminders',
      href: '/notifications/scheduled',
      icon: Clock,
      isActive: pathname === '/notifications/scheduled',
      badge: scheduledCount > 0 ? scheduledCount : undefined,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    },
    {
      label: 'Failed Deliveries',
      href: '/notifications/failed',
      icon: AlertTriangle,
      isActive: pathname === '/notifications/failed',
      badge: failedCount > 0 ? failedCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-200',
    },
    {
      label: 'Delivery History',
      href: '/notifications/history',
      icon: History,
      isActive: pathname === '/notifications/history',
    },
    {
      label: 'Preferences & Quiet Hours',
      href: '/notifications/preferences',
      icon: Sliders,
      isActive: pathname === '/notifications/preferences',
    },
  ];

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl mb-6 shadow-xs overflow-x-auto"
      aria-label="Notification Centre Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 min-h-[44px] ${
              tab.isActive
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${
                  tab.isActive
                    ? 'bg-white/20 text-white border-white/30'
                    : tab.badgeColor
                }`}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
