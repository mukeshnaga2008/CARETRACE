'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  Archive, 
  FolderGit2,
  FileSearch,
  ShieldAlert
} from 'lucide-react';
import { getCachedInstructions, getCachedInstructionSources } from '@/lib/data/instruction-vault-data';

export function InstructionsNavTabs() {
  const pathname = usePathname();
  const [awaitingReviewCount, setAwaitingReviewCount] = React.useState(0);
  const [missingSourceCount, setMissingSourceCount] = React.useState(0);

  React.useEffect(() => {
    const instructions = getCachedInstructions();
    const awaiting = instructions.filter((i) => i.verificationStatus === 'awaiting_verification').length;
    setAwaitingReviewCount(awaiting);

    const sources = getCachedInstructionSources();
    const missing = sources.filter((s) => s.isMissingSourceDetails).length;
    setMissingSourceCount(missing);
  }, [pathname]);

  const tabs = [
    {
      label: 'Instruction Vault',
      href: '/instructions',
      icon: FileText,
      isActive: pathname === '/instructions',
    },
    {
      label: 'Add Instruction',
      href: '/instructions/add',
      icon: Plus,
      isActive: pathname === '/instructions/add',
    },
    {
      label: 'Review Queue',
      href: '/instructions/review',
      icon: Clock,
      isActive: pathname === '/instructions/review',
      badge: awaitingReviewCount > 0 ? awaitingReviewCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      label: 'Provenance Sources',
      href: '/instructions/sources',
      icon: FolderGit2,
      isActive: pathname === '/instructions/sources',
      badge: missingSourceCount > 0 ? `${missingSourceCount} unverified` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      label: 'Archived & Superseded',
      href: '/instructions/archived',
      icon: Archive,
      isActive: pathname === '/instructions/archived',
    },
  ];

  return (
    <nav 
      aria-label="Care Instructions Navigation" 
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
