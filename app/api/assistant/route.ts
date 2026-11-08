import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getDemoUser,
  getDemoConversations,
  saveDemoConversations,
} from "@/lib/demo-store";

/**
 * Exact System Prompt from Section 8 of the Spec:
 * - Explain in plain English. Be concise and structured.
 * - Respond in JSON: { "meaning": string, "options": string[], "sources": [{ "title": string, "section": string }] }.
 * - Only cite Nigerian laws, regulations or regulators you are confident exist.
 *   If unsure of a section number, set "section" to "[section to verify]". Never fabricate a citation.
 * - You provide legal information, not legal advice. For serious or high-value matters, suggest speaking to a qualified lawyer.
 * - Do not ask for or store unnecessary personal data.
 */
const SYSTEM_PROMPT = `You are NaijaResolve AI, a legal information assistant for people in Nigeria.
- Explain in plain English. Be concise and structured.
- Respond in JSON: { "meaning": string, "options": string[], "sources": [{ "title": string, "section": string }] }.
- Only cite Nigerian laws, regulations or regulators you are confident exist. If unsure of a section number,
  set "section" to "[section to verify]". Never fabricate a citation.
- You provide legal information, not legal advice. For serious or high-value matters, suggest speaking to a qualified lawyer.
- Do not ask for or store unnecessary personal data.`;

interface AssistantReply {
  meaning: string;
  options: string[];
  sources: { title: string; section: string }[];
}

/**
 * Built-in Nigerian legal knowledge base fallback when LLM_API_KEY is not configured
 * or network is unavailable. Strictly follows Rule 3 (never invents section numbers;
 * uses "[section to verify]" when exact section is not verified).
 */
function buildFallbackAssistantReply(question: string): AssistantReply {
  const q = question.toLowerCase();

  // 1. Banking / Failed Transfer / POS / Debit (includes Section 5.3 sample prompt)
  if (
    q.includes("bank") ||
    q.includes("debit") ||
    q.includes("transfer") ||
    q.includes("pos") ||
    q.includes("refund") ||
    q.includes("45,000")
  ) {
    return {
      meaning:
        "Under Central Bank of Nigeria (CBN) consumer protection and electronic payment guidelines, when an inter-bank transfer or POS debit fails without crediting the beneficiary, your bank is required to reverse the debited funds automatically or within the stipulated regulatory reversal timeline (typically 24 to 72 hours depending on the channel). Holding your funds indefinitely after a failed transaction violates CBN consumer protection standards.",
      options: [
        "Log a formal complaint with your bank's Customer Resolution Unit and request a unique Complaint Tracking Number (CTN) along with the NIBSS Session ID / Transaction Reference.",
        "Send a formal written demand/complaint letter (you can click 'Draft complaint letter' below) giving the bank 7 working days to reverse the funds.",
        "If the bank fails to resolve the issue within the CBN turnaround time, escalate the complaint to the CBN Consumer Protection Department (cpd@cbn.gov.ng) or the Federal Competition and Consumer Protection Commission (FCCPC).",
        "For high-value or prolonged unlawful retention of funds, consult a qualified Nigerian lawyer regarding a formal pre-action notice.",
      ],
      sources: [
        {
          title: "CBN Consumer Protection Regulations",
          section: "[section to verify]",
        },
        {
          title:
            "CBN Regulation on Instant (Inter-Bank) Electronic Funds Transfer Services in Nigeria",
          section: "[section to verify]",
        },
        {
          title:
            "Federal Competition and Consumer Protection Act (FCCPA) 2018",
          section: "[section to verify]",
        },
      ],
    };
  }

  // 2. Tenancy / Rent / Quit Notice / Landlord
  if (
    q.includes("landlord") ||
    q.includes("tenant") ||
    q.includes("rent") ||
    q.includes("quit") ||
    q.includes("evict")
  ) {
    return {
      meaning:
        "In Nigeria, a landlord cannot lawfully evict a tenant by force, self-help, or lock-out, nor can a yearly tenant be evicted with an arbitrary 7-day quit notice unless your written tenancy agreement explicitly waives statutory notice periods. Unless agreed otherwise in writing, a yearly tenancy generally requires six (6) months' statutory Notice to Quit, followed by a 7-day Notice of Owner's Intention to Apply to Recover Possession.",
      options: [
        "Review your signed Tenancy Agreement first to check if there is a specific notice clause.",
        "Send a polite written response or formal letter to your landlord stating that the notice period does not comply with statutory tenancy requirements.",
        "Report any threat of forceful eviction or lock-out to the Citizens Mediation Centre (CMC) in your state or seek assistance from the Legal Aid Council.",
        "Speak with a qualified Nigerian property/litigation lawyer if you have been served with court summons or a 7-day recovery notice.",
      ],
      sources: [
        {
          title: "Lagos State Tenancy Law 2011 (or applicable State Tenancy Law)",
          section: "[section to verify]",
        },
        {
          title: "Recovery of Premises Act / Law",
          section: "[section to verify]",
        },
      ],
    };
  }

  // 3. Airline / Flight Cancellation / Delay
  if (
    q.includes("airline") ||
    q.includes("flight") ||
    q.includes("ticket") ||
    q.includes("ncaa")
  ) {
    return {
      meaning:
        "Under the Nigeria Civil Aviation Regulations (Part 19 — Consumer Protection), passengers whose flights are cancelled or significantly delayed are entitled to care, rerouting, or a refund of the unused ticket within the regulatory timeframe overseen by the Nigeria Civil Aviation Authority (NCAA).",
      options: [
        "Submit a formal written refund demand to the airline's customer relations desk quoting your Booking Reference (PNR) and flight date.",
        "Escalate unresolved refund delays to the NCAA Consumer Protection Directorate at the airport or via their official complaints portal.",
        "Use NaijaResolve AI's Document Generator to draft a formal complaint letter addressed to the airline.",
      ],
      sources: [
        {
          title:
            "Nigeria Civil Aviation Regulations (Nig.CARs) Part 19 — Consumer Protection",
          section: "[section to verify]",
        },
        {
          title:
            "Federal Competition and Consumer Protection Act (FCCPA) 2018",
          section: "[section to verify]",
        },
      ],
    };
  }

  // 4. General Nigerian Consumer / Employment / Civil Dispute
  return {
    meaning:
      "Under Nigerian law, consumers and citizens are protected against unfair trade practices, defective services, and breach of contract. Where a service provider, employer, or counterparty fails to honour their obligations, putting your complaint in writing creates a clear paper trail required by Nigerian regulators and courts.",
    options: [
      "Document all evidence including receipts, transaction references, emails, and dates of communication.",
      "Send a formal written complaint or demand letter clearly stating what happened and the exact resolution you require within 7 working days.",
      "Escalate consumer disputes to the Federal Competition and Consumer Protection Commission (FCCPC) or the sector-specific regulator (CBN, NCC, NERC, NCAA).",
      "For complex, high-value, or employment termination matters, speak to a qualified Nigerian legal practitioner.",
    ],
    sources: [
      {
        title: "Federal Competition and Consumer Protection Act (FCCPA) 2018",
        section: "[section to verify]",
      },
      {
        title: "Constitution of the Federal Republic of Nigeria 1999 (as amended)",
        section: "[section to verify]",
      },
    ],
  };
}

/**
 * Call LLM API (supports OpenAI, Groq, or Gemini) and parse structured JSON reply.
 */
async function callAssistantLLM(
  recentMessages: { role: string; content: string }[],
  apiKey: string
): Promise<AssistantReply | null> {
  try {
    if (apiKey.startsWith("AIza")) {
      const promptText = `${SYSTEM_PROMPT}\n\nConversation:\n${recentMessages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")}\n\nRespond ONLY with valid JSON.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const parsed = JSON.parse(raw);
          return sanitizeReply(parsed);
        }
      }
    }

    const isGroq = apiKey.startsWith("gsk_");
    const endpoint = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentMessages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        return sanitizeReply(parsed);
      }
    }
  } catch {
    // Fall back to deterministic Nigerian legal reply
  }
  return null;
}

function sanitizeReply(parsed: Record<string, unknown>): AssistantReply {
  const meaning =
    typeof parsed.meaning === "string" && parsed.meaning.trim()
      ? parsed.meaning.trim()
      : "Here is what Nigerian law and regulatory practice say about your situation.";

  const options = Array.isArray(parsed.options)
    ? parsed.options.map((o) => String(o))
    : [];

  const sources = Array.isArray(parsed.sources)
    ? parsed.sources.map((s: Record<string, unknown>) => ({
        title: String(s?.title || "Nigerian Regulatory Guideline"),
        section: String(s?.section || "[section to verify]"),
      }))
    : [];

  return { meaning, options, sources };
}

/**
 * POST /api/assistant (Section 8 Spec):
 * Input: `{ conversationId, message }`
 * Server loads recent messages, calls the LLM, stores the reply in `messages`,
 * and returns `{ conversationId, sections: { meaning, options }, sources }`.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messageText = String(body?.message || "").trim();
    let conversationId = body?.conversationId
      ? String(body.conversationId).trim()
      : "";

    if (!messageText) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      const demoUser = getDemoUser();
      const convs = getDemoConversations();

      if (!conversationId) {
        conversationId = `demo-conv-${Date.now()}`;
        const title =
          messageText.length > 60
            ? `${messageText.slice(0, 57)}...`
            : messageText;
        convs.unshift({
          id: conversationId,
          user_id: demoUser?.id || "demo-user-1",
          title,
          status: "in_progress",
          created_at: new Date().toISOString(),
        });
        saveDemoConversations(convs);
      }

      const llmKey = process.env.LLM_API_KEY?.trim();
      let reply: AssistantReply | null = null;
      if (llmKey && llmKey !== "your-llm-api-key") {
        reply = await callAssistantLLM(
          [{ role: "user", content: messageText }],
          llmKey
        );
      }
      if (!reply) {
        reply = buildFallbackAssistantReply(messageText);
      }

      return NextResponse.json({
        conversationId,
        sections: {
          meaning: reply.meaning,
          options: reply.options,
        },
        sources: reply.sources,
      });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Create a new conversation if conversationId was not passed
    if (!conversationId) {
      const title =
        messageText.length > 60
          ? `${messageText.slice(0, 57)}...`
          : messageText;

      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title,
          status: "in_progress",
        })
        .select("id")
        .single();

      if (convErr || !newConv) {
        return NextResponse.json(
          { error: convErr?.message || "Could not create conversation" },
          { status: 500 }
        );
      }
      conversationId = newConv.id;
    }

    // 2. Store user message in `messages`
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: messageText,
      sources: [],
    });

    // 3. Load recent messages in this conversation for context
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    // 4. Call LLM (or structured Nigerian fallback if LLM_API_KEY is not set)
    const llmKey = process.env.LLM_API_KEY?.trim();
    let reply: AssistantReply | null = null;

    if (llmKey && llmKey !== "your-llm-api-key") {
      reply = await callAssistantLLM(history || [{ role: "user", content: messageText }], llmKey);
    }

    if (!reply) {
      reply = buildFallbackAssistantReply(messageText);
    }

    // 5. Store assistant reply JSON in `messages`
    const serializedContent = JSON.stringify({
      meaning: reply.meaning,
      options: reply.options,
    });

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: serializedContent,
      sources: reply.sources,
    });

    return NextResponse.json({
      conversationId,
      sections: {
        meaning: reply.meaning,
        options: reply.options,
      },
      sources: reply.sources,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to process question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

