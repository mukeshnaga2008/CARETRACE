import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: SwitchProps) {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <div className={cn("flex items-center justify-between gap-4 py-1", className)}>
      {(label || description) && (
        <div className="flex-1 text-left">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                "text-base font-medium text-main cursor-pointer select-none",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-secondaryText leading-relaxed mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-secondary focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-secondary" : "bg-strongBorder"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
