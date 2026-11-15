'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  UserCheck, 
  CheckSquare, 
  ArrowLeftRight, 
  Mail, 
  Activity,
  UserPlus
} from 'lucide-react';
import { 
  getCachedHandovers, 
  getCachedInvitations, 
  getCachedTasks 
} from '@/lib/data/care-circle-data';

export function CareCircleNavTabs() {
  const pathname = usePathname();
  const [unackHandovers, setUnackHandovers] = React.useState(0);
  const [pendingInvites, setPendingInvites] = React.useState(0);
  const [activeTasks, setActiveTasks] = React.useState(0);

  React.useEffect(() => {
    const unack = getCachedHandovers().filter(h => h.handoverStatus === 'ready_for_handover' || h.handoverStatus === 'needs_clarification').length;
    setUnackHandovers(unack);

    const pending = getCachedInvitations().filter(i => i.status === 'pending').length;
    setPendingInvites(pending);

    const tasks = getCachedTasks().filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
    setActiveTasks(tasks);
  }, [pathname]);

  const tabs = [
    {
      label: 'Circle Overview',
      href: '/care-circle',
      icon: Users,
      isActive: pathname === '/care-circle',
    },
    {
      label: 'Members & Roles',
      href: '/care-circle/members',
      icon: UserCheck,
      isActive: pathname === '/care-circle/members',
    },
    {
      label: 'Shared Care Tasks',
      href: '/care-circle/tasks',
      icon: CheckSquare,
      isActive: pathname === '/care-circle/tasks',
      badge: activeTasks > 0 ? activeTasks : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      label: 'Shift Handover',
      href: '/care-circle/handover',
      icon: ArrowLeftRight,
      isActive: pathname === '/care-circle/handover',
      badge: unackHandovers > 0 ? unackHandovers : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      label: 'Invitations',
      href: '/care-circle/invitations',
      icon: Mail,
      isActive: pathname === '/care-circle/invitations',
      badge: pendingInvites > 0 ? pendingInvites : undefined,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      label: 'Collaboration Audit',
      href: '/care-circle/activity',
      icon: Activity,
      isActive: pathname === '/care-circle/activity',
    },
  ];

  return (
    <nav 
      aria-label="Care Circle Navigation" 
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
