import * as React from 'react';
import { Pill, CheckCircle2, Clock, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { SyntheticMedicationDose, DoseStatusType } from '@/lib/data/synthetic-dashboard-data';

export interface MedicationScheduleItemProps {
  dose: SyntheticMedicationDose;
  onLogAction?: (doseId: string, action: string) => void;
}

export function MedicationScheduleItem({
  dose,
  onLogAction,
}: MedicationScheduleItemProps) {
  const statusConfig: Record<
    DoseStatusType,
    {
      badgeVariant: 'success' | 'warning' | 'danger' | 'info' | 'default';
      icon: React.ReactNode;
      containerClass: string;
    }
  > = {
    reported_taken: {
      badgeVariant: 'success',
      icon: <CheckCircle2 className="h-5 w-5 text-clinical-success" aria-hidden="true" />,
      containerClass: 'border-clinical-successBorder bg-clinical-successBg/30',
    },
    upcoming: {
      badgeVariant: 'info',
      icon: <Clock className="h-5 w-5 text-secondary" aria-hidden="true" />,
      containerClass: 'border-subtleBorder bg-white hover:border-secondary',
    },
    awaiting_confirmation: {
      badgeVariant: 'warning',
      icon: <HelpCircle className="h-5 w-5 text-clinical-warning" aria-hidden="true" />,
      containerClass: 'border-clinical-warningBorder bg-clinical-warningBg/30',
    },
    missed: {
      badgeVariant: 'danger',
      icon: <AlertCircle className="h-5 w-5 text-clinical-danger" aria-hidden="true" />,
      containerClass: 'border-clinical-dangerBorder bg-clinical-dangerBg/30',
    },
    skipped: {
      badgeVariant: 'default',
      icon: <XCircle className="h-5 w-5 text-secondaryText" aria-hidden="true" />,
      containerClass: 'border-subtleBorder bg-canvas-subtle/50',
    },
  };

  const config = statusConfig[dose.status];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border text-left transition-all gap-4",
        config.containerClass
      )}
    >
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-white border border-subtleBorder flex items-center justify-center shrink-0 shadow-sm">
          {config.icon}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base text-main">{dose.medicationName}</span>
            <Badge variant="outline" size="sm">
              {dose.dosage} &bull; {dose.form}
            </Badge>
          </div>
          <p className="text-xs text-secondaryText">
            Scheduled for <strong>{dose.scheduledTime}</strong> &bull; {dose.instructions}
          </p>
          {dose.loggedBy && (
            <p className="text-[11px] text-mutedText italic">
              Audit log: {dose.loggedBy} (Self-report only; does not confirm physical swallowing)
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-subtleBorder">
        <Badge variant={config.badgeVariant} size="sm">
          {dose.statusLabel}
        </Badge>

        {dose.status === 'upcoming' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onLogAction?.(dose.id, 'report_taken')}
            className="text-xs"
          >
            Report Taken
          </Button>
        )}
      </div>
    </div>
  );
}
