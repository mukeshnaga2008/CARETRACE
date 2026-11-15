import * as React from 'react';
import { Activity, Pill, GitBranch, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SyntheticTimelineEvent } from '@/lib/data/synthetic-dashboard-data';

export interface ActivityTimelineItemProps {
  event: SyntheticTimelineEvent;
  isLast?: boolean;
}

export function ActivityTimelineItem({ event, isLast = false }: ActivityTimelineItemProps) {
  const iconMap: Record<string, React.ReactNode> = {
    vitals: <Activity className="h-4 w-4 text-primary" aria-hidden="true" />,
    adherence: <Pill className="h-4 w-4 text-secondary" aria-hidden="true" />,
    continuity: <GitBranch className="h-4 w-4 text-primary" aria-hidden="true" />,
    passport: <FileCheck className="h-4 w-4 text-secondary" aria-hidden="true" />,
  };

  return (
    <div className="relative flex gap-4 text-left group">
      {!isLast && (
        <div
          aria-hidden="true"
          className="absolute left-5 top-10 bottom-0 w-0.5 bg-subtleBorder group-hover:bg-mint-border transition-colors"
        />
      )}

      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-primary border border-mint-border shadow-sm">
        {iconMap[event.category] || <Activity className="h-4 w-4" />}
      </div>

      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-bold text-main leading-tight">{event.title}</h5>
            <Badge variant="mint" size="sm">
              {event.badgeLabel}
            </Badge>
          </div>
          <span className="text-xs font-medium text-secondaryText">{event.timestamp}</span>
        </div>

        <p className="mt-1 text-xs text-secondaryText leading-relaxed">
          {event.description}
        </p>

        <div className="mt-2 text-[11px] text-mutedText flex items-center gap-1">
          <span>Logged by:</span>
          <span className="font-semibold text-main">{event.actorName}</span>
          <span className="text-secondaryText">({event.actorRole})</span>
          <span className="text-mutedText">&bull; Sample demonstration record</span>
        </div>
      </div>
    </div>
  );
}
