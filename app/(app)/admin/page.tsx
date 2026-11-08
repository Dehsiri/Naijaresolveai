import Link from "next/link";
import { ShieldAlert, Lock } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoUser, getDemoComplaints } from "@/lib/demo-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminClient } from "./AdminClient";
import type { ComplaintItem } from "../documents/ComplaintsClient";

/**
 * Step 9: Admin Page (`app/(app)/admin/page.tsx`)
 * Acceptance Criteria:
 * - Only accessible when `profiles.role === 'admin'`
 * - Non-admin users get blocked with a clear Access Restricted screen
 * - Shows all complaints and allows changing status
 */
export default async function AdminPage() {
  let isAdmin = false;
  let allComplaints: ComplaintItem[] = [];

  if (!isSupabaseConfigured()) {
    const demoUser = getDemoUser();
    isAdmin = demoUser?.role === "admin";
    if (isAdmin) {
      allComplaints = getDemoComplaints() as ComplaintItem[];
    }
  } else {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id || "")
      .single();

    isAdmin = profile?.role === "admin";

    if (isAdmin) {
      const { data } = await supabase
        .from("complaints")
        .select(
          "id, user_id, company, category, description, amount, incident_date, status, letter, created_at"
        )
        .order("created_at", { ascending: false });

      allComplaints = (data as ComplaintItem[]) || [];
    }
  }

  // Block non-admin users per Step 9 Acceptance Criterion
  if (!isAdmin) {
    return (
      <main className="flex-1 px-4 md:px-6 py-12 max-w-[600px] w-full mx-auto flex items-center justify-center">
        <Card className="w-full text-center p-6 md:p-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-amber-bg text-amber-text flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-[22px] font-extrabold text-navy">
            Admin Access Restricted
          </h1>
          <p className="text-[14.5px] text-muted leading-relaxed">
            This page is restricted to administrators (<code>role = &apos;admin&apos;</code>).
            Your account currently has standard user permissions.
          </p>
          <p className="text-[12.5px] text-muted-2 bg-warm border border-line rounded-input p-3">
            <strong>For Demo / Testing:</strong> In Supabase SQL Editor, run{" "}
            <code>UPDATE profiles SET role = &apos;admin&apos; WHERE id = auth.uid();</code>{" "}
            (or in Demo Mode, sign in with an email containing{" "}
            <code>admin</code>, e.g. <code>admin@naijaresolve.com</code>).
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-5 md:py-6 max-w-[1060px] w-full mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-page-h1 text-navy mb-1">
            Admin Oversight Panel
          </h1>
          <p className="text-[14.5px] text-muted">
            Review all submitted citizen disputes across Nigeria and update
            escalation statuses.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-[12px] font-bold text-emerald-700">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Role: Administrator</span>
        </div>
      </div>

      <AdminClient complaints={allComplaints} />
    </main>
  );
}
