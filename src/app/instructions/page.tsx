'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Pill, 
  Calendar, 
  CheckSquare, 
  ChevronRight, 
  Filter, 
  History, 
  FolderGit2,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { InstructionsNavTabs } from '@/components/features/instructions/instructions-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AppRole } from '@/lib/constants';
import { 
  getCachedInstructions, 
  getCachedInstructionSources 
} from '@/lib/data/instruction-vault-data';
import { CareInstruction, InstructionCategory, InstructionVerificationStatus } from '@/types/caretrace';

export default function InstructionsOverviewPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [instructions, setInstructions] = React.useState<CareInstruction[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<'recent' | 'version' | 'effective'>('recent');

  React.useEffect(() => {
    setInstructions(getCachedInstructions());
  }, []);

  const sources = getCachedInstructionSources();
  const missingSourceCount = sources.filter(s => s.isMissingSourceDetails).length;

  // Metrics
  const activeInstructions = instructions.filter(
    (i) => i.verificationStatus !== 'archived' && i.verificationStatus !== 'superseded'
  );
  const verifiedCount = instructions.filter((i) => i.verificationStatus === 'verified').length;
  const awaitingCount = instructions.filter((i) => i.verificationStatus === 'awaiting_verification').length;
  const supersededCount = instructions.filter((i) => i.verificationStatus === 'superseded').length;
  const archivedCount = instructions.filter((i) => i.verificationStatus === 'archived').length;

  const filteredInstructions = instructions.filter((inst) => {
    const matchesSearch = 
      inst.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.tags && inst.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = statusFilter === 'all' || inst.verificationStatus === statusFilter;
    const matchesCategory = categoryFilter === 'all' || inst.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'version') return b.currentVersionNumber - a.currentVersionNumber;
    if (sortBy === 'effective') return new Date(b.effectiveDate || '').getTime() - new Date(a.effectiveDate || '').getTime();
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const getStatusBadge = (status: InstructionVerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'awaiting_verification':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Rejected</span>
          </span>
        );
      case 'superseded':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            <span>Superseded</span>
          </span>
        );
      case 'archived':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <span>Archived</span>
          </span>
        );
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  const getCategoryLabel = (cat: InstructionCategory) => {
    switch (cat) {
      case 'medication_related': return 'Medication Protocol';
      case 'appointment_related': return 'Appointment Care';
      case 'general_care': return 'General Care';
      case 'mobility_daily_routine': return 'Mobility & Wellness';
      case 'dietary': return 'Dietary & Nutrition';
      case 'follow_up': return 'Clinical Follow-up';
      default: return 'Care Instruction';
    }
  };

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Care Instruction Vault"
        description="Immutable, versioned repository of verified clinical orders, hospital discharge summaries, dietary guidelines, and caregiver directives for Margaret Sullivan."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Instruction Vault' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/instructions/sources">
              <Button variant="outline" size="sm" leftIcon={<FolderGit2 className="h-4 w-4" />}>
                Source Provenance
              </Button>
            </Link>
            <Link href="/instructions/add">
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Add Instruction
              </Button>
            </Link>
          </div>
        }
      >
        <InstructionsNavTabs />

        {/* Missing Source Details Alert Banner */}
        {missingSourceCount > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-900">
                  {missingSourceCount} Source Record with Missing Clinical Documentation
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  CARETRACE requires all care instructions to trace back to an identifiable document, clinician consultation, or patient entry. Instructions backed by incomplete sources are prevented from automatic clinical verification.
                </p>
              </div>
            </div>
            <Link href="/instructions/sources" className="shrink-0">
              <Button variant="outline" size="sm" className="text-xs bg-white text-amber-900 border-amber-300">
                Inspect Sources
              </Button>
            </Link>
          </div>
        )}

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Active Instructions</p>
                <h3 className="text-2xl font-bold text-main mt-1">{activeInstructions.length}</h3>
                <p className="text-xs text-secondary mt-1">{instructions.length} total on record</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Verified Orders</p>
                <h3 className="text-2xl font-bold text-main mt-1">{verifiedCount}</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">Human clinician verified</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Awaiting Review</p>
                <h3 className="text-2xl font-bold text-main mt-1">{awaitingCount}</h3>
                <p className="text-xs text-amber-600 font-medium mt-1">Requires clinical gate</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-subtleBorder bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider">Superseded / Archived</p>
                <h3 className="text-2xl font-bold text-main mt-1">{supersededCount + archivedCount}</h3>
                <p className="text-xs text-secondaryText mt-1">Preserved in history</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-white border border-subtleBorder rounded-2xl shadow-xs mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <Input
                isSearch
                placeholder="Search instructions by title, keyword, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'medication_related', label: 'Medication Related' },
                  { value: 'appointment_related', label: 'Appointment Related' },
                  { value: 'mobility_daily_routine', label: 'Mobility & Routine' },
                  { value: 'dietary', label: 'Dietary Guidance' },
                  { value: 'general_care', label: 'General Care' },
                  { value: 'follow_up', label: 'Clinical Follow-up' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'awaiting_verification', label: 'Awaiting Review' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'superseded', label: 'Superseded' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'recent', label: 'Recently Updated' },
                  { value: 'version', label: 'Highest Version' },
                  { value: 'effective', label: 'Effective Date' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Instruction Cards Feed */}
        <div className="space-y-4">
          {filteredInstructions.length === 0 ? (
            <div className="p-12 text-center bg-white border border-subtleBorder rounded-2xl space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-main">No Instructions Found</h3>
              <p className="text-xs text-secondaryText">No instructions match your search keywords or filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredInstructions.map((inst) => (
              <Card key={inst.id} className="border border-subtleBorder bg-white hover:border-primary/50 transition-colors shadow-xs">
                <CardContent className="p-5 space-y-3.5">
                  {/* Top Bar: Category, Version, Status, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-md">
                        {getCategoryLabel(inst.category)}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md font-mono">
                        v{inst.currentVersionNumber}.0
                      </span>
                      {getStatusBadge(inst.verificationStatus)}
                    </div>
                    <div className="text-xs text-secondaryText font-medium">
                      {inst.effectiveDate ? `Effective: ${inst.effectiveDate}` : `Updated: ${new Date(inst.updatedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-base text-main">
                      <Link href={`/instructions/${inst.id}`} className="hover:text-primary transition-colors">
                        {inst.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed line-clamp-2">
                      {inst.description}
                    </p>
                  </div>

                  {/* Connected CARETRACE Entities */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {inst.relatedMedicationName && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md">
                        <Pill className="w-3 h-3" />
                        <span>Med: {inst.relatedMedicationName}</span>
                      </span>
                    )}
                    {inst.relatedAppointmentTitle && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-md">
                        <Calendar className="w-3 h-3" />
                        <span>Appt: {inst.relatedAppointmentTitle}</span>
                      </span>
                    )}
                    {inst.relatedTaskTitle && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md">
                        <CheckSquare className="w-3 h-3" />
                        <span>Task: {inst.relatedTaskTitle}</span>
                      </span>
                    )}
                    {inst.tags && inst.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] rounded-md font-medium border border-slate-200">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Provenance & Action Row */}
                  <div className="pt-3 border-t border-subtleBorder/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500">
                      {inst.verifiedByName ? (
                        <span>Verified by <strong className="text-slate-800">{inst.verifiedByName}</strong> ({inst.verifiedByRole})</span>
                      ) : (
                        <span>Entered by <strong className="text-slate-800">{inst.createdByName}</strong> ({inst.createdByRole})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link href={`/instructions/${inst.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/instructions/${inst.id}/history`}>
                        <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-600" leftIcon={<History className="w-3.5 h-3.5" />}>
                          History
                        </Button>
                      </Link>
                      <Link href={`/instructions/${inst.id}/edit`}>
                        <Button variant="ghost" size="sm" className="text-xs h-8 text-primary font-bold">
                          Edit New Version
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </PageContainer>
    </AppShell>
  );
}
