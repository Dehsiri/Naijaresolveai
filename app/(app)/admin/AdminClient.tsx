"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building2,
  Calendar,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/app/StatusPill";
import { updateComplaintStatusAction } from "../documents/actions";
import type { ComplaintItem } from "../documents/ComplaintsClient";

/**
 * Step 9: Admin Complaints Management Table (`app/(app)/admin/AdminClient.tsx`)
 * Allows admin users to view all submitted complaints across the platform
 * and update any complaint's status (`draft`, `submitted`, `escalated`, `resolved`).
 */
export function AdminClient({
  complaints,
}: {
  complaints: (ComplaintItem & { user_id?: string })[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function handleStatusChange(
    id: string,
    newStatus: ComplaintItem["status"]
  ) {
    setBusyId(id);
    const res = await updateComplaintStatusAction(id, newStatus, true);
    setBusyId(null);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Admin updated dispute #${id.slice(0, 6)} to "${newStatus}"`);
      router.refresh();
    }
  }

  const totalCount = complaints.length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;
  const activeCount = totalCount - resolvedCount;

  return (
    <div className="space-y-6">
      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-muted">
            Total Complaints
          </p>
          <p className="text-[28px] font-extrabold text-navy mt-1">
            {totalCount}
          </p>
        </Card>

        <Card>
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-muted">
            Active / Escalated
          </p>
          <p className="text-[28px] font-extrabold text-amber-text mt-1">
            {activeCount}
          </p>
        </Card>

        <Card>
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-muted">
            Resolved Disputes
          </p>
          <p className="text-[28px] font-extrabold text-emerald-700 mt-1">
            {resolvedCount}
          </p>
        </Card>
      </div>

      {/* All Complaints List */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="h-5 w-5 text-emerald-700"
              aria-hidden="true"
            />
            <h2 className="text-[17px] font-extrabold text-navy">
              All Platform Complaints ({totalCount})
            </h2>
          </div>
        </div>

        {complaints.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted">
            No complaints have been logged yet.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {complaints.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-[620px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[15.5px] font-extrabold text-navy">
                      <Building2
                        className="h-4 w-4 text-emerald-700 shrink-0"
                        aria-hidden="true"
                      />
                      {item.company}
                    </span>
                    <StatusPill status={item.status} />
                    {item.letter && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Letter ready
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] text-muted font-medium flex flex-wrap items-center gap-2">
                    <span>{item.category || "Consumer Dispute"}</span>
                    {item.amount !== null && (
                      <span>
                        • <strong>₦{Number(item.amount).toLocaleString()}</strong>
                      </span>
                    )}
                    {item.incident_date && (
                      <span className="inline-flex items-center gap-1">
                        • <Calendar className="h-3 w-3" aria-hidden="true" />
                        {new Date(item.incident_date).toLocaleDateString("en-NG")}
                      </span>
                    )}
                  </p>

                  <p className="text-[13.5px] text-navy/90 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <label
                    htmlFor={`admin-status-${item.id}`}
                    className="sr-only"
                  >
                    Change complaint status
                  </label>
                  <select
                    id={`admin-status-${item.id}`}
                    value={item.status}
                    disabled={busyId === item.id}
                    onChange={(e) =>
                      handleStatusChange(
                        item.id,
                        e.target.value as ComplaintItem["status"]
                      )
                    }
                    className="min-h-[38px] rounded-btn border border-line bg-warm px-3 py-1.5 text-[13px] font-bold text-navy focus:outline-none focus:ring-2 focus:ring-emerald"
                  >
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <Button variant="secondary" size="sm" asChild className="gap-1.5">
                    <Link href={`/documents/${item.id}`}>
                      <span>Inspect letter</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
