'use client';

import { AppShell } from '@/components/common/app-shell';
import { FeaturePlaceholder } from '@/components/common/feature-placeholder';
import { Lock, ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <AppShell
      breadcrumbs={[{ label: 'Privacy & Access' }]}
      pageTitle="Privacy & Consent Governance"
      pageDescription="Granular patient data-sharing consent scopes, break-glass emergency access protocols, and authorized credential tokens."
    >
      <FeaturePlaceholder
        moduleName="Privacy, Consent & Access Centre"
        modulePhase="3 / 8"
        description="The Privacy & Access Centre ensures the elderly patient remains at the absolute centre of all care decisions, enforcing granular data-sharing controls and transparent access logging."
        icon={Lock}
        plannedCapabilities={[
          "Granular consent management: full_medical, medication_only, emergency_summary, care_circle_coordination.",
          "Instant consent revocation by the patient or authorized healthcare proxy.",
          "Emergency 'Break-Glass' access protocol allowing EMS or hospital emergency staff temporary access, triggering immediate Care Circle alerts.",
          "Access pass tokens with explicit expiration dates and query count tracking.",
          "Patient-level isolation enforced via Supabase Row Level Security (RLS) policies."
        ]}
        databaseTables={[
          "consent_records",
          "access_grants",
          "care_circle_members",
          "audit_events"
        ]}
        securityScope="Enforces strict patient-level isolation. Sensitive medical records cannot be accessed across patient boundaries under any condition."
      />
    </AppShell>
  );
}
