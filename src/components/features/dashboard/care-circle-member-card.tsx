import * as React from 'react';
import { Phone, Mail, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SyntheticCareCircleMember } from '@/lib/data/synthetic-dashboard-data';
import { cn } from '@/lib/utils/cn';

export interface CareCircleMemberCardProps {
  member: SyntheticCareCircleMember;
  onContact?: (member: SyntheticCareCircleMember) => void;
}

export function CareCircleMemberCard({
  member,
  onContact,
}: CareCircleMemberCardProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="flex flex-col justify-between p-4 rounded-xl border border-subtleBorder bg-canvas-background text-left space-y-3 transition-all hover:border-secondary">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-sm">
              {initials}
            </div>
            <div>
              <h5 className="font-bold text-sm text-main">{member.name}</h5>
              <p className="text-xs text-secondary font-semibold">
                {member.relationship} &bull; Priority #{member.emergencyPriority}
              </p>
            </div>
          </div>
          <Badge variant="mint" size="sm">
            {member.permissionTier}
          </Badge>
        </div>

        <div className="mt-3 text-xs bg-white p-2.5 rounded-lg border border-subtleBorder space-y-1">
          <span className="block font-semibold text-main text-[11px] uppercase tracking-wider text-mutedText">
            Assigned Responsibility:
          </span>
          <p className="text-secondaryText leading-relaxed">
            {member.assignedResponsibility}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-clinical-success pt-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Acknowledged &bull; Last active {member.lastActive}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-subtleBorder flex items-center justify-between text-xs text-secondaryText">
        <span className="truncate max-w-[140px]">{member.phone}</span>
        {onContact && (
          <button
            type="button"
            onClick={() => onContact(member)}
            className="text-xs font-bold text-primary hover:underline focus:outline-none"
          >
            Direct Line
          </button>
        )}
      </div>
    </div>
  );
}
