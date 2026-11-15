import * as React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowLeft, ShieldCheck, Layers, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export interface FeaturePlaceholderProps {
  moduleName: string;
  modulePhase: string;
  description: string;
  icon: LucideIcon;
  plannedCapabilities: string[];
  databaseTables: string[];
  securityScope: string;
}

export function FeaturePlaceholder({
  moduleName,
  modulePhase,
  description,
  icon: Icon,
  plannedCapabilities,
  databaseTables,
  securityScope,
}: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6 text-left max-w-4xl">
      {/* Development Banner */}
      <div className="rounded-2xl border-2 border-dashed border-subtleBorder bg-canvas-background p-6 sm:p-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="h-14 w-14 rounded-2xl bg-mint text-primary flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="mint" size="md">
                Phase {modulePhase} Roadmap
              </Badge>
              <Badge variant="outline" size="md">
                Under Active Development
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
              {moduleName}
            </h2>
            <p className="text-base text-secondaryText leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-subtleBorder flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-mutedText flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            <span>Schema defined & verified in Supabase PostgreSQL migrations.</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Return to Overview Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Architecture & Engineering Readiness Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Wrench className="h-4 w-4 text-secondary" />
              Planned Functional Capabilities
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {plannedCapabilities.map((cap, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-secondaryText leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0 mt-1.5" />
                <span>{cap}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Layers className="h-4 w-4 text-secondary" />
              Relational Schema & Security Scope
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs">
            <div>
              <span className="block font-semibold text-main mb-1.5">Connected Database Entities:</span>
              <div className="flex flex-wrap gap-1.5">
                {databaseTables.map((tbl, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[11px] px-2 py-0.5 rounded bg-canvas-subtle border border-subtleBorder text-secondaryText"
                  >
                    {tbl}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-subtleBorder">
              <span className="block font-semibold text-main mb-0.5">Authorization & Privacy Boundary:</span>
              <p className="text-secondaryText leading-relaxed">{securityScope}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
