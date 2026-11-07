"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  Plus,
  BookOpen,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/app/StatusPill";
import { ChatBubble, AssistantBubble } from "@/components/app/ChatBubble";
import { AnswerCard } from "@/components/app/AnswerCard";
import { SourceCard, type LegalSource } from "@/components/app/SourceCard";

export interface ConversationRow {
  id: string;
  title: string;
  status: "in_progress" | "resolved" | "saved";
  created_at: string;
}

export interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: LegalSource[] | null;
  created_at: string;
}

/**
 * Sample prompt required by Section 5.3 Spec:
 * "My bank debited ₦45,000 for a transfer that failed three days ago. They have not refunded me. What can I do?"
 */
const SAMPLE_BANK_QUESTION =
  "My bank debited ₦45,000 for a transfer that failed three days ago. They have not refunded me. What can I do?";

export function AssistantClient({
  activeConversation,
  initialMessages,
  recentConversations,
  initialPrompt,
}: {
  activeConversation: ConversationRow | null;
  initialMessages: MessageRow[];
  recentConversations: ConversationRow[];
  initialPrompt?: string;
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = React.useState<string>(
    activeConversation?.id || ""
  );
  const [conversationTitle, setConversationTitle] = React.useState<string>(
    activeConversation?.title || "Failed Bank Transfer & Refund Rights"
  );
  const [conversationStatus] = React.useState<string>(
    activeConversation?.status || "in_progress"
  );
  const [messages, setMessages] = React.useState<MessageRow[]>(initialMessages);
  const [input, setInput] = React.useState<string>(initialPrompt || "");
  const [loading, setLoading] = React.useState(false);

  // Auto-submit if user arrived from Landing Page prompt card (`?q=...`) with no messages yet
  const hasAutoSubmitted = React.useRef(false);
  React.useEffect(() => {
    if (
      initialPrompt &&
      initialMessages.length === 0 &&
      !hasAutoSubmitted.current
    ) {
      hasAutoSubmitted.current = true;
      sendMessage(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  async function sendMessage(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const tempUserMsg: MessageRow = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      sources: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setLoading(true);

    if (!conversationId) {
      setConversationTitle(
        trimmed.length > 56 ? `${trimmed.slice(0, 53)}...` : trimmed
      );
    }

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          message: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Could not get an answer.");
        setLoading(false);
        return;
      }

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMsg: MessageRow = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: JSON.stringify({
          meaning: data.sections?.meaning || "",
          options: data.sections?.options || [],
        }),
        sources: data.sources || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      router.refresh();
    } catch {
      toast.error("Network error while contacting NaijaResolve AI.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleNewChat() {
    setConversationId("");
    setConversationTitle("New Legal Question");
    setMessages([]);
    setInput("");
    router.push("/assistant");
  }

  // Collect all unique sources from assistant messages for the right-hand Sources panel
  const allSources: LegalSource[] = React.useMemo(() => {
    const list: LegalSource[] = [];
    const seen = new Set<string>();

    for (const msg of messages) {
      if (Array.isArray(msg.sources)) {
        for (const s of msg.sources) {
          if (s && s.title && !seen.has(s.title)) {
            seen.add(s.title);
            list.push(s);
          }
        }
      }
    }

    // If no messages yet, show the sample sources for the default CBN bank scenario
    if (list.length === 0) {
      return [
        {
          title: "CBN Consumer Protection Regulations",
          section: "[section to verify]",
        },
        {
          title:
            "CBN Regulation on Instant (Inter-Bank) Electronic Funds Transfer Services",
          section: "[section to verify]",
        },
        {
          title:
            "Federal Competition and Consumer Protection Act (FCCPA) 2018",
          section: "[section to verify]",
        },
      ];
    }

    return list;
  }, [messages]);

  // Parse assistant content JSON safely
  function parseAssistantContent(raw: string): {
    meaning: string;
    options: string[];
  } | null {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.meaning === "string") {
        return {
          meaning: parsed.meaning,
          options: Array.isArray(parsed.options) ? parsed.options : [],
        };
      }
    } catch {
      // Plain text fallback
    }
    return null;
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-20px)]">
      {/* =====================================================================
          LEFT / MAIN CHAT COLUMN (SECTION 5.3 SPEC)
      ===================================================================== */}
      <div className="flex-1 flex flex-col justify-between min-w-0 px-4 md:px-6 py-5">
        {/* Chat Column Header: Conversation Title + Status Pill + New Chat button */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-chat-h1 text-navy truncate">
              {conversationTitle}
            </h1>
            <StatusPill status={conversationStatus} />
          </div>

          <div className="flex items-center gap-2">
            {recentConversations.length > 0 && (
              <select
                aria-label="Switch conversation"
                value={conversationId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) router.push(`/assistant?id=${val}`);
                  else handleNewChat();
                }}
                className="min-h-[36px] max-w-[180px] rounded-btn border border-line bg-white px-2.5 py-1 text-[12.5px] font-bold text-navy truncate"
              >
                <option value="">Current chat</option>
                {recentConversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleNewChat}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>New chat</span>
            </Button>
          </div>
        </header>

        {/* Chat Messages Thread */}
        <div className="flex-1 space-y-5 overflow-y-auto pb-6">
          {messages.length === 0 ? (
            /* Sample Content Preview per Section 5.3 when starting a fresh session */
            <div className="space-y-5">
              <div className="rounded-input bg-emerald-50/70 border border-emerald/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-emerald-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Sample legal scenario preview (click &ldquo;Ask this sample&rdquo; or type your own question below)
                </span>
                <button
                  type="button"
                  onClick={() => sendMessage(SAMPLE_BANK_QUESTION)}
                  className="underline font-extrabold hover:opacity-80"
                >
                  Ask this sample →
                </button>
              </div>

              <ChatBubble content={SAMPLE_BANK_QUESTION} />

              <AnswerCard
                userQuestion={SAMPLE_BANK_QUESTION}
                answer={{
                  meaning:
                    "Under Central Bank of Nigeria (CBN) consumer protection and electronic payment guidelines, when an inter-bank transfer fails without crediting the recipient, your bank must reverse the debited ₦45,000 automatically or within the regulatory reversal timeline. Holding your funds beyond 72 hours after a failed NIP transfer entitles you to lodge a formal complaint and escalate to the CBN.",
                  options: [
                    "Request a formal Complaint Tracking Number (CTN) and NIBSS Session ID from your bank's customer resolution unit.",
                    "Generate and send a formal complaint/demand letter giving the bank 7 working days to reverse your ₦45,000.",
                    "Escalate to the CBN Consumer Protection Department (cpd@cbn.gov.ng) or FCCPC if unresolved.",
                  ],
                  sources: [
                    {
                      title: "CBN Consumer Protection Regulations",
                      section: "[section to verify]",
                    },
                    {
                      title:
                        "CBN Regulation on Instant (Inter-Bank) Electronic Funds Transfer Services",
                      section: "[section to verify]",
                    },
                  ],
                }}
              />
            </div>
          ) : (
            messages.map((msg, index) => {
              if (msg.role === "user") {
                return <ChatBubble key={msg.id} content={msg.content} />;
              }

              const structured = parseAssistantContent(msg.content);
              const prevUserQuestion =
                index > 0 && messages[index - 1]?.role === "user"
                  ? messages[index - 1].content
                  : SAMPLE_BANK_QUESTION;

              if (structured) {
                return (
                  <AnswerCard
                    key={msg.id}
                    userQuestion={prevUserQuestion}
                    answer={{
                      meaning: structured.meaning,
                      options: structured.options,
                      sources: Array.isArray(msg.sources) ? msg.sources : [],
                    }}
                  />
                );
              }

              return <AssistantBubble key={msg.id} content={msg.content} />;
            })
          )}

          {loading && (
            <div className="flex items-center gap-3 text-[13.5px] font-semibold text-muted">
              <div className="h-7 w-7 rounded-btn bg-ig-gradient text-white flex items-center justify-center animate-pulse">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <span>
                Reviewing Nigerian regulatory guidelines and structuring your
                options...
              </span>
            </div>
          )}
        </div>

        {/* Composer pinned to bottom of chat (Section 4 Spec: White, 1px border, radius 18px, input + Send button) */}
        <div className="pt-2 sticky bottom-3">
          <form
            onSubmit={handleFormSubmit}
            className="rounded-composer border border-line bg-white p-2 flex items-center gap-2"
          >
            <label htmlFor="assistant-composer-input" className="sr-only">
              Ask a legal question in plain English
            </label>
            <input
              id="assistant-composer-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a bank debit, tenancy notice, consumer refund, or employment issue..."
              className="flex-1 min-h-[42px] px-3 py-2 text-[14.5px] text-navy placeholder:text-muted focus:outline-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading || !input.trim()}
              className="gap-1.5 shrink-0"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>

      {/* =====================================================================
          RIGHT PANEL: SOURCES PANEL (COLLAPSES BELOW CHAT ON SMALL SCREENS)
      ===================================================================== */}
      <aside
        aria-label="Legal sources and citations"
        className="w-full lg:w-[300px] shrink-0 border-t lg:border-t-0 lg:border-l border-line bg-warm/60 p-4 md:p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <BookOpen
            className="h-4 w-4 text-emerald-700 shrink-0"
            aria-hidden="true"
          />
          <h2 className="text-[15px] font-extrabold text-navy">
            Sources & Regulators
          </h2>
        </div>

        <p className="text-[12.5px] text-muted leading-relaxed">
          Nigerian laws, regulations, and bodies referenced in this conversation.
          Unverified section numbers are explicitly marked as{" "}
          <code>[section to verify]</code>.
        </p>

        <div className="space-y-2.5">
          {allSources.map((source, idx) => (
            <SourceCard key={idx} source={source} />
          ))}
        </div>

        {/* Recent Chat History Quick Links */}
        {recentConversations.length > 0 && (
          <div className="pt-4 border-t border-line space-y-2">
            <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Recent Conversations</span>
            </h3>
            <ul className="space-y-1">
              {recentConversations.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/assistant?id=${c.id}`)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-btn text-[13px] font-semibold truncate transition-colors ${
                      c.id === conversationId
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-navy hover:bg-white"
                    }`}
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
