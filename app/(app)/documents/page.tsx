import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ComplaintsClient, type ComplaintItem } from "./ComplaintsClient";

/**
 * Step 5: Documents & Complaints Tracking Page (`app/(app)/documents/page.tsx`)
 * Acceptance Criteria:
 * - Complaint form + list: create, read, update status, delete
 * - CRUD works and persists in Supabase `complaints` table
 */
export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: { company?: string; description?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: complaints } = await supabase
    .from("complaints")
    .select(
      "id, company, category, description, amount, incident_date, status, letter, created_at"
    )
    .eq("user_id", user?.id || "")
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1200px] w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-page-h1 text-navy mb-1">
            Documents & Dispute Tracker
          </h1>
          <p className="text-[16px] text-muted">
            Log a complaint, generate a formal demand or complaint letter, and
            track its resolution status.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-white border border-line px-3.5 py-1.5 text-[12px] font-semibold text-muted-2">
          <ShieldAlert
            className="h-4 w-4 text-emerald-700 shrink-0"
            aria-hidden="true"
          />
          <span>Legal information, not legal advice.</span>
        </div>
      </div>

      {/* Interactive CRUD Form & List */}
      <ComplaintsClient
        initialComplaints={(complaints as ComplaintItem[]) || []}
        defaultCompany={searchParams?.company || ""}
        defaultDescription={searchParams?.description || ""}
      />
    </main>
  );
}

