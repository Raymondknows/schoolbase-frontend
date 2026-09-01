"use client";

import { getBackendUrl } from "@/lib/backend-url";

import { ErrorModal } from "@/components/ui/error-modal";
import AdminSkeleton from "@/components/ui/skeleton";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Bell, CheckSquare, Clock, FileText, HelpCircle, Mail, MessageCircle, X } from "lucide-react";

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
    attachments?: Array<{
      id: string;
      fileName: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      createdAt: string;
    }>;
  }>;
  attachments?: Array<{
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: string;
  }>;
  school: {
    id: string;
    name: string;
    country: string;
  } | null;
};

type SupportNote = {
  id: string;
  body: string;
  createdAt: string;
  author?: { id: string; name: string; email: string } | null;
};

type SupportAgent = { id: string; name: string; email: string };

type SupportTask = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assignedTo?: string | null;
  dueAt?: string | null;
  createdAt: string;
  assignee?: SupportAgent | null;
  creator?: SupportAgent | null;
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

const SUPPORT_CATEGORIES = [
  { value: "Billing / payment", keywords: ["billing", "invoice", "payment", "charge", "subscription", "renew", "refund", "fee"] },
  { value: "Login / access", keywords: ["login", "password", "signin", "access", "auth", "account", "otp", "reset", "permission"] },
  { value: "Timetable / classes", keywords: ["timetable", "schedule", "class", "subject", "teacher", "lesson", "period"] },
  { value: "Results / reports", keywords: ["result", "report", "grade", "exam", "score", "assessment", "performance"] },
  { value: "Technical bug", keywords: ["bug", "error", "broken", "not working", "crash", "issue", "unable", "failed", "timeout", "app"] },
  { value: "Admissions", keywords: ["admission", "enroll", "student", "application", "registration", "offer"] },
  { value: "Other", keywords: [] },
] as const;

function inferCategory(request: Pick<PlatformSupportRequestRow, "subject" | "message">) {
  const haystack = `${request.subject} ${request.message}`.toLowerCase();
  const match = SUPPORT_CATEGORIES.find((category) => category.keywords.some((keyword) => haystack.includes(keyword)));
  return match?.value ?? "Other";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `${getBackendUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
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
  const [ticketNotes, setTicketNotes] = useState<Record<string, string>>({});
  const [notesByRequest, setNotesByRequest] = useState<Record<string, SupportNote[]>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [notesBusy, setNotesBusy] = useState(false);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [tasks, setTasks] = useState<SupportTask[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskBusy, setTaskBusy] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [attachments, setAttachments] = useState<Record<string, Array<{ id: string; name: string; size: number; type: string; preview?: string }>>>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
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
    try {
      const storedAttachments = window.localStorage.getItem("support:attachments");
      if (storedAttachments) {
        setAttachments(JSON.parse(storedAttachments));
      }
    } catch (err) {
      console.error("Error loading support metadata:", err);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("support:attachments", JSON.stringify(attachments));
  }, [attachments]);

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
    const loadSharedSupportData = async () => {
      try {
        const backendUrl = getBackendUrl();
        const [agentsResponse, tasksResponse] = await Promise.all([
          fetch(`${backendUrl}/schoolbase-admin/api/support/agents`, { credentials: "include", cache: "no-store" }),
          fetch(`${backendUrl}/schoolbase-admin/api/support/tasks`, { credentials: "include", cache: "no-store" }),
        ]);
        if (agentsResponse.ok) setAgents((await agentsResponse.json()).agents ?? []);
        if (tasksResponse.ok) setTasks((await tasksResponse.json()).tasks ?? []);
      } catch (error) {
        console.error("Error loading shared support data:", error);
      }
    };
    void loadSharedSupportData();
  }, []);

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
        const matchesPriority = priorityFilter === "ALL" || request.priority === priorityFilter;
        const matchesUnreadOnly = !showUnreadOnly || !readRequestIds.includes(request.id);
        return matchesSearch && matchesStatus && matchesPriority && matchesUnreadOnly;
      }),
    [requests, search, statusFilter, priorityFilter, showUnreadOnly, readRequestIds],
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

  const selectedAttachments = selectedRequest ? attachments[selectedRequest.id] ?? [] : [];

  const uploadSupportFiles = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    setUploadingFiles(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/schoolbase-admin/api/support/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to upload support files.");
      }

      return Array.isArray(result.attachments) ? result.attachments : [];
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Upload failed",
        message: error instanceof Error ? error.message : "Unable to upload support files.",
      });
      return [];
    } finally {
      setUploadingFiles(false);
    }
  }, []);

  const handleAttachmentSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedRequest) return;

    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploaded = await uploadSupportFiles(files);
    if (uploaded.length === 0) {
      event.target.value = "";
      return;
    }

    const nextAttachments = uploaded.map((file: any) => ({
      id: file.id || `${selectedRequest.id}-${file.fileName}`,
      name: file.originalName || file.fileName,
      size: Number(file.size || 0),
      type: file.mimeType || "application/octet-stream",
      preview: /^image\//.test(file.mimeType || "") ? file.url : undefined,
    }));

    setAttachments((current) => ({
      ...current,
      [selectedRequest.id]: [...(current[selectedRequest.id] ?? []), ...nextAttachments],
    }));

    event.target.value = "";
  };

  useEffect(() => {
    if (!selectedRequest) return;

    const nextStatus = replyStatuses[selectedRequest.id] ?? (selectedRequest.status === "OPEN" ? "IN_PROGRESS" : selectedRequest.status);
    setReplyStatus(nextStatus);
  }, [selectedRequest, replyStatuses]);

  useEffect(() => {
    if (!selectedRequest) return;
    const loadNotes = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/support/requests/${selectedRequest.id}/notes`, {
          credentials: "include",
          cache: "no-store",
        });
        if (response.ok) {
          const result = await response.json();
          setNotesByRequest((current) => ({ ...current, [selectedRequest.id]: result.notes ?? [] }));
        }
      } catch (error) {
        console.error("Error loading internal notes:", error);
      }
    };
    void loadNotes();
    setNoteDraft("");
  }, [selectedRequest]);

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
          attachments: attachments[selectedRequest.id] ?? [],
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
          setAttachments((current) => ({
            ...current,
            [selectedRequest.id]: [],
          }));
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

  const saveInternalNote = async () => {
    if (!selectedRequest || !noteDraft.trim()) return;
    setNotesBusy(true);
    try {
      const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/support/requests/${selectedRequest.id}/notes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save note");
      setNotesByRequest((current) => ({
        ...current,
        [selectedRequest.id]: [...(current[selectedRequest.id] ?? []), result.note],
      }));
      setNoteDraft("");
    } catch (error) {
      setStatusModal({ open: true, type: "error", title: "Note not saved", message: error instanceof Error ? error.message : "Unable to save note" });
    } finally {
      setNotesBusy(false);
    }
  };

  const createTeamTask = async () => {
    if (!taskTitle.trim()) return;
    setTaskBusy(true);
    try {
      const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/support/tasks`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: taskTitle, description: taskDescription, assignedTo: taskAssignee || undefined, priority: taskPriority }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to create task");
      setTasks((current) => [result.task, ...current]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignee("");
      setTaskPriority("MEDIUM");
    } catch (error) {
      setStatusModal({ open: true, type: "error", title: "Task not created", message: error instanceof Error ? error.message : "Unable to create task" });
    } finally {
      setTaskBusy(false);
    }
  };

  const updateTeamTask = async (task: SupportTask, data: Record<string, string | null>) => {
    try {
      const response = await fetch(`${getBackendUrl()}/schoolbase-admin/api/support/tasks/${task.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update task");
      setTasks((current) => current.map((item) => (item.id === task.id ? result.task : item)));
    } catch (error) {
      setStatusModal({ open: true, type: "error", title: "Task not updated", message: error instanceof Error ? error.message : "Unable to update task" });
    }
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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none"
          >
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(event) => setShowUnreadOnly(event.target.checked)}
              className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
            />
            Unread only
          </label>
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

      <section className="flex flex-col gap-3 border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10"><CheckSquare className="h-4 w-4 text-brand" /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">Shared workspace</p><p className="text-sm font-semibold text-foreground">Support team tasks <span className="font-normal text-muted">· {tasks.filter((task) => task.status !== "DONE").length} open</span></p></div>
        </div>
        <button type="button" onClick={() => setShowTasksModal(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:border-brand hover:text-brand"><CheckSquare className="h-4 w-4" /> Manage tasks</button>
      </section>

      <div className="grid min-h-0 gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch">
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
                const category = inferCategory(request);
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
                      <span>{category}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-muted">{formatDate(request.createdAt)}</div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="min-h-0 overflow-hidden border border-border bg-surface p-3 sm:p-4">
          {selectedRequest ? (
            <div className="flex h-[72vh] min-h-[540px] max-h-[72vh] min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{selectedRequest.subject}</h2>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                      {inferCategory(selectedRequest)}
                    </span>
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

              <div className="grid min-h-0 min-w-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_260px]">
                <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
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
                        const messageAttachments = message.attachments ?? [];

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
                              {messageAttachments.length > 0 ? (
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                  {messageAttachments.map((attachment) => (
                                    <a key={attachment.id} href={attachmentUrl(attachment.url)} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-border bg-white/80">
                                      {attachment.mimeType.startsWith("image/") ? (
                                        <img src={attachmentUrl(attachment.url)} alt={attachment.originalName || attachment.fileName} className="h-28 w-full object-cover" />
                                      ) : (
                                        <div className="flex items-center justify-between gap-2 p-2 text-xs text-muted">
                                          <span className="truncate">{attachment.originalName || attachment.fileName}</span>
                                          <span>{formatFileSize(attachment.size)}</span>
                                        </div>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
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

                <aside className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <h3 className="text-sm font-semibold text-foreground">Customer context</h3>
                    <div className="mt-3 space-y-2 text-sm text-muted">
                      <div className="flex items-center justify-between gap-2"><span>School</span><span className="font-medium text-foreground">{selectedRequest.school?.name ?? "Unknown"}</span></div>
                      <div className="flex items-center justify-between gap-2"><span>Country</span><span className="font-medium text-foreground">{selectedRequest.school?.country ?? "—"}</span></div>
                      <div className="flex items-center justify-between gap-2"><span>Category</span><span className="font-medium text-foreground">{inferCategory(selectedRequest)}</span></div>
                      <div className="flex items-center justify-between gap-2"><span>Priority</span><span className="font-medium text-foreground">{selectedRequest.priority}</span></div>
                      <div className="flex items-center justify-between gap-2"><span>Updated</span><span className="font-medium text-foreground">{formatDate(selectedRequest.updatedAt)}</span></div>
                    </div>
                  </div>

                  <button type="button" onClick={() => setShowNotesModal(true)} className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:border-brand">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand" /><span><span className="block text-sm font-semibold text-foreground">Internal notes</span><span className="block text-xs text-muted">Shared with support agents only</span></span></span>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">{(notesByRequest[selectedRequest.id] ?? []).length}</span>
                  </button>
                </aside>
              </div>

              <button type="button" onClick={() => setShowReplyModal(true)} className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left hover:border-brand">
                <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-brand" /><span><span className="block text-sm font-semibold text-foreground">Reply to school</span><span className="block text-xs text-muted">Compose a response, update status, and attach files</span></span></span>
                <span className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">Open composer</span>
              </button>

              <div className={`${showReplyModal ? "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" : "hidden"}`} onClick={() => setShowReplyModal(false)}>
                <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-4 flex items-start justify-between border-b border-border pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">School communication</p><h2 className="mt-1 text-xl font-semibold text-foreground">Reply to {selectedRequest.school?.name || "school"}</h2></div><button type="button" onClick={() => setShowReplyModal(false)} className="rounded-lg p-2 text-muted hover:bg-background hover:text-foreground" aria-label="Close reply composer"><X className="h-5 w-5" /></button></div>
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

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-[.12em] text-muted">
                      <input type="file" multiple onChange={handleAttachmentSelection} className="hidden" />
                      Upload file
                    </label>
                    {selectedAttachments.length > 0 ? (
                      <span className="text-xs text-muted">{selectedAttachments.length} attachment{selectedAttachments.length > 1 ? "s" : ""}</span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleReply}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Sending reply..." : "Send reply"}
                  </button>
                </div>

                {selectedAttachments.length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedAttachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
                        {attachment.preview ? (
                          <img src={attachmentUrl(attachment.preview)} alt={attachment.name} className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand/10 text-xs font-semibold text-brand">FILE</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{attachment.name}</p>
                          <p className="text-[11px] text-muted">{formatFileSize(attachment.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments((current) => ({
                            ...current,
                            [selectedRequest.id]: (current[selectedRequest.id] ?? []).filter((item) => item.id !== attachment.id),
                          }))}
                          className="text-xs font-medium text-muted hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
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

      {showTasksModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setShowTasksModal(false)}>
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Team operations</p><h2 className="mt-1 text-xl font-semibold text-foreground">Shared support tasks</h2><p className="mt-1 text-sm text-muted">One operational queue for every support agent.</p></div><button type="button" onClick={() => setShowTasksModal(false)} className="rounded-lg p-2 text-muted hover:bg-background hover:text-foreground" aria-label="Close tasks"><X className="h-5 w-5" /></button></div>
            <div className="overflow-y-auto p-5"><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_auto]"><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /><input value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Description" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /><select value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"><option value="">Unassigned</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><button type="button" disabled={taskBusy || !taskTitle.trim()} onClick={() => void createTeamTask()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{taskBusy ? "Adding..." : "Add task"}</button></div><div className="mt-5 space-y-2">{tasks.length === 0 ? <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">No shared tasks yet.</div> : tasks.map((task) => <div key={task.id} className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => void updateTeamTask(task, { status: task.status === "DONE" ? "OPEN" : "DONE" })} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-white ${task.status === "DONE" ? "border-brand bg-brand" : "border-border"}`} aria-label={`Mark ${task.title} ${task.status === "DONE" ? "open" : "done"}`}>{task.status === "DONE" ? "✓" : ""}</button><div className="min-w-0"><p className={`truncate text-sm font-semibold ${task.status === "DONE" ? "text-muted line-through" : "text-foreground"}`}>{task.title}</p><p className="truncate text-xs text-muted">{task.description || "No description"}</p></div></div><div className="flex items-center gap-2"><select value={task.assignedTo ?? ""} onChange={(event) => void updateTeamTask(task, { assignedTo: event.target.value || null })} className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted outline-none"><option value="">Unassigned</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priorityClasses(task.priority)}`}>{task.priority}</span></div></div>)}</div></div>
          </div>
        </div>
      ) : null}

      {showNotesModal && selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setShowNotesModal(false)}>
          <div className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Private collaboration</p><h2 className="mt-1 text-xl font-semibold text-foreground">Internal notes</h2><p className="mt-1 text-sm text-muted">Visible to SchoolBase support agents only.</p></div><button type="button" onClick={() => setShowNotesModal(false)} className="rounded-lg p-2 text-muted hover:bg-background hover:text-foreground" aria-label="Close internal notes"><X className="h-5 w-5" /></button></div><div className="overflow-y-auto p-5"><div className="space-y-2">{(notesByRequest[selectedRequest.id] ?? []).map((note) => <div key={note.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p className="whitespace-pre-line">{note.body}</p><p className="mt-2 text-[10px] text-amber-700">{note.author?.name || "Support agent"} · {formatDate(note.createdAt)}</p></div>)}{(notesByRequest[selectedRequest.id] ?? []).length === 0 ? <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted">No internal notes yet.</p> : null}</div><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add a shared note for the support team..." className="mt-4 min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand" /><div className="mt-3 flex justify-end"><button type="button" disabled={notesBusy || !noteDraft.trim()} onClick={() => void saveInternalNote()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{notesBusy ? "Saving..." : "Save note"}</button></div></div></div>
        </div>
      ) : null}
    </div>
  );
}
