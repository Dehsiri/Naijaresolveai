"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getDemoUser,
  getDemoComplaints,
  saveDemoComplaints,
} from "@/lib/demo-store";

/**
 * Step 5: Complaints CRUD Server Actions (`app/(app)/documents/actions.ts`)
 * Supports both live Supabase Postgres and automatic Demo Store fallback.
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
  status: "draft" | "submitted" | "escalated" | "resolved"
) {
  if (!isSupabaseConfigured()) {
    const list = getDemoComplaints();
    const updated = list.map((c) =>
      c.id === complaintId ? { ...c, status } : c
    );
    saveDemoComplaints(updated);
    revalidatePath("/documents");
    revalidatePath(`/documents/${complaintId}`);
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update a complaint." };
  }

  const { error } = await supabase
    .from("complaints")
    .update({ status })
    .eq("id", complaintId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${complaintId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteComplaintAction(complaintId: string) {
  if (!isSupabaseConfigured()) {
    const list = getDemoComplaints().filter((c) => c.id !== complaintId);
    saveDemoComplaints(list);
    revalidatePath("/documents");
    revalidatePath("/dashboard");
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
  return { success: true };
}
