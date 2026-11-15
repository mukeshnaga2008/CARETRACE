'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { TimelineNavTabs } from '@/components/features/timeline/timeline-nav-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  History,
  Pill,
  Calendar,
  FileText,
  Layers,
  Users,
  CheckSquare,
  AlertTriangle,
  Shield,
  Search,
  ExternalLink,
  Clock,
  ArrowRight,
  Filter,
  Inbox,
} from 'lucide-react';
import { getUnifiedCareTimeline } from '@/lib/data/timeline-analytics-data';
import { TimelineEvent, TimelineCategory } from '@/types/caretrace';

export default function UnifiedTimelinePage() {
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');

  React.useEffect(() => {
    let list = getUnifiedCareTimeline();

    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.actorName && e.actorName.toLowerCase().includes(q))
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date().getTime();
      let days = 30;
      if (dateFilter === '7d') days = 7;
      if (dateFilter === '1d') days = 1;
      const cutoff = now - days * 24 * 3600 * 1000;
      list = list.filter((e) => new Date(e.occurredAt).getTime() >= cutoff);
    }

    setEvents(list);
  }, [categoryFilter, searchQuery, dateFilter]);

  // Group events by date (YYYY-MM-DD)
  const groupedEvents = React.useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    events.forEach((ev) => {
      const dateKey = ev.occurredAt.split('T')[0] || 'Earlier';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(ev);
    });
    return groups;
  }, [events]);

  const getCategoryIcon = (cat: TimelineCategory) => {
    switch (cat) {
      case 'medication':
        return <Pill className="w-4 h-4 text-purple-700" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-700" />;
      case 'instruction':
        return <FileText className="w-4 h-4 text-amber-700" />;
      case 'continuity':
        return <Layers className="w-4 h-4 text-indigo-700" />;
      case 'care_circle':
        return <Users className="w-4 h-4 text-emerald-700" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-teal-700" />;
      case 'care_gap':
        return <AlertTriangle className="w-4 h-4 text-rose-700" />;
      case 'security':
        return <Shield className="w-4 h-4 text-slate-700" />;
      default:
        return <History className="w-4 h-4 text-slate-700" />;
    }
  };

  const formatDateHeader = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T12:00:00Z`);
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (dateStr === todayStr) {
        return `Today — ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
      }
      if (dateStr === yesterday) {
        return `Yesterday — ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
      }
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Timeline', href: '/timeline' }, { label: 'Unified Stream' }]}
      pageTitle="Unified Care Timeline"
      pageDescription="Traceable, chronological stream uniting medication events, clinical consultations, instruction diffs, and caregiver handovers."
    >
      <PageContainer>
        <TimelineNavTabs />

        {/* Search & Filter Bar */}
        <Card className="p-4 border-slate-200 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search care timeline events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 text-xs rounded-lg min-w-[150px]"
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'medication', label: 'Medications' },
                  { value: 'appointment', label: 'Appointments' },
                  { value: 'instruction', label: 'Instructions' },
                  { value: 'continuity', label: 'Continuity' },
                  { value: 'care_circle', label: 'Care Circle' },
                  { value: 'task', label: 'Tasks' },
                  { value: 'care_gap', label: 'Care Gaps' },
                  { value: 'security', label: 'Security' },
                ]}
              />

              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 text-xs rounded-lg min-w-[130px]"
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: '1d', label: 'Past 24 Hours' },
                  { value: '7d', label: 'Past 7 Days' },
                  { value: '30d', label: 'Past 30 Days' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Chronological Timeline Stream */}
        <div className="space-y-8">
          {Object.keys(groupedEvents).length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[var(--main-text)]">No timeline events match your criteria</h3>
              <p className="text-xs text-[var(--secondary-text)] max-w-md mx-auto mt-1">
                Try clearing your search query or selecting a broader category filter.
              </p>
            </Card>
          ) : (
            Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2 sticky top-16 bg-[var(--background)] py-1.5 z-10">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {formatDateHeader(dateKey)}
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                  <Badge variant="outline" className="text-[10px] text-slate-500 font-mono">
                    {dayEvents.length} events
                  </Badge>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-200 space-y-3 ml-3">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="relative p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-all shadow-xs"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="p-1 bg-slate-100 rounded border border-slate-200">
                              {getCategoryIcon(ev.category)}
                            </div>
                            <Link
                              href={`/timeline/${ev.id}`}
                              className="font-bold text-sm text-[var(--main-text)] hover:text-teal-700 transition-colors"
                            >
                              {ev.title}
                            </Link>
                            <Badge variant="outline" className="text-[10px] capitalize font-mono">
                              {ev.category.replace('_', ' ')}
                            </Badge>
                            {ev.isReportedOnly && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[10px]">
                                Self-Reported
                              </Badge>
                            )}
                            {ev.version && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200 text-[10px] font-mono">
                                {ev.version}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-[var(--secondary-text)] leading-relaxed">
                            {ev.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--secondary-text)]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(ev.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {ev.actorName && (
                              <>
                                <span>•</span>
                                <span>By: <strong className="text-[var(--main-text)]">{ev.actorName}</strong> ({ev.actorRole || 'Actor'})</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Recorded: {new Date(ev.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                          <Link href={ev.actionUrl}>
                            <Button variant="outline" size="sm" className="h-8 text-xs min-h-[44px]">
                              <span>View Record</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
