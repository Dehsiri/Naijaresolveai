"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getDemoUser,
  getDemoComplaints,
  saveDemoComplaints,
} from "@/lib/demo-store";
import { triggerComplaintAutomation } from "@/lib/automation";

/**
 * Step 5 & Step 8: Complaints CRUD + Automation Server Actions (`app/(app)/documents/actions.ts`)
 * - Create a complaint (`createComplaintAction`)
 * - Update complaint status (`updateComplaintStatusAction`) — triggers Section 8 Automation
 *   when status changes to `submitted`!
 * - Delete a complaint (`deleteComplaintAction`)
 */

export async function createComplaintAction(formData: FormData) {
  const company = String(formData.get("company") || "").trim();
  const category = String(
    formData.get("category") || "Banking & Transfers"
  ).trim();
  const description = String(formData.get("description") || "").trim();
  const amountRaw = String(formData.get("amount") || "").trim();
  const incidentDateRaw = String(formData.get("incidentDate") || "").trim();

  if (!company || !description) {
    return {
      error:
        "Please provide both the company/institution name and what happened.",
    };
  }

  const amount = amountRaw ? Number(amountRaw.replace(/,/g, "")) : null;
  const incident_date = incidentDateRaw || null;

  if (!isSupabaseConfigured()) {
    const demoUser = getDemoUser();
    const list = getDemoComplaints();
    const newId = `demo-${Date.now()}`;
    list.unshift({
      id: newId,
      user_id: demoUser?.id || "demo-user-1",
      company,
      category,
      description,
      amount: amount && !Number.isNaN(amount) ? amount : null,
      incident_date,
      status: "draft",
      letter: null,
      created_at: new Date().toISOString(),
    });
    saveDemoComplaints(list);
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    return { id: newId };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a complaint." };
  }

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: user.id,
      company,
      category,
      description,
      amount: amount && !Number.isNaN(amount) ? amount : null,
      incident_date,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");

  return { id: data.id };
}

export async function updateComplaintStatusAction(
  complaintId: string,
  status: "draft" | "submitted" | "escalated" | "resolved",
  allowAdminOverride = false
) {
  let automationSummary: string | null = null;

  if (!isSupabaseConfigured()) {
    const demoUser = getDemoUser();
    const list = getDemoComplaints();
    const target = list.find((c) => c.id === complaintId);

    const updated = list.map((c) =>
      c.id === complaintId ? { ...c, status } : c
    );
    saveDemoComplaints(updated);

    if (status === "submitted" && target) {
      const autoRes = await triggerComplaintAutomation({
        complaintId: target.id,
        company: target.company,
        category: target.category,
        amount: target.amount,
        incidentDate: target.incident_date,
        description: target.description,
        letter: target.letter,
        userName: demoUser?.full_name || "Chinedu Okafor",
        userEmail: demoUser?.email || "chinedu@example.com",
      });
      automationSummary = autoRes.summary;
    }

    revalidatePath("/documents");
    revalidatePath(`/documents/${complaintId}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true, automationSummary };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update a complaint." };
  }

  let query = supabase
    .from("complaints")
    .update({ status })
    .eq("id", complaintId);

  if (!allowAdminOverride) {
    query = query.eq("user_id", user.id);
  }

  const { error } = await query;

  if (error) {
    return { error: error.message };
  }

  // Step 8: If status was changed to `submitted`, fire the Automation workflow
  if (status === "submitted") {
    const { data: complaint } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", complaintId)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (complaint) {
      const autoRes = await triggerComplaintAutomation({
        complaintId: complaint.id,
        company: complaint.company,
        category: complaint.category,
        amount: complaint.amount,
        incidentDate: complaint.incident_date,
        description: complaint.description,
        letter: complaint.letter,
        userName:
          profile?.full_name || user.email?.split("@")[0] || "Complainant",
        userEmail: user.email || "user@example.com",
      });
      automationSummary = autoRes.summary;
    }
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${complaintId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true, automationSummary };
}

export async function deleteComplaintAction(complaintId: string) {
  if (!isSupabaseConfigured()) {
    const list = getDemoComplaints().filter((c) => c.id !== complaintId);
    saveDemoComplaints(list);
    revalidatePath("/documents");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to delete a complaint." };
  }

  const { error } = await supabase
    .from("complaints")
    .delete()
    .eq("id", complaintId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}
