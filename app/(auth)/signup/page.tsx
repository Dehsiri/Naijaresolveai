"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Scale, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { signUpAction } from "../actions";

/**
 * Signup Form Content (Client Component inside Suspense boundary)
 */
function SignupForm() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("q") || "";

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signUpAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setSuccess(result.success);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[440px] bg-white border-line p-6 md:p-8 rounded-card text-navy">
      <div className="mb-6">
        <h1 className="text-[26px] font-extrabold text-navy mb-1.5">
          Create your account
        </h1>
        <p className="text-[15px] text-muted">
          Know your rights, draft formal complaint letters, and track your
          disputes.
        </p>
      </div>

      {initialQuestion && (
        <div className="mb-5 rounded-input bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700 font-medium">
          We&apos;ll answer your question right after sign-up:{" "}
          <span className="font-bold">&ldquo;{initialQuestion}&rdquo;</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-input bg-red-50 border border-red-200 px-4 py-3 text-[14px] text-red-700 flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-5 rounded-input bg-emerald-50 border border-emerald/30 px-4 py-3 text-[14px] text-emerald-700 flex items-start gap-2"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="q" value={initialQuestion} />

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Chinedu Okafor"
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="chinedu@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password (minimum 6 characters)</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a strong password"
            minLength={6}
            required
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
          {loading ? "Creating account..." : "Get started"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link
          href={
            initialQuestion
              ? `/login?q=${encodeURIComponent(initialQuestion)}`
              : "/login"
          }
          className="font-bold text-emerald-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}

/**
 * Signup Page (`/signup`)
 * Section 6 Spec: Centred card on navy background.
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-navy px-4 py-8 text-white relative overflow-hidden">
      {/* Subtle Instagram radial glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #E1306C 0%, #833AB4 50%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      {/* Brand header */}
      <header className="w-full max-w-landing mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-btn bg-ig-gradient flex items-center justify-center text-white font-extrabold">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-[18px] font-extrabold tracking-tight text-white">
            NaijaResolve AI
          </span>
        </Link>
      </header>

      {/* Centred Signup Card */}
      <main className="flex-1 flex items-center justify-center py-10 z-10">
        <React.Suspense
          fallback={
            <Card className="w-full max-w-[440px] p-8 text-center text-muted">
              Loading sign-up form...
            </Card>
          }
        >
          <SignupForm />
        </React.Suspense>
      </main>

      {/* Mandatory legal disclaimer */}
      <footer className="text-center text-[13px] text-muted-dark z-10">
        NaijaResolve AI provides legal information, not legal advice.
      </footer>
    </div>
  );
}

