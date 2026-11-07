import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Helper to determine the relevant Nigerian regulator & verified law framework
 * without ever inventing unverified section numbers (Rule 3: if unknown, show "[section to verify]").
 */
function getNigerianRegulatorContext(category: string | null) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("bank") || cat.includes("debit") || cat.includes("transfer")) {
    return {
      regulator: "Central Bank of Nigeria (CBN) Consumer Protection Department",
      statute:
        "CBN Consumer Protection Regulations & CBN Guidelines on Operations of Electronic Payment Channels in Nigeria [section to verify]",
      timeline: "72 hours (3 working days) for failed electronic funds transfer reversal",
    };
  }
  if (cat.includes("airline") || cat.includes("travel") || cat.includes("flight")) {
    return {
      regulator: "Nigeria Civil Aviation Authority (NCAA) Consumer Protection Directorate",
      statute: "Nigeria Civil Aviation Regulations (Nig.CARs) Part 19 — Consumer Protection [section to verify]",
      timeline: "14 days for formal ticket refund resolution",
    };
  }
  if (cat.includes("electric") || cat.includes("billing") || cat.includes("nerc")) {
    return {
      regulator: "Nigerian Electricity Regulatory Commission (NERC) Forum Office",
      statute: "NERC Customer Protection Regulations 2023 [section to verify]",
      timeline: "15 working days for billing dispute investigation",
    };
  }
  if (cat.includes("telecom") || cat.includes("ncc")) {
    return {
      regulator: "Nigerian Communications Commission (NCC) Consumer Affairs Bureau",
      statute: "Nigerian Communications Act 2003 [section to verify]",
      timeline: "7 working days for service quality & billing resolution",
    };
  }
  if (cat.includes("tenancy") || cat.includes("rent") || cat.includes("landlord")) {
    return {
      regulator: "Citizens Mediation Centre / State Tenancy Law Tribunal",
      statute: "Applicable State Tenancy Law / Recovery of Premises Act [section to verify]",
      timeline: "7 days to respond and resolve amicably before mediation",
    };
  }
  return {
    regulator: "Federal Competition and Consumer Protection Commission (FCCPC)",
    statute: "Federal Competition and Consumer Protection Act (FCCPA) 2018 [section to verify]",
    timeline: "7 working days for formal complaint resolution",
  };
}

/**
 * Builds a clean, formal Nigerian complaint/demand letter when LLM_API_KEY is not set
 * or as a structured fallback, strictly obeying Rule 3 ("[section to verify]").
 */
function buildStructuredNigerianLetter(params: {
  senderName: string;
  senderEmail: string;
  company: string;
  category: string | null;
  description: string;
  amount: number | null;
  incidentDate: string | null;
}) {
  const today = new Date().toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const incidentFormatted = params.incidentDate
    ? new Date(params.incidentDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "the date of the incident";

  const amountFormatted =
    params.amount !== null
      ? `₦${Number(params.amount).toLocaleString()}`
      : "the disputed sum";

  const reg = getNigerianRegulatorContext(params.category);

  return `FROM:
${params.senderName}
Email: ${params.senderEmail}

DATE: ${today}

TO:
The Head, Customer Resolution / Compliance Unit,
${params.company}

SUBJECT: FORMAL COMPLAINT AND DEMAND FOR IMMEDIATE RESOLUTION — ${
    params.category ? params.category.toUpperCase() : "CONSUMER DISPUTE"
  }${params.amount !== null ? ` (${amountFormatted})` : ""}

Dear Sir/Madam,

1. STATEMENT OF FACTS
I write to lodge a formal complaint regarding an unresolved issue with ${
    params.company
  } which occurred on ${incidentFormatted}${
    params.amount !== null ? ` involving the sum of ${amountFormatted}` : ""
  }.

Specifically:
${params.description}

2. REGULATORY & LEGAL BASIS
Under Nigerian consumer protection principles and the ${reg.statute}, consumers are entitled to timely, transparent, and fair resolution of service failures and disputed transactions. Regulatory guidelines issued by the ${
    reg.regulator
  } stipulate a standard resolution window (${reg.timeline}).

3. FORMAL DEMAND & NEXT STEPS
Kindly treat this letter as a formal demand to:
(a) Investigate and resolve the above complaint immediately;
(b) ${
    params.amount !== null
      ? `Credit/refund the sum of ${amountFormatted} due to me without further delay; and`
      : "Provide a complete remedial resolution as described above; and"
  }
(c) Provide written confirmation of resolution within seven (7) working days of receipt of this letter.

Take notice that if this matter is not resolved within the stated period, I shall escalate this complaint formally to the ${
    reg.regulator
  } and explore all other lawful remedies available to me without further reference to you.

Yours faithfully,

______________________________
${params.senderName}

---
Disclaimer: Generated by NaijaResolve AI. This document provides legal information, not legal advice.`;
}

/**
 * Call LLM API (supports OpenAI, Groq, or Google Gemini API keys)
 * Server-side only — API key is never exposed to the browser.
 */
async function generateLetterWithLLM(prompt: string, apiKey: string): Promise<string | null> {
  try {
    // 1. If Gemini API key (`AIza...`)
    if (apiKey.startsWith("AIza")) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    }

    // 2. OpenAI or Groq (`gsk_...` or `sk-...`)
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
        messages: [
          {
            role: "system",
            content:
              "You are NaijaResolve AI, a legal information assistant in Nigeria. Draft a formal, polite, and firm Nigerian complaint/demand letter. Never invent legal citations; if a specific section number is unknown, write '[section to verify]'. Always end with the line: 'Disclaimer: Generated by NaijaResolve AI. This document provides legal information, not legal advice.'",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text.trim();
    }
  } catch {
    // Fall back to deterministic Nigerian template if network/key fails
  }
  return null;
}

/**
 * POST /api/generate-letter (Section 8 Spec)
 * Input: `{ complaintId }`
 * Builds a formal complaint letter from the complaint row and saves it to `complaints.letter`.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const complaintId = String(body?.complaintId || "").trim();

    if (!complaintId) {
      return NextResponse.json(
        { error: "complaintId is required" },
        { status: 400 }
      );
    }

    // Load complaint row (RLS ensures user owns this complaint)
    const { data: complaint, error: fetchError } = await supabase
      .from("complaints")
      .select("*")
      .eq("id", complaintId)
      .single();

    if (fetchError || !complaint) {
      return NextResponse.json(
        { error: "Complaint not found" },
        { status: 404 }
      );
    }

    // Load user's profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const senderName =
      profile?.full_name || user.email?.split("@")[0] || "Complainant";
    const senderEmail = user.email || "";

    const reg = getNigerianRegulatorContext(complaint.category);
    const llmKey = process.env.LLM_API_KEY?.trim();

    let generatedLetter: string | null = null;

    if (llmKey && llmKey !== "your-llm-api-key") {
      const llmPrompt = `Draft a formal Nigerian complaint letter with these exact facts:
- Complainant Name: ${senderName} (${senderEmail})
- Recipient Company/Institution: ${complaint.company}
- Category: ${complaint.category || "Consumer Dispute"}
- Amount in Dispute: ${
        complaint.amount !== null
          ? `₦${Number(complaint.amount).toLocaleString()}`
          : "Not specified"
      }
- Incident Date: ${complaint.incident_date || "Recent"}
- Facts & Requested Relief: ${complaint.description}
- Relevant Regulator: ${reg.regulator}
- Statutory Reference: ${reg.statute} (IMPORTANT: Never invent section numbers. Keep "[section to verify]" if unsure of exact section).`;

      generatedLetter = await generateLetterWithLLM(llmPrompt, llmKey);
    }

    if (!generatedLetter) {
      generatedLetter = buildStructuredNigerianLetter({
        senderName,
        senderEmail,
        company: complaint.company,
        category: complaint.category,
        description: complaint.description,
        amount: complaint.amount,
        incidentDate: complaint.incident_date,
      });
    }

    // Save generated letter to `complaints.letter`
    const { error: updateError } = await supabase
      .from("complaints")
      .update({ letter: generatedLetter })
      .eq("id", complaintId)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ letter: generatedLetter });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

