"use client";

import { useMemo, useState } from "react";
import { Users, X } from "lucide-react";
import { pupilName } from "@/lib/format";
import { resolveFileUrl } from "@/lib/api-client";

const PHASE_CONFIG = {
  EARLY_YEARS: { label: "Early Years", badge: "bg-amber-100 text-amber-800" },
  PRIMARY: { label: "Primary", badge: "bg-blue-100 text-blue-800" },
  SECONDARY: { label: "Secondary", badge: "bg-purple-100 text-purple-800" },
  ALL: { label: "All students", badge: "bg-gray-100 text-gray-800" },
};

const PHASE_ORDER = ["ALL", "EARLY_YEARS", "PRIMARY", "SECONDARY"];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_ITEMS_PER_PAGE = 10;

export default function StudentsPageClient({ pupils, classes }: { pupils: any[]; classes: any[] }) {
  const [activePhase, setActivePhase] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<any | null>(null);

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

  const profileGuardian = profileStudent ? getGuardian(profileStudent) : null;

  // Filter by phase and search
  const filteredPupils = useMemo(() => {
    let filtered = pupils;

    // Filter by phase
    if (activePhase !== "ALL") {
      filtered = filtered.filter((p) => p.class?.phase === activePhase);
    }

    // Filter by search (name or admission number)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const admissionNo = (p.admissionNo || "").toLowerCase();
        return fullName.includes(query) || admissionNo.includes(query);
      });
    }

    return filtered;
  }, [pupils, activePhase, searchQuery]);

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

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handlePhaseChange = (phase: string) => {
    setActivePhase(phase);
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

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <Users className="h-[17px] w-[17px]" /> Teacher workspace
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Students</h1>
            <p className="mt-1 text-muted">{pupils.length} student{pupils.length !== 1 ? "s" : ""} across {classes.length} assigned class{classes.length !== 1 ? "es" : ""}.</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Total Students
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {getPhaseStats("ALL")}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Students across all assigned classes.</p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                <span className="text-sm font-semibold text-violet-600">P</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Primary
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {getPhaseStats("PRIMARY")}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Primary phase students.</p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <span className="text-sm font-semibold text-amber-600">S</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Secondary
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {getPhaseStats("SECONDARY")}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Secondary phase students.</p>
          </article>
        </section>

        <section className="border-b border-border pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Search & filters</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search by name or admission number..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PHASE_ORDER.map((phase) => {
                const config = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG];
                const isActive = activePhase === phase;
                return (
                  <button
                    key={phase}
                    onClick={() => handlePhaseChange(phase)}
                    className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "border-brand bg-brand text-white"
                        : "border border-border bg-background text-foreground hover:border-brand"
                    }`}
                  >
                    {config.label}
                    <span className="ml-2 inline-flex rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">
                      {getPhaseStats(phase)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {paginatedPupils.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
              {Math.min(currentPage * itemsPerPage, filteredPupils.length)} of {filteredPupils.length} student{filteredPupils.length !== 1 ? "s" : ""}
              {searchQuery ? ` matching "${searchQuery}"` : ""}
            </p>
            <label className="flex items-center gap-2 text-xs text-muted">
              Rows per page
              <select
                value={itemsPerPage}
                onChange={handlePageSizeChange}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/10"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Table */}
        {paginatedPupils.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-hidden rounded-lg border border-border bg-surface sm:block">
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
                    const guardian = p.guardians?.[0]?.guardian;
                    const classLabel = p.class
                      ? `${p.class.name}${p.class.arm ? ` ${p.class.arm}` : ""}`
                      : "Unassigned";

                    return (
                      <tr key={p.id} className="border-t border-border hover:bg-background/50 transition-colors">
                        <td className="px-4 py-2">
                          {p.photoUrl ? (
                            <img
                              src={resolveFileUrl(p.photoUrl, p.id) ?? undefined}
                              alt={`${p.firstName} ${p.lastName}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                              No photo
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 font-medium text-foreground">
                          {pupilName(p.firstName, p.lastName)}
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
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => openProfileModal(p)}
                            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-background"
                          >
                            View
                          </button>
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
                    className="border border-border bg-surface px-3 py-3 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {p.photoUrl ? (
                          <img
                            src={resolveFileUrl(p.photoUrl, p.id) ?? undefined}
                            alt={`${p.firstName} ${p.lastName}`}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground flex-shrink-0">
                            —
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {pupilName(p.firstName, p.lastName)}
                          </p>
                          <p className="text-xs text-muted mt-1">{classLabel}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProfileModal(p)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-background flex-shrink-0"
                      >
                        View
                      </button>
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
          <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-12 text-center">
            <p className="text-muted">
              {searchQuery
                ? `No students found matching "${searchQuery}"`
                : "No students in this phase"}
            </p>
          </div>
        )}
      </div>

      {isProfileOpen && profileStudent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted">Student Transcript</p>
                <h2 className="mt-2 text-3xl font-semibold text-foreground">{pupilName(profileStudent.firstName, profileStudent.lastName)}</h2>
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
                          alt={pupilName(profileStudent.firstName, profileStudent.lastName)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-semibold text-primary">
                          {pupilName(profileStudent.firstName, profileStudent.lastName)
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
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
