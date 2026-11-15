'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  History,
  Pill,
  Calendar,
  FileText,
  Layers,
  Users,
  CheckSquare,
} from 'lucide-react';

export function TimelineNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Unified Timeline',
      href: '/timeline',
      icon: History,
      isActive: pathname === '/timeline',
    },
    {
      label: 'Medications',
      href: '/timeline/medications',
      icon: Pill,
      isActive: pathname === '/timeline/medications',
    },
    {
      label: 'Appointments',
      href: '/timeline/appointments',
      icon: Calendar,
      isActive: pathname === '/timeline/appointments',
    },
    {
      label: 'Instructions',
      href: '/timeline/instructions',
      icon: FileText,
      isActive: pathname === '/timeline/instructions',
    },
    {
      label: 'Continuity Reviews',
      href: '/timeline/continuity',
      icon: Layers,
      isActive: pathname === '/timeline/continuity',
    },
    {
      label: 'Care Circle',
      href: '/timeline/care-circle',
      icon: Users,
      isActive: pathname === '/timeline/care-circle',
    },
    {
      label: 'Tasks',
      href: '/timeline/tasks',
      icon: CheckSquare,
      isActive: pathname === '/timeline/tasks',
    },
  ];

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl mb-6 shadow-xs overflow-x-auto"
      aria-label="Care Timeline Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 min-h-[44px] ${
              tab.isActive
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
