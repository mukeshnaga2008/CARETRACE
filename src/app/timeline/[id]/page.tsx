'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/common/app-shell';
import { PageContainer } from '@/components/common/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History,
  ArrowLeft,
  ExternalLink,
  Clock,
  User,
  Layers,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { getTimelineEventById } from '@/lib/data/timeline-analytics-data';
import { TimelineEvent } from '@/types/caretrace';

export default function TimelineEventDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [event, setEvent] = React.useState<TimelineEvent | null>(null);

  React.useEffect(() => {
    if (id) {
      const found = getTimelineEventById(id);
      if (found) setEvent(found);
    }
  }, [id]);

  if (!event) {
    return (
      <AppShell
        breadcrumbs={[{ label: 'Care Timeline', href: '/timeline' }, { label: 'Event Details' }]}
        pageTitle="Event Details"
      >
        <PageContainer>
          <Card className="p-8 text-center border-slate-200">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-[var(--main-text)]">Timeline Event Not Found</h3>
            <p className="text-xs text-[var(--secondary-text)] mt-1">
              The requested historical event could not be found or has been archived.
            </p>
            <Link href="/timeline">
              <Button size="sm" variant="outline" className="mt-4 text-xs min-h-[44px]">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Return to Care Timeline
              </Button>
            </Link>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[{ label: 'Care Timeline', href: '/timeline' }, { label: event.title }]}
      pageTitle={event.title}
      pageDescription={`Historical event record from the ${event.sourceModule.replace(/_/g, ' ')} module.`}
    >
      <PageContainer>
        <div className="mb-6">
          <Link href="/timeline">
            <Button variant="outline" size="sm" className="text-xs min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Care Timeline
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize font-mono tracking-wider">
                    {event.category.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {event.sourceModule}
                  </Badge>
                  {event.isReportedOnly && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[10px]">
                      Self-Reported Entry
                    </Badge>
                  )}
                  {event.version && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200 text-[10px] font-mono">
                      {event.version}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-bold text-[var(--main-text)] mt-2">
                  {event.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Event Description
                  </h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-[var(--main-text)]">
                    {event.description}
                  </div>
                </div>

                {event.isReportedOnly && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <strong className="block mb-0.5">Clinical Provenance Notice:</strong>
                    This event was self-reported by the patient or family proxy. CARETRACE distinguishes reported activity from independently confirmed clinical administration.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Record Action Card */}
            <Card className="border-teal-200 bg-teal-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-teal-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700" />
                  Underlying Source Module Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600">
                  This timeline entry links to original record <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">{event.relatedRecordId}</code> in the <strong className="text-slate-800">{event.sourceModule}</strong> system.
                </p>
                <Link href={event.actionUrl}>
                  <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white text-xs min-h-[44px]">
                    <span>Inspect Original Source Record</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[var(--main-text)]">
                  Audit Provenance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[var(--secondary-text)] block">Occurred Timestamp</span>
                  <span className="font-semibold text-[var(--main-text)]">
                    {new Date(event.occurredAt).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--secondary-text)] block">Recorded Timestamp</span>
                  <span className="font-semibold text-[var(--main-text)]">
                    {new Date(event.recordedAt).toLocaleString()}
                  </span>
                </div>

                {event.actorName && (
                  <div>
                    <span className="text-[var(--secondary-text)] block">Actor Attribution</span>
                    <span className="font-semibold text-[var(--main-text)]">
                      {event.actorName} ({event.actorRole || 'Actor'})
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[var(--secondary-text)] block">Source Module</span>
                  <span className="font-mono text-slate-700">
                    {event.sourceModule}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--secondary-text)] block">Event Identifier</span>
                  <span className="font-mono text-[11px] text-slate-500 break-all">
                    {event.id}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
