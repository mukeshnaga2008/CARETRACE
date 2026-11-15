'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Eye,
  Sliders,
  History,
} from 'lucide-react';

export function PassportNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Passport Overview',
      href: '/care-passport',
      icon: FileText,
      isActive: pathname === '/care-passport',
    },
    {
      label: 'Document Preview',
      href: '/care-passport/preview',
      icon: Eye,
      isActive: pathname === '/care-passport/preview',
    },
    {
      label: 'Included Sections',
      href: '/care-passport/settings',
      icon: Sliders,
      isActive: pathname === '/care-passport/settings',
    },
    {
      label: 'Export History',
      href: '/care-passport/history',
      icon: History,
      isActive: pathname === '/care-passport/history',
    },
  ];

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl mb-6 shadow-xs overflow-x-auto"
      aria-label="Care Passport Navigation"
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
          </Link>
        );
      })}
    </nav>
  );
}
