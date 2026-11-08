import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoConversations } from "@/lib/demo-store";
import {
  AssistantClient,
  type ConversationRow,
  type MessageRow,
} from "./AssistantClient";

/**
 * Step 7: AI Legal Assistant Page (`app/(app)/assistant/page.tsx`)
 */
export default async function AssistantPage({
  searchParams,
}: {
  searchParams?: { id?: string; q?: string };
}) {
  if (!isSupabaseConfigured()) {
    const recentList = getDemoConversations() as ConversationRow[];
    const activeConversation = searchParams?.id
      ? recentList.find((c) => c.id === searchParams.id) || null
      : null;

    return (
      <AssistantClient
        activeConversation={activeConversation}
        initialMessages={[]}
        recentConversations={recentList}
        initialPrompt={searchParams?.q || ""}
      />
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "";

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentList = (conversations as ConversationRow[]) || [];

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
