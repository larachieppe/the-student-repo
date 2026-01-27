import { useState, useEffect } from "react";
import { supabase } from "../supabase";

type ConversationSummary = {
  id: string;
  name: string;
  handle: string;
  lastMessage: string;
  lastActive: string;
  unreadCount?: number;
};

type Message = {
  id: string;
  conversationId: string;
  from: "me" | "them";
  text: string;
  timestamp: string;
};

type MessagesSectionProps = {
  initialConversationId?: string;
  companyId?: string;
};

export default function MessagesSection({
  initialConversationId,
  companyId,
}: MessagesSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const conversationMessages = messages.filter(
    (m) => m.conversationId === selectedId
  );

  useEffect(() => {
    const loadConversations = async () => {
      // Build query to filter by company_id for business users
      let query = supabase
        .from("conversations")
        .select(
          `
          id,
          student_id,
          messages:messages(
            content,
            created_at
          ),
          participants:conversation_participants(
            user_id
          )
        `
        )
        .order("updated_at", { ascending: false });

      // Filter by company_id if provided (for business users)
      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading conversations", error);
        return;
      }

      // Get unique student IDs to fetch their names
      const studentIds = data
        .map((row: any) => row.student_id)
        .filter((id: string | null) => id !== null);

      // Fetch student names from submissions table
      let studentsMap: { [key: string]: string } = {};
      if (studentIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from("submissions")
          .select("id, first_name, last_name")
          .in("id", studentIds);

        if (!studentsError && students) {
          studentsMap = students.reduce((acc: any, student: any) => {
            acc[student.id] = `${student.first_name} ${student.last_name}`;
            return acc;
          }, {});
        }
      }

      // Map supabase rows into your ConversationSummary shape
      const mapped: ConversationSummary[] = data.map((row: any) => ({
        id: row.id,
        name: studentsMap[row.student_id] || "Unknown Student",
        handle: `@${(studentsMap[row.student_id] || "student")
          .toLowerCase()
          .replace(" ", "")}`,
        lastMessage: row.messages?.[row.messages.length - 1]?.content ?? "",
        lastActive: "", // format from created_at if you want
        unreadCount: 0,
      }));

      setConversations(mapped);

      if (!mapped.length) {
        setSelectedId(null);
        return;
      }

      if (initialConversationId) {
        const match = mapped.find((c) => c.id === initialConversationId);
        setSelectedId(match ? match.id : mapped[0].id);
      } else if (!selectedId) {
        setSelectedId(mapped[0].id);
      }
    };

    loadConversations();
  }, [initialConversationId, companyId]);

  useEffect(() => {
    if (!selectedId) return;

    const loadMessages = async () => {
      //get current user once
      const {
        data: {},
      } = await supabase.auth.getUser();

      //fetch messages for this conversation
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, sender, created_at, conversation_id")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages", error);
        return;
      }

      //map without any await inside map
      // sender is "students" or "businessUsers", business user sees "businessUsers" messages as "me"
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id,
          from: m.sender === "businessUsers" ? "me" : "them",
          text: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        }))
      );
    };

    loadMessages();
  }, [selectedId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedId,
        business_id: user.id,
        student_id: null,
        sender: "businessUsers", // Must be 'students' or 'businessUsers'
        content: draft.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message", error);
      return;
    }

    // Optimistically update local state
    setMessages((prev) => [
      ...prev,
      {
        id: data.id,
        conversationId: data.conversation_id,
        from: "me",
        text: data.content,
        timestamp: new Date(data.created_at).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      },
    ]);

    setDraft("");
  };

  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm w-full max-w-7xl mx-auto"
      style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
    >
      {/* Left: conversation list */}
      <aside className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <h1 className="font-semibold text-slate-900">Messages</h1>
          <p className="text-xs text-slate-500">
            Chat with students you’ve shortlisted.
          </p>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ⌕
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const isActive = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                  isActive ? "bg-brand-blue/5" : "hover:bg-slate-50"
                }`}
              >
                {/* Avatar (initials) */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {c.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {c.name}
                    </p>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {c.lastActive}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-slate-500">
                    {c.lastMessage}
                  </p>
                </div>
                {c.unreadCount && c.unreadCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-blue text-[10px] font-semibold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: chat window */}
      <section className="flex-1 flex flex-col">
        {/* Header */}
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                {selectedConversation.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedConversation.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedConversation.handle} · Active{" "}
                  {selectedConversation.lastActive} ago
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50">
              {conversationMessages.map((m) => {
                const isMe = m.from === "me";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className="">
                      <div
                        className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          isMe
                            ? "bg-brand-blue text-white rounded-br-sm"
                            : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                      <div
                        className={`mt-0.5 text-[10px] text-slate-400 ${
                          isMe ? "text-right" : "text-left"
                        }`}
                      >
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {conversationMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No messages yet. Say hi 👋
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="border-t border-slate-200 px-3 py-2 bg-white"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue"
                />
                <button
                  type="submit"
                  className="rounded-full bg-brand-blue px-4 py-1.5 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-50"
                  disabled={!draft.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
            Select a conversation to start messaging.
          </div>
        )}
      </section>
    </div>
  );
}
