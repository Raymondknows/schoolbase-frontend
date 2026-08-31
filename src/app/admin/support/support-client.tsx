"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorModal } from "@/components/ui/error-modal";
import { getBackendUrl } from "@/lib/backend-url";

export type SupportRequestRow = {
  id: string;
  subject: string;
  message: string;
  response?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{
    id: string;
    senderRole: string;
    senderName: string;
    senderEmail?: string | null;
    body: string;
    createdAt: string;
  }>;
  school: {
    id: string;
    name: string;
    country: string;
  } | null;
};

function statusClasses(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-sky-100 text-sky-700";
    case "RESOLVED":
      return "bg-slate-100 text-slate-700";
    case "CLOSED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityClasses(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-rose-100 text-rose-800";
    case "HIGH":
      return "bg-amber-100 text-amber-800";
    case "MEDIUM":
      return "bg-sky-100 text-sky-700";
    case "LOW":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SupportClient({
  initialRequests,
}: {
  initialRequests: SupportRequestRow[];
}) {
  const [requests, setRequests] = useState<SupportRequestRow[]>(initialRequests);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [readRequestIds, setReadRequestIds] = useState<string[]>([]);
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshRequests = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/support/data`, {
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";
      let result: any = null;
      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Unable to load support requests.");
      }

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "Unable to load support requests.");
      }

      setRequests(result.supportRequests || []);
    } catch (err) {
      console.error("Error loading support requests:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const storedRead = window.localStorage.getItem("support:read-requests");
      if (storedRead) {
        setReadRequestIds(JSON.parse(storedRead));
      }

      const storedDrafts = window.localStorage.getItem("support:reply-drafts");
      if (storedDrafts) {
        setReplyDrafts(JSON.parse(storedDrafts));
      }
    } catch (err) {
      console.error("Error loading draft state:", err);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("support:read-requests", JSON.stringify(readRequestIds));
  }, [readRequestIds]);

  useEffect(() => {
    window.localStorage.setItem("support:reply-drafts", JSON.stringify(replyDrafts));
  }, [replyDrafts]);

  useEffect(() => {
    void refreshRequests(true);

    const intervalId = window.setInterval(() => {
      void refreshRequests(false);
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshRequests(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshRequests]);

  useEffect(() => {
    if (expandedRequestId) {
      setReadRequestIds((current) => (current.includes(expandedRequestId) ? current : [...current, expandedRequestId]));
    }
  }, [expandedRequestId]);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const text = [request.subject, request.message, request.school?.name, request.status, request.priority, request.response]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !search.trim() || text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [filtered],
  );

  const unreadCount = useMemo(
    () => sorted.filter((request) => !readRequestIds.includes(request.id)).length,
    [sorted, readRequestIds],
  );

  const selectedRequest = expandedRequestId
    ? sorted.find((request) => request.id === expandedRequestId) ?? null
    : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }

    setBusy(true);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/support`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });

      const contentType = response.headers.get("content-type") || "";
      let result: any = null;
      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        // Non-JSON response (likely HTML redirect). Read text for diagnostics.
        const text = await response.text();
        if (!response.ok) {
          setError(text || "Unable to create support request.");
          return;
        }
        // If ok but non-JSON, still treat as success fallback (unlikely)
        result = { supportRequest: null };
      }

      if (!response.ok) {
        setError(result?.message || "Unable to create support request.");
        return;
      }

      if (!result?.supportRequest) {
        setError("Unable to create support request.");
        return;
      }

      setRequests((current) => [result.supportRequest, ...current]);
      setSubject("");
      setMessage("");
      setShowCreateModal(false);
      setSuccess("Support request created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create support request.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center border border-border bg-surface p-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-brand"></div>
          <p className="mt-3 text-sm text-muted">Loading support requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
            <HelpCircle className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Support center</p>
            <h1 className="text-3xl font-bold text-foreground">Support Requests</h1>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <Button
            type="button"
            className="inline-flex h-10 items-center gap-2 px-4 py-2 text-sm bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setShowCreateModal(true);
            }}
          >
            Create support request
          </Button>
        </div>
      </div>

      <ErrorModal
        isOpen={Boolean(success)}
        onClose={() => setSuccess(null)}
        type="success"
        title="Support request created"
        message={success ?? "Support request created."}
        confirmLabel="OK"
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border border-border bg-surface p-4 lg:max-h-[70vh] lg:overflow-y-auto lg:overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tickets</h3>
              <p className="text-xs text-muted">{sorted.length} visible • {unreadCount} unread</p>
            </div>
          </div>

          <div className="space-y-2">
            {sorted.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted">
                No support requests match your search.
              </div>
            ) : (
              sorted.map((request) => {
                const isActive = selectedRequest?.id === request.id;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => {
                      setExpandedRequestId(request.id);
                      setReplyError(null);
                      setReplySuccess(null);
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition ${isActive ? "border-brand bg-brand/5" : "border-border bg-background hover:border-brand/40 hover:bg-brand/5"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{request.subject}</p>
                        <p className="mt-1 text-xs text-muted">{request.school?.name ?? "Unknown school"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!readRequestIds.includes(request.id) ? (
                          <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand">New</span>
                        ) : null}
                        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusClasses(request.status)}`}>
                          {request.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted">
                      <span className={`rounded-full px-2 py-1 ${priorityClasses(request.priority)}`}>{request.priority}</span>
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="border border-border bg-surface p-6">
          {selectedRequest ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{selectedRequest.subject}</h2>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${priorityClasses(selectedRequest.priority)}`}>
                      {selectedRequest.priority}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses(selectedRequest.status)}`}>
                      {selectedRequest.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {selectedRequest.school ? (
                      <>
                        From {selectedRequest.school.name} • {selectedRequest.school.country}
                      </>
                    ) : (
                      "Unknown school"
                    )}
                  </p>
                </div>
                <div className="text-sm text-muted">
                  <div>Created {formatDate(selectedRequest.createdAt)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Conversation</h3>
                  <span className="text-xs text-muted">
                    {selectedRequest.messages?.length ? selectedRequest.messages.length : 1} {selectedRequest.messages?.length === 1 ? "message" : "messages"}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedRequest.messages?.length ? (
                    selectedRequest.messages.map((message) => {
                      const isSchoolMessage = message.senderRole === "SCHOOL";
                      const senderName = isSchoolMessage
                        ? (message.senderName && !/schoolbase support|schoolbase admin|support team|support|admin|platform admin/i.test(message.senderName)
                          ? message.senderName
                          : "Your school")
                        : (message.senderName || "SchoolBase Support");

                      return (
                        <div key={message.id} className={`flex ${isSchoolMessage ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-lg border px-4 py-3 ${isSchoolMessage ? "border-brand/30 bg-brand/10" : "border-border bg-background text-foreground"}`}>
                            <div className="flex items-center justify-between gap-3 text-xs text-muted">
                              <span className={`font-semibold ${isSchoolMessage ? "text-brand" : "text-foreground"}`}>{senderName}</span>
                              <span>{formatDate(message.createdAt)}</span>
                            </div>
                            <p className={`mt-2 text-sm whitespace-pre-line ${isSchoolMessage ? "text-brand" : "text-foreground"}`}>{message.body}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-muted">
                      {selectedRequest.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <label className="mb-2 block text-sm font-medium text-foreground">Reply to support</label>
                <textarea
                  value={replyDrafts[selectedRequest.id] ?? ""}
                  onChange={(event) => setReplyDrafts((current) => ({ ...current, [selectedRequest.id]: event.target.value }))}
                  className="min-h-[120px] w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Write a reply to the support team..."
                />
                {replyError ? <div className="mt-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{replyError}</div> : null}
                <ErrorModal
                  isOpen={Boolean(replySuccess)}
                  onClose={() => setReplySuccess(null)}
                  type="success"
                  title="Reply sent"
                  message={replySuccess ?? "Reply sent successfully."}
                  confirmLabel="OK"
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    disabled={replyBusy}
                    onClick={async () => {
                      setReplyError(null);
                      setReplySuccess(null);
                      const currentDraft = replyDrafts[selectedRequest.id] ?? "";
                      if (!currentDraft.trim()) {
                        setReplyError("Reply cannot be empty.");
                        return;
                      }
                      setReplyBusy(true);
                      try {
                        const backendUrl = getBackendUrl();
                        const res = await fetch(`${backendUrl}/api/admin/support/reply`, {
                          method: "PATCH",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ requestId: selectedRequest.id, response: currentDraft }),
                        });

                        const contentType = res.headers.get("content-type") || "";
                        let json: any = null;
                        if (contentType.includes("application/json")) {
                          json = await res.json();
                        } else {
                          const text = await res.text();
                          if (!res.ok) {
                            setReplyError(text || "Unable to send reply.");
                            return;
                          }
                          setReplyError("Unexpected non-JSON response from server.");
                          return;
                        }

                        if (!res.ok) {
                          setReplyError(json?.message || "Unable to send reply.");
                          return;
                        }

                        if (!json?.supportRequest) {
                          setReplyError("Unexpected server response when sending reply.");
                          return;
                        }

                        setRequests((current) => current.map((request) => (request.id === selectedRequest.id ? json.supportRequest : request)));
                        setReplySuccess("Reply sent successfully.");
                        setReplyDrafts((current) => {
                          const next = { ...current };
                          delete next[selectedRequest.id];
                          return next;
                        });
                        setExpandedRequestId(selectedRequest.id);
                      } catch (err) {
                        setReplyError(err instanceof Error ? err.message : "Unable to send reply.");
                      } finally {
                        setReplyBusy(false);
                      }
                    }}
                  >
                    {replyBusy ? "Sending..." : "Send reply"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center border border-dashed border-border bg-background p-6 text-center text-sm text-muted">
              Select a ticket from the left to view the conversation and reply.
            </div>
          )}
        </section>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-2xl border border-border bg-surface p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">New support request</p>
                <h2 className="text-2xl font-semibold text-foreground mt-1">Create support request</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-border bg-background p-2 text-muted transition hover:bg-surface hover:text-foreground"
                aria-label="Close create support request"
              >
                ✕
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Subject</label>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Example: Payment setup issue"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Message</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[140px] w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Please explain the issue in detail."
                />
              </div>
              {error ? <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button type="button" className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
                  {busy ? "Sending..." : "Submit support request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
