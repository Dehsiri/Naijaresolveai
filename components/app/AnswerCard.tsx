import * as React from "react";
import Link from "next/link";
import {
  Scale,
  FileText,
  Users,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegalSource } from "./SourceCard";

/**
 * Answer Card (Assistant) Component (Section 4 & 5.3 Spec):
 * - White card, max-w 720px, sections with small uppercase accent headings:
 *   "WHAT THIS MEANS" and "YOUR OPTIONS"
 * - Source chips
 * - Action buttons: "Draft complaint letter" (primary), "Find a lawyer" (secondary)
 * - Mandatory disclaimer line: "NaijaResolve AI provides legal information, not legal advice."
 */
export interface StructuredAnswer {
  meaning: string;
  options: string[];
  sources: LegalSource[];
}

export function AnswerCard({
  answer,
  userQuestion,
}: {
  answer: StructuredAnswer;
  userQuestion?: string;
}) {
  const draftHref = userQuestion
    ? `/documents?description=${encodeURIComponent(userQuestion)}`
    : "/documents";

  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-btn bg-ig-gradient text-white flex items-center justify-center shrink-0 mt-1">
        <Scale className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="w-full max-w-[720px] rounded-card border border-line bg-white p-5 space-y-4 text-navy">
        {/* Section 1: What this means */}
        <div className="space-y-1.5">
          <h3 className="text-[11.5px] font-extrabold uppercase tracking-wider text-emerald-700">
            What this means
          </h3>
          <p className="text-[14.5px] leading-relaxed text-navy">
            {answer.meaning}
          </p>
        </div>

        {/* Section 2: Your options */}
        {answer.options && answer.options.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-line">
            <h3 className="text-[11.5px] font-extrabold uppercase tracking-wider text-emerald-700">
              Your options
            </h3>
            <ul className="space-y-2">
              {answer.options.map((opt, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-[14px] leading-relaxed text-navy"
                >
                  <CheckCircle2
                    className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{opt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 3: Source Chips */}
        {answer.sources && answer.sources.length > 0 && (
          <div className="pt-2 border-t border-line space-y-2">
            <h4 className="text-[11.5px] font-extrabold uppercase tracking-wider text-muted">
              Referenced Nigerian Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              {answer.sources.map((src, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-full bg-warm border border-line px-3 py-1 text-[12px] font-bold text-navy"
                >
                  <BookOpen
                    className="h-3.5 w-3.5 text-emerald-700 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{src.title}</span>
                  <span className="text-muted font-medium">
                    ({src.section || "[section to verify]"})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Action Buttons (Draft complaint letter + Find a lawyer) */}
        <div className="pt-3 border-t border-line flex flex-wrap items-center gap-2.5">
          <Button size="sm" asChild className="gap-1.5">
            <Link href={draftHref}>
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Draft complaint letter</span>
            </Link>
          </Button>

          <Button variant="secondary" size="sm" asChild className="gap-1.5">
            <Link href="/dashboard?tab=lawyers">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Find a lawyer</span>
            </Link>
          </Button>
        </div>

        {/* Section 5: Mandatory Disclaimer Line */}
        <div className="pt-2 flex items-center gap-1.5 text-[12px] font-medium text-muted-2">
          <ShieldAlert
            className="h-3.5 w-3.5 text-emerald-700 shrink-0"
            aria-hidden="true"
          />
          <span>
            NaijaResolve AI provides legal information, not legal advice.
          </span>
        </div>
      </div>
    </div>
  );
}

