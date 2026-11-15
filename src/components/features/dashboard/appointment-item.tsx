import * as React from 'react';
import { Calendar, Clock, Car, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SyntheticAppointment } from '@/lib/data/synthetic-dashboard-data';

export interface AppointmentItemProps {
  appointment: SyntheticAppointment;
  onViewDetails?: (id: string) => void;
}

export function AppointmentItem({
  appointment,
  onViewDetails,
}: AppointmentItemProps) {
  return (
    <div className="p-5 rounded-2xl border border-subtleBorder bg-canvas-background text-left space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              {appointment.specialty}
            </span>
            <Badge variant="info" size="sm">
              {appointment.status.toUpperCase()}
            </Badge>
          </div>
          <h4 className="text-xl font-bold text-main">{appointment.title}</h4>
          <p className="text-sm font-medium text-main mt-0.5">
            {appointment.providerName}
          </p>
          <p className="text-xs text-secondaryText mt-0.5">
            {appointment.facility}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-base font-bold text-main">{appointment.dateTimeFormatted}</div>
          <span className="text-xs text-secondary font-semibold">
            Duration: {appointment.durationMinutes} minutes
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-subtleBorder grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-subtleBorder">
          <Car className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
          <div>
            <span className="block font-semibold text-main">Companion & Transport</span>
            <span className="text-secondaryText">
              {appointment.companionName} &bull; {appointment.transportStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-subtleBorder">
          <FileText className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
          <div>
            <span className="block font-semibold text-main">Preparation Instructions</span>
            <span className="text-secondaryText">{appointment.preparationNotice}</span>
          </div>
        </div>
      </div>

      {onViewDetails && (
        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(appointment.id)}
          >
            View Visit Preparation Agenda
          </Button>
        </div>
      )}
    </div>
  );
}
