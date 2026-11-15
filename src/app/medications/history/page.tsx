'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  History, 
  Pill, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  UserCheck, 
  FileText, 
  ShieldCheck, 
  Search,
  Filter
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { MedicationsNavTabs } from '@/components/features/medications/medications-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/constants';
import { 
  getCachedMedications, 
  getCachedVersions, 
  getCachedDoseEvents 
} from '@/lib/data/medication-lifecycle-data';
import { MedicationRecord, MedicationVersion, DoseEvent } from '@/types/caretrace';

interface TimelineItem {
  id: string;
  type: 'version' | 'adherence' | 'creation';
  title: string;
  medicationName: string;
  description: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  badgeLabel: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'neutral';
}

export default function MedicationHistoryPage() {
  const [activeRole, setActiveRole] = React.useState<AppRole>('family');
  const [filterType, setFilterType] = React.useState<'all' | 'version' | 'adherence'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [timelineItems, setTimelineItems] = React.useState<TimelineItem[]>([]);

  React.useEffect(() => {
    const meds = getCachedMedications();
    const versions = getCachedVersions();
    const doses = getCachedDoseEvents();

    const items: TimelineItem[] = [];

    // Map versions
    versions.forEach((v) => {
      items.push({
        id: `ver-${v.id}`,
        type: 'version',
        title: `Instruction Revision v${v.versionNumber}`,
        medicationName: v.displayName,
        description: `Prescribed SIG: "${v.prescribedInstructions}" • Reason: ${v.changeReason}`,
        actorName: v.changedByName,
        actorRole: v.changedByRole,
        timestamp: v.createdAt,
        badgeLabel: `Version v${v.versionNumber}`,
        badgeVariant: v.verificationStatus === 'verified' ? 'success' : 'warning',
      });
    });

    // Map recent adherence actions
    doses.filter(d => d.reportedByName).forEach((d) => {
      items.push({
        id: `dose-${d.id}`,
        type: 'adherence',
        title: `Dose Status: ${d.eventStatus.replace('_', ' ')}`,
        medicationName: d.medicationName,
        description: d.adherenceNotes ? `Logged note: "${d.adherenceNotes}"` : `Scheduled for ${d.scheduledTime}`,
        actorName: d.reportedByName || 'Authorized User',
        actorRole: d.reportedByRole || 'Caregiver',
        timestamp: d.reportedAt || new Date().toISOString(),
        badgeLabel: d.eventStatus.replace('_', ' '),
        badgeVariant: d.eventStatus === 'reported_taken' ? 'success' : d.eventStatus === 'skipped' ? 'danger' : 'warning',
      });
    });

    // Sort newest first
    setTimelineItems(
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
  }, []);

  const filteredItems = timelineItems.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesSearch = 
      item.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.actorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell activeRole={activeRole} onSelectRole={setActiveRole}>
      <PageContainer
        title="Medication History & Audit Trail"
        description="Chronological, tamper-evident log of prescription updates, dose adherence entries, and clinical review actions."
        breadcrumbs={[
          { label: 'Overview', href: '/dashboard' },
          { label: 'Medications', href: '/medications' },
          { label: 'Audit History' },
        ]}
      >
        <MedicationsNavTabs />

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[var(--secondary-text)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search medication, actor, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--subtle-border)] bg-[var(--white-surface)] text-sm text-[var(--main-text)] focus:ring-2 focus:ring-[var(--primary-teal)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[var(--secondary-text)] uppercase tracking-wider">
              Filter:
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              All Events ({timelineItems.length})
            </button>
            <button
              onClick={() => setFilterType('version')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'version'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Revisions Only
            </button>
            <button
              onClick={() => setFilterType('adherence')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === 'adherence'
                  ? 'bg-[var(--primary-teal)] text-white'
                  : 'bg-slate-100 text-[var(--secondary-text)] hover:bg-slate-200'
              }`}
            >
              Adherence Logs
            </button>
          </div>
        </div>

        {/* Audit Timeline List */}
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] text-center space-y-3">
            <History className="w-10 h-10 text-[var(--secondary-text)] mx-auto" />
            <h3 className="text-base font-semibold text-[var(--main-text)]">
              No Matching Audit Logs Found
            </h3>
            <p className="text-sm text-[var(--secondary-text)]">
              Try adjusting your search terms or filters above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--white-surface)] shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--soft-mint)] text-[var(--primary-teal)] flex items-center justify-center shrink-0 mt-0.5">
                    {item.type === 'version' ? (
                      <History className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-[var(--main-text)]">
                        {item.medicationName} — {item.title}
                      </h4>
                      <Badge variant={item.badgeVariant}>
                        {item.badgeLabel}
                      </Badge>
                    </div>

                    <p className="text-xs text-[var(--main-text)] leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-xs text-[var(--secondary-text)]">
                      <UserCheck className="w-3.5 h-3.5 text-[var(--primary-teal)]" />
                      <span>
                        Action by <strong className="text-[var(--main-text)]">{item.actorName}</strong> ({item.actorRole})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left md:text-right shrink-0 text-xs text-[var(--secondary-text)] pt-1 md:pt-0">
                  <span className="block font-medium text-[var(--main-text)]">
                    {new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
