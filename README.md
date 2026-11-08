# NaijaResolve AI

**Tagline:** *Your rights. Your options. Your next step.*  
**Live Deployment:** [https://naijaresolveai.vercel.app/](https://naijaresolveai.vercel.app/)  
**GitHub Repository:** [https://github.com/Dehsiri/Naijaresolveai](https://github.com/Dehsiri/Naijaresolveai)

NaijaResolve AI helps Nigerians understand their rights in plain English, ask legal questions backed by verified Nigerian regulatory frameworks, generate formal complaint and demand letters, and track consumer/civil disputes from draft to resolution.

> **Mandatory Legal Disclaimer:** *NaijaResolve AI provides legal information, not legal advice.*

---

## 1. Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS + shadcn/ui (`Dialog`, `Tabs`, `Sonner`, `Card`, `Button`, `Input`, `Label`) + `lucide-react`
- **Database & Auth:** Supabase (Auth + Postgres + Row Level Security) + built-in Cookie Demo Mode fallback
- **AI Feature:** Server-side LLM API Routes (`/api/assistant` & `/api/generate-letter`) supporting OpenAI, Groq, and Google Gemini, with deterministic Nigerian regulatory fallback
- **Automation:** Make.com Webhook (`AUTOMATION_WEBHOOK_URL`) / Resend Email API (`RESEND_API_KEY`) triggered on complaint submission
- **Hosting:** Vercel

---

## 2. Project Structure

```text
app/
  (marketing)/page.tsx            -> Landing page (Hero prompt card, Features, How it works)
  (auth)/login/page.tsx           -> Sign-in screen
  (auth)/signup/page.tsx          -> Sign-up screen
  (app)/layout.tsx                -> Protected sidebar shell
  (app)/dashboard/page.tsx        -> User dashboard (Quick actions, Recent chats, Saved documents, Next step card)
  (app)/assistant/page.tsx        -> AI Legal Assistant (Structured AnswerCard + SourceCard panel)
  (app)/documents/page.tsx        -> Complaint form & Dispute tracker (CRUD + status)
  (app)/documents/[id]/page.tsx   -> AI Complaint Letter Generator & Paper preview
  (app)/admin/page.tsx            -> Admin oversight panel (role = 'admin' only)
  api/assistant/route.ts          -> POST chat answer route (JSON: meaning, options, sources)
  api/generate-letter/route.ts    -> POST formal complaint letter generator
components/
  ui/*                            -> shadcn/ui components
  app/*                           -> Sidebar, StatusPill, ChatBubble, AnswerCard, SourceCard, ActionCard
lib/
  supabase/{client,server}.ts     -> Browser & Server Supabase clients
  automation.ts                   -> Make.com Webhook & Resend email automation trigger
  demo-store.ts                   -> Instant cookie-backed Demo Mode when env vars are omitted
supabase/
  schema.sql                      -> Full Postgres DDL, RLS policies, and signup profile trigger
```

---

## 3. Local Setup & Environment Variables

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Create `.env.local` from `.env.example`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   LLM_API_KEY=your-openai-or-gemini-or-groq-key
   AUTOMATION_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-id
   ```
   *(Note: If you run the app before setting `.env.local`, the built-in Demo Mode automatically activates so every screen and AI route works out of the box).*
3. **Run the Supabase SQL Schema:**
   Paste [`supabase/schema.sql`](./supabase/schema.sql) into the Supabase SQL Editor and click **Run**.
4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## 4. Automation Workflow (Section 8)

When a user marks a complaint as **Submitted** (either on `/documents` or `/documents/[id]`):
1. `updateComplaintStatusAction` updates `complaints.status` to `'submitted'`.
2. `triggerComplaintAutomation` in [`lib/automation.ts`](./lib/automation.ts) dispatches a structured `complaint.submitted` event to `AUTOMATION_WEBHOOK_URL` (Make.com scenario: **Webhook → User Confirmation Email with Letter → Admin Alert Email/Slack**) or sends directly via `RESEND_API_KEY`.
3. A toast confirmation is displayed in the UI confirming the user confirmation email and admin alert.

---

## 5. Safety & Citation Rules

- Never fabricates Nigerian statutory section numbers. Whenever an exact section number is unverified, it is explicitly displayed as `[section to verify]`.
- Every AI response and generated complaint letter displays: *"NaijaResolve AI provides legal information, not legal advice."*
