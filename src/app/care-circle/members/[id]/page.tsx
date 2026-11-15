'use client';

import * as React from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { 
  Users, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft,
  Edit3,
  Ban,
  CheckSquare,
  Lock,
  ChevronRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedMembers, 
  getCachedTasks, 
  updateMemberRole, 
  suspendMember, 
  revokeMember 
} from '@/lib/data/care-circle-data';
import { CareCircleMember, CareCircleAssignedRole, PermissionTier, CareTask } from '@/types/caretrace';

const ALL_PERMISSION_KEYS = [
  { key: 'view_profile', label: 'View Health Profile', desc: 'Read basic demographics, condition summary, and emergency contacts' },
  { key: 'edit_profile', label: 'Edit Health Profile', desc: 'Modify personal details, preferred name, and communication preferences' },
  { key: 'view_medications', label: 'View Medication List', desc: 'Review active regimens, dosages, food instructions, and prescriber info' },
  { key: 'edit_medications', label: 'Edit Medication Records', desc: 'Add new medications or propose dosage/schedule modifications' },
  { key: 'log_adherence', label: 'Log Medication Adherence', desc: 'Confirm doses administered, mark taken/skipped, and record timestamps' },
  { key: 'verify_medications', label: 'Clinical Verification', desc: 'Clinical sign-off on medication instructions' },
  { key: 'view_appointments', label: 'View Appointments', desc: 'Access calendar of scheduled clinic visits, tests, and doctor notes' },
  { key: 'manage_appointments', label: 'Manage Appointments', desc: 'Schedule, reschedule, or cancel consultations and assign escorts' },
  { key: 'manage_tasks', label: 'Manage Shared Care Tasks', desc: 'Create, assign, update, and sign off on daily care responsibilities' },
  { key: 'manage_handovers', label: 'Shift Handover Sign-off', desc: 'Author and acknowledge caregiver-to-family transition notes' },
  { key: 'manage_invitations', label: 'Invite Care Circle Members', desc: 'Generate secure expiring invitation links for family & clinicians' },
  { key: 'manage_access_grants', label: 'Manage Access & Permissions', desc: 'Configure role permissions, suspend, or revoke member access' },
];

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [member, setMember] = React.useState<CareCircleMember | null>(null);
  const [memberTasks, setMemberTasks] = React.useState<CareTask[]>([]);
  
  // Modals
  const [isEditRoleOpen, setIsEditRoleOpen] = React.useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = React.useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = React.useState(false);

  // Form states
  const [newAssignedRole, setNewAssignedRole] = React.useState<CareCircleAssignedRole>('caregiver');
  const [newTier, setNewTier] = React.useState<PermissionTier>('caregiver_editor');
  const [reason, setReason] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');

  const loadData = () => {
    const found = getCachedMembers().find(m => m.id === id);
    if (!found) {
      return;
    }
    setMember({ ...found });
    setNewAssignedRole(found.assignedRole || 'caregiver');
    setNewTier(found.permissionTier || 'caregiver_editor');

    const tasks = getCachedTasks().filter(t => t.assignedMemberId === id || t.assignedMemberName === found.name);
    setMemberTasks(tasks);
  };

  React.useEffect(() => {
    loadData();
  }, [id]);

  if (!member) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Member Not Found"
          description="The requested Care Circle member profile does not exist or has been removed."
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Care Circle', href: '/care-circle' },
            { label: 'Members', href: '/care-circle/members' },
          ]}
        >
          <div className="p-8 text-center bg-white border border-subtleBorder rounded-2xl space-y-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-main">Care Circle Member Not Found</h3>
            <p className="text-sm text-secondaryText">Member ID: {id}</p>
            <Link href="/care-circle/members">
              <Button variant="primary">Return to Members Directory</Button>
            </Link>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setFormError('A valid operational or clinical reason (min 5 chars) is mandatory.');
      return;
    }

    const updated = updateMemberRole(
      member.id,
      newAssignedRole,
      newTier,
      reason.trim(),
      'David Sullivan',
      'Family Care Coordinator'
    );

    if (updated) {
      loadData();
      setIsEditRoleOpen(false);
      setReason('');
      setFormError('');
      setStatusMessage('Permissions updated successfully in the audit registry.');
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleConfirmSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setFormError('A documented reason (min 5 chars) is required.');
      return;
    }

    const updated = suspendMember(
      member.id,
      reason.trim(),
      'David Sullivan',
      'Family Care Coordinator'
    );

    if (updated) {
      loadData();
      setIsSuspendOpen(false);
      setReason('');
      setFormError('');
      setStatusMessage('Member access suspended.');
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleConfirmRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setFormError('A documented reason (min 5 chars) is required.');
      return;
    }

    const updated = revokeMember(
      member.id,
      reason.trim(),
      'David Sullivan',
      'Family Care Coordinator'
    );

    if (updated) {
      loadData();
      setIsRevokeOpen(false);
      setReason('');
      setFormError('');
      setStatusMessage('Care Circle access permanently revoked.');
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={member.name}
        description={`${member.relationship} &bull; ${member.assignedRole?.replace('_', ' ')} &bull; Joined ${member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active'}`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Members', href: '/care-circle/members' },
          { label: member.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/care-circle/members">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                All Members
              </Button>
            </Link>
            {member.membershipStatus === 'active' && (
              <Button 
                variant="primary" 
                size="sm" 
                leftIcon={<Edit3 className="w-4 h-4" />}
                onClick={() => {
                  setReason('');
                  setFormError('');
                  setIsEditRoleOpen(true);
                }}
              >
                Modify Permissions
              </Button>
            )}
          </div>
        }
      >
        {statusMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Member Status Banner if Suspended or Revoked */}
        {member.membershipStatus === 'suspended' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Care Circle Access Suspended</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                This member is temporarily blocked from viewing patient charts, logging adherence, or acknowledging handovers.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2.5 text-xs text-emerald-800 border-emerald-300 bg-white"
                onClick={() => {
                  updateMemberRole(member.id, member.assignedRole || 'caregiver', member.permissionTier, 'Reinstated from suspension', 'David Sullivan', 'Family Care Coordinator');
                  loadData();
                }}
              >
                Reinstate Active Access
              </Button>
            </div>
          </div>
        )}

        {member.membershipStatus === 'revoked' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 text-sm">Access Permanently Revoked</h4>
              <p className="text-xs text-red-800 mt-0.5">
                Revocation executed. Reason on record: &ldquo;{member.revocationReason || 'Administrative termination'}&rdquo;
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card, Contact, Responsibilities (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center mx-auto shadow-inner">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-main">{member.name}</h2>
                  <p className="text-xs font-semibold text-secondaryText mt-0.5">{member.relationship}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    member.membershipStatus === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    member.membershipStatus === 'suspended' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {(member.membershipStatus || 'active').toUpperCase()}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold bg-teal-50 text-teal-800 rounded-full capitalize">
                    {member.permissionTier.replace('_', ' ')}
                  </span>
                  {member.emergencyPriority && (
                    <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-800 rounded-full">
                      Emergency #{member.emergencyPriority}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-subtleBorder space-y-2.5 text-xs text-left">
                  <div className="flex items-center justify-between text-secondaryText">
                    <span className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Phone:</span>
                    </span>
                    <span className="font-semibold text-main">{member.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-secondaryText">
                    <span className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email:</span>
                    </span>
                    <span className="font-semibold text-main truncate max-w-[200px]">{member.email}</span>
                  </div>
                  {member.shiftTimes && (
                    <div className="flex items-center justify-between text-secondaryText">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Shift / Hours:</span>
                      </span>
                      <span className="font-semibold text-main">{member.shiftTimes}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-secondaryText">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Joined Circle:</span>
                    </span>
                    <span className="font-semibold text-main">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                </div>

                {member.membershipStatus === 'active' && (
                  <div className="pt-4 border-t border-subtleBorder flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setReason('');
                        setFormError('');
                        setIsSuspendOpen(true);
                      }}
                    >
                      Suspend Access
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setReason('');
                        setFormError('');
                        setIsRevokeOpen(true);
                      }}
                    >
                      Revoke Access
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Responsibilities */}
            <Card className="border border-subtleBorder bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-main">Current Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {member.currentResponsibilities && member.currentResponsibilities.length > 0 ? (
                  <ul className="space-y-2 text-xs">
                    {member.currentResponsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-slate-800 font-medium">{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-secondaryText italic">No formal responsibilities assigned yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Assigned Active Care Tasks */}
            <Card className="border border-subtleBorder bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-main">Assigned Care Tasks ({memberTasks.length})</CardTitle>
                <Link href="/care-circle/tasks" className="text-xs text-primary font-bold hover:underline">
                  View Tasks &rarr;
                </Link>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {memberTasks.length > 0 ? (
                  memberTasks.map((task) => (
                    <div key={task.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900">{task.title}</h4>
                        <p className="text-[11px] text-slate-500">Due: {task.dueDate} &bull; Priority: {task.priority}</p>
                      </div>
                      <Link href={`/care-circle/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7">
                          Details
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-secondaryText italic">No active care tasks assigned to this member.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Granular Permissions List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-main">Granular Access Privileges</CardTitle>
                    <p className="text-xs text-secondaryText mt-0.5">
                      Permission breakdown based on tier: <span className="font-bold capitalize">{member.permissionTier.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-subtleBorder">
                {ALL_PERMISSION_KEYS.map((perm) => {
                  const hasPermission = member.permissions ? member.permissions.includes(perm.key) : false;

                  return (
                    <div key={perm.key} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {hasPermission ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className={`text-xs font-bold ${hasPermission ? 'text-main' : 'text-slate-400'}`}>
                            {perm.label}
                          </h4>
                          <p className="text-[11px] text-secondaryText mt-0.5">{perm.desc}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        hasPermission ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {hasPermission ? 'Granted' : 'Denied'}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Audit Notice */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Security & Access Accountability</span>
              </div>
              <p>
                All access changes to this member profile are permanently written to the CARETRACE tamper-evident audit ledger with required operational justifications. Immediate access revocation invalidates all live authentication tokens within 5 seconds.
              </p>
            </div>
          </div>

        </div>

        {/* Modal: Edit Permissions */}
        <Dialog
          isOpen={isEditRoleOpen}
          onClose={() => setIsEditRoleOpen(false)}
          title={`Update Permissions: ${member.name}`}
          description="Adjust assigned role and access tier. Requires a documented justification."
        >
          <form onSubmit={handleSaveRole} className="space-y-4 pt-2">
            <Select
              label="Assigned Care Circle Role"
              value={newAssignedRole}
              onChange={(e) => setNewAssignedRole(e.target.value as CareCircleAssignedRole)}
              options={[
                { value: 'family_coordinator', label: 'Family Care Coordinator' },
                { value: 'visiting_nurse', label: 'Visiting Nurse' },
                { value: 'caregiver', label: 'Caregiver' },
                { value: 'specialist_physician', label: 'Specialist Physician' },
                { value: 'family_member', label: 'Family Member' },
              ]}
            />

            <Select
              label="Permission Tier"
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as PermissionTier)}
              options={[
                { value: 'full_admin', label: 'Full Admin (Demographics, Meds, Appointments, Grants)' },
                { value: 'caregiver_editor', label: 'Caregiver Editor (Adherence, Tasks, Handovers)' },
                { value: 'family_viewer', label: 'Family Viewer (Read-only Timeline, Contacts)' },
                { value: 'clinician_access', label: 'Clinician Access (Clinical Records & Outcomes)' },
              ]}
            />

            <Textarea
              label="Operational / Clinical Reason (Mandatory)"
              placeholder="e.g. Granted caregiver editor permission to log evening dose adherence..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={formError}
              required
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsEditRoleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: Suspend Access */}
        <Dialog
          isOpen={isSuspendOpen}
          onClose={() => setIsSuspendOpen(false)}
          title={`Suspend Access for ${member.name}`}
          description="Temporarily revoke access to patient records."
        >
          <form onSubmit={handleConfirmSuspend} className="space-y-4 pt-2">
            <Textarea
              label="Reason for Suspension (Mandatory)"
              placeholder="e.g. Temporary leave of absence..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={formError}
              required
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsSuspendOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white">
                Confirm Suspension
              </Button>
            </div>
          </form>
        </Dialog>

        {/* Modal: Revoke Access */}
        <Dialog
          isOpen={isRevokeOpen}
          onClose={() => setIsRevokeOpen(false)}
          title={`Permanently Revoke Access for ${member.name}`}
          description="Permanent termination of Care Circle membership."
        >
          <form onSubmit={handleConfirmRevoke} className="space-y-4 pt-2">
            <Textarea
              label="Reason for Permanent Revocation (Mandatory)"
              placeholder="e.g. Care arrangement concluded..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={formError}
              required
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsRevokeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-red-600 hover:bg-red-700 text-white">
                Revoke Access Immediately
              </Button>
            </div>
          </form>
        </Dialog>

      </PageContainer>
    </AppShell>
  );
}