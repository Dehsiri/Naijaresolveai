import { cookies } from "next/headers";

/**
 * Cookie-backed Demo Store when NEXT_PUBLIC_SUPABASE_URL is not configured yet.
 * Allows the entire app (Signup, Login, Dashboard, AI Assistant, Complaints CRUD,
 * AI Letter Generator, and Admin Panel) to work 100% end-to-end on Vercel and localhost
 * out of the box!
 */

export interface DemoUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
}

export interface DemoComplaint {
  id: string;
  user_id: string;
  company: string;
  category: string | null;
  description: string;
  amount: number | null;
  incident_date: string | null;
  status: "draft" | "submitted" | "escalated" | "resolved";
  letter: string | null;
  created_at: string;
}

export interface DemoConversation {
  id: string;
  user_id: string;
  title: string;
  status: "in_progress" | "resolved" | "saved";
  created_at: string;
}

const DEMO_USER_COOKIE = "nr_demo_user";
const DEMO_COMPLAINTS_COOKIE = "nr_demo_complaints";
const DEMO_CONVS_COOKIE = "nr_demo_convs";

const DEFAULT_DEMO_COMPLAINTS: DemoComplaint[] = [
  {
    id: "demo-cbn-45k",
    user_id: "demo-user-1",
    company: "Zenith Guaranty Bank PLC",
    category: "Banking & Failed Transfer",
    description:
      "My account was debited ₦45,000 for a NIP inter-bank transfer that failed three days ago (Ref: NIP/2026/8839201). Despite visiting the branch, the funds have still not been reversed.",
    amount: 45000,
    incident_date: "2026-11-05",
    status: "in_progress" as unknown as "draft",
    letter: null,
    created_at: "2026-11-05T10:30:00.000Z",
  },
];

// Normalize default status to 'draft'
DEFAULT_DEMO_COMPLAINTS[0].status = "draft";

const DEFAULT_DEMO_CONVS: DemoConversation[] = [
  {
    id: "demo-conv-1",
    user_id: "demo-user-1",
    title: "Failed ₦45,000 bank transfer refund rights",
    status: "in_progress",
    created_at: "2026-11-05T09:15:00.000Z",
  },
];

export function getDemoUser(): DemoUser | null {
  try {
    const raw = cookies().get(DEMO_USER_COOKIE)?.value;
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw)) as DemoUser;
  } catch {
    return null;
  }
}

export function setDemoUser(user: DemoUser) {
  cookies().set(DEMO_USER_COOKIE, encodeURIComponent(JSON.stringify(user)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
}

export function clearDemoUser() {
  cookies().delete(DEMO_USER_COOKIE);
}

export function getDemoComplaints(): DemoComplaint[] {
  try {
    const raw = cookies().get(DEMO_COMPLAINTS_COOKIE)?.value;
    if (!raw) return DEFAULT_DEMO_COMPLAINTS;
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed : DEFAULT_DEMO_COMPLAINTS;
  } catch {
    return DEFAULT_DEMO_COMPLAINTS;
  }
}

export function saveDemoComplaints(list: DemoComplaint[]) {
  // Keep cookie compact (strip huge letters from list cookie if needed, or store up to 3 items)
  const compact = list.slice(0, 5).map((c) => ({
    ...c,
    description: c.description.slice(0, 260),
    letter: c.letter ? c.letter.slice(0, 1800) : null,
  }));
  cookies().set(
    DEMO_COMPLAINTS_COOKIE,
    encodeURIComponent(JSON.stringify(compact)),
    {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    }
  );
}

export function getDemoConversations(): DemoConversation[] {
  try {
    const raw = cookies().get(DEMO_CONVS_COOKIE)?.value;
    if (!raw) return DEFAULT_DEMO_CONVS;
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed : DEFAULT_DEMO_CONVS;
  } catch {
    return DEFAULT_DEMO_CONVS;
  }
}

export function saveDemoConversations(list: DemoConversation[]) {
  const compact = list.slice(0, 6);
  cookies().set(
    DEMO_CONVS_COOKIE,
    encodeURIComponent(JSON.stringify(compact)),
    {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    }
  );
}

