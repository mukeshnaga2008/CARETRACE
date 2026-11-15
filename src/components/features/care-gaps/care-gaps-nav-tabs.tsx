'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Pill,
  CheckSquare,
  Calendar,
  ClipboardCheck,
  History,
  AlertTriangle,
} from 'lucide-react';
import { getCachedCareGaps } from '@/lib/data/care-gap-intelligence-data';

export function CareGapsNavTabs() {
  const pathname = usePathname();
  const [highPriorityCount, setHighPriorityCount] = React.useState(0);
  const [openGapsCount, setOpenGapsCount] = React.useState(0);

  React.useEffect(() => {
    const gaps = getCachedCareGaps();
    const active = gaps.filter((g) => g.status !== 'resolved' && g.status !== 'dismissed');
    setOpenGapsCount(active.length);

    const high = active.filter((g) => g.priority === 'high_priority');
    setHighPriorityCount(high.length);
  }, [pathname]);

  const tabs = [
    {
      label: 'Radar Overview',
      href: '/care-gaps',
      icon: ShieldAlert,
      isActive: pathname === '/care-gaps',
      badge: openGapsCount > 0 ? openGapsCount : undefined,
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-200',
    },
    {
      label: 'Medication Gaps',
      href: '/care-gaps/medications',
      icon: Pill,
      isActive: pathname === '/care-gaps/medications',
    },
    {
      label: 'Task & Responsibility Gaps',
      href: '/care-gaps/tasks',
      icon: CheckSquare,
      isActive: pathname === '/care-gaps/tasks',
    },
    {
      label: 'Appointment Gaps',
      href: '/care-gaps/appointments',
      icon: Calendar,
      isActive: pathname === '/care-gaps/appointments',
    },
    {
      label: 'Review Gaps',
      href: '/care-gaps/reviews',
      icon: ClipboardCheck,
      isActive: pathname === '/care-gaps/reviews',
    },
    {
      label: 'Resolved History',
      href: '/care-gaps/history',
      icon: History,
      isActive: pathname === '/care-gaps/history',
    },
  ];

  return (
    <nav
      aria-label="Care Gap Intelligence Navigation"
      className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-[var(--subtle-border)] scrollbar-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] ${
              active
                ? 'bg-[var(--primary-teal)] text-white shadow-sm'
                : 'text-[var(--secondary-text)] hover:text-[var(--main-text)] hover:bg-[var(--soft-mint)]/60'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[var(--secondary-text)]'}`} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  active ? 'bg-white/20 text-white border-white/30' : tab.badgeColor
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
