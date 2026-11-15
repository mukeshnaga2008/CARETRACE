'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  Save, 
  ShieldAlert, 
  AlertCircle, 
  History, 
  Pill, 
  Calendar, 
  CheckSquare, 
  Info,
  GitCommit
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInstructions, 
  getCachedInstructionSources, 
  createNewInstructionVersion 
} from '@/lib/data/instruction-vault-data';
import { 
  InstructionCategory, 
  CareInstruction, 
  InstructionSource 
} from '@/types/caretrace';

export default function EditInstructionVersionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [instruction, setInstruction] = React.useState<CareInstruction | null>(null);
  const [sources, setSources] = React.useState<InstructionSource[]>([]);

  // Form states
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<InstructionCategory>('medication_related');
  const [description, setDescription] = React.useState('');
  const [sourceId, setSourceId] = React.useState('');
  const [changeReason, setChangeReason] = React.useState('');
  const [effectiveDate, setEffectiveDate] = React.useState('');
  const [expirationDate, setExpirationDate] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  
  // Structured content
  const [frequency, setFrequency] = React.useState('');
  const [targetParameter, setTargetParameter] = React.useState('');
  const [guidelinesText, setGuidelinesText] = React.useState('');
  const [precautionsText, setPrecautionsText] = React.useState('');

  const [relatedMedicationId, setRelatedMedicationId] = React.useState('');
  const [relatedAppointmentId, setRelatedAppointmentId] = React.useState('');
  const [relatedTaskId, setRelatedTaskId] = React.useState('');

  const [formError, setFormError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const inst = getCachedInstructions().find((i) => i.id === id);
    if (!inst) return;
    setInstruction(inst);

    setTitle(inst.title);
    setCategory(inst.category);
    setDescription(inst.description);
    setSourceId(inst.sourceId);
    setEffectiveDate(inst.effectiveDate || new Date().toISOString().split('T')[0]);
    setExpirationDate(inst.expirationDate || '');
    setTagsInput(inst.tags ? inst.tags.join(', ') : '');

    if (inst.structuredContent) {
      setFrequency(inst.structuredContent.frequency || '');
      setTargetParameter(inst.structuredContent.targetParameter || '');
      setGuidelinesText(inst.structuredContent.guidelines ? inst.structuredContent.guidelines.join('\n') : '');
      setPrecautionsText(inst.structuredContent.precautions ? inst.structuredContent.precautions.join('\n') : '');
    }

    setRelatedMedicationId(inst.relatedMedicationId || '');
    setRelatedAppointmentId(inst.relatedAppointmentId || '');
    setRelatedTaskId(inst.relatedTaskId || '');

    setSources(getCachedInstructionSources());
  }, [id]);

  if (!instruction) {
    return (
      <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
        <PageContainer
          title="Instruction Not Found"
          breadcrumbs={[
            { label: 'Overview', href: '/dashboard' },
            { label: 'Instruction Vault', href: '/instructions' },
          ]}
        >
          <div className="p-8 text-center text-xs text-secondaryText">Instruction record not found.</div>
        </PageContainer>
      </AppShell>
    );
  }

  const nextVersionNumber = instruction.currentVersionNumber + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setFormError('Title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setFormError('Description must be at least 5 characters.');
      return;
    }
    if (!changeReason.trim() || changeReason.trim().length < 5) {
      setFormError('A documented reason for this new version (min 5 characters) is mandatory.');
      return;
    }

    setIsSubmitting(true);

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const guidelines = guidelinesText.split('\n').map(g => g.trim()).filter(Boolean);
    const precautions = precautionsText.split('\n').map(p => p.trim()).filter(Boolean);

    const updated = createNewInstructionVersion(
      instruction.id,
      {
        title: title.trim(),
        category,
        description: description.trim(),
        sourceId,
        changeReason: changeReason.trim(),
        effectiveDate: effectiveDate || undefined,
        expirationDate: expirationDate || undefined,
        tags: tags.length ? tags : undefined,
        structuredContent: (frequency || targetParameter || guidelines.length || precautions.length) ? {
          frequency: frequency.trim() || undefined,
          targetParameter: targetParameter.trim() || undefined,
          guidelines: guidelines.length ? guidelines : undefined,
          precautions: precautions.length ? precautions : undefined,
        } : undefined,
        relatedMedicationId: relatedMedicationId || undefined,
        relatedAppointmentId: relatedAppointmentId || undefined,
        relatedTaskId: relatedTaskId || undefined,
      },
      {
        id: 'member-david',
        name: 'David Sullivan',
        role: 'Family Care Coordinator',
      }
    );

    if (updated) {
      router.push(`/instructions/${instruction.id}`);
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title={`Edit Instruction: Create Version ${nextVersionNumber}.0`}
        description={`Modifying "${instruction.title}". A new immutable version will be created, resetting verification status to Awaiting Review.`}
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault', href: '/instructions' },
          { label: instruction.title, href: `/instructions/${instruction.id}` },
          { label: `New Version (${nextVersionNumber}.0)` },
        ]}
        actions={
          <Link href={`/instructions/${instruction.id}`}>
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Cancel Edit
            </Button>
          </Link>
        }
      >
        {/* Version Reset Security Warning */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Strict Versioning Policy:</span> Edits in CARETRACE never overwrite previous records. Publishing this form increments the version to <strong className="font-mono">v{nextVersionNumber}.0</strong> and returns the instruction to <strong>Awaiting Review</strong> status. Previous version {instruction.currentVersionNumber}.0 is permanently preserved in the immutable version history.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Form (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Mandatory Change Reason Card */}
              <Card className="border-2 border-primary/30 bg-primary/5 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-main flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-primary" />
                    <span>Mandatory Reason for New Version (Audit Required)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    placeholder="Document clinical or operational reason for this revision (e.g. Lowered systolic withholding threshold from 110 to 100 mmHg per cardiology consultation)..."
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    rows={3}
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    *This rationale will be recorded in the immutable version diff and displayed to clinical reviewers.
                  </p>
                </CardContent>
              </Card>

              {/* Updated Content Card */}
              <Card className="border border-subtleBorder bg-white shadow-sm">
                <CardHeader className="border-b border-subtleBorder pb-4">
                  <CardTitle className="text-base font-bold text-main">Updated Instruction Details</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <Input
                    label="Instruction Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Category"
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
                      label="Source Provenance Reference"
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
                      label="Expiration Date (Optional)"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Descriptive Tags (Comma separated)"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Structured Parameters Card */}
              <Card className="border border-subtleBorder bg-white shadow-sm">
                <CardHeader className="border-b border-subtleBorder pb-4">
                  <CardTitle className="text-base font-bold text-main">Structured Parameters (v{nextVersionNumber}.0)</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Timing / Frequency"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    />
                    <Input
                      label="Target Parameter / Safety Bound"
                      value={targetParameter}
                      onChange={(e) => setTargetParameter(e.target.value)}
                    />
                  </div>

                  <Textarea
                    label="Guidelines (One per line)"
                    value={guidelinesText}
                    onChange={(e) => setGuidelinesText(e.target.value)}
                    rows={3}
                  />

                  <Textarea
                    label="Precautions & Stop Conditions"
                    value={precautionsText}
                    onChange={(e) => setPrecautionsText(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Comparison Preview & Links (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Linked Entities */}
              <Card className="border border-subtleBorder bg-white shadow-sm">
                <CardHeader className="border-b border-subtleBorder pb-3">
                  <CardTitle className="text-sm font-bold text-main">Connected Healthcare Records</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1.5 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-blue-600" />
                      <span>Link to Medication</span>
                    </label>
                    <Select
                      value={relatedMedicationId}
                      onChange={(e) => setRelatedMedicationId(e.target.value)}
                      options={[
                        { value: '', label: 'None' },
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
                      <span>Link to Appointment</span>
                    </label>
                    <Select
                      value={relatedAppointmentId}
                      onChange={(e) => setRelatedAppointmentId(e.target.value)}
                      options={[
                        { value: '', label: 'None' },
                        { value: 'appt-001', label: 'Dr. Eleanor Vance Cardiology Visit' },
                        { value: 'appt-002', label: 'Springfield Lab Routine Blood Panel' },
                        { value: 'appt-003', label: 'Dr. Robert Chen Geriatric Consultation' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-main mb-1.5 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link to Care Task</span>
                    </label>
                    <Select
                      value={relatedTaskId}
                      onChange={(e) => setRelatedTaskId(e.target.value)}
                      options={[
                        { value: '', label: 'None' },
                        { value: 'task-001', label: 'Pick up Lisinopril 10mg refill' },
                        { value: 'task-002', label: 'Review Fasting Guidelines with Patient' },
                        { value: 'task-003', label: 'Daily Morning Blood Pressure Recording' },
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Version Comparison Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-primary" />
                  <span>Version Progression</span>
                </h4>
                <div className="flex items-center justify-between font-mono pt-1 border-t border-slate-200">
                  <span>Current Live Version:</span>
                  <span className="font-bold text-slate-800">v{instruction.currentVersionNumber}.0</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span>New Target Version:</span>
                  <span className="font-bold text-primary">v{nextVersionNumber}.0</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>Editor:</span>
                  <span className="font-bold">David Sullivan</span>
                </div>
              </div>

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
                {isSubmitting ? 'Publishing Version...' : `Publish v${nextVersionNumber}.0 & Submit for Review`}
              </Button>

            </div>

          </div>
        </form>

      </PageContainer>
    </AppShell>
  );
}
