'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Pill,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { CareGapsNavTabs } from '@/components/features/care-gaps/care-gaps-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getCachedCareGaps } from '@/lib/data/care-gap-intelligence-data';
import {
  getCachedMedications,
  getCachedDoseEvents,
} from '@/lib/data/medication-lifecycle-data';
import { CareGapRecord, DoseEvent, MedicationRecord } from '@/types/caretrace';

export default function MedicationGapsPage() {
  const [gaps, setGaps] = React.useState<CareGapRecord[]>([]);
  const [doseEvents, setDoseEvents] = React.useState<DoseEvent[]>([]);
  const [medications, setMedications] = React.useState<MedicationRecord[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [eventStatusFilter, setEventStatusFilter] = React.useState('all');
  const [selectedMedFilter, setSelectedMedFilter] = React.useState('all');

  React.useEffect(() => {
    const allGaps = getCachedCareGaps().filter((g) => g.category === 'medication');
    setGaps(allGaps);
    setDoseEvents(getCachedDoseEvents());
    setMedications(getCachedMedications());
  }, []);

  const activeMedGaps = gaps.filter((g) => g.status !== 'resolved' && g.status !== 'dismissed');

  const filteredDoseEvents = doseEvents.filter((ev) => {
    const matchesSearch =
      ev.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.notes && ev.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = eventStatusFilter === 'all' || ev.status === eventStatusFilter;
    const matchesMed = selectedMedFilter === 'all' || ev.medicationId === selectedMedFilter;

    return matchesSearch && matchesStatus && matchesMed;
  });

  const getDoseStatusBadge = (status: DoseEvent['status']) => {
    switch (status) {
      case 'missed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-900 border-red-300 font-bold text-xs">
            <XCircle className="w-3 h-3 mr-1" />
            Missed
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-semibold text-xs">
            <HelpCircle className="w-3 h-3 mr-1" />
            Skipped
          </Badge>
        );
      case 'taken':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Reported Taken
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'delayed':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-900 border-purple-300 text-xs">
            Delayed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-300 text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Care Gap Radar', href: '/care-gaps' },
        { label: 'Medication Gaps' },
      ]}
      pageTitle="Medication Activity &amp; Gap Intelligence"
      pageDescription="Cross-module surveillance of scheduled dose events, adherence records, unconfirmed events, and clinical verification dependencies."
    >
      <PageContainer>
        <CareGapsNavTabs />

        {/* STRICT CLINICAL NON-PRESCRIBING POLICY */}
        <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-950 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-teal-100 text-teal-800 rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-teal-800" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal-900">
              Clinical Safety &amp; Non-Prescribing Policy
            </h3>
            <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
              CARETRACE displays actual recorded statuses. An unconfirmed event is <strong>never assumed missed</strong>, and a user-reported taken status does not prove clinical ingestion.
              CARETRACE strictly <strong>never calculates, recommends, or changes medication dosages</strong> or suggests extra doses in response to missed or skipped events.
            </p>
          </div>
        </div>

        {/* ACTIVE MEDICATION GAPS SECTION */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-700" />
                Active Medication Care Gaps ({activeMedGaps.length})
              </h2>
              <p className="text-xs text-[var(--secondary-text)]">
                Situations requiring coordinator check-in without clinical dosage modification.
              </p>
            </div>
          </div>

          {activeMedGaps.length === 0 ? (
            <Card className="p-6 text-center text-xs text-[var(--secondary-text)] bg-white border-[var(--subtle-border)]">
              No active medication coordination gaps detected.
            </Card>
          ) : (
            <div className="space-y-3">
              {activeMedGaps.map((gap) => (
                <Card
                  key={gap.id}
                  className="border-[var(--subtle-border)] hover:border-purple-300 transition-all bg-white p-4 sm:p-5 rounded-xl shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            gap.priority === 'high_priority'
                              ? 'bg-red-50 text-red-900 border-red-300 font-bold text-[10px]'
                              : 'bg-amber-50 text-amber-900 border-amber-300 font-semibold text-[10px]'
                          }
                        >
                          {gap.priority.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono">
                          {gap.gapType}
                        </Badge>
                        <span className="text-[11px] text-[var(--secondary-text)]">
                          Detected: {new Date(gap.detectedAt).toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[var(--main-text)]">
                        {gap.title}
                      </h3>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {gap.explanation}
                      </p>

                      <div className="text-[11px] text-purple-900 pt-1 font-medium">
                        <strong>Rationale: </strong>
                        {gap.priorityReason}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center sm:flex-col justify-end gap-2">
                      <Link href={`/care-gaps/${gap.id}`}>
                        <Button size="sm" className="bg-[var(--primary-teal)] hover:bg-[var(--primary-teal)]/90 text-white text-xs font-semibold">
                          Inspect &amp; Resolve
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* RECENT DOSE EVENTS ACTIVITY TABLE */}
        <Card className="border-[var(--subtle-border)] bg-white rounded-2xl p-5 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <CardTitle className="text-base font-bold text-[var(--main-text)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--primary-teal)]" />
                Medication Dose Events Surveillance
              </CardTitle>
              <p className="text-xs text-[var(--secondary-text)] mt-0.5">
                Real-time dose activity with honest status tracking across scheduled, taken, skipped, and missed events.
              </p>
            </div>
            <Link href="/medications/adherence">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Open Full Adherence Module
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Input
              placeholder="Search by medication name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-white border-[var(--subtle-border)]"
            />

            <Select
              value={eventStatusFilter}
              onChange={(e) => setEventStatusFilter(e.target.value)}
              className="text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Event Statuses' },
                { value: 'scheduled', label: 'Scheduled / Upcoming' },
                { value: 'taken', label: 'Reported Taken' },
                { value: 'missed', label: 'Missed' },
                { value: 'skipped', label: 'Skipped' },
                { value: 'delayed', label: 'Delayed' },
              ]}
            />

            <Select
              value={selectedMedFilter}
              onChange={(e) => setSelectedMedFilter(e.target.value)}
              className="text-xs bg-white border-[var(--subtle-border)]"
              options={[
                { value: 'all', label: 'All Medications' },
                ...medications.map((m) => ({
                  value: m.id,
                  label: m.displayName,
                })),
              ]}
            />
          </div>

          {/* DOSE EVENTS FEED */}
          <div className="space-y-2">
            {filteredDoseEvents.slice(0, 10).map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <Pill className="w-4 h-4 text-purple-700" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--main-text)]">{ev.medicationName}</span>
                    <div className="text-[11px] text-[var(--secondary-text)]">
                      Scheduled for {ev.scheduledAt ? new Date(ev.scheduledAt).toLocaleDateString() : 'Today'} at {ev.scheduledTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getDoseStatusBadge(ev.status)}
                  {(ev.reportedByName || ev.loggedByName) && (
                    <span className="text-[11px] text-[var(--secondary-text)]">
                      Logged by {ev.reportedByName || ev.loggedByName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
