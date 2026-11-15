'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  GitCompare,
  Network,
  ClipboardCheck,
  History,
  AlertTriangle,
} from 'lucide-react';
import {
  getCachedContinuityReviews,
  getCachedAnalyses,
} from '@/lib/data/care-continuity-data';

export function ContinuityNavTabs() {
  const pathname = usePathname();
  const [pendingReviewCount, setPendingReviewCount] = React.useState(0);
  const [unresolvedChangesCount, setUnresolvedChangesCount] = React.useState(0);

  React.useEffect(() => {
    const reviews = getCachedContinuityReviews();
    const pending = reviews.filter(
      (r) => r.reviewStatus === 'awaiting_human_review' || r.reviewStatus === 'needs_clarification'
    ).length;
    setPendingReviewCount(pending);

    const analyses = getCachedAnalyses();
    const unresolved = analyses.filter(
      (a) => a.status === 'awaiting_human_review' || a.status === 'needs_clarification'
    ).length;
    setUnresolvedChangesCount(unresolved);
  }, [pathname]);

  const tabs = [
    {
      label: 'Continuity Overview',
      href: '/continuity',
      icon: Activity,
      isActive: pathname === '/continuity',
    },
    {
      label: 'Detected Changes',
      href: '/continuity/changes',
      icon: GitCompare,
      isActive: pathname.startsWith('/continuity/changes'),
      badge: unresolvedChangesCount > 0 ? unresolvedChangesCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    },
    {
      label: 'Impact Matrix',
      href: '/continuity/impact',
      icon: Network,
      isActive: pathname === '/continuity/impact',
    },
    {
      label: 'Review Queue',
      href: '/continuity/reviews',
      icon: ClipboardCheck,
      isActive: pathname.startsWith('/continuity/reviews'),
      badge: pendingReviewCount > 0 ? `${pendingReviewCount} pending` : undefined,
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
    },
    {
      label: 'Audit History',
      href: '/continuity/history',
      icon: History,
      isActive: pathname === '/continuity/history',
    },
  ];

  return (
    <nav
      aria-label="Care Continuity Navigation"
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
