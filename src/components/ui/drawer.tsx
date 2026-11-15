import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: "left" | "right";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = "right",
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      <div
        className="fixed inset-0 bg-[#123C43]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 flex max-w-full",
          side === "right" ? "right-0" : "left-0"
        )}
      >
        <div className="w-screen max-w-md bg-white p-6 shadow-modal border-l border-subtleBorder flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-subtleBorder">
              <div>
                <h3 className="text-xl font-bold text-main">{title}</h3>
                {description && (
                  <p className="text-sm text-secondaryText mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-secondaryText hover:text-main hover:bg-canvas-subtle transition-colors focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="py-4 text-left">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
