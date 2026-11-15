'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  User, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Users, 
  FileText, 
  Edit3, 
  Lock,
  Sparkles,
  PhoneCall,
  Activity
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ProfileNavTabs } from '@/components/features/profile/profile-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { 
  INITIAL_PATIENT_PROFILE, 
  INITIAL_EMERGENCY_CONTACTS, 
  INITIAL_PATIENT_PREFERENCES,
  INITIAL_HEALTH_SOURCES,
  getMaskedPatientProfile 
} from '@/lib/data/patient-profile-data';
import { SYNTHETIC_CARE_CIRCLE } from '@/lib/data/synthetic-dashboard-data';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';

export default function PatientProfileOverviewPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');
  const [profile, setProfile] = React.useState(INITIAL_PATIENT_PROFILE);
  const [contacts, setContacts] = React.useState(INITIAL_EMERGENCY_CONTACTS);
  const [preferences, setPreferences] = React.useState(INITIAL_PATIENT_PREFERENCES);
  const [sources, setSources] = React.useState(INITIAL_HEALTH_SOURCES);

  // Mask data appropriately for current perspective
  const safeProfile = React.useMemo(() => {
    const tier = activeRole === 'patient' ? 'full_admin' : activeRole === 'family' ? 'family_viewer' : 'caregiver_editor';
    return getMaskedPatientProfile(profile, activeRole, tier);
  }, [profile, activeRole]);

  const isFullAdmin = activeRole === 'patient';

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Patient Health Identity"
        description="Centralized clinical identity, emergency escalation, and care preferences centered around Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Patient Profile' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </Link>
          </div>
        }
      >
        {/* Navigation Tabs connecting all 6 profile routes */}
        <ProfileNavTabs />

        {/* Perspective Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-canvas-background border border-subtleBorder flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-secondaryText">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {USER_PERSPECTIVES[activeRole].sampleName[0]}
            </div>
            <div>
              <span className="font-bold text-main">{USER_PERSPECTIVES[activeRole].sampleName}</span>
              <span className="text-mutedText ml-1.5">({USER_PERSPECTIVES[activeRole].label})</span>
              <span className="block sm:inline sm:ml-2 text-mutedText">
                {isFullAdmin 
                  ? '• Viewing unmasked personal identifiers with Full Administrative Authority'
                  : '• Viewing privacy-masked records (Sensitive street address & DOB restricted)'}
              </span>
            </div>
          </div>
          <Badge variant={isFullAdmin ? "mint" : "neutral"} size="sm">
            {isFullAdmin ? "Full Access" : "Restricted Privacy View"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Identity & Health Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Patient Identity Card */}
            <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-subtleBorder">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold shadow-md">
                    MS
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-main">{safeProfile.fullName}</h2>
                      <span className="px-2 py-0.5 rounded-full bg-mint text-primary border border-mint-border text-xs font-semibold">
                        Preferred: &ldquo;{safeProfile.preferredName}&rdquo;
                      </span>
                    </div>
                    <p className="text-xs text-secondaryText mt-1 flex items-center gap-2">
                      <span>Age: {safeProfile.age}</span>
                      <span>•</span>
                      <span>Blood Type: <strong>{safeProfile.bloodType}</strong></span>
                      <span>•</span>
                      <span className="text-clinical-success font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Identity Verified
                      </span>
                    </p>
                  </div>
                </div>

                {/* Profile Completion Meter */}
                <div className="sm:text-right shrink-0">
                  <div className="text-xs text-secondaryText mb-1">Profile Completeness</div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2.5 bg-canvas-subtle rounded-full overflow-hidden border border-subtleBorder">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all duration-500" 
                        style={{ width: `${safeProfile.profileCompletionPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-main">{safeProfile.profileCompletionPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Contact Information & Privacy Shielding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 text-xs">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-secondaryText">
                    <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-main">Primary Telephone</span>
                      <span>{safeProfile.phoneNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-secondaryText">
                    <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-main">Secure Email</span>
                      <span>{safeProfile.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-secondaryText">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-main">Residence Address</span>
                      <span>{safeProfile.addressLine1}</span>
                      <span className="block text-mutedText">{safeProfile.addressCity}, {safeProfile.addressState} {safeProfile.addressZip}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-secondaryText">
                    <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-main">Date of Birth</span>
                      <span>{safeProfile.dateOfBirth}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provenance Footer */}
              <div className="mt-6 pt-4 border-t border-subtleBorder flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-mutedText gap-2">
                <div>
                  Last reviewed on <strong>{new Date(safeProfile.lastReviewedAt).toLocaleDateString()}</strong> by {safeProfile.lastReviewedByName} ({safeProfile.lastReviewedByRole})
                </div>
                <Link href="/profile/edit" className="text-secondary font-semibold hover:underline flex items-center gap-1">
                  Update Details <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* 2. Health Information & Clinical Provenance */}
            <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-main flex items-center gap-2">
                    <Activity className="h-4 w-4 text-secondary" />
                    Health Identity & Clinical Provenance
                  </h3>
                  <p className="text-xs text-secondaryText">
                    Every vital record carries provenance and verification tracking.
                  </p>
                </div>
                <Link
                  href="/profile/health-summary"
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  Full Summary <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {sources.map((src) => {
                  const isVerified = src.verificationStatus === 'verified';
                  return (
                    <div 
                      key={src.id}
                      className="p-3.5 rounded-xl border border-subtleBorder bg-canvas-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-main uppercase tracking-wide text-[10px]">
                            {src.category.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                            isVerified 
                              ? 'bg-[#EAF4EE] text-[#1B6346] border border-clinical-successBorder'
                              : 'bg-clinical-warningBg text-[#8C5D17] border border-clinical-warningBorder'
                          }`}>
                            {isVerified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {isVerified ? 'Verified Clinician' : 'Awaiting Review'}
                          </span>
                        </div>
                        <p className="text-secondaryText">
                          Source: <strong>{src.enteredByName}</strong> ({src.enteredByRole})
                        </p>
                        {src.details?.allergies && (
                          <div className="text-main font-semibold">
                            {src.details.allergies.map((a: any) => `${a.substance} (${a.severity})`).join(', ')}
                          </div>
                        )}
                        {src.details?.conditions && (
                          <div className="text-main font-semibold">
                            {src.details.conditions.map((c: any) => `${c.name} [${c.status}]`).join(', ')}
                          </div>
                        )}
                        {src.details?.note && (
                          <div className="text-main italic">
                            &ldquo;{src.details.note}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="sm:text-right shrink-0 text-[11px] text-mutedText">
                        <div>Logged: {new Date(src.createdAt).toLocaleDateString()}</div>
                        {src.verifiedAt && (
                          <div className="text-clinical-success font-semibold">
                            Verified {new Date(src.verifiedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Emergency Contacts Card */}
            <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-main flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-clinical-danger" />
                    Priority Emergency Contacts
                  </h3>
                  <p className="text-xs text-secondaryText">
                    Ordered contact escalation tree. (Non-caregiver assumption strictly enforced).
                  </p>
                </div>
                <Link
                  href="/profile/emergency-contacts"
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  Manage Contacts <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {contacts.map((c) => (
                  <div 
                    key={c.id} 
                    className="p-3.5 rounded-xl border border-subtleBorder bg-canvas-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        #{c.priorityOrder}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-main text-sm">{c.contactName}</span>
                          <span className="text-secondaryText">({c.relationship})</span>
                          {c.isAuthorizedCaregiver ? (
                            <span className="px-2 py-0.5 rounded bg-mint text-primary text-[10px] font-semibold border border-mint-border">
                              Authorized Caregiver
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-canvas-subtle text-mutedText text-[10px] font-medium border border-subtleBorder">
                              Emergency Only (No Health Access)
                            </span>
                          )}
                        </div>
                        <p className="text-mutedText mt-0.5 text-[11px]">{c.notes}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a 
                        href={`tel:${c.phoneNumber}`}
                        className="px-3 py-1.5 rounded-lg bg-white border border-subtleBorder hover:bg-canvas-subtle text-main font-semibold transition-colors flex items-center gap-1.5 touch-target-min"
                      >
                        <Phone className="h-3.5 w-3.5 text-secondary" />
                        <span>{c.phoneNumber}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Preferences, Care Circle & Privacy */}
          <div className="space-y-6">
            {/* Care Preferences Card */}
            <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  Care & Accessibility
                </h3>
                <Link
                  href="/profile/preferences"
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  Edit <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-subtleBorder">
                  <span className="text-secondaryText">Communication:</span>
                  <span className="font-semibold text-main capitalize">{preferences.preferredCommunicationMethod} Call Preferred</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-subtleBorder">
                  <span className="text-secondaryText">Time Format:</span>
                  <span className="font-semibold text-main">{preferences.timeFormat === '12h' ? '12-Hour (AM/PM)' : '24-Hour Military'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-subtleBorder">
                  <span className="text-secondaryText">Text Scaling:</span>
                  <span className="font-semibold text-clinical-success">Large High-Legibility</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-subtleBorder">
                  <span className="text-secondaryText">Voice Briefings:</span>
                  <span className="font-semibold text-main">{preferences.voiceReadoutEnabled ? 'Enabled (0.9x Speed)' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondaryText">Quiet Hours:</span>
                  <span className="font-semibold text-main">{preferences.notificationPreferences.quietHoursStart} – {preferences.notificationPreferences.quietHoursEnd}</span>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-canvas-background border border-subtleBorder text-[11px] text-mutedText">
                  <span className="font-semibold text-secondaryText block mb-0.5">Special Care Notes:</span>
                  {preferences.accessibilityNotes}
                </div>
              </div>
            </div>

            {/* Care Circle Summary */}
            <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Active Care Circle
                </h3>
                <Link
                  href="/care-circle"
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {SYNTHETIC_CARE_CIRCLE.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl bg-canvas-background border border-subtleBorder text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-main">{member.name}</div>
                        <div className="text-[11px] text-secondaryText">{member.relationship}</div>
                      </div>
                    </div>
                    <Badge variant={member.permissionTier === 'full_admin' ? "mint" : "neutral"} size="sm">
                      {member.permissionTier.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy & Sharing Card */}
            <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-main flex items-center gap-2">
                  <Lock className="h-4 w-4 text-secondary" />
                  Access & Sharing
                </h3>
                <Link
                  href="/profile/access"
                  className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                >
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <p className="text-xs text-secondaryText mb-4 leading-relaxed">
                Margaret Sullivan remains at the centre of all care decisions. Access grants can be reviewed or revoked at any time.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-canvas-background border border-subtleBorder flex items-center justify-between">
                  <span className="text-secondaryText">Active Consent Grants:</span>
                  <span className="font-bold text-main">3 Authorized</span>
                </div>
                <div className="p-2.5 rounded-xl bg-canvas-background border border-subtleBorder flex items-center justify-between">
                  <span className="text-secondaryText">Advance Directives:</span>
                  <span className="font-bold text-clinical-success">Documented & Verified</span>
                </div>
              </div>

              <Link
                href="/profile/access"
                className="mt-4 inline-flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-canvas-background border border-subtleBorder hover:bg-canvas-subtle text-xs font-semibold text-secondaryText hover:text-main transition-colors touch-target-min"
              >
                <span>View Full Access Audit</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
