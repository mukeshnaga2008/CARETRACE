import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "mint" | "outline" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-canvas-subtle text-secondaryText border-subtleBorder",
    success: "bg-clinical-successBg text-[#17563C] border-clinical-successBorder",
    warning: "bg-clinical-warningBg text-[#83520E] border-clinical-warningBorder",
    danger: "bg-clinical-dangerBg text-[#852D2D] border-clinical-dangerBorder",
    info: "bg-clinical-infoBg text-[#225577] border-clinical-infoBorder",
    mint: "bg-mint text-primary border-mint-border font-bold",
    outline: "border-strongBorder text-main bg-white",
    neutral: "bg-canvas-subtle text-secondaryText border-subtleBorder",
  };

  const dotStyles = {
    default: "bg-secondaryText",
    success: "bg-clinical-success",
    warning: "bg-clinical-warning",
    danger: "bg-clinical-danger",
    info: "bg-clinical-info",
    mint: "bg-primary",
    outline: "bg-secondary",
    neutral: "bg-secondaryText",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border tracking-wide select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])} aria-hidden="true" />}
      {children}
    </span>
  );
}
