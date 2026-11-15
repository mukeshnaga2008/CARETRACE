'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Pill, 
  Calendar, 
  Users, 
  FileText, 
  GitBranch, 
  ShieldAlert, 
  Bell, 
  History, 
  FileCheck, 
  Lock, 
  Settings,
  User,
  Heart,
  PhoneCall,
  Activity
} from 'lucide-react';
import { NAVIGATION_SECTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5 shrink-0" />,
  Pill: <Pill className="h-5 w-5 shrink-0" />,
  Calendar: <Calendar className="h-5 w-5 shrink-0" />,
  Users: <Users className="h-5 w-5 shrink-0" />,
  FileText: <FileText className="h-5 w-5 shrink-0" />,
  GitBranch: <GitBranch className="h-5 w-5 shrink-0" />,
  ShieldAlert: <ShieldAlert className="h-5 w-5 shrink-0" />,
  Bell: <Bell className="h-5 w-5 shrink-0" />,
  History: <History className="h-5 w-5 shrink-0" />,
  FileCheck: <FileCheck className="h-5 w-5 shrink-0" />,
  Lock: <Lock className="h-5 w-5 shrink-0" />,
  Settings: <Settings className="h-5 w-5 shrink-0" />,
  User: <User className="h-5 w-5 shrink-0" />,
};

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col justify-between border-r border-subtleBorder bg-white py-4 px-3 select-none overflow-hidden",
        className
      )}
    >
      <div className="flex-1 overflow-y-auto pr-1.5 space-y-5 overscroll-contain">
        {/* Navigation Groups */}
        {NAVIGATION_SECTIONS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-mutedText text-left">
              {group.group}
            </h3>
            <div className="space-y-1 pt-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === '/dashboard' && pathname === '/') ||
                  (item.href === '/care-gaps' && pathname === '/radar') ||
                  (item.href === '/care-passport' && pathname === '/passport') ||
                  (item.href === '/profile' && pathname.startsWith('/profile'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all touch-target-min",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-main hover:bg-mint hover:text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(isActive ? "text-white" : "text-secondary")}>
                        {iconMap[item.icon] || <Activity className="h-5 w-5" />}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badge === "Alert"
                            ? "bg-clinical-dangerBg text-clinical-danger"
                            : "bg-canvas-subtle text-secondaryText"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Status Card: Care Network Health */}
      <div className="pt-4 border-t border-subtleBorder text-left">
        <div className="rounded-xl border border-subtleBorder bg-canvas-background p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-main flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-clinical-success animate-pulse" />
              Care Network Active
            </span>
            <Badge variant="mint" size="sm">
              Synced
            </Badge>
          </div>
          <p className="text-[11px] text-secondaryText leading-relaxed">
            All 3 caregivers synchronized. Last vitals checked 2h ago.
          </p>
        </div>
      </div>
    </aside>
  );
}
