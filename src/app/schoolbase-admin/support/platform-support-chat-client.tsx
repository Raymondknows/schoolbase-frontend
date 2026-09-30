"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MessageCircle, Paperclip, RefreshCw, Send } from "lucide-react";

type Attachment = { id: string; originalName: string; mimeType: string; size: number; url: string };
type Message = { id: string; senderRole: string; senderName: string; body: string; createdAt: string; readAt?: string | null; attachments?: Attachment[] };
type Conversation = {
  id: string; schoolId: string; subject: string; status: string; createdAt: string; lastMessageAt: string; unreadCount: number;
  requester: { name?: string | null; email?: string | null; role?: string | null };
  school?: { name: string; country: string; plan: string; currency: string };
  messages: Message[];
};

const statusFilters = ["ALL", "OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"];
const statuses = statusFilters.filter((status) => status !== "ALL");

function formatTime(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusStyle(status: string) {
  if (status === "OPEN") return "bg-emerald-100 text-emerald-800";
  if (status === "IN_PROGRESS") return "bg-sky-100 text-sky-800";
  if (status === "WAITING_FOR_CUSTOMER") return "bg-amber-100 text-amber-900";
  if (status === "RESOLVED") return "bg-slate-100 text-slate-700";
  return "bg-rose-100 text-rose-800";
}

export default function PlatformSupportChatClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    const params = new URLSearchParams({ status: statusFilter, limit: "100" });
    if (search.trim()) params.set("search", search.trim());
    try {
      const response = await fetch(`/schoolbase-admin/api/support-chat/conversations?${params}`, { credentials: "include", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load support chats.");
      const next = data.conversations || [];
      setConversations(next);
      if (selectedId && !next.some((item: Conversation) => item.id === selectedId)) {
        setSelectedId("");
        setSelected(null);
      }
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load support chats.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedId, statusFilter]);

  const loadConversation = useCallback(async (id: string, markRead = true) => {
    try {
      const response = await fetch(`/schoolbase-admin/api/support-chat/conversations/${encodeURIComponent(id)}`, { credentials: "include", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load conversation.");
      setSelected(data.conversation);
      if (markRead) {
        await fetch(`/schoolbase-admin/api/support-chat/conversations/${encodeURIComponent(id)}/read`, { method: "POST", credentials: "include" });
        void loadConversations();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load conversation.");
    }
  }, [loadConversations]);

  useEffect(() => { void Promise.resolve().then(loadConversations); }, [loadConversations]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) void loadConversations(); }, 10000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);
  useEffect(() => {
    if (!selectedId) return;
    void Promise.resolve().then(() => loadConversation(selectedId));
    const timer = window.setInterval(() => { if (!document.hidden) void loadConversation(selectedId, false); }, 5000);
    return () => window.clearInterval(timer);
  }, [loadConversation, selectedId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [selected?.messages.length]);

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || (!draft.trim() && !files.length)) return;
    setSending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("message", draft.trim());
      files.forEach((file) => formData.append("files", file));
      const response = await fetch(`/schoolbase-admin/api/support-chat/conversations/${encodeURIComponent(selectedId)}/messages`, { method: "POST", credentials: "include", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send reply.");
      setSelected(data.conversation);
      setDraft("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      await loadConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send reply.");
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: string) {
    if (!selectedId) return;
    const response = await fetch(`/schoolbase-admin/api/support-chat/conversations/${encodeURIComponent(selectedId)}/status`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Unable to update conversation status."); return; }
    await Promise.all([loadConversation(selectedId, false), loadConversations()]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const unreadTotal = useMemo(() => conversations.reduce((sum, item) => sum + item.unreadCount, 0), [conversations]);

  return (
    <section className="space-y-4">
      <header className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-brand"><MessageCircle className="h-4 w-4" /> In-app support</div>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">School conversations</h2>
          <p className="mt-1 text-sm text-muted">{unreadTotal} unread customer {unreadTotal === 1 ? "message" : "messages"}</p>
        </div>
        <button type="button" onClick={() => void loadConversations()} className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      {error ? <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div> : null}
      <div className="grid min-h-[620px] gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.6fr)]">
        <aside className="flex min-h-0 flex-col border border-border bg-surface">
          <div className="space-y-3 border-b border-border p-3">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search school or message..." className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand" aria-label="Search support conversations" />
            <div className="flex gap-1 overflow-x-auto pb-1">
              {statusFilters.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`shrink-0 border px-2.5 py-1.5 text-[10px] font-bold uppercase ${statusFilter === status ? "border-brand bg-brand text-white" : "border-border bg-background text-muted hover:text-brand"}`}>{status.replaceAll("_", " ")}</button>)}
            </div>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {loading ? <p className="p-5 text-sm text-muted">Loading conversations…</p> : conversations.length ? conversations.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full px-4 py-4 text-left transition hover:bg-background ${selectedId === item.id ? "border-l-2 border-l-brand bg-brand/5" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{item.school?.name || "School"}</p><p className="mt-0.5 truncate text-xs text-muted">{item.requester.name || "School user"} · {item.requester.role || "User"}</p></div>
                  {item.unreadCount ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{item.unreadCount}</span> : null}
                </div>
                <p className="mt-2 truncate text-xs text-foreground">{item.messages.at(-1)?.body || item.subject}</p>
                <div className="mt-2 flex items-center justify-between gap-2"><span className={`px-2 py-1 text-[9px] font-bold uppercase ${statusStyle(item.status)}`}>{item.status.replaceAll("_", " ")}</span><time className="text-[10px] text-muted">{formatTime(item.lastMessageAt)}</time></div>
              </button>
            )) : <p className="p-5 text-sm text-muted">No conversations match this view.</p>}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border border-border bg-surface">
          {selected ? (
            <>
              <header className="flex flex-col justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="min-w-0"><h3 className="truncate text-base font-semibold text-foreground">{selected.school?.name || "School"}</h3><p className="mt-1 truncate text-xs text-muted">{selected.requester.name || "School user"} · {selected.requester.role || "User"}{selected.requester.email ? ` · ${selected.requester.email}` : ""}</p><p className="mt-1 text-[10px] text-muted">{selected.school?.plan || "Plan unknown"} · {selected.school?.country || "Country unknown"} · {selected.subject}</p></div>
                <label className="text-xs font-semibold text-muted">Status <select value={selected.status} onChange={(event) => void changeStatus(event.target.value)} className="ml-2 border border-border bg-surface px-2 py-2 text-xs text-foreground">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
              </header>
              <div className="flex-1 space-y-4 overflow-y-auto bg-background/50 p-4 sm:p-5" aria-live="polite">
                {selected.messages.map((message) => {
                  const fromAdmin = message.senderRole === "PLATFORM_ADMIN";
                  return <article key={message.id} className={`max-w-[86%] ${fromAdmin ? "ml-auto" : "mr-auto"}`}><p className={`mb-1 text-[10px] font-semibold text-muted ${fromAdmin ? "text-right" : ""}`}>{message.senderName} · {formatTime(message.createdAt)}</p><div className={`whitespace-pre-wrap break-words border px-3 py-2.5 text-sm leading-5 ${fromAdmin ? "border-brand bg-brand text-white" : "border-border bg-white text-foreground"}`}>{message.body}</div>{message.attachments?.map((attachment) => <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className={`mt-1 block truncate border border-border bg-white px-3 py-2 text-xs font-medium text-brand underline ${fromAdmin ? "ml-auto" : ""}`}>{attachment.originalName}</a>)}</article>;
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendReply} className="shrink-0 border-t border-border bg-surface p-3 sm:p-4">
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple className="hidden" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
                <div className="mb-2 flex items-center justify-between"><button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"><Paperclip className="h-3.5 w-3.5" /> Attach image/PDF</button>{files.length ? <span className="max-w-[260px] truncate text-[10px] text-muted">{files.map((file) => file.name).join(", ")}</span> : null}</div>
                <div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} rows={2} maxLength={20000} placeholder="Reply to this school..." className="max-h-36 min-h-11 flex-1 resize-y border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand" aria-label="Reply to this school" /><button type="submit" disabled={sending || (!draft.trim() && !files.length)} className="flex h-10 w-10 items-center justify-center bg-brand text-white hover:bg-brand-hover disabled:opacity-50" aria-label="Send reply">{sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="h-4 w-4" />}</button></div>
              </form>
            </>
          ) : <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"><MessageCircle className="h-8 w-8 text-brand" /><h3 className="mt-3 text-sm font-semibold text-foreground">Select a conversation</h3><p className="mt-1 max-w-sm text-xs text-muted">Customer messages and account context will appear here.</p></div>}
        </section>
      </div>
    </section>
  );
}
