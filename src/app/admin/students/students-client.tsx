"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, X, Upload, Download } from "lucide-react";
import { playCloseTone, playOpenTone } from "@/lib/sounds";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { UserGuide, type PageHelpGuide } from "@/components/ui/user-guide";
import { pupilName } from "@/lib/format";
import { resolveFileUrl } from "@/lib/api-client";

const PHASE_CONFIG = {
  EARLY_YEARS: { label: "Early Years", badge: "bg-amber-100 text-amber-800" },
  PRIMARY: { label: "Primary", badge: "bg-blue-100 text-blue-800" },
  SECONDARY: { label: "Secondary", badge: "bg-purple-100 text-purple-800" },
  ALL: { label: "All Students", badge: "bg-gray-100 text-gray-800" },
};

const PHASE_ORDER = ["ALL", "EARLY_YEARS", "PRIMARY", "SECONDARY"];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500] as const;
const DEFAULT_ITEMS_PER_PAGE = 10;

const HELP_GUIDE: PageHelpGuide = {
  title: "Managing Students",
  overview: "View, search, and manage all active students in your school. Organize by phase (grade level) or search by name and admission number.",
  steps: [
    "Click 'Add student' button to create a new student record",
    "Use the search bar to find students by name or admission number",
    "Filter by phase (Early Years, Primary, Secondary) using tabs",
    "Click a student to view details and edit information",
    "Use pagination to browse through large student lists",
  ],
  commonTasks: [
    {
      title: "Add a New Student",
      description: "Create a new student record in the system",
      tips: [
        "Fill in first name, last name, and admission number",
        "Select the student's class and phase",
        "Add guardian contact information",
        "Upload a student photo (optional)",
      ],
    },
    {
      title: "Search for a Student",
      description: "Quickly find a student using the search box",
      example: "Search: 'John' or 'ADM001' or 'Smith'",
      tips: [
        "Search works on first name, last name, or admission number",
        "Searches are case-insensitive",
        "Results update as you type",
      ],
    },
    {
      title: "Filter by Phase/Grade",
      description: "View students in a specific phase or all phases",
      tips: [
        "Early Years: Pre-K and K students",
        "Primary: Grades 1-6 students",
        "Secondary: Grades 7-12 students",
        "Click 'All Students' to see everyone",
      ],
    },
  ],
  faqs: [
    {
      question: "How do I deactivate a student?",
      answer: "Click the student's name to open details, then click 'Deactivate'. The student will no longer appear in active lists but the record is preserved.",
    },
    {
      question: "Can I bulk import students?",
      answer: "Yes. Click 'Import CSV' and upload a file with columns: firstName, lastName, admissionNo, classId. Consult the template for exact format.",
    },
    {
      question: "Why is a student not appearing in fees/results?",
      answer: "Make sure the student is assigned to a class. Use edit student to verify class assignment and that 'Active' is checked.",
    },
  ],
};

const whatsAppPulseStyle = `
  @keyframes whatsapp-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
  .whatsapp-pulse {
    animation: whatsapp-pulse 2s ease-in-out infinite;
  }
`;

export default function StudentsPageClient({ pupils, classes }: { pupils: any[]; classes: any[] }) {
  const router = useRouter();
  const [activePhase, setActivePhase] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [sortMode, setSortMode] = useState("alphabet-asc");
  const [selectedClassId, setSelectedClassId] = useState("ALL");
  const [selectedLetter, setSelectedLetter] = useState("ALL");
  const searchParams = useSearchParams();
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(() => {
    if (searchParams?.get("saved")) {
      return "Student registration completed successfully and the learner is now enrolled in the school roster.";
    }
    if (searchParams?.get("updated")) {
      return "Student record updated successfully and the information is now reflected across the school system.";
    }
    return null;
  });
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(
    searchParams?.get("emailError") ?? null
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<any | null>(null);
  const [whatsAppConnected, setWhatsAppConnected] = useState<boolean | null>(null);
  const [whatsAppStatusMessage, setWhatsAppStatusMessage] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isImportModalOpen) {
      playOpenTone();
    }
  }, [isImportModalOpen]);

  useEffect(() => {
    async function fetchWhatsAppStatus() {
      try {
        const res = await fetch(`/api/admin/whatsapp/status`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setWhatsAppConnected(data?.session?.status === 'connected');
          setWhatsAppStatusMessage(data?.session?.statusMessage || data?.session?.status || null);
        } else {
          setWhatsAppConnected(false);
          setWhatsAppStatusMessage('Unable to retrieve WhatsApp status.');
        }
      } catch (err) {
        console.error('Error loading WhatsApp status:', err);
        setWhatsAppConnected(false);
        setWhatsAppStatusMessage('Unable to retrieve WhatsApp status.');
      }
    }

    fetchWhatsAppStatus();
  }, []);

  const openProfileModal = (student: any) => {
    setProfileStudent(student);
    setIsProfileOpen(true);
  };
  const closeProfileModal = () => {
    setIsProfileOpen(false);
    setProfileStudent(null);
  };



  const formatDate = (value?: string | Date | null) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatAge = (value?: string | Date | null) => {
    if (!value) return "—";
    const dob = value instanceof Date ? value : new Date(value);
    const diff = Date.now() - dob.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} yrs`;
  };

  const getGuardian = (student: any) => {
    const entry = student.guardians?.[0] ?? null;
    return entry?.guardian ?? entry ?? null;
  };

  const getStudentInitials = (student: any) => {
    const displayName = [student?.lastName, student?.firstName].filter(Boolean).join(" ").trim();
    const parts = displayName.split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "S";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const profileGuardian = profileStudent ? getGuardian(profileStudent) : null;

  const classOptions = useMemo(() => {
    const filteredClasses = (classes || []).filter(Boolean);
    if (activePhase === "ALL") {
      return Array.from(new Map(filteredClasses.map((cls) => [cls.id, cls])).values());
    }

    return Array.from(
      new Map(
        filteredClasses
          .filter((cls) => cls.phase === activePhase)
          .map((cls) => [cls.id, cls])
      ).values()
    );
  }, [classes, activePhase]);

  const alphabetOptions = useMemo(() => {
    return ["ALL", ...Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))];
  }, []);

  // Filter by phase, search, class, alphabet, and sort
  const filteredPupils = useMemo(() => {
    let filtered = [...pupils];

    // Filter by phase
    if (activePhase !== "ALL") {
      filtered = filtered.filter((p) => p.class?.phase === activePhase);
    }

    // Filter by search (name or admission number)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const firstLast = `${p.firstName} ${p.lastName}`.toLowerCase();
        const lastFirst = `${p.lastName} ${p.firstName}`.toLowerCase();
        const admissionNo = (p.admissionNo || "").toLowerCase();
        return firstLast.includes(query) || lastFirst.includes(query) || admissionNo.includes(query);
      });
    }

    // Filter by class
    if (selectedClassId !== "ALL") {
      filtered = filtered.filter((p) => p.class?.id === selectedClassId);
    }

    // Filter by starting letter
    if (selectedLetter !== "ALL") {
      const letter = selectedLetter.toLowerCase();
      filtered = filtered.filter((p) => {
        const displayName = [p.lastName, p.firstName].filter(Boolean).join(" ").trim().toLowerCase();
        return displayName.startsWith(letter);
      });
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortMode) {
        case "alphabet-desc": {
          const nameA = [a.lastName, a.firstName].filter(Boolean).join(" ").trim().toLowerCase();
          const nameB = [b.lastName, b.firstName].filter(Boolean).join(" ").trim().toLowerCase();
          return nameB.localeCompare(nameA);
        }
        case "date-asc": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateA - dateB;
        }
        case "date-desc": {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        }
        case "admission-asc": {
          const admissionA = (a.admissionNo || "").toLowerCase();
          const admissionB = (b.admissionNo || "").toLowerCase();
          return admissionA.localeCompare(admissionB);
        }
        case "admission-desc": {
          const admissionA = (a.admissionNo || "").toLowerCase();
          const admissionB = (b.admissionNo || "").toLowerCase();
          return admissionB.localeCompare(admissionA);
        }
        case "alphabet-asc":
        default: {
          const nameA = [a.lastName, a.firstName].filter(Boolean).join(" ").trim().toLowerCase();
          const nameB = [b.lastName, b.firstName].filter(Boolean).join(" ").trim().toLowerCase();
          return nameA.localeCompare(nameB);
        }
      }
    });

    return filtered;
  }, [pupils, activePhase, searchQuery, selectedClassId, selectedLetter, sortMode]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPupils.length / itemsPerPage));
  const paginatedPupils = filteredPupils.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortMode(event.target.value);
    setCurrentPage(1);
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(event.target.value);
    setCurrentPage(1);
  };

  const handleLetterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLetter(event.target.value);
    setCurrentPage(1);
  };

  const resetAdvancedFilters = () => {
    setSortMode("alphabet-asc");
    setSelectedClassId("ALL");
    setSelectedLetter("ALL");
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handlePhaseChange = (phase: string) => {
    setActivePhase(phase);
    setSelectedClassId("ALL");
    handleFilterChange();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    handleFilterChange();
  };

  const getPhaseStats = (phase: string) => {
    if (phase === "ALL") {
      return pupils.length;
    }
    return pupils.filter((p) => p.class?.phase === phase).length;
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportPreviewRows([]);
    setImportErrors([]);
    setImportSummary(null);
    if (importFileInputRef.current) {
      importFileInputRef.current.value = "";
    }
  };

  const handleDownloadImportTemplate = () => {
    const template = [
      'firstName,lastName,middleName,className,guardianFirst,guardianLast,guardianPhone,guardianEmail,dateOfBirth,gender,address,status',
      'Ada,Okafor,,Primary 1,Ade,Okafor,08012345678,ade@example.com,2005-01-10,Female,12 Main Street,ACTIVE',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePreviewImport = async (event?: FormEvent) => {
    event?.preventDefault();

    if (!importFile) {
      setImportErrors(['Choose a CSV file before previewing the import.']);
      return;
    }

    setIsImporting(true);
    setImportErrors([]);
    setImportSummary(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch('/api/admin/students/import?preview=true', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => '');
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { error: text };
          }
        }
      }

      if (!res.ok) {
        const fallbackMessage = typeof data?.error === 'string' && data.error.trim()
          ? data.error
          : 'The import preview could not be completed.';
        const detailMessage = typeof data?.details === 'string' && data.details.trim()
          ? data.details
          : null;
        setImportErrors([detailMessage ? `${fallbackMessage}: ${detailMessage}` : fallbackMessage]);
        return;
      }

      setImportPreviewRows(data.previewRows || []);
      setImportSummary(`${data.validRows || 0} valid records ready to import.`);
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setImportErrors(data.errors);
      } else {
        setImportErrors([]);
      }
    } catch (error) {
      console.error('Error previewing student import:', error);
      setImportErrors(['The import preview failed. Please try again.']);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) {
      setImportErrors(['Choose a CSV file before importing students.']);
      return;
    }

    setIsImporting(true);
    setImportErrors([]);
    setImportSummary(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => '');
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { error: text };
          }
        }
      }

      if (!res.ok) {
        setImportErrors([data?.error || 'The student import could not be completed.']);
        return;
      }

      setImportSummary(`${data.importedCount || 0} students were imported successfully.`);
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setImportErrors(data.errors);
      }
      resetImportState();
      router.refresh();
    } catch (error) {
      console.error('Error importing students:', error);
      setImportErrors(['The import failed. Please try again.']);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <style>{whatsAppPulseStyle}</style>
      <div>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students</h1>
            <p className="mt-2 text-sm text-muted">
              {pupils.length} active student{pupils.length !== 1 ? "s" : ""} across all phases
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end sm:items-center">
            {whatsAppConnected !== null && (
              <button
                title={whatsAppConnected ? 'WhatsApp connected — Ready to send school messages' : 'WhatsApp disconnected — Reconnect via settings'}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-sm whatsapp-pulse ${whatsAppConnected ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:shadow-md' : 'bg-amber-100 text-amber-600 hover:bg-amber-200 hover:shadow-md'}`}
              >
                <WhatsAppIcon className="h-5 w-5" />
              </button>
            )}
            {/* Animated Search Panel - slides out on same line */}
            <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${isSearchOpen ? "w-72 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full"}`}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-lg border-2 border-[#0A66C2] bg-background px-3 py-1.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsSearchOpen((open) => !open)}
              className="h-9 w-full rounded-md border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0858a8] sm:w-auto"
            >
              <Search className="h-4 w-4" />
              {isSearchOpen ? "Close Search" : "Search Student"}
            </Button>
            <Button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="h-9 w-full rounded-md border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0858a8] sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/admin/students/new')}
              className="h-9 w-full rounded-md border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0858a8] sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              Register Student
            </Button>
          </div>
        </div>

        {successModalMessage ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-8">
            <div className="w-full max-w-xl rounded-3xl border border-border bg-surface p-8 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-2xl bg-success/10 p-3 text-success">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Student saved successfully</h3>
                  <p className="mt-2 text-sm text-muted">{successModalMessage}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setSuccessModalMessage(null)}>
                  Close
                </Button>
                <Button type="button" onClick={() => setSuccessModalMessage(null)}>
                  Back to roster
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {emailErrorMessage ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Student registered, but guardian email failed to send.</p>
                <p className="mt-1 text-sm text-amber-900">{emailErrorMessage}</p>
                <p className="mt-1 text-sm text-amber-900">
                  Please verify the guardian's email address and SMTP settings. The student record was still created.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmailErrorMessage(null)}
                className="rounded-full p-1 text-amber-700 transition hover:bg-amber-100"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Phase tabs + filters */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {PHASE_ORDER.map((phase) => {
              const count = getPhaseStats(phase);
              const config = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG];
              const isActive = activePhase === phase;

              return (
                <button
                  key={phase}
                  onClick={() => handlePhaseChange(phase)}
                  className={`px-2 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                    isActive
                      ? "border-b-2 border-primary text-primary"
                      : "border-b-2 border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {config.label}
                  <span className="ml-1 inline-block rounded px-1.5 py-0.5 text-xs font-semibold bg-background text-foreground sm:ml-2 sm:px-2">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <p className="whitespace-nowrap text-sm text-muted">
              Showing {paginatedPupils.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
              {Math.min(currentPage * itemsPerPage, filteredPupils.length)} of {filteredPupils.length}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>

            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">Sort</span>
              <select
                value={sortMode}
                onChange={handleSortChange}
                className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="alphabet-asc">A–Z</option>
                <option value="alphabet-desc">Z–A</option>
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="admission-asc">Admission ↑</option>
                <option value="admission-desc">Admission ↓</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">Class</span>
              <select
                value={selectedClassId}
                onChange={handleClassChange}
                className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="ALL">All classes</option>
                {classOptions.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}{cls.arm ? ` ${cls.arm}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">Starts with</span>
              <select
                value={selectedLetter}
                onChange={handleLetterChange}
                className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {alphabetOptions.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter === "ALL" ? "All" : letter}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">Rows</span>
              <select
                value={itemsPerPage}
                onChange={handlePageSizeChange}
                className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            {(sortMode !== "alphabet-asc" || selectedClassId !== "ALL" || selectedLetter !== "ALL") && (
              <button
                type="button"
                onClick={resetAdvancedFilters}
                className="rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-background"
              >
                Reset
              </button>
            )}
          </div>
        </div>

      {/* Table */}
      {paginatedPupils.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-hidden rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Photo</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Class</th>
                  <th className="px-4 py-2 font-medium">Admission No.</th>
                  <th className="px-4 py-2 font-medium">Parent Contact</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPupils.map((p) => {
                  const guardian = p.guardians[0]?.guardian;
                  const classLabel = p.class
                    ? `${p.class.name}${p.class.arm ? ` ${p.class.arm}` : ""}`
                    : "Unassigned";

                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-background/50 transition-colors">
                      <td className="px-4 py-2">
                        {p.photoUrl ? (
                          <img
                            src={resolveFileUrl(p.photoUrl, p.id) ?? undefined}
                            alt={[p.lastName, p.firstName].filter(Boolean).join(" ")}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-xs font-semibold text-primary shadow-sm">
                            {getStudentInitials(p)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-foreground">
                        {[p.lastName, p.firstName].filter(Boolean).join(" ")}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                          {classLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {p.admissionNo ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {guardian?.phone ?? "—"}
                      </td>
                      <td className="px-4 py-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/students/${p.id}`)}
                          className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white transition hover:bg-brand/90"
                        >
                          View
                        </button>
                        <Button type="button" variant="secondary" className="text-xs px-1.5 py-0.5" onClick={() => router.push(`/admin/students/${p.id}/edit`)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="sm:hidden space-y-2">
            {paginatedPupils.map((p) => {
              const classLabel = p.class
                ? `${p.class.name}${p.class.arm ? ` ${p.class.arm}` : ""}`
                : "Unassigned";

              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-border bg-surface px-3 py-2 hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {[p.lastName, p.firstName].filter(Boolean).join(" ")}
                      </p>
                      <p className="text-xs text-muted mt-1">{classLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/students/${p.id}`)}
                        className="rounded-lg bg-brand px-2 py-1 text-xs font-semibold text-white transition hover:bg-brand/90"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/students/${p.id}/edit`)}
                        className="rounded-full border border-border bg-surface px-1.5 py-0.5 text-xs font-semibold text-foreground transition hover:bg-background"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded px-3 py-1.5 border border-border text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and ±1 pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, arr) => (
                    <div key={page}>
                      {index > 0 && arr[index - 1] !== page - 1 && (
                        <span className="px-2 py-2 text-muted">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`rounded px-2.5 py-1.5 text-sm font-medium ${
                          page === currentPage
                            ? "bg-primary text-white"
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
                  className="rounded px-3 py-1.5 border border-border text-sm font-medium text-foreground hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
          <p className="text-muted">
            {searchQuery
              ? `No students found matching "${searchQuery}"`
              : "No students in this phase"}
          </p>
        </div>
      )}
    </div>

      {isImportModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes students_import_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
          `}</style>

          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: `students_import_modal_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="border-b border-slate-100 px-6 py-5" style={{ background: "linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0.04))" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Import students from CSV</h2>
                  <p className="mt-1 text-sm text-muted">Upload a CSV file to add students without changing the existing manual registration flow.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playCloseTone();
                    setIsImportModalOpen(false);
                    resetImportState();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-background transition-colors"
                  aria-label="Close import dialog"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Use the template below to prepare your file.</p>
                    <p className="mt-1">Required columns: firstName, lastName, and className. Admission numbers are assigned automatically by the system.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadImportTemplate}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0A66C2] bg-white px-3 py-2 text-sm font-semibold text-[#0A66C2] transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Download template
                  </button>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handlePreviewImport}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">Choose CSV file</span>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setImportFile(file);
                      setImportErrors([]);
                      setImportSummary(null);
                      setImportPreviewRows([]);
                    }}
                    className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>

                <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      playCloseTone();
                      setIsImportModalOpen(false);
                      resetImportState();
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background"
                  >
                    Cancel
                  </button>
                  <Button type="submit" className="inline-flex items-center gap-2" disabled={isImporting}>
                    <Upload className="h-4 w-4" />
                    {isImporting ? 'Checking file...' : 'Preview import'}
                  </Button>
                </div>
              </form>

              {importSummary ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                  {importSummary}
                </div>
              ) : null}

              {importErrors.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <p className="font-semibold">We found issues in the file.</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {importErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {importPreviewRows.length > 0 ? (
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Preview</h4>
                    <Button type="button" onClick={handleConfirmImport} disabled={isImporting}>
                      {isImporting ? 'Importing...' : 'Import students'}
                    </Button>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-muted">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Admission No.</th>
                          <th className="px-3 py-2">Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewRows.map((row) => (
                          <tr key={`${row.firstName}-${row.lastName}-${row.admissionNo}`} className="border-t border-border">
                            <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                            <td className="px-3 py-2">{row.admissionNo || '—'}</td>
                            <td className="px-3 py-2">{row.className || 'Unassigned'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isProfileOpen && profileStudent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Student Transcript</p>
                <h2 className="mt-2 text-3xl font-semibold text-foreground">{[profileStudent.lastName, profileStudent.firstName].filter(Boolean).join(" ")}</h2>
                <p className="mt-1 text-sm text-muted">{profileStudent.class?.name}{profileStudent.class?.arm ? ` ${profileStudent.class.arm}` : ""}</p>
              </div>
              <button
                type="button"
                onClick={closeProfileModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-surface"
                aria-label="Close student details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-8">
              <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,_1fr)]">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                      {profileStudent.photoUrl ? (
                        <img
                          src={resolveFileUrl(profileStudent.photoUrl, profileStudent.id) ?? undefined}
                          alt={[profileStudent.lastName, profileStudent.firstName].filter(Boolean).join(" ")}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-semibold text-primary">
                          {[profileStudent.lastName, profileStudent.firstName].filter(Boolean).join(" ")
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">Admission No.</p>
                      <p className="mt-2 text-xl font-semibold text-foreground">{profileStudent.admissionNo ?? profileStudent.id}</p>
                      <p className="mt-3 text-sm text-muted">Enrolled {formatDate(profileStudent.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">Class</span>
                      <span className="font-semibold text-foreground">{profileStudent.class?.name ?? "—"}{profileStudent.class?.arm ? ` ${profileStudent.class.arm}` : ""}</span>
                    </div>
                    <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">Phase</span>
                      <span className="font-semibold text-foreground">{profileStudent.class?.phase ?? "—"}</span>
                    </div>
                    <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">Date of birth</span>
                      <span className="font-semibold text-foreground">{formatDate(profileStudent.dateOfBirth)}</span>
                    </div>
                    <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">Age</span>
                      <span className="font-semibold text-foreground">{formatAge(profileStudent.dateOfBirth)}</span>
                    </div>
                    <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 py-3">
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">Gender</span>
                      <span className="font-semibold text-foreground">{profileStudent.gender ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Student details</h3>
                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">First name</span>
                        <span className="font-semibold text-foreground">{profileStudent.firstName ?? "—"}</span>
                      </div>
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">Middle name</span>
                        <span className="font-semibold text-foreground">{profileStudent.middleName || "—"}</span>
                      </div>
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">Last name</span>
                        <span className="font-semibold text-foreground">{profileStudent.lastName ?? "—"}</span>
                      </div>
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-start gap-4 py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">Address</span>
                        <span className="font-semibold text-foreground break-words">{profileStudent.address || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground">Parent / guardian</h3>
                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">Name</span>
                        <span className="font-semibold text-foreground">{profileGuardian ? `${profileGuardian.firstName ?? ""} ${profileGuardian.lastName ?? ""}`.trim() || "—" : "—"}</span>
                      </div>
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">Relationship</span>
                        <span className="font-semibold text-foreground">{profileStudent.guardians?.[0]?.relation ?? "—"}</span>
                      </div>
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 border-b border-border py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">Phone</span>
                        <span className="font-semibold text-foreground">{profileGuardian?.phone ?? profileStudent.guardians?.[0]?.phone ?? "—"}</span>
                      </div>
                      <div className="grid grid-cols-[160px_minmax(0,_1fr)] items-center gap-4 py-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted">Email</span>
                        <span className="font-semibold text-foreground">{profileGuardian?.email ?? profileStudent.guardians?.[0]?.email ?? "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={closeProfileModal}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <UserGuide guide={HELP_GUIDE} />
    </>
  );
}
