"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { setDemoUser, clearDemoUser } from "@/lib/demo-store";

/**
 * Sign up a new user with Supabase Auth (or instant Demo Session when Supabase env vars are not yet added).
 */
export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const initialQuestion = String(formData.get("q") || "").trim();

  if (!fullName || !email || password.length < 6) {
    return {
      error:
        "Please enter your full name, valid email, and a password of at least 6 characters.",
    };
  }

  // Seamless Demo Mode when Supabase keys are not yet configured
  if (!isSupabaseConfigured()) {
    const isAdminEmail = email.toLowerCase().includes("admin");
    setDemoUser({
      id: "demo-user-1",
      email,
      full_name: fullName,
      role: isAdminEmail ? "admin" : "user",
    });

    revalidatePath("/", "layout");
    if (initialQuestion) {
      redirect(`/assistant?q=${encodeURIComponent(initialQuestion)}`);
    }
    redirect("/dashboard");
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: fullName,
        role: "user",
      },
      { onConflict: "id" }
    );
  }

  if (data.user && !data.session) {
    return {
      success:
        "Account created! Please check your email inbox to confirm your account.",
    };
  }

  revalidatePath("/", "layout");
  if (initialQuestion) {
    redirect(`/assistant?q=${encodeURIComponent(initialQuestion)}`);
  }
  redirect("/dashboard");
}

/**
 * Log in an existing user with email and password (or instant Demo Session if Supabase is not configured yet).
 */
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const initialQuestion = String(formData.get("q") || "").trim();

  if (!email || !password) {
    return { error: "Please enter both your email and password." };
  }

  if (!isSupabaseConfigured()) {
    const isAdminEmail = email.toLowerCase().includes("admin");
    const derivedName = email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    setDemoUser({
      id: "demo-user-1",
      email,
      full_name: derivedName || "Chinedu Okafor",
      role: isAdminEmail ? "admin" : "user",
    });

    revalidatePath("/", "layout");
    if (initialQuestion) {
      redirect(`/assistant?q=${encodeURIComponent(initialQuestion)}`);
    }
    redirect("/dashboard");
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  if (initialQuestion) {
    redirect(`/assistant?q=${encodeURIComponent(initialQuestion)}`);
  }
  redirect("/dashboard");
}

/**
 * Log out the current user and redirect to `/login`.
 */
export async function signOutAction() {
  clearDemoUser();
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
