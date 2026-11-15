import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  timestamp: string;
  description?: string;
  actorName?: string;
  actorRole?: string;
  badge?: React.ReactNode;
  isLast?: boolean;
}

export function TimelineItem({
  icon,
  title,
  timestamp,
  description,
  actorName,
  actorRole,
  badge,
  isLast = false,
}: TimelineItemProps) {
  return (
    <div className="relative flex gap-4 text-left group">
      {/* Vertical line connecting nodes */}
      {!isLast && (
        <div
          aria-hidden="true"
          className="absolute left-5 top-10 bottom-0 w-0.5 bg-subtleBorder group-hover:bg-mint-border transition-colors"
        />
      )}

      {/* Node Icon */}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-primary border border-mint-border shadow-sm">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-main leading-tight">{title}</h4>
            {badge}
          </div>
          <span className="text-xs font-medium text-secondaryText">{timestamp}</span>
        </div>

        {description && (
          <p className="mt-1 text-sm text-secondaryText leading-relaxed">
            {description}
          </p>
        )}

        {(actorName || actorRole) && (
          <div className="mt-2 text-xs text-mutedText flex items-center gap-1.5">
            <span>Logged by:</span>
            <span className="font-semibold text-main">{actorName}</span>
            {actorRole && <span className="text-secondaryText">({actorRole})</span>}
          </div>
        )}
      </div>
    </div>
  );
}
