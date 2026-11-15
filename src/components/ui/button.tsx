import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "mint";
  size?: "sm" | "md" | "lg" | "elder";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target-min";

    const variantStyles = {
      primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-sm",
      secondary: "bg-secondary text-white hover:bg-secondary-hover active:bg-secondary-active shadow-sm",
      outline: "border border-strongBorder bg-white text-main hover:bg-canvas-subtle hover:border-secondary",
      ghost: "text-main hover:bg-mint hover:text-primary",
      destructive: "bg-clinical-danger text-white hover:bg-[#9B3C3C] shadow-sm",
      mint: "bg-mint text-primary hover:bg-mint-hover border border-mint-border",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-sm rounded-md gap-1.5",
      md: "h-11 px-4 text-base rounded-lg gap-2",
      lg: "h-12 px-6 text-lg rounded-xl gap-2.5",
      elder: "h-14 px-7 text-xl rounded-2xl gap-3 touch-target-elder font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
