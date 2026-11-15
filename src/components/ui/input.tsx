import * as React from "react";
import { Search, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isSearch?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, helperText, error, isSearch, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = React.useState(false);

    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-main select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {isSearch && (
            <div className="absolute left-3.5 pointer-events-none text-secondaryText">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={actualType}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              "flex h-11 w-full rounded-lg border border-subtleBorder bg-white px-3.5 py-2 text-base text-main placeholder:text-mutedText transition-colors",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-secondary focus-visible:border-secondary",
              "disabled:cursor-not-allowed disabled:bg-canvas-subtle disabled:opacity-60",
              isSearch && "pl-10",
              isPassword && "pr-10",
              error && "border-clinical-danger focus-visible:ring-clinical-danger",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 text-secondaryText hover:text-main focus:outline-none focus:ring-2 focus:ring-secondary rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs font-medium text-clinical-danger" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-secondaryText">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
