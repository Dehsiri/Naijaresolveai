import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button Component (Instagram-styled):
 * - Primary: Instagram gradient (`bg-ig-gradient`) with crisp white text, 700 weight, min-h 44px, radius 12px.
 * - Secondary: Transparent, 1px border #DBDBDB, dark text.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-btn text-[15px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-5 py-2.5",
  {
    variants: {
      variant: {
        default:
          "bg-ig-gradient text-white hover:bg-ig-gradient-hover active:opacity-95",
        secondary:
          "bg-transparent border border-line text-navy hover:bg-navy/5",
        darkSecondary:
          "bg-navy-800 border border-navy-line text-[#E5E5E5] hover:bg-navy-700",
        ghost:
          "bg-transparent text-navy hover:bg-navy/5 font-semibold",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "min-h-[42px] px-4 py-2 text-[14px]",
        sm: "min-h-[36px] px-3.5 py-1.5 text-[13px]",
        lg: "min-h-[46px] px-5 py-2.5 text-[15px]",
        icon: "h-[40px] w-[40px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
