import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoUser, getDemoComplaints } from "@/lib/demo-store";
import { DocumentPreviewClient } from "./DocumentPreviewClient";
import type { ComplaintItem } from "../ComplaintsClient";

/**
 * Step 6: Document Preview & AI Letter Generation Page (`app/(app)/documents/[id]/page.tsx`)
 */
export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured()) {
    const demoUser = getDemoUser();
    const list = getDemoComplaints();
    const complaint = list.find((c) => c.id === params.id) || list[0];

    if (!complaint) {
      notFound();
    }

    return (
      <main className="flex-1 px-4 md:px-6 py-5 md:py-6 max-w-[1060px] w-full mx-auto">
        <DocumentPreviewClient
          complaint={complaint as ComplaintItem}
          senderName={demoUser?.full_name || "Chinedu Okafor"}
        />
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: complaint, error } = await supabase
    .from("complaints")
    .select(
      "id, company, category, description, amount, incident_date, status, letter, created_at"
    )
    .eq("id", params.id)
    .single();

  if (error || !complaint) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user?.id || "")
    .single();

  const senderName =
    profile?.full_name || user?.email?.split("@")[0] || "Complainant";

  return (
    <main className="flex-1 px-4 md:px-6 py-5 md:py-6 max-w-[1060px] w-full mx-auto">
      <DocumentPreviewClient
        complaint={complaint as ComplaintItem}
        senderName={senderName}
      />
    </main>
  );
}
