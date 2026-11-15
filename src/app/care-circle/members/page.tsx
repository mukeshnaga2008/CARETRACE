'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  SlidersHorizontal,
  Ban,
  CheckCircle2,
  Lock,
  Unlock,
  Edit3
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareCircleNavTabs } from '@/components/features/care-circle/care-circle-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedMembers, 
  updateMemberRole, 
  suspendMember, 
  revokeMember 
} from '@/lib/data/care-circle-data';
import { CareCircleMember, CareCircleAssignedRole, PermissionTier } from '@/types/caretrace';

export default function CareCircleMembersPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [members, setMembers] = React.useState<CareCircleMember[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Dialog states
  const [selectedMember, setSelectedMember] = React.useState<CareCircleMember | null>(null);
  const [isEditRoleOpen, setIsEditRoleOpen] = React.useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = React.useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = React.useState(false);

  // Form states for modals
  const [newAssignedRole, setNewAssignedRole] = React.useState<CareCircleAssignedRole>('caregiver');
  const [newTier, setNewTier] = React.useState<PermissionTier>('caregiver_editor');
  const [changeReason, setChangeReason] = React.useState('');
  const [suspensionReason, setSuspensionReason] = React.useState('');
  const [revocationReason, setRevocationReason] = React.useState('');
  const [actionError, setActionError] = React.useState('');
  const [feedbackMessage, setFeedbackMessage] = React.useState('');

  React.useEffect(() => {
    setMembers(getCachedMembers());
  }, []);

  const filteredMembers = members.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || m.assignedRole === roleFilter;
    const matchesStatus = statusFilter === 'all' || m.membershipStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenEditRole = (member: CareCircleMember) => {
    setSelectedMember(member);
    setNewAssignedRole(member.assignedRole || 'caregiver');
    setNewTier(member.permissionTier || 'caregiver_editor');
    setChangeReason('');
    setActionError('');
    setIsEditRoleOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!changeReason.trim() || changeReason.trim().length < 5) {
      setActionError('A valid operational or clinical reason (min 5 chars) is mandatory for role changes.');
      return;
    }

    const updated = updateMemberRole(
      selectedMember.id,
      newAssignedRole,
      newTier,
      changeReason.trim(),
      'David Sullivan',
      'Family Care Coordinator'
    );

    if (updated) {
      setMembers([...getCachedMembers()]);
      setIsEditRoleOpen(false);
      setFeedbackMessage(`Updated permissions for ${selectedMember.name}.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
    }
  };

  const handleOpenSuspend = (member: CareCircleMember) => {
    setSelectedMember(member);
    setSuspensionReason('');
    setActionError('');
    setIsSuspendOpen(true);
  };

  const handleConfirmSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!suspensionReason.trim() || suspensionReason.trim().length < 5) {
      setActionError('A documented reason (min 5 chars) is required to suspend member access.');
      return;
    }

    const updated = suspendMember(
      selectedMember.id,
      suspensionReason.trim(),
      'David Sullivan',
      'Family Care Coordinator'
    );

    if (updated) {
      setMembers([...getCachedMembers()]);
      setIsSuspendOpen(false);
      setFeedbackMessage(`Access temporarily suspended for ${selectedMember.name}.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
    }
  };

  const handleOpenRevoke = (member: CareCircleMember) => {
    setSelectedMember(member);
    setRevocationReason('');
    setActionError('');
    setIsRevokeOpen(true);
  };

  const handleConfirmRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (!revocationReason.trim() || revocationReason.trim().length < 5) {
      setActionError('A documented reason (min 5 chars) is required for permanent access revocation.');
      return;
    }

    const updated = revokeMember(
      selectedMember.id,
      revocationReason.trim(),
      'David Sullivan',
      'Family Care Coordinator'
    );

    if (updated) {
      setMembers([...getCachedMembers()]);
      setIsRevokeOpen(false);
      setFeedbackMessage(`Care Circle access permanently revoked for ${selectedMember.name}.`);
      setTimeout(() => setFeedbackMessage(''), 4000);
    }
  };

  const getStatusBadge = (status: CareCircleMember['membershipStatus']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'invited':
        return <Badge variant="warning">Invited</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspended</Badge>;
      case 'revoked':
        return <Badge variant="neutral">Revoked</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'family_coordinator': return 'Family Coordinator';
      case 'visiting_nurse': return 'Visiting Nurse';
      case 'specialist_physician': return 'Specialist Physician';
      case 'caregiver': return 'Caregiver';
      case 'family_member': return 'Family Member';
      case 'patient': return 'Patient';
      default: return role || 'Member';
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Care Circle Members & Access"
        description="Directory of verified family members, attending clinicians, and nursing staff authorized to participate in Margaret Sullivan's care coordination."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Members & Roles' },
        ]}
        actions={
          <Link href="/care-circle/invitations">
            <Button variant="primary" size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
              Invite New Member
            </Button>
          </Link>
        }
      >
        <CareCircleNavTabs />

        {feedbackMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white border border-subtleBorder rounded-2xl shadow-xs mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <Input
                isSearch
                placeholder="Search member by name, relationship, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'family_coordinator', label: 'Family Coordinator' },
                  { value: 'visiting_nurse', label: 'Visiting Nurse' },
                  { value: 'specialist_physician', label: 'Specialist Physician' },
                  { value: 'caregiver', label: 'Caregiver' },
                  { value: 'family_member', label: 'Family Member' },
                ]}
              />
            </div>
            <div className="sm:col-span-3">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'invited', label: 'Invited' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'revoked', label: 'Revoked' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Members Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMembers.map((member) => (
            <Card key={member.id} className={`border transition-all ${
              member.membershipStatus === 'suspended' ? 'border-amber-200 bg-amber-50/20' :
              member.membershipStatus === 'revoked' ? 'border-slate-200 bg-slate-50 opacity-75' :
              'border-subtleBorder bg-white hover:border-primary/50'
            }`}>
              <CardContent className="p-5 space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm shrink-0 ${
                      member.membershipStatus === 'revoked' ? 'bg-slate-200 text-slate-600' :
                      member.membershipStatus === 'suspended' ? 'bg-amber-100 text-amber-800' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-main">{member.name}</h3>
                        {member.emergencyPriority && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Emergency Priority #{member.emergencyPriority}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary font-medium mt-0.5">{member.relationship}</p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(member.membershipStatus)}
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-subtleBorder/60 text-xs">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md">
                    {getRoleLabel(member.assignedRole)}
                  </span>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 font-semibold rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="capitalize">{member.permissionTier.replace('_', ' ')}</span>
                  </span>
                  {member.shiftTimes && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{member.shiftTimes}</span>
                    </span>
                  )}
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-secondaryText pt-2 border-t border-subtleBorder/60">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.email}</span>
                  </div>
                </div>

                {/* Responsibilities summary */}
                {member.currentResponsibilities && member.currentResponsibilities.length > 0 && (
                  <div className="pt-2 border-t border-subtleBorder/60">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Key Responsibilities</p>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {member.currentResponsibilities.slice(0, 2).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">&bull;</span>
                          <span className="line-clamp-1">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Revocation notice if revoked */}
                {member.membershipStatus === 'revoked' && member.revocationReason && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                    <span className="font-bold">Revocation reason:</span> {member.revocationReason}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-subtleBorder flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/care-circle/members/${member.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      Permissions & Details
                    </Button>
                  </Link>

                  {member.membershipStatus === 'active' && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-slate-700"
                        onClick={() => handleOpenEditRole(member)}
                      >
                        Edit Role
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-amber-700 hover:bg-amber-50"
                        onClick={() => handleOpenSuspend(member)}
                      >
                        Suspend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 text-red-700 hover:bg-red-50"
                        onClick={() => handleOpenRevoke(member)}
                      >
                        Revoke
                      </Button>
                    </div>
                  )}

                  {member.membershipStatus === 'suspended' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-emerald-700 border-emerald-300"
                      onClick={() => {
                        updateMemberRole(member.id, member.assignedRole || 'caregiver', member.permissionTier, 'Reinstated from suspension', 'David Sullivan', 'Family Care Coordinator');
                        member.membershipStatus = 'active';
                        member.isActive = true;
                        setMembers([...getCachedMembers()]);
                      }}
                    >
                      Reinstate Member
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Edit Member Role & Permissions */}
        <Dialog
          isOpen={isEditRoleOpen}
          onClose={() => setIsEditRoleOpen(false)}
          title={`Edit Permissions: ${selectedMember?.name}`}
          description="Update assigned care circle role and permission tier. All changes require an auditable reason."
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
                { value: 'full_admin', label: 'Full Admin (Full Profile, Medications, Appointments, Grants)' },
                { value: 'caregiver_editor', label: 'Caregiver Editor (Med Adherence, Appointments, Tasks, Handovers)' },
                { value: 'family_viewer', label: 'Family Viewer (Read-only Timeline, Emergency Contact)' },
                { value: 'clinician_access', label: 'Clinician Access (Clinical Records, Medication Verification)' },
              ]}
            />

            <Textarea
              label="Reason for Role / Permission Change (Mandatory for HIPAA Audit)"
              placeholder="e.g. Assigned to manage afternoon medication adherence and transport coordination..."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              error={actionError}
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

        {/* Modal: Suspend Member */}
        <Dialog
          isOpen={isSuspendOpen}
          onClose={() => setIsSuspendOpen(false)}
          title={`Suspend Care Circle Access: ${selectedMember?.name}`}
          description="Temporarily revoke access to patient records, tasks, and notifications. This can be reinstated later."
        >
          <form onSubmit={handleConfirmSuspend} className="space-y-4 pt-2">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
              <span className="font-bold">Security Note:</span> Suspended members are immediately blocked from querying patient records, signing off tasks, or acknowledging shift handovers.
            </div>

            <Textarea
              label="Reason for Suspension (Mandatory)"
              placeholder="e.g. Extended medical leave until April 2026..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              error={actionError}
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

        {/* Modal: Revoke Member */}
        <Dialog
          isOpen={isRevokeOpen}
          onClose={() => setIsRevokeOpen(false)}
          title={`Permanently Revoke Access: ${selectedMember?.name}`}
          description="Revoke all patient care permissions. This action is recorded permanently in the tamper-evident audit log."
        >
          <form onSubmit={handleConfirmRevoke} className="space-y-4 pt-2">
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs">
              <span className="font-bold">Permanent Revocation:</span> All active session tokens will be invalidated immediately. Any pending tasks assigned to this member will be unassigned back to the Care Circle pool.
            </div>

            <Textarea
              label="Reason for Revocation (Mandatory)"
              placeholder="e.g. Nursing contract completed with Home Health Agency..."
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              error={actionError}
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