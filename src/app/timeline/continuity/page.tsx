'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { TimelineNavTabs } from '@/components/features/timeline/timeline-nav-tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, ExternalLink, Inbox } from 'lucide-react';
import { getUnifiedCareTimeline } from '@/lib/data/timeline-analytics-data';
import { TimelineEvent } from '@/types/caretrace';

export default function ContinuityTimelinePage() {
  const [events, setEvents] = React.useState<TimelineEvent[]>([]);

  React.useEffect(() => {
    const list = getUnifiedCareTimeline('patient-profile-001', { category: 'continuity' });
    setEvents(list);
  }, []);

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Timeline', href: '/timeline' }, { label: 'Continuity Reviews' }]}
      pageTitle="Care Continuity Engine Timeline"
      pageDescription="Downstream impact evaluations, human-in-the-loop review determinations, and synchronization jobs."
    >
      <PageContainer>
        <TimelineNavTabs />

        <div className="space-y-4">
          {events.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-[var(--secondary-text)]">No continuity reviews recorded.</p>
            </Card>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded border border-indigo-200">
                      <Layers className="w-4 h-4 text-indigo-700" />
                    </div>
                    <Link href={`/timeline/${ev.id}`} className="font-bold text-sm text-[var(--main-text)] hover:text-indigo-700">
                      {ev.title}
                    </Link>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {ev.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{ev.description}</p>
                  <div className="text-[11px] text-slate-500">
                    Decided: {new Date(ev.occurredAt).toLocaleString()} • Reviewer: {ev.actorName}
                  </div>
                </div>
                <Link href={ev.actionUrl}>
                  <Button variant="outline" size="sm" className="h-8 text-xs min-h-[44px]">
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
