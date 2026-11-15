'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Pill, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Plus 
} from 'lucide-react';
import { getCachedMedications } from '@/lib/data/medication-lifecycle-data';

export function MedicationsNavTabs() {
  const pathname = usePathname();
  const allMeds = getCachedMedications();
  const pendingCount = allMeds.filter(
    (m) => m.verificationStatus === 'awaiting_review' || m.verificationStatus === 'needs_clarification'
  ).length;

  const TABS = [
    { href: '/medications', label: 'Overview', icon: Pill },
    { href: '/medications/schedule', label: 'Schedule', icon: Calendar },
    { href: '/medications/adherence', label: 'Adherence', icon: CheckCircle2 },
    { 
      href: '/medications/review', 
      label: 'Review Needed', 
      icon: AlertCircle, 
      badge: pendingCount > 0 ? `${pendingCount}` : undefined 
    },
    { href: '/medications/history', label: 'History & Audits', icon: History },
  ];

  return (
    <div className="w-full border-b border-subtleBorder bg-white mb-6">
      <div className="flex items-center justify-between overflow-x-auto py-2 px-1 focus:outline-none">
        <nav 
          className="flex space-x-1 sm:space-x-2" 
          aria-label="Medication Sections"
        >
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap touch-target-min ${
                  isActive
                    ? 'bg-mint text-primary font-bold shadow-sm border border-mint-border'
                    : 'text-secondaryText hover:text-main hover:bg-canvas-subtle'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-secondaryText'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-clinical-warning text-white">
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/medications/add"
          className="shrink-0 ml-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-colors touch-target-min"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Prescription</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>
    </div>
  );
}
