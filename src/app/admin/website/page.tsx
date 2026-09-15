"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { playCloseTone, playOpenTone } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { ErrorModal } from "@/components/ui/error-modal";
import { CalendarDays, CheckCircle2, Clock3, FileText, GraduationCap, LayoutGrid, List, Megaphone, PlusCircle, Search, Trash2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { UserGuide, type PageHelpGuide } from "@/components/ui/user-guide";
import SubscriptionModal from "@/components/subscription-modal";
import AdminSkeleton from "@/components/ui/skeleton";

interface Announcement {
  id: string;
  title: string;
  body: string;
  published: boolean;
  publishedAt?: string;
  createdAt?: string;
  academicYear?: {
    id: string;
    name: string;
    isCurrent?: boolean;
  } | null;
  term?: {
    id: string;
    name: string;
    academicYear?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

const FILTER_STATUS = [
  { value: "ALL", label: "All announcements" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

const HELP_GUIDE: PageHelpGuide = {
  title: "Managing Website & Announcements",
  overview: "Publish announcements to your school website that parents and guardians can see. Keep your school community informed about important news and updates.",
  steps: [
    "Click 'Post news' to create a new announcement.",
    "Write your announcement title and message.",
    "Save as Draft to edit later, or Publish immediately.",
    "Published announcements appear on your school's public website.",
    "Delete announcements you no longer want to display.",
  ],
  commonTasks: [
    {
      title: "Create an Announcement",
      description: "Post news that will be visible on your school website.",
      tips: [
        "Click 'Post news' button at the top right",
        "Enter an engaging title (e.g., 'School Closed Tomorrow')",
        "Write your message in the body field",
        "Click 'Publish' to make it live immediately",
        "Or save as 'Draft' to edit and publish later",
      ],
    },
    {
      title: "View Published Announcements",
      description: "See which announcements are live on your website.",
      tips: [
        "Only 'Published' announcements appear on your public website",
        "Drafts are saved but remain hidden from parents",
        "Publication date shows when each announcement was published",
      ],
    },
    {
      title: "Delete an Announcement",
      description: "Remove announcements from your website.",
      tips: [
        "Click the trash icon on the right side of any announcement",
        "Both published and draft announcements can be deleted",
        "Deletion is permanent",
      ],
    },
  ],
  faqs: [
    {
      question: "Where do announcements appear?",
      answer: "Published announcements appear on your school's public website that parents can visit. They're organized by date with the newest first.",
    },
    {
      question: "Can I edit an announcement after publishing?",
      answer: "Currently, you need to delete and recreate an announcement to make changes. We're working on an edit feature for future releases.",
    },
    {
      question: "How many announcements can I post?",
      answer: "You can post unlimited announcements. We recommend keeping the 5-10 most recent visible for clarity.",
    },
  ],
};

export default function WebsitePage() {
  const searchParams = useSearchParams();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [deletingAnnouncementTitle, setDeletingAnnouncementTitle] = useState<string>("");
  const [deleteAnimateState, setDeleteAnimateState] = useState<"enter" | "exit">("enter");
  const [isDeletingAnnouncement, setIsDeletingAnnouncement] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error'>('success');
  const [statusModalTitle, setStatusModalTitle] = useState<string | undefined>(undefined);
  const [statusModalMessage, setStatusModalMessage] = useState("");
  const [subscriptionError, setSubscriptionError] = useState<{
    reason?: string;
    schoolName?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSessionId, setSelectedSessionId] = useState("ALL");
  const [selectedTermId, setSelectedTermId] = useState("ALL");
  const [sortMode, setSortMode] = useState("date-desc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [whatsAppConnected, setWhatsAppConnected] = useState<boolean | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  interface AnnouncementTermGroup {
    termId: string;
    termName: string;
    announcements: Announcement[];
  }

  interface AnnouncementSessionGroup {
    sessionId: string;
    sessionName: string;
    terms: AnnouncementTermGroup[];
  }

  const availableSessions = useMemo(
    () => {
      const sessionsMap = new Map<string, { id: string; name: string }>();
      for (const announcement of announcements) {
        const sessionId = announcement.term?.academicYear?.id || announcement.academicYear?.id || "unassigned";
        const sessionName = announcement.term?.academicYear?.name || announcement.academicYear?.name || "No session assigned";
        sessionsMap.set(sessionId, { id: sessionId, name: sessionName });
      }
      return Array.from(sessionsMap.values());
    },
    [announcements]
  );

  const availableTerms = useMemo(
    () => {
      const termsMap = new Map<string, { id: string; name: string }>();
      for (const announcement of announcements) {
        const sessionId = announcement.term?.academicYear?.id || announcement.academicYear?.id || "unassigned";
        if (selectedSessionId !== "ALL" && sessionId !== selectedSessionId) continue;
        const termId = announcement.term?.id || "all-terms";
        const termName = announcement.term?.name || "All terms";
        termsMap.set(termId, { id: termId, name: termName });
      }
      return Array.from(termsMap.values());
    },
    [announcements, selectedSessionId]
  );

  const filteredAnnouncements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return announcements
      .filter((announcement) => {
        if (selectedStatus !== "ALL") {
          if (selectedStatus === "PUBLISHED" && !announcement.published) return false;
          if (selectedStatus === "DRAFT" && announcement.published) return false;
        }

        const sessionId = announcement.term?.academicYear?.id || announcement.academicYear?.id || "unassigned";
        if (selectedSessionId !== "ALL" && sessionId !== selectedSessionId) return false;

        const termId = announcement.term?.id || "all-terms";
        if (selectedTermId !== "ALL" && termId !== selectedTermId) return false;

        if (!query) return true;
        const title = announcement.title?.toLowerCase() || "";
        const body = announcement.body?.toLowerCase() || "";
        return title.includes(query) || body.includes(query);
      })
      .sort((a, b) => {
        if (sortMode === "date-asc") {
          return new Date(a.publishedAt || a.createdAt || 0).getTime() - new Date(b.publishedAt || b.createdAt || 0).getTime();
        }
        if (sortMode === "date-desc") {
          return new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime();
        }
        if (sortMode === "title-asc") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortMode === "title-desc") {
          return (b.title || "").localeCompare(a.title || "");
        }
        return 0;
      });
  }, [announcements, selectedStatus, selectedSessionId, selectedTermId, searchQuery, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredAnnouncements.length / itemsPerPage));
  const paginatedAnnouncements = useMemo(
    () => filteredAnnouncements.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredAnnouncements, currentPage, itemsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedSessionId, selectedTermId, sortMode, itemsPerPage]);

  const groupedAnnouncements = useMemo<AnnouncementSessionGroup[]>(() => {
    const sessions = new Map<
      string,
      {
        sessionId: string;
        sessionName: string;
        terms: Map<
          string,
          {
            termId: string;
            termName: string;
            announcements: Announcement[];
          }
        >;
      }
    >();

    for (const announcement of paginatedAnnouncements) {
      const sessionId = announcement.term?.academicYear?.id || announcement.academicYear?.id || "unassigned";
      const sessionName =
        announcement.term?.academicYear?.name || announcement.academicYear?.name || "No session assigned";
      const termId = announcement.term?.id || "all-terms";
      const termName = announcement.term?.name || "All terms";

      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          sessionId,
          sessionName,
          terms: new Map(),
        });
      }

      const session = sessions.get(sessionId)!;
      if (!session.terms.has(termId)) {
        session.terms.set(termId, {
          termId,
          termName,
          announcements: [],
        });
      }

      session.terms.get(termId)!.announcements.push(announcement);
    }

    return Array.from(sessions.values()).map((session) => ({
      ...session,
      terms: Array.from(session.terms.values()),
    }));
  }, [paginatedAnnouncements]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedSessionId("ALL");
    setSelectedTermId("ALL");
    setSortMode("date-desc");
    setCurrentPage(1);
  };

  const selectedCount = filteredAnnouncements.length;
  const firstVisible = selectedCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastVisible = Math.min(currentPage * itemsPerPage, selectedCount);
  const totalCount = announcements.length;
  const publishedCount = announcements.filter((announcement) => announcement.published).length;
  const draftCount = totalCount - publishedCount;

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/admin/website/data`, {
          credentials: "include",
        });

        if (response.status === 403) {
          const data = await response.json();
          if (data?.code === 'SUBSCRIPTION_INACTIVE') {
            setSubscriptionError({
              reason: data.reason || 'Your school subscription is not active.',
              schoolName: data.school?.name,
            });
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load announcements");
        }

        const data = await response.json();
        setAnnouncements(data.announcements || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (searchParams.get("created") !== "1") return;

    const announcementId = searchParams.get("announcementId");
    const whatsappSent = Number(searchParams.get("whatsappSent") || 0);
    const whatsappFailed = Number(searchParams.get("whatsappFailed") || 0);
    const emailSent = Number(searchParams.get("emailSent") || 0);
    const emailFailed = Number(searchParams.get("emailFailed") || 0);
    const queued = searchParams.get("queued") === "1";

    setStatusModalType(whatsappFailed > 0 ? "error" : "success");
    setStatusModalTitle(whatsappFailed > 0 ? "Announcement queued, WhatsApp needs attention" : "Announcement published");
    setStatusModalMessage(
      queued
        ? "The announcement was saved successfully. Email and WhatsApp delivery is continuing in the background. Check Notifications for the final delivery status."
        : `Email: ${emailSent} sent${emailFailed ? `, ${emailFailed} failed` : ""}. WhatsApp: ${whatsappSent} sent${whatsappFailed ? `, ${whatsappFailed} failed` : ""}.`
    );
    setStatusModalOpen(true);
    window.history.replaceState({}, "", "/admin/website");

    if (!announcementId || !queued) return;

    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/api/admin/announcements/${announcementId}/delivery-status`, { credentials: "include" });
        if (!response.ok || cancelled) return;
        const result = await response.json();
        if (result.complete || attempts >= 15) {
          setStatusModalType(result.whatsappFailed > 0 ? "error" : "success");
          setStatusModalTitle(result.whatsappFailed > 0 ? "WhatsApp delivery needs attention" : "Announcement delivery complete");
          setStatusModalMessage(`Email: ${result.emailSent} sent${result.emailFailed ? `, ${result.emailFailed} failed` : ""}. WhatsApp: ${result.whatsappSent} sent${result.whatsappFailed ? `, ${result.whatsappFailed} failed` : ""}.`);
          return;
        }
        attempts += 1;
        window.setTimeout(poll, 2000);
      } catch {
        if (!cancelled && attempts < 15) {
          attempts += 1;
          window.setTimeout(poll, 2000);
        }
      }
    };
    void poll();
    return () => { cancelled = true; };
  }, [searchParams]);

  useEffect(() => {
    async function fetchWhatsAppStatus() {
      try {
        const response = await fetch("/api/admin/whatsapp/status", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          setWhatsAppConnected(false);
          return;
        }
        const data = await response.json();
        setWhatsAppConnected(data?.session?.status === "connected");
      } catch {
        setWhatsAppConnected(false);
      }
    }

    void fetchWhatsAppStatus();
  }, []);

  const openDeleteModal = (announcement: Announcement) => {
    setDeletingAnnouncementId(announcement.id);
    setDeletingAnnouncementTitle(announcement.title || "this announcement");
    setDeleteAnimateState("enter");
    setDeleteModalOpen(true);
    playOpenTone();
  };

  const closeDeleteModal = () => {
    setDeleteAnimateState("exit");
    playCloseTone();
    setTimeout(() => {
      setDeleteModalOpen(false);
      setDeletingAnnouncementId(null);
      setDeletingAnnouncementTitle("");
    }, 320);
  };

  const handleDeleteAnnouncement = async () => {
    if (!deletingAnnouncementId) return;

    setIsDeletingAnnouncement(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/announcements/${deletingAnnouncementId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseData?.error || "Failed to delete announcement");
      }

      setAnnouncements((current) => current.filter((a) => a.id !== deletingAnnouncementId));
      setStatusModalType('success');
      setStatusModalTitle('Announcement deleted');
      setStatusModalMessage(`"${deletingAnnouncementTitle}" has been permanently deleted.`);
      setStatusModalOpen(true);
      closeDeleteModal();
    } catch (err) {
      setStatusModalType('error');
      setStatusModalTitle('Delete failed');
      setStatusModalMessage(err instanceof Error ? err.message : 'Failed to delete announcement');
      setStatusModalOpen(true);
    } finally {
      setIsDeletingAnnouncement(false);
    }
  };

  const openAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    playOpenTone();
  };

  const closeAnnouncement = () => {
    setSelectedAnnouncement(null);
    playCloseTone();
  };

  return (
    <>
      <main className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
        {/* Header */}
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.16em] text-brand">School communications</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Announcements</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage public school updates and keep parents, teachers, and students informed.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            {whatsAppConnected !== null && (
              <div
                className="inline-flex items-center gap-2.5 self-start rounded-full border border-border bg-surface px-2.5 py-1.5 shadow-sm sm:self-auto"
                title={whatsAppConnected ? "WhatsApp connected — Ready to send school messages" : "WhatsApp disconnected — Reconnect via settings"}
              >
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${whatsAppConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground">
                    {whatsAppConnected ? "Connected" : "Disconnected"}
                  </span>
                  <span className="hidden text-[10px] text-muted sm:inline">
                    {whatsAppConnected ? "Ready" : "Reconnect"}
                  </span>
                </div>
                <span className={`h-2 w-2 rounded-full ${whatsAppConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
              </div>
            )}
            <Link href="/admin/website/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Post news</span>
                <span className="inline sm:hidden">New</span>
              </Button>
            </Link>
            <div className="flex rounded-lg border border-border bg-surface p-1 text-sm">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold ${viewMode === "list" ? "bg-brand text-white" : "text-muted hover:bg-background"}`}
              >
                <List className="h-4 w-4" /> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold ${viewMode === "grid" ? "bg-brand text-white" : "text-muted hover:bg-background"}`}
              >
                <LayoutGrid className="h-4 w-4" /> Grid
              </button>
            </div>
          </div>
        </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total updates", value: totalCount, detail: "Across all sessions", icon: FileText },
            { label: "Published", value: publishedCount, detail: "Visible to your community", icon: CheckCircle2 },
            { label: "Drafts", value: draftCount, detail: "Ready for review", icon: Clock3 },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center bg-brand/10 text-brand">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-semibold tracking-tight text-foreground">{stat.value}</span>
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{stat.label}</p>
                <p className="mt-1 text-xs text-muted">{stat.detail}</p>
              </article>
            );
          })}
        </section>

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="min-h-screen bg-background">
            <AdminSkeleton />
          </div>
        )}

        {!loading && (
          <>
            <section className="border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="min-w-0">
                <p className="text-sm text-muted">
                  Showing {firstVisible}–{lastVisible} of {selectedCount} filtered announcement{selectedCount !== 1 ? "s" : ""} ({totalCount} total)
                </p>
                {searchQuery ? (
                  <p className="mt-1 text-sm text-muted">Search results for "{searchQuery}"</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block min-w-[240px]">
                  <span className="sr-only">Search announcements</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search announcements"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <span className="hidden sm:inline">Status</span>
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    {FILTER_STATUS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <span className="hidden sm:inline">Session</span>
                  <select
                    value={selectedSessionId}
                    onChange={(event) => {
                      setSelectedSessionId(event.target.value);
                      setSelectedTermId("ALL");
                    }}
                    className="rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="ALL">All sessions</option>
                    {availableSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <span className="hidden sm:inline">Term</span>
                  <select
                    value={selectedTermId}
                    onChange={(event) => setSelectedTermId(event.target.value)}
                    className="rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="ALL">All terms</option>
                    {availableTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <span className="hidden sm:inline">Sort</span>
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value)}
                    className="rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {(searchQuery || selectedStatus !== "ALL" || selectedSessionId !== "ALL" || selectedTermId !== "ALL" || sortMode !== "date-desc") && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background"
                  >
                    Reset
                  </button>
                )}
                <label className="flex items-center gap-2 text-sm text-muted">
                  <span className="hidden sm:inline">Rows</span>
                  <select
                    value={itemsPerPage}
                    onChange={(event) => setItemsPerPage(Number(event.target.value))}
                    className="rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm text-foreground focus:border-brand focus:outline-none"
                  >
                    {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {totalCount === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <p className="text-muted">No announcements yet.</p>
                <Link href="/admin/website/new" className="mt-3 inline-block text-sm text-brand hover:underline">
                  Create your first announcement
                </Link>
              </div>
            ) : selectedCount === 0 ? (
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <p className="text-muted">No announcements match the selected filters.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedAnnouncements.map((session) => (
                  <section key={session.sessionId} className="space-y-4">
                    <div className="space-y-4">
                      {session.terms.map((term) => (
                        <div key={term.termId} className="space-y-3">
                          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "divide-y divide-border overflow-hidden border border-border bg-surface"}>
                            {term.announcements.map((announcement) => (
                              <div
                                key={announcement.id}
                                onClick={() => openAnnouncement(announcement)}
                                className={viewMode === "grid" ? "flex min-h-[220px] cursor-pointer flex-col rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm" : "flex cursor-pointer items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-background"}
                              >
                                <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                                  {viewMode === "list" ? (
                                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 text-sm sm:grid-cols-[minmax(180px,1.5fr)_110px_130px_minmax(120px,1fr)_minmax(100px,1fr)] sm:items-center sm:gap-4">
                                      <span className="flex min-w-0 items-center gap-2 truncate font-semibold text-foreground">
                                        <Megaphone className="h-4 w-4 shrink-0 text-brand" />
                                        <span className="truncate">{announcement.title}</span>
                                      </span>
                                      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${announcement.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                                        {announcement.published ? "Published" : "Draft"}
                                      </span>
                                      <span className="flex items-center gap-1.5 text-muted">
                                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                        {new Date(announcement.publishedAt || announcement.createdAt || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                      </span>
                                      <span className="flex min-w-0 items-center gap-1.5 truncate text-muted">
                                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{session.sessionName}</span>
                                      </span>
                                      <span className="flex min-w-0 items-center gap-1.5 truncate text-muted">
                                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{term.termName}</span>
                                      </span>
                                    </div>
                                  ) : (
                                    <div className={viewMode === "grid" ? "flex min-w-0 flex-1 flex-col" : "min-w-0 flex-1"}>
                                      <div className="mb-3 flex flex-wrap gap-2">
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{session.sessionName}</span>
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{term.termName}</span>
                                      </div>
                                      <h2 className="truncate text-lg font-semibold text-foreground">{announcement.title}</h2>
                                      <p className="mt-1 line-clamp-3 text-sm text-muted">{announcement.body}</p>
                                      <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${announcement.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                          {announcement.published ? "Published" : "Draft"}
                                        </span>
                                        <span className="text-xs text-muted">{new Date(announcement.publishedAt || announcement.createdAt || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDeleteModal(announcement);
                                    }}
                                    disabled={isDeletingAnnouncement && deletingAnnouncementId === announcement.id}
                                    className="flex-shrink-0 rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                    title="Delete announcement"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
            </section>
            {selectedCount > 0 && totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Help & Guide */}
      <UserGuide guide={HELP_GUIDE} />

      <ErrorModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={statusModalTitle}
        message={statusModalMessage}
        type={statusModalType}
        confirmLabel={statusModalType === 'success' ? 'Okay' : 'Review'}
      />

      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-detail-title"
          onClick={closeAnnouncement}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border bg-brand/10 px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-brand">Announcement details</p>
                <h2 id="announcement-detail-title" className="mt-2 text-xl font-bold text-foreground">
                  {selectedAnnouncement.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeAnnouncement}
                aria-label="Close announcement details"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                ×
              </button>
            </div>
            <div className="space-y-5 px-6 py-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className={`rounded-full px-2.5 py-1 font-semibold ${selectedAnnouncement.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                  {selectedAnnouncement.published ? "Published" : "Draft"}
                </span>
                <span>{selectedAnnouncement.term?.academicYear?.name || selectedAnnouncement.academicYear?.name || "No session"}</span>
                <span>•</span>
                <span>{selectedAnnouncement.term?.name || "No term"}</span>
                <span>•</span>
                <span>{new Date(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                {selectedAnnouncement.body}
              </div>
            </div>
            <div className="flex justify-end border-t border-border bg-background px-6 py-4">
              <button
                type="button"
                onClick={closeAnnouncement}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes sb_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes sb_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-md overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(220,38,38,0.16)]"
            style={{
              animation: `${deleteAnimateState === "enter" ? "sb_modal_enter" : "sb_modal_exit"} 320ms cubic-bezier(.2,.9,.2,1)`,
            }}
          >
            <div className="border-b border-border/70 bg-error/10 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-error/20 bg-error/10">
                  <Trash2 className="h-6 w-6" style={{ color: "#DC2626" }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Delete announcement?</h2>
                  <p className="mt-1 text-sm text-slate-600">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-slate-700">
                You are about to permanently delete <strong>"{deletingAnnouncementTitle}"</strong>.
              </p>
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-700">
                  <strong>Warning:</strong> The announcement will be completely removed from the system.
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  closeDeleteModal();
                }}
                disabled={isDeletingAnnouncement}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 disabled:opacity-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAnnouncement}
                disabled={isDeletingAnnouncement}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#DC2626" }}
              >
                {isDeletingAnnouncement ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {subscriptionError && (
        <SubscriptionModal reason={subscriptionError.reason} schoolName={subscriptionError.schoolName} />
      )}
    </>
  );
}
