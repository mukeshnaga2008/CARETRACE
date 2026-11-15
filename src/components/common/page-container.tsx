import * as React from 'react';
import { Breadcrumb, BreadcrumbItem } from './breadcrumb';
import { cn } from '@/lib/utils/cn';

export interface PageContainerProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  breadcrumbs,
  title,
  description,
  action,
  actions,
  children,
  className,
}: PageContainerProps) {
  const effectiveAction = action ?? actions;

  return (
    <div className={cn("space-y-6 text-left", className)}>
      {(breadcrumbs || title) && (
        <header className="pb-6 border-b border-subtleBorder flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {breadcrumbs && <Breadcrumb items={breadcrumbs} className="mb-2" />}
            {title && (
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-main">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm sm:text-base text-secondaryText mt-1 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
          {effectiveAction && <div className="shrink-0">{effectiveAction}</div>}
        </header>
      )}

      <div>{children}</div>
    </div>
  );
}
