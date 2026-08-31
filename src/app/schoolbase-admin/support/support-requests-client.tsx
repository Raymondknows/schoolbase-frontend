"use client";

import { getBackendUrl } from "@/lib/backend-url";

import { ErrorModal } from "@/components/ui/error-modal";
import AdminSkeleton from "@/components/ui/skeleton";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Clock, HelpCircle, Mail, MessageCircle } from "lucide-react";

export type PlatformSupportRequestRow = {
  id: string;
  subject: string;
  message: string;
  response?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
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

export default function SupportRequestsClient({
  initialRequests = [],
}: {
  initialRequests?: PlatformSupportRequestRow[];
}) {
  const [requests, setRequests] = useState<PlatformSupportRequestRow[]>(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [replyStatus, setReplyStatus] = useState("IN_PROGRESS");
  const [replyStatuses, setReplyStatuses] = useState<Record<string, string>>({});
  const [readRequestIds, setReadRequestIds] = useState<string[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [statusModal, setStatusModal] = useState<{ open: boolean; type: "success" | "error"; title?: string; message: string }>({
    open: false,
    type: "success",
    message: "",
  });
  const [loading, setLoading] = useState(true);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const refreshRequests = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/schoolbase-admin/api/support`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Unable to load support requests. Status: ${res.status}`);
      }

      const data = await res.json();
      if (data?.supportRequests) {
        setRequests(data.supportRequests);
      }
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
    if (selectedRequestId) {
      setReadRequestIds((current) => (current.includes(selectedRequestId) ? current : [...current, selectedRequestId]));
    }
  }, [selectedRequestId]);

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        const text = [
          request.subject,
          request.message,
          request.school?.name,
          request.status,
          request.priority,
          request.response,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesSearch = !search.trim() || text.includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [requests, search, statusFilter],
  );

  const unreadCount = useMemo(
    () => requests.filter((request) => !readRequestIds.includes(request.id)).length,
    [requests, readRequestIds],
  );

  const openCount = useMemo(
    () => requests.filter((request) => request.status === "OPEN").length,
    [requests],
  );

  const inProgressCount = useMemo(
    () => requests.filter((request) => request.status === "IN_PROGRESS").length,
    [requests],
  );

  const resolvedCount = useMemo(
    () => requests.filter((request) => request.status === "RESOLVED").length,
    [requests],
  );

  const closedCount = useMemo(
    () => requests.filter((request) => request.status === "CLOSED").length,
    [requests],
  );

  const selectedRequest = selectedRequestId
    ? requests.find((request) => request.id === selectedRequestId) ?? null
    : null;

  useEffect(() => {
    if (!selectedRequest) return;

    const nextStatus = replyStatuses[selectedRequest.id] ?? (selectedRequest.status === "OPEN" ? "IN_PROGRESS" : selectedRequest.status);
    setReplyStatus(nextStatus);
  }, [selectedRequest, replyStatuses]);

  useEffect(() => {
    if (filtered.length === 0) {
      if (selectedRequestId) setSelectedRequestId(null);
      return;
    }

    if (!selectedRequestId || !filtered.some((request) => request.id === selectedRequestId)) {
      setSelectedRequestId(filtered[0].id);
    }
  }, [filtered, selectedRequestId]);

  const quickReplies = [
    {
      label: "Need more details",
      text: "Thanks for reporting this. Could you please share a bit more detail about the issue, including screenshots, steps to reproduce, and the impact on your school operations?",
    },
    {
      label: "Thanks for waiting",
      text: "Thanks for your patience. We are reviewing this issue and will follow up with an update shortly with the next steps.",
    },
    {
      label: "Investigating",
      text: "We have received your report and are investigating the issue now. We will keep you updated as we work through it.",
    },
    {
      label: "Action required",
      text: "We need a little more information from your side to proceed. Please reply with the affected module, user role, and any recent changes made.",
    },
    {
      label: "Resolved",
      text: "This issue has now been resolved. Please test it on your end and let us know if anything else comes up.",
    },
    {
      label: "Escalated",
      text: "We have escalated this request to our technical team. You will receive an update as soon as we have more information.",
    },
  ];

  const persistRequestUpdate = useCallback(
    async (nextStatus: string, draftText = "", options?: { showSuccess?: boolean; clearDraft?: boolean }) => {
      if (!selectedRequest) return null;

      const currentDraft = draftText.trim();
      const normalizedStatus = String(nextStatus || selectedRequest.status).trim().toUpperCase();
      const hasReplyText = currentDraft.length > 0;

      if (!hasReplyText && normalizedStatus === selectedRequest.status) {
        return null;
      }

      setBusy(true);

      try {
        const requestPayload: Record<string, unknown> = {
          requestId: selectedRequest.id,
          status: normalizedStatus,
        };
        if (hasReplyText) {
          requestPayload.response = currentDraft;
        }

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/schoolbase-admin/api/support/reply`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify(requestPayload),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to update support ticket.");
        }

        const updatedRequest = result.supportRequest;
        if (updatedRequest) {
          const nextPersistedStatus = String(updatedRequest.status || "").trim().toUpperCase() || selectedRequest.status;
          setRequests((current) =>
            current.map((request) =>
              request.id === updatedRequest.id
                ? {
                    ...request,
                    ...updatedRequest,
                    status: nextPersistedStatus,
                    updatedAt: updatedRequest.updatedAt || request.updatedAt,
                    response: updatedRequest.response ?? request.response,
                    messages: updatedRequest.messages || request.messages,
                  }
                : request,
            ),
          );
          setSelectedRequestId(updatedRequest.id);
          setReplyStatus(nextPersistedStatus);
          setReplyStatuses((current) => ({ ...current, [updatedRequest.id]: nextPersistedStatus }));
        }

        await refreshRequests(false);

        if (options?.showSuccess) {
          setStatusModal({ open: true, type: "success", title: "Reply sent", message: "Your reply was sent successfully." });
        }

        if (options?.clearDraft) {
          setReplyDrafts((current) => {
            const next = { ...current };
            delete next[selectedRequest.id];
            return next;
          });
        }

        return updatedRequest;
      } catch (err) {
        setStatusModal({ open: true, type: "error", title: "Update failed", message: err instanceof Error ? err.message : "Unable to update support ticket." });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [refreshRequests, selectedRequest],
  );

  const handleReply = async () => {
    if (!selectedRequest) return;
    const currentDraft = replyDrafts[selectedRequest.id] ?? "";
    const hasReplyText = currentDraft.trim().length > 0;

    if (!hasReplyText && replyStatus === selectedRequest.status) {
      setStatusModal({ open: true, type: "error", title: "Reply required", message: "Reply cannot be empty unless you change the ticket status." });
      return;
    }

    await persistRequestUpdate(replyStatus, currentDraft, { showSuccess: true, clearDraft: true });
  };

  if (loading) {
    return (
      <div className="py-12">
        <AdminSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmLabel={statusModal.type === "success" ? "Okay" : "Try again"}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
            <HelpCircle className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Support center</p>
            <h1 className="text-3xl font-bold text-foreground">SchoolBase support</h1>
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
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total tickets",
            value: requests.length,
            detail: "All support requests",
            icon: MessageCircle,
          },
          {
            label: "Open",
            value: openCount,
            detail: "Need response",
            icon: Bell,
          },
          {
            label: "In progress",
            value: inProgressCount,
            detail: "Being handled",
            icon: Clock,
          },
          {
            label: "Unread",
            value: unreadCount,
            detail: "Unseen requests",
            icon: Mail,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-2 text-brand">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">{card.label}</span>
              </div>
              <div className="text-3xl font-semibold text-foreground">{card.value}</div>
              <div className="mt-1 text-xs text-muted">{card.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch">
        <aside className="border border-border bg-surface p-4 xl:max-h-[74vh] xl:overflow-y-auto xl:overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tickets</h3>
              <p className="text-xs text-muted">{filtered.length} visible • {unreadCount} unread</p>
            </div>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted">
                No support requests match your search.
              </div>
            ) : (
              filtered.map((request) => {
                const isActive = selectedRequest?.id === request.id;
                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => {
                      const nextStatus = replyStatuses[request.id] ?? (request.status === "OPEN" ? "IN_PROGRESS" : request.status);
                      setSelectedRequestId(request.id);
                      setReplyStatus(nextStatus);
                      setStatusModal((prev) => ({ ...prev, open: false }));
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
            <div className="flex h-[72vh] min-h-[540px] flex-col">
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
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
                  <p className="mt-1.5 text-sm text-muted">
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
                  {selectedRequest.school ? (
                    <Link href={`/schoolbase-admin/schools/${selectedRequest.school.id}`} className="mt-1 inline-flex text-brand hover:underline">
                      View school
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background">
                <div className="flex items-center justify-center border-b border-border bg-surface px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (messageListRef.current) {
                        messageListRef.current.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="text-[11px] font-semibold uppercase tracking-[.12em] text-brand transition hover:text-brand-hover"
                  >
                    Load older messages
                  </button>
                </div>

                <div ref={messageListRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                  {selectedRequest.messages.length > 0 ? (
                    selectedRequest.messages.map((message) => {
                      const isSchoolMessage = message.senderRole === "SCHOOL";
                      const normalizedSenderName = typeof message.senderName === "string" ? message.senderName.trim() : "";
                      const senderName = isSchoolMessage
                        ? (selectedRequest.school?.name || normalizedSenderName || "School")
                        : (normalizedSenderName || "SchoolBase Support");
                      const badgeLabel = isSchoolMessage ? "School" : "Support";
                      const badgeClasses = isSchoolMessage ? "bg-emerald-100 text-emerald-700" : "bg-brand/10 text-brand";

                      return (
                        <div key={message.id} className={`flex ${isSchoolMessage ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[85%] rounded-lg border px-3 py-2 ${isSchoolMessage ? "border-brand/30 bg-brand/10" : "border-border bg-background text-foreground"}`}>
                            <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${badgeClasses}`}>{badgeLabel}</span>
                                <span className={`${isSchoolMessage ? "text-brand" : "text-foreground"} font-semibold`}>{senderName}</span>
                              </div>
                              <span>{formatDate(message.createdAt)}</span>
                            </div>
                            <p className={`mt-1.5 text-sm whitespace-pre-line ${isSchoolMessage ? "text-brand" : "text-foreground"}`}>{message.body}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-muted">
                      No messages yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-background p-3">
                <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Set status</label>
                    <select
                      value={replyStatus}
                      onChange={(event) => {
                        const nextStatus = event.target.value;
                        setReplyStatus(nextStatus);
                        if (selectedRequest) {
                          setReplyStatuses((current) => ({ ...current, [selectedRequest.id]: nextStatus }));
                          void persistRequestUpdate(nextStatus, replyDrafts[selectedRequest.id] ?? "");
                        }
                      }}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none"
                    >
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Reply message</label>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {quickReplies.map((template) => (
                        <button
                          key={template.label}
                          type="button"
                          onClick={() => setReplyDrafts((current) => ({ ...current, [selectedRequest.id]: `${current[selectedRequest.id] ?? ""}${current[selectedRequest.id] ? "\n\n" : ""}${template.text}`.trim() }))}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted transition hover:border-brand hover:text-brand"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={replyDrafts[selectedRequest.id] ?? ""}
                      onChange={(event) => setReplyDrafts((current) => ({ ...current, [selectedRequest.id]: event.target.value }))}
                      className="min-h-[120px] w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      placeholder="Write your support reply here..."
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleReply}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Sending reply..." : "Send reply"}
                  </button>
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
    </div>
  );
}
