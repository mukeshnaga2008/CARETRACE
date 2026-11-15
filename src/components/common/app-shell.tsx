'use client';

import * as React from 'react';
import { TopHeader } from './top-header';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { AIAssistant } from './ai-assistant';
import { Breadcrumb, BreadcrumbItem } from './breadcrumb';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';

export interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  pageTitle?: string;
  pageDescription?: string;
  action?: React.ReactNode;
  activeRole?: AppRole;
  onSelectRole?: (role: AppRole) => void;
}

export function AppShell({
  children,
  breadcrumbs,
  pageTitle,
  pageDescription,
  action,
  activeRole: propActiveRole,
  onSelectRole: propOnSelectRole,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [internalActiveRole, setInternalActiveRole] = React.useState<AppRole>('patient');
  const activeRole = propActiveRole ?? internalActiveRole;
  const setActiveRole = propOnSelectRole ?? setInternalActiveRole;

  React.useEffect(() => {
    const handleCustomOpen = () => setMobileNavOpen(true);
    window.addEventListener('caretrace_open_mobile_nav', handleCustomOpen);
    return () => window.removeEventListener('caretrace_open_mobile_nav', handleCustomOpen);
  }, []);

  const activePerspective = USER_PERSPECTIVES[activeRole];

  return (
    <div className="min-h-screen bg-canvas-background text-main flex flex-col font-sans">
      {/* Top Header with Role Switcher & Accessibility */}
      <TopHeader
        onToggleMobileNav={() => setMobileNavOpen(true)}
        activeRole={activeRole}
        onSelectRole={(r) => setActiveRole(r)}
      />

      {/* Main Layout Grid */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Left Sidebar (Grouped: CARE, COORDINATION, RECORDS, ACCOUNT) */}
        <div className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <Sidebar />
        </div>

        {/* Mobile Navigation Drawer & Bottom Bar */}
        <MobileNav
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 text-left"
        >
          {/* Demonstration Watermark Banner */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-mint/70 border border-mint-border text-xs text-primary">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
              <span>
                <strong>Demonstration Preview Mode:</strong> Viewing through the perspective of{' '}
                <span className="font-bold underline">{activePerspective.label}</span> ({activePerspective.sampleName}).
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-secondary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Synthetic Non-Diagnostic Sample Data</span>
            </div>
          </div>

          {/* Page Heading & Breadcrumb Context */}
          {(breadcrumbs || pageTitle) && (
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-subtleBorder">
              <div>
                {breadcrumbs && <Breadcrumb items={breadcrumbs} className="mb-2" />}
                {pageTitle && (
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-main">
                    {pageTitle}
                  </h1>
                )}
                {pageDescription && (
                  <p className="text-sm sm:text-base text-secondaryText mt-1 leading-relaxed max-w-3xl">
                    {pageDescription}
                  </p>
                )}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
          )}

          {/* Page Body Content */}
          {children}
        </main>
      </div>

      {/* Reusable Footer */}
      <footer className="border-t border-subtleBorder bg-white py-6 text-center text-xs text-secondaryText mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            CARETRACE — The Intelligent Healthcare Continuity Network &copy; 2026.
          </p>
          <p className="text-mutedText">
            PromptWars × Catalyst 2026. Fictional synthetic healthcare records for development and testing.
          </p>
        </div>
      </footer>

      {/* Floating Mini CARETRACE AI Navigation Assistant */}
      <AIAssistant />
    </div>
  );
}
