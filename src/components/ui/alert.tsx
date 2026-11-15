import * as React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "error" | "info";
  title?: string;
  onClose?: () => void;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  onClose,
  ...props
}: AlertProps) {
  const variantConfig = {
    success: {
      container: "bg-clinical-successBg border-clinical-successBorder text-clinical-success",
      icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-clinical-success" aria-hidden="true" />,
      role: "status",
      titleColor: "text-[#17563C]",
    },
    warning: {
      container: "bg-clinical-warningBg border-clinical-warningBorder text-clinical-warning",
      icon: <AlertTriangle className="h-5 w-5 shrink-0 text-clinical-warning" aria-hidden="true" />,
      role: "alert",
      titleColor: "text-[#83520E]",
    },
    error: {
      container: "bg-clinical-dangerBg border-clinical-dangerBorder text-clinical-danger",
      icon: <AlertCircle className="h-5 w-5 shrink-0 text-clinical-danger" aria-hidden="true" />,
      role: "alert",
      titleColor: "text-[#852D2D]",
    },
    info: {
      container: "bg-clinical-infoBg border-clinical-infoBorder text-clinical-info",
      icon: <Info className="h-5 w-5 shrink-0 text-clinical-info" aria-hidden="true" />,
      role: "status",
      titleColor: "text-[#225577]",
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      role={config.role}
      className={cn(
        "flex items-start gap-3.5 p-4 rounded-xl border text-left text-sm transition-all shadow-sm",
        config.container,
        className
      )}
      {...props}
    >
      <div className="pt-0.5">{config.icon}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className={cn("font-bold text-base leading-tight", config.titleColor)}>{title}</h5>}
        <div className="text-sm leading-relaxed text-main/90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-black/5 transition-colors -mr-1 -mt-1 text-secondaryText hover:text-main"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
