import * as React from 'react';
import { AlertTriangle, Info, AlertCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { SyntheticAlert } from '@/lib/data/synthetic-dashboard-data';

export interface CareAlertCardProps {
  alert: SyntheticAlert;
  onAction?: (alert: SyntheticAlert) => void;
}

export function CareAlertCard({ alert, onAction }: CareAlertCardProps) {
  const severityConfig = {
    warning: {
      container: 'border-clinical-warningBorder bg-clinical-warningBg/50 text-[#83520E]',
      icon: <AlertTriangle className="h-5 w-5 text-clinical-warning shrink-0" aria-hidden="true" />,
      badgeVariant: 'warning' as const,
      buttonVariant: 'outline' as const,
    },
    info: {
      container: 'border-clinical-infoBorder bg-clinical-infoBg/50 text-[#225577]',
      icon: <Info className="h-5 w-5 text-clinical-info shrink-0" aria-hidden="true" />,
      badgeVariant: 'info' as const,
      buttonVariant: 'outline' as const,
    },
    critical: {
      container: 'border-clinical-dangerBorder bg-clinical-dangerBg/50 text-[#852D2D]',
      icon: <AlertCircle className="h-5 w-5 text-clinical-danger shrink-0" aria-hidden="true" />,
      badgeVariant: 'danger' as const,
      buttonVariant: 'destructive' as const,
    },
  };

  const config = severityConfig[alert.severity];

  return (
    <div
      role="region"
      aria-label={`Care Alert: ${alert.title}`}
      className={cn(
        "p-4 rounded-xl border text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all shadow-sm",
        config.container
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="pt-0.5">{config.icon}</div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-base text-main">{alert.title}</span>
            <Badge variant={config.badgeVariant} size="sm">
              {alert.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-secondaryText leading-relaxed">
            {alert.description}
          </p>
          <div className="text-[11px] text-mutedText pt-0.5">
            <strong>Required:</strong> {alert.actionRequired} &bull; {alert.timestamp}
          </div>
        </div>
      </div>

      {onAction && (
        <div className="self-end sm:self-center shrink-0">
          <Button
            variant={config.buttonVariant}
            size="sm"
            onClick={() => onAction(alert)}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            className="text-xs"
          >
            Review & Resolve
          </Button>
        </div>
      )}
    </div>
  );
}
