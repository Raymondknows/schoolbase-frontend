"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, Search, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorModal } from "@/components/ui/error-modal";
import { getBackendUrl } from "@/lib/backend-url";

export type SupportAttachmentRow = {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

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
    attachments?: SupportAttachmentRow[];
  }>;
  attachments?: SupportAttachmentRow[];
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

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(url?: string, mimeType?: string) {
  return Boolean((mimeType && mimeType.startsWith("image/")) || (url && /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url)));
}

function attachmentUrl(url: string) {
  const normalizedUrl = url.replace(/^http:\/\/(api\.schoolbase\.live)/i, "https://$1");
  return /^https?:\/\//i.test(normalizedUrl) ? normalizedUrl : `${getBackendUrl()}${normalizedUrl.startsWith("/") ? "" : "/"}${normalizedUrl}`;
}

const SUPPORT_FAQS = [
  {
    category: "Getting started",
    question: "How do I register a new student?",
    answer: "Open Students, select Add student, complete the learner profile, choose the class, and save. If the class is missing, create it first under Classes, then return to the student form.",
  },
  {
    category: "Getting started",
    question: "What should we set up first after creating our school?",
    answer: "Complete the setup in this order: school profile and logo, academic year, enabled phases, classes, subjects, teachers, fee schedules, and payment settings. The setup checklist highlights the remaining items.",
  },
  {
    category: "Students",
    question: "Can I import many students at once?",
    answer: "Yes. Use the student import workflow and download the provided CSV template first. Keep the column headings unchanged, validate the file, review the preview, and then confirm the import.",
  },
  {
    category: "Timetable",
    question: "How do I create and publish a timetable?",
    answer: "Open Timetable, create or select a timetable for the academic year and term, configure school periods, add lessons, resolve conflicts, and publish when the board is ready.",
  },
  {
    category: "Fees and payments",
    question: "Why is a payment or invoice not showing?",
    answer: "Confirm the student is active and assigned to the correct class, check that the fee schedule applies to the current academic year and term, and verify the payment status in Fees or Payments.",
  },
  {
    category: "Results",
    question: "What should I check before publishing results?",
    answer: "Confirm the assessment is attached to the correct class, term, subject, and academic year. Review missing scores, grading scales, and the preview before publishing results to families.",
  },
  {
    category: "Admissions",
    question: "How do I process an admission application?",
    answer: "Open Admissions, review the applicant details, update the application status, select the intended class where required, and use the applicant communication actions for next steps.",
  },
  {
    category: "Communication",
    question: "How can we notify parents or staff?",
    answer: "Use Announcements, Email Center, or the configured WhatsApp communication tools. Always review recipients and message content before sending bulk communications.",
  },
  {
    category: "Troubleshooting",
    question: "What information should I include when reporting a technical issue?",
    answer: "Include the affected module, user role, school, steps to reproduce, the expected result, the actual result, and a screenshot or short recording. This helps support investigate the issue faster.",
  },
  {
    category: "Account and access",
    question: "What should I do if a staff member cannot log in?",
    answer: "Confirm the email address and role, check whether the account belongs to the correct school, and use the password reset flow. Never share a password in a support ticket.",
  },
] as const;

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
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [pendingReplyAttachments, setPendingReplyAttachments] = useState<Record<string, SupportAttachmentRow[]>>({});
  const [pendingCreateAttachments, setPendingCreateAttachments] = useState<SupportAttachmentRow[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFaqPanel, setShowFaqPanel] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState("All topics");
  const [openFaq, setOpenFaq] = useState<string | null>(SUPPORT_FAQS[0].question);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messageListRef = useRef<HTMLDivElement | null>(null);

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

  const faqCategories = ["All topics", ...Array.from(new Set(SUPPORT_FAQS.map((faq) => faq.category)))];
  const visibleFaqs = SUPPORT_FAQS.filter((faq) => {
    const haystack = `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase();
    return (faqCategory === "All topics" || faq.category === faqCategory) && (!faqSearch.trim() || haystack.includes(faqSearch.trim().toLowerCase()));
  });

  const uploadSupportFiles = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return [];

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    setUploadingFiles(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/support/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to upload attachments.");
      }

      return Array.isArray(result.attachments) ? result.attachments : [];
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Unable to upload attachments.");
      return [];
    } finally {
      setUploadingFiles(false);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!subject.trim() || (!message.trim() && pendingCreateAttachments.length === 0)) {
      setError("Add a message or attach a file before submitting.");
      return;
    }

    setBusy(true);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/support`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority, attachments: pendingCreateAttachments }),
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
      setPendingCreateAttachments([]);
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
          <Button
            type="button"
            variant="secondary"
            className="inline-flex h-10 items-center gap-2 px-4 py-2 text-sm font-semibold"
            onClick={() => setShowFaqPanel(true)}
          >
            <LifeBuoy className="h-4 w-4" />
            Help center
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

      <div className="grid min-h-0 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
        <aside className="max-h-[30vh] overflow-y-auto border border-border bg-surface p-3 sm:p-4 lg:max-h-[76vh] lg:overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

        <section className="min-h-0 overflow-hidden border border-border bg-surface p-2 sm:p-4">
          {selectedRequest ? (
            <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:h-[72vh] lg:max-h-[72vh]">
              <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between sm:pb-4">
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
                  <p className="mt-1 text-sm text-muted">
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

              <div className="mt-0 flex h-[62svh] min-h-[460px] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background sm:h-[66svh] sm:min-h-[500px] lg:mt-3 lg:h-auto lg:min-h-0">
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

                <div ref={messageListRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2.5 py-3 sm:px-3">
                  {selectedRequest.messages?.length ? (
                    selectedRequest.messages.map((message) => {
                      const isSchoolMessage = message.senderRole === "SCHOOL";
                      const senderName = isSchoolMessage
                        ? (message.senderName && !/schoolbase support|schoolbase admin|support team|support|admin|platform admin/i.test(message.senderName)
                          ? message.senderName
                          : "Your school")
                        : (message.senderName || "SchoolBase Support");
                      const attachments = message.attachments ?? [];

                      return (
                        <div key={message.id} className={`flex ${isSchoolMessage ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-lg border px-3 py-2 ${isSchoolMessage ? "border-brand/30 bg-brand/10" : "border-border bg-background text-foreground"}`}>
                            <div className="flex items-center justify-between gap-3 text-xs text-muted">
                              <span className={`font-semibold ${isSchoolMessage ? "text-brand" : "text-foreground"}`}>{senderName}</span>
                              <span>{formatDate(message.createdAt)}</span>
                            </div>
                            <p className={`mt-1.5 text-sm whitespace-pre-line ${isSchoolMessage ? "text-brand" : "text-foreground"}`}>{message.body}</p>
                            {attachments.length > 0 ? (
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {attachments.map((attachment) => (
                                  <a key={attachment.id} href={attachmentUrl(attachment.url)} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-border bg-white/80">
                                    {isImageAttachment(attachment.url, attachment.mimeType) ? (
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
                      {selectedRequest.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Reply to support</label>
                <textarea
                  value={replyDrafts[selectedRequest.id] ?? ""}
                  onChange={(event) => setReplyDrafts((current) => ({ ...current, [selectedRequest.id]: event.target.value }))}
                  className="min-h-[120px] w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Write a reply to the support team..."
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted hover:text-foreground">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                      className="hidden"
                      onChange={async (event) => {
                        const files = event.target.files;
                        if (!files || files.length === 0) return;
                        const uploaded = await uploadSupportFiles(files);
                        if (uploaded.length > 0) {
                          setPendingReplyAttachments((current) => ({
                            ...current,
                            [selectedRequest.id]: [...(current[selectedRequest.id] ?? []), ...uploaded],
                          }));
                        }
                        event.target.value = "";
                      }}
                    />
                    Add photo or file
                  </label>
                  {uploadingFiles ? <span className="text-xs text-muted">Uploading...</span> : null}
                </div>
                {(pendingReplyAttachments[selectedRequest.id] ?? []).length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(pendingReplyAttachments[selectedRequest.id] ?? []).map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
                        {isImageAttachment(attachment.url, attachment.mimeType) ? (
                          <img src={attachmentUrl(attachment.url)} alt={attachment.originalName || attachment.fileName} className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand/10 text-[10px] font-semibold text-brand">FILE</div>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-xs font-medium text-foreground">{attachment.originalName || attachment.fileName}</p>
                          <p className="text-[10px] text-muted">{formatFileSize(attachment.size)}</p>
                        </div>
                        <button
                          type="button"
                          className="text-[10px] text-muted hover:text-foreground"
                          onClick={() => setPendingReplyAttachments((current) => ({
                            ...current,
                            [selectedRequest.id]: (current[selectedRequest.id] ?? []).filter((item) => item.id !== attachment.id),
                          }))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {replyError ? <div className="mt-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{replyError}</div> : null}
                <ErrorModal
                  isOpen={Boolean(replySuccess)}
                  onClose={() => setReplySuccess(null)}
                  type="success"
                  title="Reply sent"
                  message={replySuccess ?? "Reply sent successfully."}
                  confirmLabel="OK"
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    disabled={replyBusy}
                    onClick={async () => {
                      setReplyError(null);
                      setReplySuccess(null);
                      const currentDraft = replyDrafts[selectedRequest.id] ?? "";
                      if (!currentDraft.trim() && (pendingReplyAttachments[selectedRequest.id] ?? []).length === 0) {
                        setReplyError("Write a reply or attach a file before sending.");
                        return;
                      }
                      setReplyBusy(true);
                      try {
                        const backendUrl = getBackendUrl();
                        const res = await fetch(`${backendUrl}/api/admin/support/reply`, {
                          method: "PATCH",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            requestId: selectedRequest.id,
                            response: currentDraft,
                            attachments: pendingReplyAttachments[selectedRequest.id] ?? [],
                          }),
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
                        setPendingReplyAttachments((current) => ({
                          ...current,
                          [selectedRequest.id]: [],
                        }));
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
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted hover:text-foreground">
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                      multiple
                      className="hidden"
                      onChange={async (event) => {
                        const files = event.target.files;
                        if (!files || files.length === 0) return;
                        const uploaded = await uploadSupportFiles(files);
                        if (uploaded.length > 0) {
                          setPendingCreateAttachments((current) => [...current, ...uploaded]);
                        }
                        event.target.value = "";
                      }}
                    />
                    Upload image or file
                  </label>
                  {uploadingFiles ? <span className="text-xs text-muted">Uploading...</span> : null}
                </div>
                {pendingCreateAttachments.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pendingCreateAttachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
                        {isImageAttachment(attachment.url, attachment.mimeType) ? (
                          <img src={attachmentUrl(attachment.url)} alt={attachment.originalName || attachment.fileName} className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand/10 text-[10px] font-semibold text-brand">FILE</div>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-xs font-medium text-foreground">{attachment.originalName || attachment.fileName}</p>
                          <p className="text-[10px] text-muted">{formatFileSize(attachment.size)}</p>
                        </div>
                        <button
                          type="button"
                          className="text-[10px] text-muted hover:text-foreground"
                          onClick={() => setPendingCreateAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
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

      {showFaqPanel ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35" onClick={() => setShowFaqPanel(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10"><LifeBuoy className="h-5 w-5 text-brand" /></div><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Self-service support</p><h2 className="mt-1 text-xl font-semibold text-foreground">SchoolBase help center</h2><p className="mt-1 text-sm text-muted">Quick answers for common school workflows.</p></div></div>
              <button type="button" onClick={() => setShowFaqPanel(false)} className="rounded-lg p-2 text-muted hover:bg-background hover:text-foreground" aria-label="Close help center">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" /><input value={faqSearch} onChange={(event) => setFaqSearch(event.target.value)} placeholder="Search help articles" className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-brand" /></div><select value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"><option>All topics</option>{faqCategories.slice(1).map((category) => <option key={category}>{category}</option>)}</select></div>
              <div className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">{visibleFaqs.length > 0 ? visibleFaqs.map((faq) => { const isOpen = openFaq === faq.question; return <div key={faq.question} className="bg-background"><button type="button" onClick={() => setOpenFaq(isOpen ? null : faq.question)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-surface"><span><span className="block text-[10px] font-bold uppercase tracking-[.12em] text-brand">{faq.category}</span><span className="mt-1 block text-sm font-semibold text-foreground">{faq.question}</span></span><ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>{isOpen ? <div className="px-4 pb-4 text-sm leading-6 text-muted">{faq.answer}</div> : null}</div>; }) : <div className="p-6 text-center text-sm text-muted">No help articles match your search.</div>}</div>
              <div className="mt-5 border-t border-border pt-4"><p className="text-sm text-muted">Still need help? Include the affected area and a screenshot when creating a request.</p><Button type="button" onClick={() => { setShowFaqPanel(false); setShowCreateModal(true); }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"><HelpCircle className="h-4 w-4" /> Ask support</Button></div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
