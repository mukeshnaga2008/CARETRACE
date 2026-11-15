'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Pill,
  CheckSquare,
  Calendar,
  ClipboardCheck,
  Bell,
  ArrowRight,
  User,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareGapsNavTabs } from '@/components/features/care-gaps/care-gaps-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  getCachedCareGaps,
  detectCareGaps,
} from '@/lib/data/care-gap-intelligence-data';
import { CareGapRecord, CareGapPriority, CareGapCategory } from '@/types/caretrace';

export default function CareGapsRadarPage() {
  const [gaps, setGaps] = React.useState<CareGapRecord[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [quickTab, setQuickTab] = React.useState<'all' | 'high' | 'unassigned' | 'overdue'>('all');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState('');

  React.useEffect(() => {
    setGaps(getCachedCareGaps());
  }, []);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage('');
    try {
      const res = await fetch('/api/care-gaps/detect', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.allGaps) {
        setGaps([...data.allGaps]);
        setScanMessage(data.message || 'Scan completed successfully.');
      }
    } catch {
      const result = detectCareGaps();
      setGaps([...result.allGaps]);
      setScanMessage(
        `Scan completed. ${result.newGapsCount} new gap(s) identified, ${result.updatedGapsCount} active gap(s) verified.`
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Compute metrics
  const activeGaps = gaps.filter((g) => g.status !== 'resolved' && g.status !== 'dismissed');
  const highPriorityGaps = activeGaps.filter((g) => g.priority === 'high_priority');
  const unassignedGaps = activeGaps.filter((g) => !g.assignedToId);
  const overdueGaps = activeGaps.filter(
    (g) => g.gapType === 'overdue_task' || g.gapType === 'appointment_prep_overdue' || g.gapType === 'overdue_unconfirmed_event'
  );
  const resolvedGaps = gaps.filter((g) => g.status === 'resolved');

  // Medication, Task, Appointment, Review, Notification counts
  const medGapsCount = activeGaps.filter((g) => g.category === 'medication').length;
  const taskGapsCount = activeGaps.filter((g) => g.category === 'responsibility').length;
  const apptGapsCount = activeGaps.filter((g) => g.category === 'appointment').length;
  const reviewGapsCount = activeGaps.filter((g) => g.category === 'instruction_continuity').length;
  const notifGapsCount = activeGaps.filter((g) => g.category === 'notification').length;

  const filteredGaps = activeGaps.filter((gap) => {
    // Quick tab filtering
    if (quickTab === 'high' && gap.priority !== 'high_priority') return false;
    if (quickTab === 'unassigned' && gap.assignedToId) return false;
    if (
      quickTab === 'overdue' &&
      gap.gapType !== 'overdue_task' &&
      gap.gapType !== 'appointment_prep_overdue' &&
      gap.gapType !== 'overdue_unconfirmed_event'
    )
      return false;

    // Search query
    const matchesSearch =
      gap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gap.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gap.relatedRecordTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || gap.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || gap.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || gap.status === statusFilter;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (priority: CareGapPriority) => {
    switch (priority) {
      case 'high_priority':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-900 border-red-300 font-bold text-[11px]">
            <AlertTriangle className="w-3 h-3 mr-1 text-red-700" />
            High Priority
          </Badge>
        );
      case 'attention_required':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-semibold text-[11px]">
            <Clock className="w-3 h-3 mr-1 text-amber-700" />
            Attention Required
          </Badge>
        );
      case 'routine':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300 font-semibold text-[11px]">
            Routine Coordination
          </Badge>
        );
      case 'informational':
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-300 text-[11px]">
            Informational
          </Badge>
        );
    }
  };

  const getCategoryIcon = (category: CareGapCategory) => {
    switch (category) {
      case 'medication':
        return <Pill className="w-4 h-4 text-purple-700" />;
      case 'responsibility':
        return <CheckSquare className="w-4 h-4 text-teal-700" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-700" />;
      case 'instruction_continuity':
        return <ClipboardCheck className="w-4 h-4 text-indigo-700" />;
      case 'notification':
        return <Bell className="w-4 h-4 text-amber-700" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Gap Radar' }]}
      pageTitle="Care Gap Radar &amp; Coordination Intelligence"
      pageDescription="Continuous cross-module surveillance detecting incomplete tasks, unconfirmed doses, pending verifications, and delivery breakdowns."
    >
      <PageContainer>
        <CareGapsNavTabs />

        {/* CLINICAL SAFETY & COORDINATION GUARANTEE */}
        <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-teal-900">
                Care Coordination &amp; Visibility Guardrail
              </h2>
              <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
                CARETRACE identifies coordination situations to keep care teams aligned. It does not provide medical diagnoses,
                never assumes unconfirmed doses were missed, and strictly never calculates or alters medication dosages or schedules.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleRunScan}
            disabled={isScanning}
            className="bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Modules...' : 'Run Deterministic Scan'}
          </Button>
        </div>

        {scanMessage && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            {scanMessage}
          </div>
        )}

        {/* CRITICAL ATTENTION BANNER */}
        {highPriorityGaps.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-red-300 bg-red-50 text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-900 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-800" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-950">
                  {highPriorityGaps.length} High-Priority Care {highPriorityGaps.length === 1 ? 'Gap' : 'Gaps'} Requiring Attention
                </h3>
                <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                  Active missed dose events, incomplete pre-visit fasting protocols, or failed emergency notifications have been identified.
                  Care Circle coordination is recommended.
                </p>
              </div>
            </div>
            <button
              onClick={() => setQuickTab('high')}
              className="px-3.5 py-1.5 bg-red-800 hover:bg-red-900 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              Filter High Priority ({highPriorityGaps.length})
            </button>
          </div>
        )}

        {/* SUMMARY METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <Card className="border-[var(--subtle-border)] bg-white p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--secondary-text)] mb-1">
              <span>Open Gaps</span>
              <ShieldAlert className="w-4 h-4 text-[var(--primary-teal)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--main-text)]">{activeGaps.length}</div>
            <div className="text-[11px] text-[var(--secondary-text)] mt-1">Across 5 care modules</div>
          </Card>

          <Card className="border-red-200 bg-red-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-red-900 mb-1">
              <span>High Priority</span>
              <AlertTriangle className="w-4 h-4 text-red-700" />
            </div>
            <div className="text-2xl font-bold text-red-900">{highPriorityGaps.length}</div>
            <div className="text-[11px] text-red-800 mt-1">Immediate focus</div>
          </Card>

          <Card className="border-amber-200 bg-amber-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
              <span>Unassigned</span>
              <User className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-bold text-amber-900">{unassignedGaps.length}</div>
            <div className="text-[11px] text-amber-800 mt-1">Lacks designated owner</div>
          </Card>

          <Card className="border-purple-200 bg-purple-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-900 mb-1">
              <span>Overdue Items</span>
              <Clock className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-2xl font-bold text-purple-900">{overdueGaps.length}</div>
            <div className="text-[11px] text-purple-800 mt-1">Past scheduled window</div>
          </Card>

          <Card className="border-blue-200 bg-blue-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900 mb-1">
              <span>Meds &amp; Reviews</span>
              <Pill className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{medGapsCount + reviewGapsCount}</div>
            <div className="text-[11px] text-blue-800 mt-1">Dose &amp; protocol checks</div>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/40 p-3.5 sm:p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1">
              <span>Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-emerald-900">{resolvedGaps.length}</div>
            <div className="text-[11px] text-emerald-800 mt-1">Archived in history</div>
          </Card>
        </div>

        {/* CATEGORY BREAKDOWN CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <Link href="/care-gaps/medications" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-purple-400 transition-all bg-white p-3.5 rounded-xl shadow-2xs group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg group-hover:bg-purple-100">
                  <Pill className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-900 font-bold">
                  {medGapsCount}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-[var(--main-text)] group-hover:text-purple-700">Medications</h4>
              <p className="text-[10px] text-[var(--secondary-text)] mt-0.5">Missed/unconfirmed doses</p>
            </Card>
          </Link>

          <Link href="/care-gaps/tasks" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-teal-400 transition-all bg-white p-3.5 rounded-xl shadow-2xs group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg group-hover:bg-teal-100">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-xs bg-teal-50 text-teal-900 font-bold">
                  {taskGapsCount}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-[var(--main-text)] group-hover:text-teal-700">Responsibilities</h4>
              <p className="text-[10px] text-[var(--secondary-text)] mt-0.5">Unassigned &amp; handovers</p>
            </Card>
          </Link>

          <Link href="/care-gaps/appointments" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-blue-400 transition-all bg-white p-3.5 rounded-xl shadow-2xs group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg group-hover:bg-blue-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-900 font-bold">
                  {apptGapsCount}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-[var(--main-text)] group-hover:text-blue-700">Appointments</h4>
              <p className="text-[10px] text-[var(--secondary-text)] mt-0.5">Prep &amp; post-visit tasks</p>
            </Card>
          </Link>

          <Link href="/care-gaps/reviews" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-indigo-400 transition-all bg-white p-3.5 rounded-xl shadow-2xs group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg group-hover:bg-indigo-100">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-900 font-bold">
                  {reviewGapsCount}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-[var(--main-text)] group-hover:text-indigo-700">Reviews &amp; Vault</h4>
              <p className="text-[10px] text-[var(--secondary-text)] mt-0.5">Pending verifications</p>
            </Card>
          </Link>

          <Link href="/care-gaps" className="block">
            <Card className="h-full border-[var(--subtle-border)] hover:border-amber-400 transition-all bg-white p-3.5 rounded-xl shadow-2xs group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-100">
                  <Bell className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-900 font-bold">
                  {notifGapsCount}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-[var(--main-text)] group-hover:text-amber-700">Notifications</h4>
              <p className="text-[10px] text-[var(--secondary-text)] mt-0.5">Delivery failures</p>
            </Card>
          </Link>
        </div>

        {/* QUICK FILTER PILLS & SEARCH BAR */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setQuickTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                quickTab === 'all'
                  ? 'bg-[var(--primary-teal)] text-white shadow-xs'
                  : 'bg-white border border-[var(--subtle-border)] text-[var(--secondary-text)] hover:bg-slate-50'
              }`}
            >
              All Open Gaps ({activeGaps.length})
            </button>
            <button
              onClick={() => setQuickTab('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                quickTab === 'high'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white border border-[var(--subtle-border)] text-red-800 hover:bg-red-50'
              }`}
            >
              High Priority ({highPriorityGaps.length})
            </button>
            <button
              onClick={() => setQuickTab('unassigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                quickTab === 'unassigned'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white border border-[var(--subtle-border)] text-amber-800 hover:bg-amber-50'
              }`}
            >
              Unassigned ({unassignedGaps.length})
            </button>
            <button
              onClick={() => setQuickTab('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                quickTab === 'overdue'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white border border-[var(--subtle-border)] text-purple-800 hover:bg-purple-50'
              }`}
            >
              Overdue Responsibilities ({overdueGaps.length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--secondary-text)]" />
              <Input
                placeholder="Search gaps by title, explanation, or record..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-[var(--subtle-border)]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-40 text-xs bg-white border-[var(--subtle-border)]"
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'medication', label: 'Medications' },
                  { value: 'responsibility', label: 'Responsibilities' },
                  { value: 'appointment', label: 'Appointments' },
                  { value: 'instruction_continuity', label: 'Reviews' },
                  { value: 'notification', label: 'Notifications' },
                ]}
              />

              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-40 text-xs bg-white border-[var(--subtle-border)]"
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'high_priority', label: 'High Priority' },
                  { value: 'attention_required', label: 'Attention Required' },
                  { value: 'routine', label: 'Routine' },
                  { value: 'informational', label: 'Informational' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* GAPS FEED LIST */}
        {filteredGaps.length === 0 ? (
          <Card className="p-8 text-center bg-white border-[var(--subtle-border)] rounded-2xl">
            <ShieldAlert className="w-10 h-10 text-[var(--secondary-text)] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[var(--main-text)]">No active care gaps found</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              All monitored medication schedules, tasks, and appointments are currently aligned.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGaps.map((gap) => (
              <Card
                key={gap.id}
                className="border-[var(--subtle-border)] hover:border-[var(--primary-teal)]/50 transition-all bg-white p-5 rounded-2xl shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="space-y-2.5 flex-1">
                    {/* Top tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="p-1 bg-slate-100 rounded-md">
                        {getCategoryIcon(gap.category)}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary-text)]">
                        {gap.category.replace(/_/g, ' ')}
                      </span>

                      {getPriorityBadge(gap.priority)}

                      <Badge
                        variant="outline"
                        className={
                          gap.status === 'open'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 text-[10px]'
                            : gap.status === 'assigned'
                            ? 'bg-blue-50 text-blue-900 border-blue-300 text-[10px]'
                            : gap.status === 'awaiting_clarification'
                            ? 'bg-purple-50 text-purple-900 border-purple-300 text-[10px]'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300 text-[10px]'
                        }
                      >
                        {gap.status.replace(/_/g, ' ')}
                      </Badge>

                      <span className="text-xs text-[var(--secondary-text)] ml-auto">
                        Detected: {new Date(gap.detectedAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Gap Title */}
                    <h3 className="text-base sm:text-lg font-bold text-[var(--main-text)]">
                      {gap.title}
                    </h3>

                    {/* Explanation */}
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {gap.explanation}
                    </p>

                    {/* Priority Reason & Details Box */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <div>
                        <strong className="text-slate-900">Priority Rationale: </strong>
                        {gap.priorityReason}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--secondary-text)] border-t border-slate-200/60">
                        <span>
                          Source: <strong>{gap.sourceModule.replace(/_/g, ' ')}</strong>
                        </span>
                        <span>
                          Related Record: <strong>{gap.relatedRecordTitle}</strong>
                        </span>
                        {gap.assignedToName ? (
                          <span className="text-blue-800 font-medium">
                            Assigned to: <strong>{gap.assignedToName}</strong> ({gap.assignedToRole})
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[var(--subtle-border)]">
                    <Link href={`/care-gaps/${gap.id}`}>
                      <Button
                        size="sm"
                        className={
                          gap.priority === 'high_priority'
                            ? 'bg-red-800 hover:bg-red-900 text-white font-semibold text-xs flex items-center gap-1.5'
                            : 'bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white font-semibold text-xs flex items-center gap-1.5'
                        }
                      >
                        Inspect &amp; Resolve
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>

                    {gap.actionRoute && (
                      <Link href={gap.actionRoute}>
                        <Button variant="ghost" size="sm" className="text-xs text-[var(--secondary-text)] flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {gap.actionLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
