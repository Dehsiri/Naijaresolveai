import Link from "next/link";
import {
  Search,
  Bell,
  MessageSquareText,
  FileText,
  BookOpen,
  Users,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/app/StatusPill";
import { ActionCard } from "@/components/app/ActionCard";
import { signOutAction } from "@/app/(auth)/actions";

/**
 * Step 4: Full Dashboard Page (`app/(app)/dashboard/page.tsx`)
 * Implements Section 5.2 specifications:
 * 1. Top bar: search field ("Search conversations, documents, guides"), notifications button, avatar initials.
 * 2. Greeting: "Good morning, {firstName}" + "What do you need help with today?"
 * 3. Four quick-action cards: Ask a question, Draft a document, Know your rights, Find a lawyer.
 * 4. Two cards side by side: Recent conversations and Saved documents (from `conversations` and `complaints`),
 *    each row with a status pill + clean empty states when the user has no rows yet.
 * 5. Navy "next step" card with a primary action (opens the letter for the most recent in-progress dispute,
 *    or prompts the user to start their first dispute).
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "";

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();

  const fullName =
    profile?.full_name || user?.email?.split("@")[0] || "Naija User";
  const firstName = fullName.split(" ")[0];
  const initials = fullName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // 2. Fetch user's recent conversations (RLS ensures only own rows are returned)
  const searchQuery = searchParams?.q?.trim() || "";
  let conversationsQuery = supabase
    .from("conversations")
    .select("id, title, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (searchQuery) {
    conversationsQuery = conversationsQuery.ilike("title", `%${searchQuery}%`);
  }

  const { data: conversations } = await conversationsQuery;

  // 3. Fetch user's saved complaints / documents (RLS ensures only own rows are returned)
  let complaintsQuery = supabase
    .from("complaints")
    .select("id, company, category, status, letter, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (searchQuery) {
    complaintsQuery = complaintsQuery.ilike("company", `%${searchQuery}%`);
  }

  const { data: complaints } = await complaintsQuery;

  // Find the most recent active/draft dispute for the Navy "Next Step" card
  const activeComplaint =
    complaints?.find(
      (c) =>
        c.status === "draft" ||
        c.status === "submitted" ||
        c.status === "escalated"
    ) || complaints?.[0];

  return (
    <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1200px] w-full mx-auto space-y-8">
      {/* =====================================================================
          1. TOP BAR: SEARCH FIELD, NOTIFICATIONS BUTTON, AVATAR INITIALS
      ===================================================================== */}
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <form
          action="/dashboard"
          method="get"
          className="relative flex-1 max-w-[520px]"
        >
          <label htmlFor="dashboard-search" className="sr-only">
            Search conversations, documents, guides
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
            aria-hidden="true"
          />
          <Input
            id="dashboard-search"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search conversations, documents, guides"
            className="pl-11 min-h-[48px]"
          />
        </form>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="h-[44px] w-[44px] rounded-btn border border-line bg-white text-navy hover:bg-navy/5 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          <div
            title={fullName}
            aria-label={`Signed in as ${fullName}`}
            className="h-[44px] w-[44px] rounded-full bg-ig-gradient text-white text-[14px] font-extrabold flex items-center justify-center shrink-0"
          >
            {initials || "NR"}
          </div>

          <form action={signOutAction} className="lg:hidden">
            <Button variant="secondary" size="sm" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </header>

      {/* =====================================================================
          2. GREETING SECTION
      ===================================================================== */}
      <section>
        <h1 className="text-page-h1 text-navy mb-1">
          Good morning, {firstName}
        </h1>
        <p className="text-[16px] text-muted">
          What do you need help with today?
        </p>
      </section>

      {/* =====================================================================
          3. FOUR QUICK-ACTION CARDS
      ===================================================================== */}
      <section aria-label="Quick actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Ask a question"
            description="Plain-English answers with Nigerian sources"
            href="/assistant"
            icon={MessageSquareText}
          />
          <ActionCard
            title="Draft a document"
            description="Generate a formal complaint or demand letter"
            href="/documents?new=true"
            icon={FileText}
          />
          <ActionCard
            title="Know your rights"
            description="CBN, FCCPC, tenancy, and consumer guides"
            href="/assistant?q=What+are+my+consumer+and+banking+rights+in+Nigeria%3F"
            icon={BookOpen}
          />
          <ActionCard
            title="Find a lawyer"
            description="When to escalate to a verified practitioner"
            href="/assistant?q=When+should+I+hire+a+qualified+lawyer+for+a+dispute+in+Nigeria%3F"
            icon={Users}
          />
        </div>
      </section>

      {/* =====================================================================
          4. TWO CARDS SIDE BY SIDE: RECENT CONVERSATIONS & SAVED DOCUMENTS
      ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-line">
              <div>
                <h2 className="text-[18px] font-bold text-navy">
                  Recent conversations
                </h2>
                <p className="text-[13px] text-muted">
                  Your legal questions with the AI assistant
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/assistant" className="gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>New chat</span>
                </Link>
              </Button>
            </div>

            {!conversations || conversations.length === 0 ? (
              <div className="py-8 text-center">
                <div className="h-11 w-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-[15px] font-bold text-navy mb-1">
                  No conversations yet
                </p>
                <p className="text-[14px] text-muted max-w-[320px] mx-auto mb-4">
                  Ask a question about a failed bank transfer, tenancy notice,
                  or consumer issue to see your history here.
                </p>
                <Button size="sm" asChild>
                  <Link href="/assistant">Ask your first question</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/assistant?id=${conv.id}`}
                      className="flex items-center justify-between gap-3 py-3.5 hover:bg-warm/60 -mx-2 px-2 rounded-btn transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-navy truncate">
                          {conv.title}
                        </p>
                        <p className="text-[13px] text-muted">
                          {new Date(conv.created_at).toLocaleDateString(
                            "en-NG",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <StatusPill status={conv.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Saved Documents / Complaints Card */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-line">
              <div>
                <h2 className="text-[18px] font-bold text-navy">
                  Saved documents
                </h2>
                <p className="text-[13px] text-muted">
                  Complaint letters and active disputes
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/documents" className="gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>New complaint</span>
                </Link>
              </Button>
            </div>

            {!complaints || complaints.length === 0 ? (
              <div className="py-8 text-center">
                <div className="h-11 w-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-[15px] font-bold text-navy mb-1">
                  No saved documents yet
                </p>
                <p className="text-[14px] text-muted max-w-[320px] mx-auto mb-4">
                  Log a dispute against a bank, airline, landlord, or service
                  provider to generate a formal complaint letter.
                </p>
                <Button size="sm" asChild>
                  <Link href="/documents">Draft a complaint letter</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {complaints.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="flex items-center justify-between gap-3 py-3.5 hover:bg-warm/60 -mx-2 px-2 rounded-btn transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-navy truncate">
                          Complaint against {doc.company}
                        </p>
                        <p className="text-[13px] text-muted">
                          {doc.category || "Consumer Dispute"}
                          {doc.amount
                            ? ` • ₦${Number(doc.amount).toLocaleString()}`
                            : ""}
                        </p>
                      </div>
                      <StatusPill
                        status={
                          doc.letter && doc.status === "draft"
                            ? "ready"
                            : doc.status
                        }
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>

      {/* =====================================================================
          5. NAVY "NEXT STEP" CARD WITH PRIMARY ACTION
      ===================================================================== */}
      <section>
        <div className="rounded-card bg-navy text-white border border-navy-line p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-[680px]">
            <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Recommended next step</span>
            </div>

            {activeComplaint ? (
              <>
                <h2 className="text-[20px] font-extrabold text-white">
                  {activeComplaint.letter
                    ? `Review and send your complaint letter to ${activeComplaint.company}`
                    : `Generate your formal complaint letter for ${activeComplaint.company}`}
                </h2>
                <p className="text-[15px] text-muted-dark">
                  Your dispute with {activeComplaint.company} is currently
                  marked as{" "}
                  <strong className="text-white">
                    {activeComplaint.status}
                  </strong>
                  . Open the document to preview, copy, or update its status.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[20px] font-extrabold text-white">
                  Have an unresolved bank debit or service complaint?
                </h2>
                <p className="text-[15px] text-muted-dark">
                  Start by logging the details of your dispute or asking the AI
                  legal assistant what your options are under Nigerian law.
                </p>
              </>
            )}
          </div>

          <div className="shrink-0">
            {activeComplaint ? (
              <Button asChild size="lg" className="gap-2">
                <Link href={`/documents/${activeComplaint.id}`}>
                  <span>Open complaint letter</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="gap-2">
                <Link href="/documents">
                  <span>Create your first complaint</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
