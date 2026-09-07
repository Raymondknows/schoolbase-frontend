"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { resultStatusLabel, type ResultStatus } from "@/lib/format";

const PHASE_CONFIG = {
  EARLY_YEARS: { label: "Early Years", color: "bg-purple-100 text-purple-800" },
  PRIMARY: { label: "Primary", color: "bg-blue-100 text-blue-800" },
  SECONDARY: { label: "Secondary", color: "bg-green-100 text-green-800" },
  ALL: { label: "All Phases", color: "bg-gray-100 text-gray-800" },
};

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", icon: Clock, color: "text-gray-600", bg: "bg-gray-50" },
  APPROVED: { label: "Ready to Publish", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
  PUBLISHED: { label: "Published", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  ALL: { label: "All Statuses", icon: FileText, color: "text-gray-600", bg: "bg-gray-50" },
};

const PHASE_ORDER = ["ALL", "EARLY_YEARS", "PRIMARY", "SECONDARY"];
const STATUS_ORDER = ["ALL", "PUBLISHED", "APPROVED", "DRAFT"];
const ITEMS_PER_PAGE = 15;

type SessionOption = { name?: string; isCurrent?: boolean };

const getSessionValue = (assessment: Assessment) =>
  assessment.sessionName || assessment.term?.academicYear?.name || "No session";

const getDefaultSessionOption = (assessments: Assessment[], sessions: SessionOption[] = []) => {
  const currentSession = sessions.find((session) => session.isCurrent);
  if (currentSession?.name) {
    return currentSession.name;
  }

  const currentSessionAssessment = assessments.find(
    (assessment) => assessment.term?.academicYear?.isCurrent === true
  );

  return currentSessionAssessment ? getSessionValue(currentSessionAssessment) : "ALL";
};

const getDefaultTermOption = (assessments: Assessment[], selectedSession: string) => {
  const matchingAssessments = assessments.filter((assessment) => {
    if (selectedSession === "ALL") return true;
    return getSessionValue(assessment) === selectedSession;
  });

  const currentTermAssessment = matchingAssessments.find(
    (assessment) => assessment.term?.academicYear?.isCurrent === true && assessment.term?.id
  );

  if (currentTermAssessment?.term?.id) {
    return String(currentTermAssessment.term.id);
  }

  const firstTermAssessment = matchingAssessments.find((assessment) => assessment.term?.id);
  return firstTermAssessment ? String(firstTermAssessment.term.id) : "ALL";
};

interface Assessment {
  id: string;
  name: string;
  sessionName?: string;
  phase: string;
  status: ResultStatus;
  isLocked?: boolean;
  canEdit?: boolean;
  term: { id?: string; name: string; academicYear?: { name?: string; isCurrent?: boolean } };
  _count?: { results: number };
  studentCount?: number;
  entryCount?: number;
  subjectCount?: number;
  results?: Array<{
    pupilId: string;
    totalScore: number | null;
    grade: string | null;
  }>;
  createdAt?: string;
  subject?: {
    name: string;
  };
}

export default function TeacherResultsEnhancedClient({
  assessments,
  sessions = [],
  initialSubject,
}: {
  assessments: Assessment[];
  sessions?: SessionOption[];
  initialSubject?: string | null;
}) {
  const [activePhase, setActivePhase] = useState("ALL");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState(initialSubject ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(() => getDefaultSessionOption(assessments, sessions));
  const [selectedTerm, setSelectedTerm] = useState(() => getDefaultTermOption(assessments, getDefaultSessionOption(assessments, sessions)));

  const sessionOptions = useMemo(() => {
    const uniqueSessions = Array.from(
      new Set(
        (sessions.length > 0
          ? sessions.map((session) => session.name).filter(Boolean)
          : assessments.map(getSessionValue)
        ).filter(Boolean)
      )
    );

    return [{ value: "ALL", label: "All Sessions" }, ...uniqueSessions.map((value) => ({ value, label: value }))];
  }, [assessments, sessions]);

  const uniqueTerms = useMemo(() => {
    const matchingAssessments = assessments.filter((assessment) => {
      if (selectedSession === "ALL") return true;
      return getSessionValue(assessment) === selectedSession;
    });

    const terms = new Map<string, { value: string; label: string }>();
    matchingAssessments.forEach((assessment) => {
      if (assessment.term?.id && assessment.term?.name) {
        terms.set(String(assessment.term.id), {
          value: String(assessment.term.id),
          label: assessment.term.name,
        });
      }
    });

    return [{ value: "ALL", label: "All Terms" }, ...Array.from(terms.values())];
  }, [assessments, selectedSession]);

  // Calculate stats for quick stat cards
  const stats = useMemo(() => {
    const pending = assessments.filter((a) => a.status === "DRAFT").length;
    const readyToPublish = assessments.filter((a) => a.status === "APPROVED").length;
    const published = assessments.filter((a) => a.status === "PUBLISHED").length;
    const incomplete = assessments.filter((a) => {
      const entered = a.entryCount ?? a._count?.results ?? 0;
      const total = a.studentCount ?? 0;
      return a.status !== "PUBLISHED" && total > 0 && entered < total;
    }).length;

    return { pending, readyToPublish, published, incomplete };
  }, [assessments]);

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    let filtered = assessments;

    if (activePhase !== "ALL") {
      filtered = filtered.filter((a) => a.phase === activePhase);
    }

    if (activeStatus !== "ALL") {
      filtered = filtered.filter((a) => a.status === activeStatus);
    }

    if (selectedSession !== "ALL") {
      filtered = filtered.filter((a) => getSessionValue(a) === selectedSession);
    }

    if (selectedTerm !== "ALL") {
      filtered = filtered.filter((a) => String(a.term?.id) === selectedTerm);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        const name = (a.name || "").toLowerCase();
        const termName = (a.term?.name || "").toLowerCase();
        const subjectName = (a.subject?.name || "").toLowerCase();
        return (
          name.includes(query) ||
          termName.includes(query) ||
          subjectName.includes(query)
        );
      });
    }

    return filtered;
  }, [assessments, activePhase, activeStatus, selectedSession, selectedTerm, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE);
  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Calculate assessment progress
  const calculateProgress = (assessment: Assessment) => {
    const totalStudents = assessment.studentCount ?? 0;
    const entered = assessment.entryCount ?? assessment._count?.results ?? 0;

    if (totalStudents === 0) return 0;

    const percentage = Math.round((entered / totalStudents) * 100);
    return Math.min(100, percentage);
  };

  const getPhaseStats = (phase: string) => {
    if (phase === "ALL") return assessments.length;
    return assessments.filter((a) => a.phase === phase).length;
  };

  const getStatusStats = (status: string) => {
    if (status === "ALL") return assessments.length;
    return assessments.filter((a) => a.status === status).length;
  };

  return (
    <main className="min-h-screen pb-12">
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <FileText className="h-[17px] w-[17px]" /> Teacher workspace
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Assessment Results</h1>
          <p className="mt-1 text-muted">Review, enter, and follow up on student assessment results.</p>
        </div>
      </div>

      {filteredAssessments.length === 0 && (searchQuery || initialSubject) && (
        <div className="border border-[#f0d58a] bg-[#fff9e8] px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">No assessments found for &quot;{searchQuery || initialSubject}&quot;</p>
          <p className="text-sm text-amber-900 mt-1">If you expected to see an assessment for this subject, it may not have been created yet. Contact your administrator or check the assessments list.</p>
          <div className="mt-3">
            <Link href="/teacher/results" className="inline-flex items-center gap-2 rounded-lg bg-white border border-border px-3 py-2 text-sm font-medium text-brand hover:bg-brand/5">View all assessments</Link>
          </div>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted">Pending Entry</p>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.pending}</p>
          <p className="text-xs text-blue-700 mt-1">Awaiting score entry</p>
        </div>

        <div className="border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted">Incomplete</p>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-900">{stats.incomplete}</p>
          <p className="text-xs text-orange-700 mt-1">Partial entries</p>
        </div>

        <div className="border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted">Ready to Publish</p>
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-900">{stats.readyToPublish}</p>
          <p className="text-xs text-amber-700 mt-1">Approved by admin</p>
        </div>

        <div className="border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted">Published</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.published}</p>
          <p className="text-xs text-green-700 mt-1">Live for parents</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by assessment name, term, or subject..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand transition"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Phase Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted min-w-fit">Phase:</span>
          <div className="flex flex-wrap gap-2">
            {PHASE_ORDER.map((phase) => {
              const count = getPhaseStats(phase);
              const config = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG];
              const isActive = activePhase === phase;

              return (
                <button
                  key={phase}
                  onClick={() => {
                    setActivePhase(phase);
                    handleFilterChange();
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "border-brand bg-brand text-white"
                      : "bg-background text-muted hover:bg-surface border border-border"
                  }`}
                >
                  {config.label}
                  <span className="ml-1 inline-block">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session, Term & Status Dropdowns */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted">Session:</label>
            <select
              value={selectedSession}
              onChange={(e) => {
                setSelectedSession(e.target.value);
                setSelectedTerm("ALL");
                handleFilterChange();
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-brand transition"
            >
              {sessionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted">Term:</label>
            <select
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                handleFilterChange();
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-brand transition"
            >
              {uniqueTerms.map((term) => (
                <option key={term.value} value={term.value}>
                  {term.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted">Status:</label>
            <select
              value={activeStatus}
              onChange={(e) => {
                setActiveStatus(e.target.value);
                handleFilterChange();
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background focus:outline-none focus:ring-2 focus:ring-brand transition"
            >
              {STATUS_ORDER.map((status) => {
                const count = getStatusStats(status);
                const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                return (
                  <option key={status} value={status}>
                    {config.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted">
        Showing {paginatedAssessments.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
        {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssessments.length)} of{" "}
        {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? "s" : ""}
        {searchQuery && <span className="ml-1">matching &quot;{searchQuery}&quot;</span>}
      </div>

      {/* Assessment Cards - Professional Grid */}
      {paginatedAssessments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paginatedAssessments.map((assessment) => {
            const progress = calculateProgress(assessment);
            const isPublished = assessment.status === "PUBLISHED";
            const isDraft = assessment.status === "DRAFT";
            const isLocked = Boolean(assessment.isLocked);
            const phaseConfig = PHASE_CONFIG[assessment.phase as keyof typeof PHASE_CONFIG];
            const statusConfig = STATUS_CONFIG[assessment.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig.icon;

            return (
              <Link key={assessment.id} href={`/teacher/results/${assessment.id}`}>
                <div className="border border-border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-light">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {assessment.name}
                      </h3>
                      <p className="text-sm text-muted mt-1">
                        {assessment.term?.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 ml-2">
                      {isLocked && (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Locked
                        </Badge>
                      )}
                      <Badge
                        variant={
                          isPublished ? "success" : assessment.status === "APPROVED" ? "brand" : "default"
                        }
                        className="flex items-center gap-1"
                      >
                        <StatusIcon className="w-3 h-3" />
                        {resultStatusLabel(assessment.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Phase Badge */}
                  <div className="mb-4">
                    <span className={`inline-block border border-border px-2 py-1 text-xs font-medium ${phaseConfig.color}`}>
                      {phaseConfig.label}
                    </span>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted">Score Entry Progress</p>
                      <p className="text-xs font-bold text-brand">{progress}%</p>
                    </div>
                    <div className="h-2 w-full overflow-hidden bg-background">
                      <div
                        className="h-full bg-brand transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-4 grid grid-cols-3 gap-3 border-y border-border bg-background p-3 text-center">
                    <div>
                      <p className="text-xs text-muted">Total Students</p>
                      <p className="text-lg font-bold text-foreground">
                              {assessment.studentCount ?? assessment._count?.results ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Entries</p>
                      <p className="text-lg font-bold text-foreground">
                              {assessment.entryCount ?? assessment._count?.results ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Remaining</p>
                      <p className="text-lg font-bold text-orange-600">
                              {Math.max(
                                0,
                                (assessment.studentCount ?? assessment._count?.results ?? 0) -
                                  (assessment.entryCount ?? assessment._count?.results ?? 0)
                              )}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/teacher/results/${assessment.id}`;
                      }}
                      className="flex-1 bg-brand text-white hover:bg-brand-dark font-medium py-2 px-3 rounded-lg text-sm transition inline-flex items-center justify-center gap-1"
                    >
                      {isPublished ? "View Results" : isDraft ? "Enter Scores" : "Continue"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {!isPublished && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/teacher/results/${assessment.id}/subjects`;
                        }}
                        className="flex-1 border border-brand text-brand hover:bg-brand/5 font-medium py-2 px-3 rounded-lg text-sm transition"
                      >
                        By Subject
                      </button>
                    )}
                    {isPublished && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/teacher/results/${assessment.id}/analytics`;
                        }}
                        className="flex-1 border border-border text-foreground hover:bg-background font-medium py-2 px-3 rounded-lg text-sm transition inline-flex items-center justify-center gap-1"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-lg border border-border bg-surface">
          <FileText className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold text-foreground mb-2">No Assessments Found</p>
          <p className="text-sm text-muted">
            No assessments match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-6">
          <div className="text-sm text-muted">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded px-3 py-1.5 border border-border text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                );
              })
              .map((page, index, arr) => (
                <div key={page}>
                  {index > 0 && arr[index - 1] !== page - 1 && (
                    <span className="px-1 py-1.5 text-sm text-muted">…</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                      page === currentPage
                        ? "bg-brand text-white"
                        : "border border-border text-foreground hover:bg-background"
                    }`}
                  >
                    {page}
                  </button>
                </div>
              ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded px-3 py-1.5 border border-border text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
    </main>
  );
}
