import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, disabled, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <div className="flex items-start gap-3">
        <div className="flex items-center h-6">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className={cn(
              "h-5 w-5 rounded border border-strongBorder bg-white text-secondary transition-colors cursor-pointer",
              "focus-visible:ring-3 focus-visible:ring-secondary focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />
        </div>
        <div className="text-left">
          <label
            htmlFor={checkboxId}
            className={cn(
              "text-base font-medium text-main cursor-pointer select-none",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            {label}
          </label>
          {description && (
            <p className="text-xs text-secondaryText leading-relaxed mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
