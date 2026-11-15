import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-subtleBorder bg-white p-6 transition-all",
        elevated ? "shadow-elevated" : "shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-4 border-b border-subtleBorder text-left", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-xl font-bold tracking-tight text-main", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-secondaryText leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-4 text-left", className)} {...props}>{children}</div>;
}

// Specialized Metric Card for Healthcare Vitals & Adherence Statistics
export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: "up" | "down" | "neutral";
    label: string;
  };
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-subtleBorder bg-white p-5 shadow-card text-left transition-all hover:shadow-elevated",
        className
      )}
    >
      <div className="flex items-center justify-between text-secondaryText mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon && <div className="p-2 rounded-xl bg-mint text-primary">{icon}</div>}
      </div>
      <div className="text-3xl font-extrabold text-main tracking-tight">{value}</div>
      {(subValue || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "font-semibold px-2 py-0.5 rounded-full",
                trend.direction === "up" && "bg-clinical-successBg text-clinical-success",
                trend.direction === "down" && "bg-clinical-dangerBg text-clinical-danger",
                trend.direction === "neutral" && "bg-canvas-subtle text-secondaryText"
              )}
            >
              {trend.label}
            </span>
          )}
          {subValue && <span className="text-secondaryText">{subValue}</span>}
        </div>
      )}
    </div>
  );
}
