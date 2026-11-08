import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoUser } from "@/lib/demo-store";
import { Sidebar } from "@/components/app/Sidebar";

/**
 * Auth-Protected `(app)` Layout (`app/(app)/layout.tsx`)
 * Verifies user session on the server (or Demo Session when Supabase env vars are not yet added).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    const demoUser = getDemoUser();
    if (!demoUser) {
      redirect("/login");
    }
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-warm text-navy">
        <Sidebar isAdmin={demoUser.role === "admin"} />
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
