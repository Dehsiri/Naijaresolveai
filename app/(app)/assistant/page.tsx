import { createClient } from "@/lib/supabase/server";
import {
  AssistantClient,
  type ConversationRow,
  type MessageRow,
} from "./AssistantClient";

/**
 * Step 7: AI Legal Assistant Page (`app/(app)/assistant/page.tsx`)
 * Implements Section 5.3 Spec:
 * - Chat column (header with conversation title + status pill) and a Sources panel on the right
 *   (collapses below the chat on small screens).
 * - User bubble, then an Answer Card with structured sections ("What this means" / "Your options"),
 *   source chips, and actions: "Draft complaint letter" (primary), "Find a lawyer" (secondary).
 * - Composer pinned to bottom.
 */
export default async function AssistantPage({
  searchParams,
}: {
  searchParams?: { id?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "";

  // Load recent conversations for the user
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentList = (conversations as ConversationRow[]) || [];

  // Determine active conversation if `?id=...` is provided
  let activeConversation: ConversationRow | null = null;
  let initialMessages: MessageRow[] = [];

  if (searchParams?.id) {
    activeConversation =
      recentList.find((c) => c.id === searchParams.id) || null;

    if (activeConversation) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("id, role, content, sources, created_at")
        .eq("conversation_id", activeConversation.id)
        .order("created_at", { ascending: true });

      initialMessages = (msgs as MessageRow[]) || [];
    }
  }

  return (
    <AssistantClient
      activeConversation={activeConversation}
      initialMessages={initialMessages}
      recentConversations={recentList}
      initialPrompt={searchParams?.q || ""}
    />
  );
}
