// src/components/MessagesSection.tsx
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

export default function MessagesSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const conversationMessages = messages.filter(
    (m) => m.conversationId === selectedId
  );

  useEffect(() => {
    const loadConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          messages:messages(
            body,
            created_at
          ),
          participants:conversation_participants(
            user_id
          )
        `
        )
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading conversations", error);
        return;
      }

      // Map supabase rows into your ConversationSummary shape
      const mapped: ConversationSummary[] = data.map((row: any) => ({
        id: row.id,
        name: "TODO: student name", // you can join to profiles later
        handle: "@todo",
        lastMessage: row.messages?.[row.messages.length - 1]?.body ?? "",
        lastActive: "", // format from created_at if you want
        unreadCount: 0,
      }));

      setConversations(mapped);
      if (mapped[0]) setSelectedId(mapped[0].id);
    };

    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const loadMessages = async () => {
      // 1️⃣ get current user once
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const myId = user?.id;

      // 2️⃣ fetch messages for this conversation
      const { data, error } = await supabase
        .from("messages")
        .select("id, body, sender_id, created_at, conversation_id")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages", error);
        return;
      }

      // 3️⃣ map without any await inside map
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          conversationId: m.conversation_id,
          from: m.sender_id === myId ? "me" : "them",
          text: m.body,
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
        sender_id: user.id,
        body: draft.trim(),
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
        text: data.body,
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
      className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm
      w-full sm:w-[640px] md:w-[768px] lg:w-[960px] xl:w-[1240px]
      h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px] xl:h-[650px] mx-auto"
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
