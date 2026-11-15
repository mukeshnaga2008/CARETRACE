'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  Save, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  Pill, 
  Calendar, 
  CheckSquare, 
  FolderGit2,
  Lock,
  Info
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { InstructionsNavTabs } from '@/components/features/instructions/instructions-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInstructionSources, 
  addCareInstruction 
} from '@/lib/data/instruction-vault-data';
import { 
  InstructionCategory, 
  CareInstruction, 
  InstructionSource 
} from '@/types/caretrace';

export default function AddInstructionPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [sources, setSources] = React.useState<InstructionSource[]>([]);

  // Form states
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<InstructionCategory>('medication_related');
  const [description, setDescription] = React.useState('');
  const [sourceId, setSourceId] = React.useState('');
  const [effectiveDate, setEffectiveDate] = React.useState('');
  const [expirationDate, setExpirationDate] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  
  // Structured content
  const [frequency, setFrequency] = React.useState('');
  const [targetParameter, setTargetParameter] = React.useState('');
  const [guidelinesText, setGuidelinesText] = React.useState('');
  const [precautionsText, setPrecautionsText] = React.useState('');
  
  // Connected entity labels
  const [relatedMedicationId, setRelatedMedicationId] = React.useState('');
  const [relatedAppointmentId, setRelatedAppointmentId] = React.useState('');
  const [relatedTaskId, setRelatedTaskId] = React.useState('');

  const [formError, setFormError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const srcList = getCachedInstructionSources();
    setSources(srcList);
    if (srcList.length > 0) {
      setSourceId(srcList[0].id);
    }
    // Default effective date: today
    setEffectiveDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setFormError('Instruction title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setFormError('Plain-language description must be at least 5 characters.');
      return;
    }
    if (!sourceId) {
      setFormError('A source provenance document or consultation reference is mandatory.');
      return;
    }

    setIsSubmitting(true);

    const sourceObj = sources.find(s => s.id === sourceId);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const guidelines = guidelinesText.split('\n').map(g => g.trim()).filter(Boolean);
    const precautions = precautionsText.split('\n').map(p => p.trim()).filter(Boolean);

    const newInstruction: CareInstruction = {
      id: `inst-${Date.now()}`,
      patientId: 'patient-profile-001',
      title: title.trim(),
      category,
      description: description.trim(),
      structuredContent: (frequency || targetParameter || guidelines.length || precautions.length) ? {
        frequency: frequency.trim() || undefined,
        targetParameter: targetParameter.trim() || undefined,
        guidelines: guidelines.length ? guidelines : undefined,
        precautions: precautions.length ? precautions : undefined,
      } : undefined,
      currentVersionNumber: 1,
      verificationStatus: 'awaiting_verification',
      sourceId,
      source: sourceObj,
      effectiveDate: effectiveDate || undefined,
      expirationDate: expirationDate || undefined,
      tags: tags.length ? tags : undefined,
      relatedMedicationId: relatedMedicationId || undefined,
      relatedAppointmentId: relatedAppointmentId || undefined,
      relatedTaskId: relatedTaskId || undefined,
      createdBy: 'member-david',
      createdByName: 'David Sullivan',
      createdByRole: 'Family Care Coordinator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCareInstruction(newInstruction);
    router.push(`/instructions/${newInstruction.id}`);
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Archive New Care Instruction"
        description="Add a source-backed medical, dietary, or daily-care directive to Margaret Sullivan's permanent instruction vault with structured parameters."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault', href: '/instructions' },
          { label: 'Add Instruction' },
        ]}
        actions={
          <Link href="/instructions">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Vault
            </Button>
          </Link>
        }
      >
        <InstructionsNavTabs />

        {/* Safety Gate Alert */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3.5">
          <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <span className="font-bold">Human Clinical Gate:</span> Newly created instructions automatically enter the <span className="font-bold underline">Awaiting Review</span> status. CARETRACE does not execute automatic medication or schedule changes until an authorized physician or nurse explicitly verifies the source document.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Core Fields (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-subtleBorder bg-white shadow-sm">
                <CardHeader className="border-b border-subtleBorder pb-4">
                  <CardTitle className="text-base font-bold text-main">Instruction Information</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <Input
                    label="Instruction Title"
                    placeholder="e.g. Resting Blood Pressure Check Prior to Morning Metoprolol"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Instruction Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as InstructionCategory)}
                      options={[
                        { value: 'medication_related', label: 'Medication Related' },
                        { value: 'appointment_related', label: 'Appointment Related' },
                        { value: 'mobility_daily_routine', label: 'Mobility & Routine' },
                        { value: 'dietary', label: 'Dietary Guidance' },
                        { value: 'general_care', label: 'General Care' },
                        { value: 'follow_up', label: 'Clinical Follow-up' },
                        { value: 'other', label: 'Other Directives' },
                      ]}
                    />

                    <Select
                      label="Source Provenance Document"
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      options={sources.map(s => ({
                        value: s.id,
                        label: `${s.title} (${s.providerName || s.facilityName || 'Record'})`,
                      }))}
                    />
                  </div>

                  <Textarea
                    label="Plain-Language Instruction Description"
                    placeholder="Explain the care directive clearly in patient-friendly terms..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Effective Date"
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                    <Input
                      label="Expiration / Review Date (Optional)"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Descriptive Tags (Comma separated)"
                    placeholder="Cardiology, Blood Pressure, Vitals, Discharge"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Structured Metadata Card */}
              <Card className="border border-subtleBorder bg-white shadow-sm">
                <CardHeader className="border-b border-subtleBorder pb-4">
                  <CardTitle className="text-base font-bold text-main">Structured Clinical Parameters (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Timing / Frequency"
                      placeholder="e.g. Daily at 08:00 AM before breakfast"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    />
                    <Input
                      label="Target Parameter / Safety Bound"
                      placeholder="e.g. Systolic BP ≥ 100 mmHg, Pulse ≥ 55 bpm"
                      value={targetParameter}
                      onChange={(e) => setTargetParameter(e.target.value)}
                    />
                  </div>

                  <Textarea
                    label="Specific Guidelines (One guideline per line)"
                    placeholder="Sit quietly for 5 minutes prior to measurement&#10;Place cuff on left arm at heart level"
                    value={guidelinesText}
                    onChange={(e) => setGuidelinesText(e.target.value)}
                    rows={3}
                  />

                  <Textarea
                    label="Clinical Precautions & Stop Conditions"
                    placeholder="Do not administer dose if pulse < 55 bpm&#10;Recheck recumbent if systolic < 100 mmHg"
                    value={precautionsText}
                    onChange={(e) => setPrecautionsText(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Relationships & Source Provenance Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Linked Entities */}
              <Card className="border border-subtleBorder bg-white shadow-sm">
                <CardHeader className="border-b border-subtleBorder pb-4">
                  <CardTitle className="text-base font-bold text-main">Connected Healthcare Records</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1.5 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-blue-600" />
                      <span>Link to Medication Regimen (Optional)</span>
                    </label>
                    <Select
                      value={relatedMedicationId}
                      onChange={(e) => setRelatedMedicationId(e.target.value)}
                      options={[
                        { value: '', label: 'None (General Instruction)' },
                        { value: 'med-001', label: 'Lisinopril 10mg Oral Tablet' },
                        { value: 'med-002', label: 'Metoprolol Succinate ER 50mg' },
                        { value: 'med-003', label: 'Atorvastatin Calcium 20mg' },
                        { value: 'med-004', label: 'Amlodipine Besylate 5mg' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-main mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>Link to Clinic Visit (Optional)</span>
                    </label>
                    <Select
                      value={relatedAppointmentId}
                      onChange={(e) => setRelatedAppointmentId(e.target.value)}
                      options={[
                        { value: '', label: 'None (Not Visit-Specific)' },
                        { value: 'appt-001', label: 'Dr. Eleanor Vance Cardiology Visit' },
                        { value: 'appt-002', label: 'Springfield Lab Routine Blood Panel' },
                        { value: 'appt-003', label: 'Dr. Robert Chen Geriatric Consultation' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-main mb-1.5 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link to Coordinated Care Task (Optional)</span>
                    </label>
                    <Select
                      value={relatedTaskId}
                      onChange={(e) => setRelatedTaskId(e.target.value)}
                      options={[
                        { value: '', label: 'None (Standalone Guidance)' },
                        { value: 'task-001', label: 'Pick up Lisinopril 10mg refill' },
                        { value: 'task-002', label: 'Review Fasting Guidelines with Patient' },
                        { value: 'task-003', label: 'Daily Morning Blood Pressure Recording' },
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Provenance Card Preview */}
              <Card className="border border-subtleBorder bg-slate-50 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Provenance Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600">
                  <p>
                    <strong>Creator:</strong> David Sullivan (Family Care Coordinator)
                  </p>
                  <p>
                    <strong>Patient Record:</strong> Margaret Sullivan (DOB: 1948-04-12)
                  </p>
                  <p>
                    <strong>Version:</strong> Initial (v1.0)
                  </p>
                  <p>
                    <strong>Status on Save:</strong> Awaiting Clinical Verification
                  </p>
                </CardContent>
              </Card>

              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                leftIcon={<Save className="w-4 h-4" />}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Archiving Instruction...' : 'Archive Instruction in Vault'}
              </Button>

            </div>

          </div>
        </form>

      </PageContainer>
    </AppShell>
  );
}
