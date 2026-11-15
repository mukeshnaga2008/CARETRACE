'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Pill, 
  Calendar, 
  Users, 
  MoreHorizontal,
  X
} from 'lucide-react';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils/cn';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  const primaryMobileTabs = [
    { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/medications', label: 'Meds', icon: <Pill className="h-5 w-5" /> },
    { href: '/appointments', label: 'Visits', icon: <Calendar className="h-5 w-5" /> },
    { href: '/care-circle', label: 'Circle', icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Sliding Mobile Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#123C43]/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-modal z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-subtleBorder flex items-center justify-between">
              <span className="font-bold text-base text-primary">Care Navigation</span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-secondaryText hover:text-main"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={onClose} />
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation Bar on Mobile / Tablet */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-subtleBorder bg-white/95 backdrop-blur-md px-2 py-1 shadow-elevated"
      >
        <div className="flex items-center justify-around">
          {primaryMobileTabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href === '/overview' && pathname === '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors touch-target-min min-w-[60px]",
                  isActive
                    ? "text-primary font-bold"
                    : "text-secondaryText hover:text-primary"
                )}
              >
                <div className={cn("p-1 rounded-lg", isActive && "bg-mint text-primary")}>
                  {tab.icon}
                </div>
                <span className="text-[11px] mt-0.5">{tab.label}</span>
              </Link>
            );
          })}

          {/* More trigger */}
          <button
            type="button"
            onClick={() => {
              const event = new CustomEvent('caretrace_open_mobile_nav');
              window.dispatchEvent(event);
            }}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-xs font-semibold text-secondaryText hover:text-primary touch-target-min min-w-[60px]"
            aria-label="Open complete navigation drawer"
          >
            <div className="p-1 rounded-lg">
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-[11px] mt-0.5">All</span>
          </button>
        </div>
      </nav>
    </>
  );
}
