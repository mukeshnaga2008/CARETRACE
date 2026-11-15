'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ArrowLeftRight, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  HeartHandshake,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareCircleNavTabs } from '@/components/features/care-circle/care-circle-nav-tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/constants';
import { 
  getCachedMembers, 
  getCachedTasks, 
  getCachedHandovers, 
  getCachedInvitations,
  acknowledgeHandover
} from '@/lib/data/care-circle-data';
import { CareCircleMember, CareTask, CareHandover } from '@/types/caretrace';

export default function CareCircleOverviewPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [members, setMembers] = React.useState<CareCircleMember[]>([]);
  const [tasks, setTasks] = React.useState<CareTask[]>([]);
  const [handovers, setHandovers] = React.useState<CareHandover[]>([]);
  const [justAcknowledged, setJustAcknowledged] = React.useState(false);

  React.useEffect(() => {
    setMembers(getCachedMembers());
    setTasks(getCachedTasks());
    setHandovers(getCachedHandovers());
  }, []);

  const activeMembers = members.filter(m => m.membershipStatus === 'active');
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const unackHandovers = handovers.filter(h => h.handoverStatus === 'ready_for_handover' || h.handoverStatus === 'needs_clarification');
  const primaryEmergencyContact = members.find(m => m.emergencyPriority === 1);

  const handleQuickAcknowledge = (handoverId: string) => {
    acknowledgeHandover(handoverId, 'David Sullivan', 'Quick acknowledged from Care Circle Overview.');
    setHandovers([...getCachedHandovers()]);
    setJustAcknowledged(true);
    setTimeout(() => setJustAcknowledged(false), 4000);
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Care Circle Collaboration"
        description="A coordinated network of family members, visiting nurses, and clinical specialists collaborating around Margaret Sullivan's daily care, responsibilities, and clinical transitions."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/care-circle/invitations">
              <Button variant="outline" size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
                Invite Member
              </Button>
            </Link>
            <Link href="/care-circle/tasks">
              <Button variant="primary" size="sm" leftIcon={<CheckSquare className="h-4 w-4" />}>
                New Care Task
              </Button>
            </Link>
          </div>
        }
      >
        <CareCircleNavTabs />

        {/* Success toast after quick acknowledge */}
        {justAcknowledged && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-sm animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Shift handover acknowledged successfully. Active coordination responsibility updated to David Sullivan.</span>
            </div>
            <Link href="/care-circle/handover" className="text-emerald-700 underline font-medium text-xs">
              View Handover Archive
            </Link>
          </div>
        )}

        {/* Critical Unacknowledged Shift Handover Banner */}
        {unackHandovers.length > 0 && !justAcknowledged && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                      Shift Handover Awaiting Review
                    </span>
                    <span className="text-xs text-amber-700 font-medium">Outgoing: Sarah Jenkins, RN</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Morning Nursing Shift Handover &bull; Incoming: David Sullivan
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Nurse Sarah completed the morning vitals and medication check. 2 pending tasks transitioned for afternoon/evening coverage (Lisinopril refill & fasting lab reminder).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleQuickAcknowledge(unackHandovers[0].id)}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Acknowledge Handover
                </Button>
                <Link href="/care-circle/handover">
                  <Button variant="outline" size="sm">
                    Review Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Active Members</p>
                <h3 className="text-2xl font-bold text-main mt-1">{activeMembers.length}</h3>
                <p className="text-xs text-secondary mt-1">1 invited &bull; 0 suspended</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Open Care Tasks</p>
                <h3 className="text-2xl font-bold text-main mt-1">{pendingTasks.length}</h3>
                <p className="text-xs text-amber-600 font-medium mt-1">
                  {pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length} high/urgent priority
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Active Handover</p>
                <h3 className="text-2xl font-bold text-main mt-1">
                  {unackHandovers.length > 0 ? `${unackHandovers.length} Pending` : 'Up to Date'}
                </h3>
                <p className="text-xs text-secondary mt-1">
                  {unackHandovers.length > 0 ? 'Requires incoming sign-off' : 'All shifts transitioned'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Primary Emergency</p>
                <h3 className="text-lg font-bold text-main mt-1 truncate max-w-[130px]">
                  {primaryEmergencyContact ? primaryEmergencyContact.name.split(' ')[0] : 'None'}
                </h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">Priority #1 &bull; On Call</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Section: Active Roster & Priority Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Care Circle Roster (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-main">Care Circle Roster</h2>
                <p className="text-xs text-secondaryText">Members authorized to view or manage Margaret Sullivan's care.</p>
              </div>
              <Link href="/care-circle/members" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                <span>View All ({members.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {members.slice(0, 4).map((member) => (
                <Card key={member.id} className="border border-subtleBorder hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-main">{member.name}</h4>
                          <span className="text-xs text-secondaryText font-medium">({member.relationship})</span>
                          {member.emergencyPriority && (
                            <Badge variant="mint" className="text-[10px] py-0 px-1.5">
                              Pri #{member.emergencyPriority}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-secondaryText">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            <span className="capitalize">{member.permissionTier.replace('_', ' ')}</span>
                          </span>
                          <span>&bull;</span>
                          <span>{member.lastActiveAt || 'Recently active'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link href={`/care-circle/members/${member.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          Permissions
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>All care team members have signed HIPAA-aligned digital consent and verification credentials.</span>
              </div>
              <Link href="/care-circle/members" className="font-bold text-primary hover:underline shrink-0">
                Manage Roles
              </Link>
            </div>
          </div>

          {/* Right Column: Shared Urgent Tasks & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-main">Urgent Care Tasks</h2>
                <p className="text-xs text-secondaryText">Coordinated responsibilities for today & tomorrow.</p>
              </div>
              <Link href="/care-circle/tasks" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                <span>All Tasks ({tasks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {pendingTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="p-3.5 bg-white border border-subtleBorder rounded-xl shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[11px] text-secondaryText font-medium">Due: {task.dueDate}</span>
                      </div>
                      <h4 className="font-bold text-xs text-main mt-1.5">{task.title}</h4>
                      <p className="text-[11px] text-secondaryText mt-0.5 line-clamp-1">{task.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-subtleBorder/60 text-xs">
                    <span className="text-[11px] font-medium text-slate-700">
                      Assigned: <span className="font-bold">{task.assignedMemberName || 'Unassigned (Pool)'}</span>
                    </span>
                    <Link href={`/care-circle/tasks/${task.id}`} className="text-primary font-bold hover:underline text-[11px]">
                      Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Links Card */}
            <Card className="border border-subtleBorder bg-gradient-to-br from-softMint/40 to-white">
              <CardContent className="p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Care Circle Capabilities</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link href="/care-circle/handover" className="p-2.5 bg-white border border-subtleBorder rounded-lg hover:border-primary transition-colors flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-semibold text-main">Shift Handover</span>
                  </Link>
                  <Link href="/care-circle/invitations" className="p-2.5 bg-white border border-subtleBorder rounded-lg hover:border-primary transition-colors flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-main">Invite Caregiver</span>
                  </Link>
                  <Link href="/care-circle/tasks" className="p-2.5 bg-white border border-subtleBorder rounded-lg hover:border-primary transition-colors flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-main">Task Delegation</span>
                  </Link>
                  <Link href="/care-circle/activity" className="p-2.5 bg-white border border-subtleBorder rounded-lg hover:border-primary transition-colors flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-main">Audit Timeline</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </PageContainer>
    </AppShell>
  );
}