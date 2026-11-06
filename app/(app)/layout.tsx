import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/Sidebar";

/**
 * Auth-Protected `(app)` Layout (`app/(app)/layout.tsx`)
 * Step 2 Acceptance Criterion:
 * - Verifies user session on the server; redirects logged-out users to `/login`.
 * - Loads `profiles.role` to determine if the Admin link is shown in the Sidebar.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login?setup=required");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-warm text-navy">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}

