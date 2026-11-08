"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/app/StatusPill";
import {
  createComplaintAction,
  updateComplaintStatusAction,
  deleteComplaintAction,
} from "./actions";

export interface ComplaintItem {
  id: string;
  company: string;
  category: string | null;
  description: string;
  amount: number | null;
  incident_date: string | null;
  status: "draft" | "submitted" | "escalated" | "resolved";
  letter: string | null;
  created_at: string;
}

const CATEGORIES = [
  "Banking & Failed Transfer",
  "Unauthorised Debit / POS",
  "Airline & Travel Refund",
  "Electricity / Estimated Billing (NERC)",
  "Telecoms & Data Depletion (NCC)",
  "Tenancy & Rent Dispute",
  "E-commerce / Defective Product (FCCPC)",
  "Employment & Unpaid Salary",
];

/**
 * Interactive Client View for Step 5:
 * - Form to log a new complaint (with a 1-click "Fill sample CBN bank dispute" button for fast demoing)
 * - List of user's complaints with status switcher (`draft`, `submitted`, `escalated`, `resolved`),
 *   Delete button, and link to `/documents/[id]` for AI letter generation & preview.
 */
export function ComplaintsClient({
  initialComplaints,
  defaultCompany = "",
  defaultDescription = "",
}: {
  initialComplaints: ComplaintItem[];
  defaultCompany?: string;
  defaultDescription?: string;
}) {
  const router = useRouter();
  const [company, setCompany] = React.useState(defaultCompany);
  const [category, setCategory] = React.useState(CATEGORIES[0]);
  const [amount, setAmount] = React.useState("");
  const [incidentDate, setIncidentDate] = React.useState("");
  const [description, setDescription] = React.useState(defaultDescription);
  const [submitting, setSubmitting] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  function handleFillDemo() {
    setCompany("Zenith Guaranty Bank PLC");
    setCategory("Banking & Failed Transfer");
    setAmount("45000");
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000)
      .toISOString()
      .split("T")[0];
    setIncidentDate(threeDaysAgo);
    setDescription(
      "My account was debited ₦45,000 for a NIP inter-bank transfer that failed three days ago (Transaction Ref: NIP/2026/8839201). Despite visiting the branch and logging a ticket, the funds have still not been reversed into my account."
    );
    toast.success("Sample Nigerian banking dispute loaded");
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.set("company", company);
    formData.set("category", category);
    formData.set("amount", amount);
    formData.set("incidentDate", incidentDate);
    formData.set("description", description);

    const result = await createComplaintAction(formData);
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Complaint saved! Opening letter generator...");
    setCompany("");
    setAmount("");
    setIncidentDate("");
    setDescription("");

    if (result?.id) {
      router.push(`/documents/${result.id}`);
    } else {
      router.refresh();
    }
  }

  async function handleStatusChange(
    id: string,
    newStatus: "draft" | "submitted" | "escalated" | "resolved"
  ) {
    setBusyId(id);
    const res = await updateComplaintStatusAction(id, newStatus);
    setBusyId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      if (res?.automationSummary) {
        toast.success(res.automationSummary);
      } else {
        toast.success(`Dispute status updated to "${newStatus}"`);
      }
      router.refresh();
    }
  }

  async function handleDelete(id: string, companyName: string) {
    setBusyId(id);
    const res = await deleteComplaintAction(id);
    setBusyId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Deleted complaint against ${companyName}`);
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* =====================================================================
          LEFT COLUMN (5 COLS): NEW COMPLAINT FORM
      ===================================================================== */}
      <Card className="lg:col-span-5">
        <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-line">
          <div>
            <h2 className="text-[19px] font-extrabold text-navy">
              Log a new complaint
            </h2>
            <p className="text-[13px] text-muted">
              Enter the facts to track your dispute and draft a formal letter
            </p>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Fill sample</span>
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">
              Company, Bank, Landlord, or Institution
            </Label>
            <Input
              id="company"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. First Bank / Air Peace / Ikeja Electric"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Dispute category</Label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex min-h-[50px] w-full rounded-input border border-line bg-white px-4 py-3 text-[16px] text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount in dispute (₦, optional)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentDate">Incident date</Label>
              <Input
                id="incidentDate"
                name="incidentDate"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              What happened & what resolution do you want?
            </Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what happened, any reference numbers, and whether you want a refund, reversal, or repair..."
              required
              className="flex w-full rounded-input border border-line bg-white px-4 py-3 text-[16px] text-navy placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full gap-2 mt-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>
              {submitting
                ? "Saving complaint..."
                : "Save & open letter generator"}
            </span>
          </Button>
        </form>
      </Card>

      {/* =====================================================================
          RIGHT COLUMN (7 COLS): SAVED COMPLAINTS & DISPUTE TRACKER LIST
      ===================================================================== */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[19px] font-extrabold text-navy">
            Your complaints & letters ({initialComplaints.length})
          </h2>
        </div>

        {initialComplaints.length === 0 ? (
          <Card className="py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-[17px] font-bold text-navy mb-1">
              No complaints recorded yet
            </h3>
            <p className="text-[14px] text-muted max-w-[380px] mx-auto mb-5">
              Use the form on the left (or click{" "}
              <button
                type="button"
                onClick={handleFillDemo}
                className="font-bold text-emerald-700 underline"
              >
                Fill sample
              </button>
              ) to log your first dispute and generate a formal complaint
              letter.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {initialComplaints.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col justify-between gap-4 transition-colors hover:border-emerald/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[17px] font-extrabold text-navy">
                        <Building2
                          className="h-4 w-4 text-emerald-700 shrink-0"
                          aria-hidden="true"
                        />
                        {item.company}
                      </span>
                      <StatusPill status={item.status} />
                      {item.letter && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          Letter generated
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted font-medium">
                      <span>{item.category || "General Dispute"}</span>
                      {item.amount !== null && (
                        <span>
                          • <strong>₦{Number(item.amount).toLocaleString()}</strong>
                        </span>
                      )}
                      {item.incident_date && (
                        <span className="inline-flex items-center gap-1">
                          •{" "}
                          <Calendar
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          {new Date(item.incident_date).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    aria-label={`Delete complaint against ${item.company}`}
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item.id, item.company)}
                    className="self-end sm:self-start h-9 w-9 rounded-btn border border-line text-muted hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <p className="text-[14px] text-navy/90 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Bottom Action Bar: Status Switcher + Open Letter Button */}
                <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`status-${item.id}`}
                      className="text-[12px] font-bold uppercase tracking-wider text-muted"
                    >
                      Status:
                    </label>
                    <select
                      id={`status-${item.id}`}
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
                  </div>

                  <Button size="sm" asChild className="gap-1.5">
                    <Link href={`/documents/${item.id}`}>
                      <span>
                        {item.letter
                          ? "View complaint letter"
                          : "Generate AI letter"}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

