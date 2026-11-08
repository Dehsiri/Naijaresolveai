"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Printer,
  Send,
  ShieldAlert,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/app/StatusPill";
import { updateComplaintStatusAction } from "../actions";
import type { ComplaintItem } from "../ComplaintsClient";

/**
 * Step 6 Document Preview & Letter Generator Client (`app/(app)/documents/[id]/DocumentPreviewClient.tsx`)
 * Implements Section 4 "Document preview" spec:
 * - White "paper" card on `warm` bg, serif-free (same Plus Jakarta Sans font), 15px body,
 *   header with To / Date / Subject.
 * - Mandatory disclaimer: "Legal information, not legal advice."
 * - 1-click "Generate AI Letter" / "Regenerate", Copy to Clipboard, Print/Save PDF,
 *   and Status updater (`draft` -> `submitted` -> `escalated` -> `resolved`).
 */
export function DocumentPreviewClient({
  complaint,
  senderName,
}: {
  complaint: ComplaintItem;
  senderName: string;
}) {
  const router = useRouter();
  const [letter, setLetter] = React.useState<string>(complaint.letter || "");
  const [status, setStatus] = React.useState<ComplaintItem["status"]>(
    complaint.status
  );
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Automatically generate letter on first visit if complaint.letter is empty
  const hasAutoTriggered = React.useRef(false);
  React.useEffect(() => {
    if (!complaint.letter && !hasAutoTriggered.current) {
      hasAutoTriggered.current = true;
      handleGenerateLetter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerateLetter() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: complaint.id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Could not generate letter");
      } else {
        setLetter(data.letter);
        toast.success("Formal complaint letter generated and saved!");
        router.refresh();
      }
    } catch {
      toast.error("Network error while generating complaint letter.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!letter) return;
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    toast.success("Letter copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  async function handleStatusUpdate(newStatus: ComplaintItem["status"]) {
    setSubmitting(true);
    const res = await updateComplaintStatusAction(complaint.id, newStatus);
    setSubmitting(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      setStatus(newStatus);
      if (res?.automationSummary) {
        toast.success(`Complaint submitted! ${res.automationSummary}`);
      } else {
        toast.success(`Complaint marked as "${newStatus}"`);
      }
      router.refresh();
    }
  }

  const formattedDate = new Date(complaint.created_at).toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="space-y-5">
      {/* Top Navigation & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-[14px] font-bold text-muted hover:text-navy transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Documents & Disputes</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGenerateLetter}
            disabled={generating}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{letter ? "Regenerate AI letter" : "Generate AI letter"}</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            disabled={!letter}
            className="gap-1.5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copied ? "Copied" : "Copy letter"}</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            disabled={!letter}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print / Save PDF</span>
          </Button>

          {status === "draft" && (
            <Button
              type="button"
              size="sm"
              disabled={submitting || !letter}
              onClick={() => handleStatusUpdate("submitted")}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mark as Submitted</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout: Left Dispute Metadata (4 cols) + Right Paper Preview (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Summary Card */}
        <Card className="lg:col-span-4 space-y-4 print:hidden">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
            <h2 className="text-[16px] font-extrabold text-navy">
              Dispute Details
            </h2>
            <StatusPill
              status={letter && status === "draft" ? "ready" : status}
            />
          </div>

          <dl className="space-y-3 text-[13.5px]">
            <div>
              <dt className="text-muted font-semibold">Target Company / Party</dt>
              <dd className="font-bold text-navy text-[15px]">
                {complaint.company}
              </dd>
            </div>

            <div>
              <dt className="text-muted font-semibold">Category</dt>
              <dd className="font-semibold text-navy">
                {complaint.category || "Consumer Dispute"}
              </dd>
            </div>

            {complaint.amount !== null && (
              <div>
                <dt className="text-muted font-semibold">Amount in Dispute</dt>
                <dd className="font-extrabold text-emerald-700 text-[15px]">
                  ₦{Number(complaint.amount).toLocaleString()}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-muted font-semibold">Update Dispute Status</dt>
              <dd className="mt-1">
                <select
                  aria-label="Update dispute status"
                  value={status}
                  disabled={submitting}
                  onChange={(e) =>
                    handleStatusUpdate(
                      e.target.value as ComplaintItem["status"]
                    )
                  }
                  className="w-full min-h-[38px] rounded-btn border border-line bg-warm px-3 py-1.5 text-[13px] font-bold text-navy focus:outline-none focus:ring-2 focus:ring-emerald"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                </select>
              </dd>
            </div>
          </dl>

          <div className="rounded-input bg-warm border border-line p-3.5 text-[12.5px] text-muted-2 flex items-start gap-2">
            <ShieldAlert
              className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>
              <strong>Legal information, not legal advice.</strong> Verify any{" "}
              <code>[section to verify]</code> placeholders before filing in
              court.
            </span>
          </div>
        </Card>

        {/* Right Paper Card: Section 4 "Document preview" Spec */}
        <div className="lg:col-span-8">
          <div className="rounded-card border border-line bg-white p-6 md:p-8 text-navy">
            {/* Paper Header with To / Date / Subject per Section 4 */}
            <div className="pb-5 mb-6 border-b border-line space-y-2 text-[14px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-emerald-700">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  Formal Complaint Letter Preview
                </span>
                <span className="text-[12px] font-semibold text-muted">
                  Prepared for {senderName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div>
                  <span className="text-muted font-semibold">To: </span>
                  <strong className="text-navy">{complaint.company}</strong>
                </div>
                <div>
                  <span className="text-muted font-semibold">Date: </span>
                  <strong className="text-navy">{formattedDate}</strong>
                </div>
              </div>

              <div>
                <span className="text-muted font-semibold">Subject: </span>
                <strong className="text-navy">
                  Formal Complaint & Demand for Resolution —{" "}
                  {complaint.category || "Dispute"}
                  {complaint.amount !== null
                    ? ` (₦${Number(complaint.amount).toLocaleString()})`
                    : ""}
                </strong>
              </div>
            </div>

            {/* Letter Body (15px body, sans-serif per Section 4) */}
            {generating ? (
              <div className="py-16 text-center space-y-3">
                <div className="h-11 w-11 rounded-full bg-ig-gradient text-white flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-[15px] font-bold text-navy">
                  Drafting your formal Nigerian complaint letter...
                </p>
                <p className="text-[13px] text-muted">
                  Structuring statement of facts, regulatory timeline, and
                  demand notice.
                </p>
              </div>
            ) : letter ? (
              <div className="text-[15px] leading-[1.65] text-navy whitespace-pre-wrap font-sans">
                {letter}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[15px] text-muted mb-4">
                  No letter has been generated for this complaint yet.
                </p>
                <Button onClick={handleGenerateLetter} className="gap-2">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Generate AI Complaint Letter</span>
                </Button>
              </div>
            )}

            {/* Footer Disclaimer inside Document Preview */}
            <div className="mt-8 pt-4 border-t border-line flex items-center justify-between text-[12px] text-muted-2">
              <span>NaijaResolve AI — Document Generator</span>
              <span>Legal information, not legal advice.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

