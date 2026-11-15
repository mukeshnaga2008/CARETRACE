'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  CalendarDays, 
  Clock, 
  ClipboardList, 
  CheckSquare, 
  History, 
  PlusCircle 
} from 'lucide-react';
import { 
  getCachedPreparationItems, 
  getCachedFollowUpTasks 
} from '@/lib/data/appointment-intelligence-data';

export function AppointmentsNavTabs() {
  const pathname = usePathname();
  const [unaddressedCount, setUnaddressedCount] = React.useState(0);
  const [pendingTasksCount, setPendingTasksCount] = React.useState(0);

  React.useEffect(() => {
    const unaddressed = getCachedPreparationItems().filter((i) => !i.isAddressed).length;
    setUnaddressedCount(unaddressed);

    const pendingTasks = getCachedFollowUpTasks().filter((t) => t.taskStatus !== 'completed' && t.taskStatus !== 'cancelled').length;
    setPendingTasksCount(pendingTasks);
  }, [pathname]);

  const tabs = [
    {
      label: 'Overview',
      href: '/appointments',
      icon: Calendar,
      isActive: pathname === '/appointments',
    },
    {
      label: 'Calendar',
      href: '/appointments/calendar',
      icon: CalendarDays,
      isActive: pathname === '/appointments/calendar',
    },
    {
      label: 'Upcoming Visits',
      href: '/appointments/upcoming',
      icon: Clock,
      isActive: pathname === '/appointments/upcoming',
    },
    {
      label: 'Visit Preparation',
      href: '/appointments/preparation',
      icon: ClipboardList,
      isActive: pathname === '/appointments/preparation',
      badge: unaddressedCount > 0 ? unaddressedCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      label: 'Follow-up Tasks',
      href: '/appointments/follow-ups',
      icon: CheckSquare,
      isActive: pathname === '/appointments/follow-ups',
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      label: 'Visit History',
      href: '/appointments/history',
      icon: History,
      isActive: pathname === '/appointments/history',
    },
    {
      label: 'Schedule Visit',
      href: '/appointments/add',
      icon: PlusCircle,
      isActive: pathname === '/appointments/add',
    },
  ];

  return (
    <nav 
      aria-label="Appointment Management Navigation" 
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
