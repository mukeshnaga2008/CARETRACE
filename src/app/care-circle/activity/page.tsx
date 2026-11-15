'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Activity, 
  ShieldCheck, 
  UserCheck, 
  UserPlus, 
  Edit3, 
  Ban, 
  CheckSquare, 
  ArrowLeftRight, 
  Clock, 
  Lock, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareCircleNavTabs } from '@/components/features/care-circle/care-circle-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { AppRole } from '@/lib/constants';
import { getCachedActivities } from '@/lib/data/care-circle-data';
import { CareCircleActivity, CareCircleActivityEventType } from '@/types/caretrace';

export default function CareCircleActivityPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [activities, setActivities] = React.useState<CareCircleActivity[]>([]);
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  React.useEffect(() => {
    setActivities(getCachedActivities());
  }, []);

  const filteredActivities = activities.filter((act) => {
    if (typeFilter === 'all') return true;
    return act.eventType === typeFilter;
  });

  const getEventIcon = (type: CareCircleActivityEventType) => {
    switch (type) {
      case 'member_joined':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'member_invited':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'role_changed':
        return <Edit3 className="w-4 h-4 text-purple-600" />;
      case 'member_suspended':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'member_revoked':
        return <Ban className="w-4 h-4 text-red-600" />;
      case 'task_assigned':
        return <CheckSquare className="w-4 h-4 text-indigo-600" />;
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'handover_sent':
        return <ArrowLeftRight className="w-4 h-4 text-teal-600" />;
      case 'handover_acknowledged':
        return <CheckCircle2 className="w-4 h-4 text-teal-700" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventBadge = (type: CareCircleActivityEventType) => {
    const formatted = type.replace('_', ' ').toUpperCase();
    switch (type) {
      case 'member_joined':
      case 'task_completed':
      case 'handover_acknowledged':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{formatted}</span>;
      case 'role_changed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">{formatted}</span>;
      case 'member_suspended':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">{formatted}</span>;
      case 'member_revoked':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">{formatted}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{formatted}</span>;
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Care Circle Collaboration & Audit Log"
        description="Tamper-evident, chronological ledger of all access grants, role modifications, task handovers, and responsibility delegations for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Activity & Audit' },
        ]}
      >
        <CareCircleNavTabs />

        {/* Audit Compliance Notice */}
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3.5">
          <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-slate-900">
              HIPAA-Aligned Accountability Standard & Immutability
            </p>
            <p>
              Every access modification, permission delegation, and shift transition event is recorded with non-repudiable actor attribution and documented operational justifications. Records cannot be overwritten or truncated.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white border border-subtleBorder rounded-2xl shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-main">Filter Activity By Event:</span>
          </div>

          <div className="w-full sm:w-72">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Collaboration Events' },
                { value: 'role_changed', label: 'Role & Permission Updates' },
                { value: 'member_suspended', label: 'Member Suspensions' },
                { value: 'member_revoked', label: 'Member Revocations' },
                { value: 'member_invited', label: 'Member Invitations' },
                { value: 'task_assigned', label: 'Task Assignments' },
                { value: 'task_completed', label: 'Task Completions' },
                { value: 'handover_sent', label: 'Handovers Submitted' },
                { value: 'handover_acknowledged', label: 'Handovers Acknowledged' },
              ]}
            />
          </div>
        </div>

        {/* Chronological Activity Feed */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center bg-white border border-subtleBorder rounded-2xl space-y-2">
              <Activity className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-main">No Events Found</h3>
              <p className="text-xs text-secondaryText">No activity records match the selected event filter.</p>
            </div>
          ) : (
            filteredActivities.map((act) => (
              <div 
                key={act.id} 
                className="p-4 sm:p-5 bg-white border border-subtleBorder rounded-2xl shadow-xs hover:border-primary/40 transition-colors flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  {getEventIcon(act.eventType)}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-main">{act.title}</h4>
                      {getEventBadge(act.eventType)}
                    </div>
                    <span className="text-xs text-secondaryText flex items-center gap-1 font-medium shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(act.timestamp).toLocaleString()}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {act.description}
                  </p>

                  <div className="pt-2 border-t border-subtleBorder/60 flex items-center gap-3 text-[11px] text-slate-500">
                    <span>
                      Actor: <strong className="text-slate-800">{act.actorName}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Role: <strong className="text-slate-800">{act.actorRole}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </PageContainer>
    </AppShell>
  );
}