'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { ProfileNavTabs } from '@/components/features/profile/profile-nav-tabs';
import { INITIAL_PATIENT_PROFILE } from '@/lib/data/patient-profile-data';
import { AppRole, USER_PERSPECTIVES } from '@/lib/constants';

export default function EditPatientProfilePage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = React.useState<AppRole>('patient');

  const [fullName, setFullName] = React.useState(INITIAL_PATIENT_PROFILE.fullName);
  const [preferredName, setPreferredName] = React.useState(INITIAL_PATIENT_PROFILE.preferredName);
  const [phoneNumber, setPhoneNumber] = React.useState(INITIAL_PATIENT_PROFILE.phoneNumber);
  const [email, setEmail] = React.useState(INITIAL_PATIENT_PROFILE.email);
  const [addressLine1, setAddressLine1] = React.useState(INITIAL_PATIENT_PROFILE.addressLine1);
  const [addressCity, setAddressCity] = React.useState(INITIAL_PATIENT_PROFILE.addressCity);
  const [addressState, setAddressState] = React.useState(INITIAL_PATIENT_PROFILE.addressState);
  const [addressZip, setAddressZip] = React.useState(INITIAL_PATIENT_PROFILE.addressZip);
  const [bloodType, setBloodType] = React.useState(INITIAL_PATIENT_PROFILE.bloodType);
  const [primaryDoctorName, setPrimaryDoctorName] = React.useState(INITIAL_PATIENT_PROFILE.primaryDoctorName);
  const [primaryClinic, setPrimaryClinic] = React.useState(INITIAL_PATIENT_PROFILE.primaryClinic);
  const [preferredLanguage, setPreferredLanguage] = React.useState(INITIAL_PATIENT_PROFILE.preferredLanguage);

  const [isLoading, setIsLoading] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isCaregiver = activeRole === 'caregiver';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCaregiver) {
      setStatusMessage({
        type: 'error',
        text: 'Caregiver accounts hold read-only permissions for patient health profile. Please request edits through the family administrator or patient.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          preferredName,
          phoneNumber,
          email,
          addressLine1,
          addressCity,
          addressState,
          addressZip,
          bloodType,
          primaryDoctorName,
          primaryClinic,
          preferredLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to update patient profile.',
        });
        setIsLoading(false);
        return;
      }

      setStatusMessage({
        type: 'success',
        text: 'Patient health profile successfully updated and logged in clinical audit trail.',
      });

      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error communicating with profile update endpoint.',
      });
      setIsLoading(false);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Edit Health Identity"
        description="Update Margaret Sullivan's clinical identifiers, contact channels, and primary care providers."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Patient Profile', href: '/profile' },
          { label: 'Edit' },
        ]}
      >
        <ProfileNavTabs />

        {isCaregiver && (
          <div className="mb-6 p-4 rounded-xl bg-clinical-warningBg border border-clinical-warningBorder flex items-start gap-3 text-sm text-[#8C5D17]">
            <Lock className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Read-Only Permission Tier</p>
              <p className="text-xs mt-0.5">
                Caregivers cannot modify patient legal identifiers or addresses. Form fields are locked for this session.
              </p>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-[#EAF4EE] border border-clinical-successBorder text-[#1B6346]'
              : 'bg-clinical-dangerBg border border-clinical-dangerBorder text-[#852D2D]'
          }`} role="status">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{statusMessage.type === 'success' ? 'Update Saved' : 'Update Notice'}</p>
              <p className="text-xs mt-0.5">{statusMessage.text}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Legal & Preferred Names */}
          <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-main border-b border-subtleBorder pb-3">
              1. Patient Identification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-main mb-1.5">
                  Full Legal Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  disabled={isCaregiver}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label htmlFor="preferredName" className="block text-xs font-bold text-main mb-1.5">
                  Preferred / Familiar Name *
                </label>
                <input
                  id="preferredName"
                  type="text"
                  required
                  disabled={isCaregiver}
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="e.g. Peggy"
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label htmlFor="bloodType" className="block text-xs font-bold text-main mb-1.5">
                  Blood Group
                </label>
                <select
                  id="bloodType"
                  disabled={isCaregiver}
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                >
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="B-">B Negative (B-)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                  <option value="AB-">AB Negative (AB-)</option>
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label htmlFor="preferredLanguage" className="block text-xs font-bold text-main mb-1.5">
                  Preferred Language
                </label>
                <select
                  id="preferredLanguage"
                  disabled={isCaregiver}
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="zh">Chinese (Mandarin)</option>
                  <option value="fr">French (Français)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Address */}
          <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-main border-b border-subtleBorder pb-3">
              2. Private Contact & Residence (Restricted Visibility)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-main mb-1.5">
                  Direct Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  disabled={isCaregiver}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-main mb-1.5">
                  Contact Email
                </label>
                <input
                  id="email"
                  type="email"
                  disabled={isCaregiver}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="addressLine1" className="block text-xs font-bold text-main mb-1.5">
                  Street Address
                </label>
                <input
                  id="addressLine1"
                  type="text"
                  disabled={isCaregiver}
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label htmlFor="addressCity" className="block text-xs font-bold text-main mb-1.5">
                  City
                </label>
                <input
                  id="addressCity"
                  type="text"
                  disabled={isCaregiver}
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="addressState" className="block text-xs font-bold text-main mb-1.5">
                    State
                  </label>
                  <input
                    id="addressState"
                    type="text"
                    disabled={isCaregiver}
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="addressZip" className="block text-xs font-bold text-main mb-1.5">
                    Postal Code
                  </label>
                  <input
                    id="addressZip"
                    type="text"
                    disabled={isCaregiver}
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Primary Healthcare Provider */}
          <div className="rounded-2xl border border-subtleBorder bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-main border-b border-subtleBorder pb-3">
              3. Primary Care Providers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primaryDoctor" className="block text-xs font-bold text-main mb-1.5">
                  Attending Doctor / Specialist
                </label>
                <input
                  id="primaryDoctor"
                  type="text"
                  disabled={isCaregiver}
                  value={primaryDoctorName}
                  onChange={(e) => setPrimaryDoctorName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label htmlFor="primaryClinic" className="block text-xs font-bold text-main mb-1.5">
                  Primary Clinic / Hospital Affiliation
                </label>
                <input
                  id="primaryClinic"
                  type="text"
                  disabled={isCaregiver}
                  value={primaryClinic}
                  onChange={(e) => setPrimaryClinic(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-subtleBorder bg-canvas-background text-sm text-main disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href="/profile"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-subtleBorder bg-white hover:bg-canvas-subtle text-secondaryText hover:text-main text-xs sm:text-sm font-semibold transition-colors touch-target-min"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel & Return</span>
            </Link>

            <button
              type="submit"
              disabled={isLoading || isCaregiver}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 touch-target-min"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
