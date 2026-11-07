"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  ArrowRight,
  MessageSquareText,
  FileText,
  BookOpen,
  Users,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Quick suggestion chips under the Hero Prompt Card (Section 5.1.4)
 * Clicking a chip populates the prompt input with a realistic Nigerian legal scenario
 * or submits directly.
 */
const HERO_CHIPS = [
  {
    label: "Check my rights",
    prompt:
      "My landlord gave me a 7-day quit notice after I paid yearly rent. What are my rights in Nigeria?",
  },
  {
    label: "Draft a letter",
    prompt:
      "My bank debited ₦45,000 for a transfer that failed three days ago. They have not refunded me. Help me draft a complaint letter.",
  },
  {
    label: "Resolve a dispute",
    prompt:
      "An airline cancelled my Lagos to Abuja flight without refunding my ticket for two weeks. How do I escalate?",
  },
  {
    label: "Find a lawyer",
    prompt:
      "When should I speak to a qualified Nigerian lawyer about an unlawful termination of employment?",
  },
];

/**
 * Four Feature Cards (Section 5.1.5)
 */
const FEATURE_CARDS = [
  {
    title: "AI legal assistant",
    description:
      "Ask legal questions in plain English and receive structured explanations backed by verified Nigerian statutes and regulators.",
    icon: MessageSquareText,
    href: "/assistant",
    tag: "Instant clarity",
  },
  {
    title: "Document generator",
    description:
      "Turn your consumer, banking, or tenancy dispute into a formal complaint or demand letter ready to send.",
    icon: FileText,
    href: "/documents",
    tag: "Ready to send",
  },
  {
    title: "Know your rights",
    description:
      "Browse plain-language guides covering CBN banking timelines, FCCPC consumer rights, tenancy laws, and labour rights.",
    icon: BookOpen,
    href: "/signup",
    tag: "Plain English",
  },
  {
    title: "Find a lawyer",
    description:
      "When a matter requires formal legal representation or court action, connect with verified Nigerian legal practitioners.",
    icon: Users,
    href: "/signup",
    tag: "Verified counsel",
  },
];

/**
 * Three-step "How it works" Band (Section 5.1.6)
 */
const HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    title: "Ask",
    description:
      "Describe what happened in your own words — whether it is a failed bank transfer, an unfair billing dispute, or a tenancy issue.",
  },
  {
    step: "2",
    title: "Understand",
    description:
      "See what the situation means under Nigerian regulations, which regulator oversees it (CBN, FCCPC, NCAA), and your practical options.",
  },
  {
    step: "3",
    title: "Act",
    description:
      "Generate a formal complaint letter in one click, track the status of your dispute from draft to resolution, or escalate when needed.",
  },
];

/**
 * Step 3: Full Landing Page (`app/(marketing)/page.tsx`)
 * Implements every element in Section 5.1 with the Instagram-inspired colour tokens.
 */
export default function LandingPage() {
  const router = useRouter();
  const [question, setQuestion] = React.useState("");

  function handlePromptSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = question.trim();
    const targetQuestion =
      trimmed ||
      "My bank debited ₦45,000 for a transfer that failed three days ago. They have not refunded me. What can I do?";
    // Redirects to `/signup?q=...` (and middleware forwards logged-in users directly to `/assistant?q=...`)
    router.push(`/signup?q=${encodeURIComponent(targetQuestion)}`);
  }

  function handleChipClick(chipPrompt: string) {
    setQuestion(chipPrompt);
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm text-navy">
      {/* =====================================================================
          1. NAVY HERO SECTION WITH SUBTLE GRADIENT RADIAL GLOW AT TOP CENTRE
      ===================================================================== */}
      <section className="relative bg-navy text-white overflow-hidden">
        {/* Radial glow at top centre */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[380px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #E1306C 0%, #833AB4 45%, transparent 75%)",
          }}
          aria-hidden="true"
        />

        {/* Navigation Bar */}
        <header className="relative z-10 w-full max-w-landing mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-btn bg-ig-gradient flex items-center justify-center text-white font-extrabold shrink-0">
              <Scale className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-white">
              NaijaResolve AI
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav
            aria-label="Marketing navigation"
            className="hidden md:flex items-center gap-6 text-[14px] font-semibold text-muted-dark"
          >
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              How it works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Find a lawyer
            </a>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign in
            </Link>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="md:hidden text-[13px] font-semibold text-muted-dark hover:text-white px-2 py-1.5"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </header>

        {/* Hero Body */}
        <div className="relative z-10 w-full max-w-landing mx-auto px-4 md:px-6 pt-5 pb-12 md:pt-8 md:pb-16 flex flex-col items-center text-center">
          {/* 2. Tagline Chip */}
          <div className="inline-flex items-center gap-2 min-h-[32px] px-3.5 py-1 rounded-full bg-navy-800 border border-navy-line text-[#E5E5E5] text-[12px] font-bold mb-4">
            <Sparkles
              className="h-3.5 w-3.5 text-emerald-300"
              aria-hidden="true"
            />
            <span>Your rights. Your options. Your next step.</span>
          </div>

          {/* 3. Hero H1 (centred, max 720px) + Subtext (15px, max 540px, muted-on-dark) */}
          <h1 className="text-hero-h1 max-w-[720px] text-white mb-3.5">
            Legal problems?{" "}
            <span className="text-ig-gradient">Know your rights.</span> Find
            your next step.
          </h1>

          <p className="text-[15px] text-muted-dark max-w-[540px] mb-7 leading-relaxed font-normal">
            NaijaResolve AI helps Nigerians understand their rights, ask legal
            questions in plain language, generate complaint and demand letters,
            and find a lawyer when needed.
          </p>

          {/* 4. Prompt Card (max 680px, navy-800, radius 24px, shadow-hero) */}
          <div className="w-full max-w-[680px] rounded-hero bg-navy-800 border border-navy-line p-4 md:p-5 shadow-hero text-left">
            <form onSubmit={handlePromptSubmit} className="space-y-3">
              <label
                htmlFor="hero-prompt-input"
                className="block text-[12px] font-bold text-emerald-300 tracking-wide uppercase"
              >
                Ask NaijaResolve
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="hero-prompt-input"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. My bank debited ₦45,000 for a failed transfer three days ago..."
                  className="flex-1 min-h-[44px] rounded-input bg-navy border border-navy-line px-3.5 py-2 text-[14px] text-white placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-emerald"
                />
                <Button
                  type="submit"
                  size="default"
                  className="shrink-0 gap-2 min-h-[44px]"
                >
                  <span>Ask now</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="mt-3.5 pt-3 border-t border-navy-line/70 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-muted-dark mr-1">
                Try:
              </span>
              {HERO_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.prompt)}
                  className="inline-flex items-center min-h-[34px] px-3 py-1 rounded-full bg-navy border border-navy-line text-[#E5E5E5] text-[12px] font-semibold hover:bg-navy-700 hover:border-emerald/60 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. FEATURES SECTION (WARM BG): H2 + FOUR CARDS IN A WRAPPING ROW
      ===================================================================== */}
      <section
        id="features"
        className="w-full max-w-landing mx-auto px-4 md:px-6 py-12 md:py-14"
      >
        <div className="max-w-[580px] mb-8">
          <p className="text-[12px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
            Built for everyday legal clarity
          </p>
          <h2 className="text-section-h2 text-navy mb-2">
            Everything you need to understand and resolve a dispute
          </h2>
          <p className="text-[14.5px] text-muted">
            From bank reversal delays to consumer complaints and tenancy
            questions, get structured information and formal documentation in
            minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_CARDS.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group block focus:outline-none focus:ring-2 focus:ring-emerald rounded-card"
              >
                <Card className="h-full flex flex-col justify-between transition-colors group-hover:border-emerald/60">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="h-9 w-9 rounded-btn bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="rounded-full bg-warm border border-line px-2.5 py-0.5 text-[11px] font-bold text-muted">
                        {feature.tag}
                      </span>
                    </div>

                    <h3 className="text-[16px] font-bold text-navy mb-1.5 group-hover:text-emerald-700 transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-[13.5px] text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[13px] font-bold text-navy group-hover:text-emerald-700">
                    <span>Explore</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          6. HOW IT WORKS NAVY BAND: 1 ASK, 2 UNDERSTAND, 3 ACT
      ===================================================================== */}
      <section
        id="how-it-works"
        className="w-full bg-navy text-white border-y border-navy-line py-12 md:py-14"
      >
        <div className="w-full max-w-landing mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                How it works
              </p>
              <h2 className="text-section-h2 text-white">
                Three simple steps from confusion to action
              </h2>
            </div>
            <Button asChild size="sm">
              <Link href="/signup" className="gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-card bg-navy-800 border border-navy-line p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-btn bg-ig-gradient text-white text-[14px] font-extrabold mb-3.5">
                    {item.step}
                  </div>
                  <h3 className="text-[17px] font-extrabold text-white mb-1.5">
                    {item.step}. {item.title}
                  </h3>
                  <p className="text-[13.5px] text-muted-dark leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-line flex items-center gap-2 text-[12px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Built for Nigerian regulations</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. FOOTER & MANDATORY DISCLAIMER (SECTION 5.1.7)
      ===================================================================== */}
      <footer className="w-full bg-warm border-t border-line py-10 px-4 md:px-8">
        <div className="w-full max-w-landing mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-btn bg-ig-gradient flex items-center justify-center text-white font-extrabold">
              <Scale className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-[16px] font-extrabold text-navy">
              NaijaResolve AI
            </span>
          </div>

          <div className="flex items-center gap-2 text-[14px] font-semibold text-muted-2 text-center">
            <ShieldAlert
              className="h-4 w-4 text-emerald-700 shrink-0"
              aria-hidden="true"
            />
            <span>
              NaijaResolve AI provides legal information, not legal advice.
            </span>
          </div>

          <div className="flex items-center gap-5 text-[14px] font-semibold text-muted">
            <Link href="/login" className="hover:text-navy">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-navy">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
