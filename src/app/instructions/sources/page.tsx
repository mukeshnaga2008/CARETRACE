'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  FolderGit2, 
  Plus, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  User, 
  Calendar, 
  Paperclip, 
  CheckCircle2, 
  FileCheck,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { InstructionsNavTabs } from '@/components/features/instructions/instructions-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInstructionSources, 
  getCachedInstructions, 
  addInstructionSource 
} from '@/lib/data/instruction-vault-data';
import { InstructionSource, InstructionSourceType } from '@/types/caretrace';

export default function InstructionSourcesPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [sources, setSources] = React.useState<InstructionSource[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  // Modal
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [sourceType, setSourceType] = React.useState<InstructionSourceType>('specialist_consult');
  const [facilityName, setFacilityName] = React.useState('');
  const [providerName, setProviderName] = React.useState('');
  const [providerRole, setProviderRole] = React.useState('');
  const [documentReference, setDocumentReference] = React.useState('');
  const [encounterDate, setEncounterDate] = React.useState('');
  const [rawNotes, setRawNotes] = React.useState('');
  const [isMissingDetails, setIsMissingDetails] = React.useState(false);
  const [notesAboutMissing, setNotesAboutMissing] = React.useState('');
  const [modalError, setModalError] = React.useState('');
  const [feedback, setFeedback] = React.useState('');

  const loadData = () => {
    setSources([...getCachedInstructionSources()]);
  };

  React.useEffect(() => {
    loadData();
    setEncounterDate(new Date().toISOString().split('T')[0]);
  }, []);

  const instructions = getCachedInstructions();

  const filteredSources = sources.filter((s) => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.providerName && s.providerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.facilityName && s.facilityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.documentReference && s.documentReference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || s.sourceType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setModalError('Source title must be at least 3 characters.');
      return;
    }

    const newSource: InstructionSource = {
      id: `src-${Date.now()}`,
      patientId: 'patient-profile-001',
      sourceType,
      title: title.trim(),
      facilityName: facilityName.trim() || undefined,
      providerName: providerName.trim() || undefined,
      providerRole: providerRole.trim() || undefined,
      documentReference: documentReference.trim() || undefined,
      encounterDate: encounterDate || undefined,
      rawNotes: rawNotes.trim() || undefined,
      enteredBy: 'member-david',
      enteredByName: 'David Sullivan',
      enteredByRole: 'Family Care Coordinator',
      entryTimestamp: new Date().toISOString(),
      isMissingSourceDetails: isMissingDetails,
      notesAboutMissingSource: isMissingDetails ? notesAboutMissing.trim() || 'Missing clinician sign-off' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addInstructionSource(newSource);
    loadData();
    setIsCreateOpen(false);
    setTitle('');
    setFacilityName('');
    setProviderName('');
    setProviderRole('');
    setDocumentReference('');
    setRawNotes('');
    setIsMissingDetails(false);
    setNotesAboutMissing('');
    setFeedback(`Source "${newSource.title}" added to provenance registry.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const getSourceTypeBadge = (type: InstructionSourceType) => {
    switch (type) {
      case 'hospital_discharge':
        return <Badge variant="mint">Hospital Discharge</Badge>;
      case 'specialist_consult':
        return <Badge variant="success">Specialist Consult</Badge>;
      case 'lab_diagnostic_report':
        return <Badge variant="neutral">Lab Diagnostic</Badge>;
      case 'caregiver_provided':
        return <Badge variant="warning">Caregiver Intake</Badge>;
      case 'patient_or_representative_entry':
        return <Badge variant="danger">Patient / Verbal Note</Badge>;
      default:
        return <Badge variant="neutral">{type.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Source Provenance Registry"
        description="Every care directive in CARETRACE traces back to an authentic clinical encounter, hospital discharge packet, or documented patient intake."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault', href: '/instructions' },
          { label: 'Provenance Sources' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setModalError('');
              setIsCreateOpen(true);
            }}
          >
            Add Source Document
          </Button>
        }
      >
        <InstructionsNavTabs />

        {feedback && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Provenance Integrity Notice */}
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-slate-900">
              Anti-Fabrication & Source Integrity Standard
            </p>
            <p>
              CARETRACE strictly forbids fabricating clinician signatures, hospital seals, or verification events. If an instruction originated from an unverified verbal conversation or neighbor note, it is clearly flagged as having missing clinical documentation.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-white border border-subtleBorder rounded-2xl shadow-xs mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <Input
                isSearch
                placeholder="Search sources by title, doctor, facility, or document reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sm:col-span-4">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Source Types' },
                  { value: 'hospital_discharge', label: 'Hospital Discharge' },
                  { value: 'specialist_consult', label: 'Specialist Consultation' },
                  { value: 'lab_diagnostic_report', label: 'Lab Diagnostic Report' },
                  { value: 'caregiver_provided', label: 'Caregiver Provided' },
                  { value: 'patient_or_representative_entry', label: 'Patient / Representative Entry' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Sources Cards Feed */}
        <div className="space-y-4">
          {filteredSources.map((source) => {
            const backedInstructions = instructions.filter((i) => i.sourceId === source.id);

            return (
              <Card key={source.id} className="border border-subtleBorder bg-white shadow-xs hover:border-primary/50 transition-colors">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base text-main">{source.title}</h3>
                      {getSourceTypeBadge(source.sourceType)}
                      {source.isMissingSourceDetails && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Missing Documentation</span>
                        </span>
                      )}
                    </div>
                    {source.encounterDate && (
                      <span className="text-xs text-secondaryText flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Encounter: {source.encounterDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Facility / Clinic:</span>
                      <strong className="text-slate-800">{source.facilityName || 'Not Documented'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Prescriber / Provider:</span>
                      <strong className="text-slate-800">{source.providerName || 'Patient/Family Entry'}</strong>
                      {source.providerRole && <span className="text-slate-500 text-[11px] block">{source.providerRole}</span>}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Document ID / Order:</span>
                      <strong className="font-mono text-slate-800">{source.documentReference || 'VERBAL-UNRECORDED'}</strong>
                    </div>
                  </div>

                  {/* Raw Notes Excerpt */}
                  {source.rawNotes && (
                    <p className="text-xs text-slate-700 italic border-l-2 border-primary/40 pl-3">
                      &ldquo;{source.rawNotes}&rdquo;
                    </p>
                  )}

                  {/* Attached Document File */}
                  {source.attachments && source.attachments.length > 0 && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-700" />
                        <span className="font-bold">{source.attachments[0].fileName}</span>
                        <span className="text-blue-600 text-[11px]">({(source.attachments[0].fileSize / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                        Encrypted Access
                      </span>
                    </div>
                  )}

                  {/* Missing Source Details Alert */}
                  {source.isMissingSourceDetails && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Source Defect Notice:</span>
                      </span>
                      <p>{source.notesAboutMissingSource || 'No formal doctor signature or hospital seal provided.'}</p>
                    </div>
                  )}

                  {/* Instructions stemming from this source */}
                  <div className="pt-3 border-t border-subtleBorder flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600 font-medium">
                      Backed Instructions in Vault: <strong className="text-primary">{backedInstructions.length}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {backedInstructions.map((inst) => (
                        <Link key={inst.id} href={`/instructions/${inst.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:bg-primary/10">
                            {inst.title.split(' ')[0]}... &rarr;
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modal: Create Source Record */}
        <Dialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add Clinical Source Document"
          description="Log an encounter summary, clinic letter, or hospital packet in the provenance ledger."
        >
          <form onSubmit={handleCreateSource} className="space-y-4 pt-2">
            <Input
              label="Source Title"
              placeholder="e.g. Springfield Cardiology Consultation Letter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Source Type"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as InstructionSourceType)}
                options={[
                  { value: 'hospital_discharge', label: 'Hospital Discharge Summary' },
                  { value: 'specialist_consult', label: 'Specialist Consultation' },
                  { value: 'primary_care_visit', label: 'Primary Care Visit' },
                  { value: 'lab_diagnostic_report', label: 'Lab Diagnostic Report' },
                  { value: 'caregiver_provided', label: 'Caregiver Observation' },
                  { value: 'patient_or_representative_entry', label: 'Patient / Representative Entry' },
                ]}
              />

              <Input
                label="Encounter Date"
                type="date"
                value={encounterDate}
                onChange={(e) => setEncounterDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Facility / Clinic"
                placeholder="e.g. Metro Heart & Vascular"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
              />

              <Input
                label="Clinician Name & Role"
                placeholder="e.g. Dr. Arthur Vance, MD (Cardiology)"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>

            <Input
              label="Document Reference Code / Rx ID"
              placeholder="e.g. DISCH-STJUDE-2026-8819"
              value={documentReference}
              onChange={(e) => setDocumentReference(e.target.value)}
            />

            <Textarea
              label="Summary Notes / Excerpt from Source"
              placeholder="Paste or transcribe the verbatim clinical directive or encounter summary..."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              rows={3}
            />

            {/* Incomplete documentation flag */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
              <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMissingDetails}
                  onChange={(e) => setIsMissingDetails(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Flag as Incomplete Documentation / Unverified Source</span>
              </label>

              {isMissingDetails && (
                <Textarea
                  placeholder="Explain missing source details (e.g. Patient verbal report, doctor signature not yet obtained)..."
                  value={notesAboutMissing}
                  onChange={(e) => setNotesAboutMissing(e.target.value)}
                  rows={2}
                />
              )}
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-subtleBorder">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Record Source Provenance
              </Button>
            </div>
          </form>
        </Dialog>

      </PageContainer>
    </AppShell>
  );
}
