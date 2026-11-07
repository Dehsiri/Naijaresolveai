import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input Component (Section 4 Spec):
 * - Min-h 48-52px, radius 14px (rounded-input), 1px border, 16px text.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-[42px] w-full rounded-input border border-line bg-white px-3.5 py-2 text-[14px] text-navy placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

