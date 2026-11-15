'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Pill,
  Calendar,
  CheckSquare,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export function AnalyticsNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Operational Overview',
      href: '/analytics',
      icon: BarChart3,
      isActive: pathname === '/analytics',
    },
    {
      label: 'Medications',
      href: '/analytics/medications',
      icon: Pill,
      isActive: pathname === '/analytics/medications',
    },
    {
      label: 'Appointments',
      href: '/analytics/appointments',
      icon: Calendar,
      isActive: pathname === '/analytics/appointments',
    },
    {
      label: 'Responsibilities',
      href: '/analytics/responsibilities',
      icon: CheckSquare,
      isActive: pathname === '/analytics/responsibilities',
    },
    {
      label: 'Continuity Engine',
      href: '/analytics/continuity',
      icon: Layers,
      isActive: pathname === '/analytics/continuity',
    },
    {
      label: 'Care Gaps',
      href: '/analytics/care-gaps',
      icon: AlertTriangle,
      isActive: pathname === '/analytics/care-gaps',
    },
  ];

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl mb-6 shadow-xs overflow-x-auto"
      aria-label="Care Analytics Navigation"
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
