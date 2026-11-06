import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Status Pill Component (Section 4 Spec):
 * - 12px/700, padding 4x10 (px-2.5 py-1), radius full.
 * - Pair states with a text label, never colour alone (Section 3 contrast rule).
 * - Variants:
 *   - Accent/Green (`resolved`, `ready`): Resolved / Ready to send
 *   - Amber (`in_progress`, `draft`, `submitted`): In progress / Draft / Submitted
 *   - Slate (`saved`, `exported`, `escalated`): Saved / Exported / Escalated
 */
export type StatusValue =
  | "in_progress"
  | "resolved"
  | "saved"
  | "draft"
  | "submitted"
  | "escalated"
  | "ready";

interface StatusPillProps {
  status: StatusValue | string;
  className?: string;
}

const STATUS_MAP: Record<
  string,
  { label: string; classes: string; dotClass: string }
> = {
  resolved: {
    label: "Resolved",
    classes: "bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-700",
  },
  ready: {
    label: "Ready to send",
    classes: "bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-700",
  },
  in_progress: {
    label: "In progress",
    classes: "bg-amber-bg text-amber-text",
    dotClass: "bg-amber-text",
  },
  draft: {
    label: "Draft",
    classes: "bg-amber-bg text-amber-text",
    dotClass: "bg-amber-text",
  },
  submitted: {
    label: "Submitted",
    classes: "bg-amber-bg text-amber-text",
    dotClass: "bg-amber-text",
  },
  saved: {
    label: "Saved",
    classes: "bg-slate-bg text-slate-text",
    dotClass: "bg-slate-text",
  },
  exported: {
    label: "Exported",
    classes: "bg-slate-bg text-slate-text",
    dotClass: "bg-slate-text",
  },
  escalated: {
    label: "Escalated",
    classes: "bg-slate-bg text-slate-text",
    dotClass: "bg-slate-text",
  },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const normalized = status?.toLowerCase() || "draft";
  const config = STATUS_MAP[normalized] || {
    label: status,
    classes: "bg-slate-bg text-slate-text",
    dotClass: "bg-slate-text",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold leading-none whitespace-nowrap",
        config.classes,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}

