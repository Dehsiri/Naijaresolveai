import * as React from "react";
import { Scale } from "lucide-react";

/**
 * Chat Bubble (User) Component (Section 4 Spec):
 * - Navy bg (#121212), light text, radius 20/20/4/20, right aligned, max-w 520px.
 */
export function ChatBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[520px] rounded-[20px_20px_4px_20px] bg-navy px-4 py-3 text-[14.5px] leading-relaxed text-white">
        {content}
      </div>
    </div>
  );
}

/**
 * Assistant Plain Text Bubble (fallback when message is not structured JSON)
 */
export function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-btn bg-ig-gradient text-white flex items-center justify-center shrink-0 mt-0.5">
        <Scale className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="max-w-[720px] rounded-card border border-line bg-white p-4 text-[14.5px] leading-relaxed text-navy">
        {content}
      </div>
    </div>
  );
}
