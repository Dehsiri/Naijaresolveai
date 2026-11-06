"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Sign up a new user with Supabase Auth and ensure a row exists in `public.profiles`.
 * Supports forwarding an initial legal question (`?q=...`) from the landing page prompt card.
 */
export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured yet. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    };
  }

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const initialQuestion = String(formData.get("q") || "").trim();

  if (!fullName || !email || password.length < 6) {
    return {
      error: "Please enter your full name, valid email, and a password of at least 6 characters.",
    };
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

  // Ensure a row exists in `profiles` (Section 7 requirement: trigger OR server action)
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

  // If email confirmation is enabled on the Supabase project and session is null,
  // inform the user clearly.
  if (data.user && !data.session) {
    return {
      success:
        "Account created! Please check your email inbox to confirm your account, or disable 'Confirm email' in Supabase Auth -> Providers -> Email for instant login.",
    };
  }

  revalidatePath("/", "layout");
  if (initialQuestion) {
    redirect(`/assistant?q=${encodeURIComponent(initialQuestion)}`);
  }
  redirect("/dashboard");
}

/**
 * Log in an existing user with email and password.
 */
export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured yet. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    };
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const initialQuestion = String(formData.get("q") || "").trim();

  if (!email || !password) {
    return { error: "Please enter both your email and password." };
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
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

