"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Notification Toast Component (Section 4 Spec):
 * - Uses Sonner restyled with NaijaResolve tokens.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-btn border border-line bg-white text-navy font-sans p-4 shadow-none",
          title: "text-[14px] font-bold text-navy",
          description: "text-[13px] text-muted",
          actionButton: "bg-emerald text-ink-on-emerald font-bold rounded-btn",
          cancelButton: "bg-warm text-muted font-semibold rounded-btn",
        },
      }}
    />
  );
}

