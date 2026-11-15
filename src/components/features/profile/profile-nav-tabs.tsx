'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  Edit3, 
  PhoneCall, 
  Sliders, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';

const PROFILE_TABS = [
  { href: '/profile', label: 'Overview', icon: User },
  { href: '/profile/edit', label: 'Edit Identity', icon: Edit3 },
  { href: '/profile/emergency-contacts', label: 'Emergency Contacts', icon: PhoneCall },
  { href: '/profile/preferences', label: 'Preferences', icon: Sliders },
  { href: '/profile/health-summary', label: 'Health Summary', icon: FileText },
  { href: '/profile/access', label: 'Access & Sharing', icon: ShieldCheck },
];

export function ProfileNavTabs() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-subtleBorder bg-white mb-6">
      <nav 
        className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 px-1 focus:outline-none" 
        aria-label="Patient Profile Sections"
      >
        {PROFILE_TABS.map((tab) => {
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
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
