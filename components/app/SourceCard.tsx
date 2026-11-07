import * as React from "react";
import { BookOpen, AlertTriangle } from "lucide-react";

/**
 * Source Card Component (Section 4 Spec):
 * - Border 1px (`border-line`), radius 14px (`rounded-input`), title + citation.
 * - Rule 3: Unknown section shown as `[section to verify]`. Never invent legal citations.
 */
export interface LegalSource {
  title: string;
  section: string;
}

export function SourceCard({ source }: { source: LegalSource }) {
  const sectionText = source.section?.trim() || "[section to verify]";
  const needsVerification = sectionText.includes("[section to verify]");

  return (
    <div className="rounded-input border border-line bg-white p-3.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <BookOpen
          className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <h4 className="text-[13.5px] font-bold text-navy leading-snug">
          {source.title}
        </h4>
      </div>

      <div className="pl-6 flex items-center gap-1.5 text-[12.5px]">
        {needsVerification ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-bg px-2 py-0.5 text-[11px] font-bold text-amber-text">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            <span>{sectionText}</span>
          </span>
        ) : (
          <span className="font-semibold text-muted">{sectionText}</span>
        )}
      </div>
    </div>
  );
}
