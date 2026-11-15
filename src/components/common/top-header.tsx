'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Bell, 
  Menu, 
  UserCircle, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  PhoneCall, 
  Search, 
  Sliders, 
  LogOut, 
  HelpCircle,
  Users,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/components/theme/theme-provider';
import { APP_NAME, APP_TAGLINE, AppRole, USER_PERSPECTIVES } from '@/lib/constants';
import { AccessibilityToolbar } from './accessibility-toolbar';
import { Badge } from '@/components/ui/badge';

export interface TopHeaderProps {
  onToggleMobileNav?: () => void;
  activeRole?: AppRole;
  onSelectRole?: (role: AppRole) => void;
}

export function TopHeader({
  onToggleMobileNav,
  activeRole = 'patient',
  onSelectRole,
}: TopHeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchNotice, setSearchNotice] = React.useState(false);

  const activePerspective = USER_PERSPECTIVES[activeRole];

  const handleSelectPerspective = async (r: AppRole) => {
    onSelectRole?.(r);
    setIsRoleMenuOpen(false);
    // Keep server-side cookie in sync so middleware knows active perspective
    try {
      await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: r }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue redirect
    }
    router.push('/login');
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchNotice(true);
    setTimeout(() => setSearchNotice(false), 4000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-subtleBorder bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Hamburger (mobile) + Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleMobileNav && (
            <button
              type="button"
              onClick={onToggleMobileNav}
              className="lg:hidden p-2 rounded-lg text-secondaryText hover:text-main hover:bg-canvas-subtle transition-colors focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
              aria-label="Open navigation drawer"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          <Link href="/dashboard" className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-secondary rounded-lg">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
              <Heart className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight text-primary flex items-center gap-1.5 leading-none">
                {APP_NAME}
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-mint text-primary border border-mint-border">
                  Continuity
                </span>
              </span>
              <span className="hidden md:block text-[11px] text-secondaryText tracking-wide mt-0.5">
                {APP_TAGLINE}
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Search Interface Placeholder */}
        <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2 relative">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondaryText pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medications, tasks or records..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
              aria-label="Search records (Preview)"
            />
          </form>

          {searchNotice && (
            <div className="absolute top-12 left-0 right-0 p-3 rounded-xl bg-white border border-subtleBorder shadow-elevated z-50 text-xs text-secondaryText animate-in fade-in duration-150">
              <span className="font-bold text-main block mb-0.5">Search Interface Preview:</span>
              Instant indexed search across active prescriptions and clinical visits connects in Phase 4.
            </div>
          )}
        </div>

        {/* Right: Role Switcher, Accessibility Toolbar & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 1-Touch Emergency Callout */}
          <button
            type="button"
            onClick={() => alert("EMERGENCY CALL: Initiating direct line to Primary Family Admin (David Sullivan) and St. Jude Geriatric EMS.")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-clinical-dangerBg text-[#852D2D] border border-clinical-dangerBorder text-xs font-bold hover:bg-red-100 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 touch-target-min"
            title="One-Touch Emergency Assistance"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Emergency 911 / Circle</span>
          </button>

          {/* User Perspective Switcher (Patient, Family, Caregiver) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-subtleBorder bg-canvas-background hover:bg-mint hover:border-mint-border transition-colors text-left focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
              aria-expanded={isRoleMenuOpen}
              aria-label="Switch User Perspective (Demo Mode)"
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {activePerspective.sampleName[0]}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-main leading-tight truncate max-w-[130px]">
                  {activePerspective.sampleName}
                </span>
                <span className="block text-[10px] text-secondaryText truncate max-w-[130px]">
                  {activePerspective.label}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-secondaryText" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-subtleBorder bg-white p-2 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                <div className="px-3 py-2 border-b border-subtleBorder mb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-secondaryText">
                      User Perspective Switcher
                    </span>
                    <Sparkles className="h-3.5 w-3.5 text-secondary" />
                  </div>
                  <p className="text-[11px] text-mutedText mt-0.5">
                    Preview the platform from the perspective of each care stakeholder:
                  </p>
                </div>

                <div className="space-y-1">
                  {(Object.keys(USER_PERSPECTIVES) as AppRole[]).map((r) => {
                    const p = USER_PERSPECTIVES[r];
                    const isSelected = r === activeRole;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSelectPerspective(r)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                          isSelected ? 'bg-mint text-primary font-bold' : 'hover:bg-canvas-subtle'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-main">{p.label}</div>
                          <div className="text-[11px] text-secondaryText">{p.sampleName}</div>
                          <div className="text-[10px] text-mutedText">{p.roleDescription}</div>
                        </div>
                        <Badge variant={isSelected ? "mint" : "default"} size="sm">
                          {p.badgeLabel}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Accessibility Controls Toolbar */}
          <AccessibilityToolbar />

          {/* Theme Toggle (Dark / Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-subtleBorder bg-white text-secondaryText hover:text-primary hover:border-secondary transition-colors text-xs font-semibold focus-visible:ring-2 focus-visible:ring-secondary touch-target-min flex items-center gap-1.5"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-secondary" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Notifications Link */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-secondaryText hover:text-primary hover:bg-canvas-subtle transition-colors focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
            aria-label="View notifications. 2 unread reminders."
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
          </Link>

          {/* User Profile & Account Menu Placeholder */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-1.5 rounded-xl border border-subtleBorder text-secondaryText hover:text-main hover:bg-canvas-subtle transition-colors focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
              aria-expanded={isUserMenuOpen}
              aria-label="User account menu"
            >
              <UserCircle className="h-6 w-6 text-primary" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-subtleBorder bg-white p-2 shadow-elevated z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-subtleBorder mb-1">
                  <span className="block text-xs font-bold text-main">{activePerspective.sampleName}</span>
                  <span className="block text-[11px] text-secondaryText">{activePerspective.label}</span>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-teal-800 bg-mint px-2 py-0.5 rounded">
                    Evaluation Session
                  </span>
                </div>

                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-canvas-subtle text-main"
                  >
                    <Heart className="h-3.5 w-3.5 text-secondary" />
                    <span>Patient Profile Summary</span>
                  </Link>

                  <Link
                    href="/care-circle"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-canvas-subtle text-main"
                  >
                    <Users className="h-3.5 w-3.5 text-secondary" />
                    <span>Care Circle Roles</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-canvas-subtle text-main"
                  >
                    <Settings className="h-3.5 w-3.5 text-secondary" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      alert("Session reset: Demonstration environment refreshed to synthetic baseline.");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-canvas-subtle text-secondaryText"
                  >
                    <Sliders className="h-3.5 w-3.5 text-mutedText" />
                    <span>Reset Demo State</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-subtleBorder">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-clinical-dangerBg text-[#852D2D] font-semibold transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-clinical-danger" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
