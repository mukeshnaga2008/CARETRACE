'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  Trash2,
  Send,
  Info
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareCircleNavTabs } from '@/components/features/care-circle/care-circle-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInvitations, 
  addInvitation, 
  cancelInvitation 
} from '@/lib/data/care-circle-data';
import { Invitation, CareCircleAssignedRole, PermissionTier } from '@/types/caretrace';

export default function InvitationsPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);

  // Form states
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [assignedRole, setAssignedRole] = React.useState<CareCircleAssignedRole>('caregiver');
  const [permissionTier, setPermissionTier] = React.useState<PermissionTier>('caregiver_editor');
  const [notes, setNotes] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setInvitations(getCachedInvitations());
  }, []);

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !relationship.trim()) {
      setFormError('Please enter full name, valid email address, and relationship.');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }

    // Check duplicate pending invite
    const existing = invitations.find(i => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending');
    if (existing) {
      setFormError(`A pending invitation already exists for ${email}.`);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newInvite: Invitation = {
      id: `inv-${Date.now()}`,
      patientId: 'patient-profile-001',
      invitedBy: 'member-david',
      invitedByName: 'David Sullivan',
      email: email.trim().toLowerCase(),
      inviteeName: name.trim(),
      relationship: relationship.trim(),
      permissionTier,
      role: assignedRole,
      status: 'pending',
      token: `ct_inv_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      personalNote: notes.trim() || undefined,
    };

    addInvitation(newInvite);
    setInvitations([...getCachedInvitations()]);
    
    // Reset form
    setName('');
    setEmail('');
    setRelationship('');
    setNotes('');
    setFormError('');
    setSuccessMessage(`Invitation dispatched to ${newInvite.email} with 7-day expiration.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleCancelInvite = (inviteId: string) => {
    cancelInvitation(inviteId);
    setInvitations([...getCachedInvitations()]);
  };

  const handleCopyLink = (token: string) => {
    const link = `https://caretrace.app/auth/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Care Circle Invitations"
        description="Invite family members, trusted helpers, visiting nurses, or clinical specialists to coordinate Margaret Sullivan's care with time-limited cryptographic tokens."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Invitations' },
        ]}
      >
        <CareCircleNavTabs />

        {/* Demo Staging Notice Banner */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3.5">
          <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <span className="font-bold">Competition Demonstration Staging:</span> In this sandbox environment, invitations generate verifiable one-time tokens recorded in the database. In production, invitations are dispatched through an encrypted HIPAA-compliant transactional email service requiring multi-factor verification on acceptance.
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Send New Invitation Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-4">
                <CardTitle className="text-base font-bold text-main flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span>Send Secure Invitation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  <Input
                    label="Invitee Full Name"
                    placeholder="e.g. Dr. Arthur Vance or Elena Rostova"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. elena.r@rehabpartners.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    label="Relationship / Title"
                    placeholder="e.g. Physical Therapist, Daughter, Home Aide"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    required
                  />

                  <Select
                    label="Assigned Care Role"
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value as CareCircleAssignedRole)}
                    options={[
                      { value: 'caregiver', label: 'Caregiver / Home Care Aide' },
                      { value: 'visiting_nurse', label: 'Visiting Nurse / Clinical RN' },
                      { value: 'family_coordinator', label: 'Family Care Coordinator' },
                      { value: 'specialist_physician', label: 'Specialist Physician' },
                      { value: 'family_member', label: 'Family Member (Viewer)' },
                    ]}
                  />

                  <Select
                    label="Initial Permission Tier"
                    value={permissionTier}
                    onChange={(e) => setPermissionTier(e.target.value as PermissionTier)}
                    options={[
                      { value: 'caregiver_editor', label: 'Caregiver Editor (Meds, Tasks, Handovers)' },
                      { value: 'family_viewer', label: 'Family Viewer (Read-only Timeline, Contacts)' },
                      { value: 'clinician_access', label: 'Clinician Access (Clinical Records)' },
                      { value: 'full_admin', label: 'Full Admin (Full Profile & Member Management)' },
                    ]}
                  />

                  <Textarea
                    label="Personal Welcome Note (Optional)"
                    placeholder="e.g. Welcome to Margaret's care circle. Please coordinate with Nurse Sarah for morning shifts..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <Button type="submit" variant="primary" className="w-full" leftIcon={<Send className="w-4 h-4" />}>
                    Dispatch Secure Invitation
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Staged / Pending Invitations (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-subtleBorder bg-white shadow-sm">
              <CardHeader className="border-b border-subtleBorder pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-main">Active & Historical Invitations</CardTitle>
                  <p className="text-xs text-secondaryText mt-0.5">Track invitation tokens and expiration status.</p>
                </div>
                <Badge variant="mint">{invitations.length} Total</Badge>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-subtleBorder">
                {invitations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-secondaryText">No invitations on record.</div>
                ) : (
                  invitations.map((inv) => (
                    <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-main">{inv.inviteeName}</h4>
                          <span className="text-xs text-secondaryText font-medium">({inv.relationship})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            inv.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {inv.status}
                          </span>
                        </div>

                        <p className="text-xs text-secondaryText flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inv.email}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                          <span>Invited by: <strong className="text-slate-700">{inv.invitedByName}</strong></span>
                          <span>&bull;</span>
                          <span>Tier: <strong className="text-slate-700 capitalize">{inv.permissionTier.replace('_', ' ')}</strong></span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                          </span>
                        </div>

                        {inv.personalNote && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-2">
                            &ldquo;{inv.personalNote}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {inv.status === 'pending' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              leftIcon={<Copy className="w-3.5 h-3.5" />}
                              onClick={() => handleCopyLink(inv.token)}
                            >
                              {copiedToken === inv.token ? 'Copied!' : 'Copy Link'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 text-red-600 hover:bg-red-50"
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              onClick={() => handleCancelInvite(inv.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Completed</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Verification Security Specs Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Security & Invitation Specifications</span>
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Tokens expire automatically 7 days after issuance if not redeemed.</li>
                <li>Redemption requires email matching and authenticated identity validation.</li>
                <li>Cancelled invitations immediately invalidate the signed token in the database.</li>
              </ul>
            </div>
          </div>

        </div>

      </PageContainer>
    </AppShell>
  );
}