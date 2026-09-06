"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SubscriptionModal from "@/components/subscription-modal";
import { getBackendUrl } from "@/lib/backend-url";
import { CalendarDays, PlusCircle, BookOpen, AlertCircle, Trash2, Clock3, CheckCircle2, Search } from "lucide-react";

interface Term {
  id: string;
  name: string;
  sortOrder: number;
  startsOn?: string | null;
  endsOn?: string | null;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
  terms: Term[];
}

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string; schoolName?: string } | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewYearModal, setShowNewYearModal] = useState(false);
  const [showNewTermModal, setShowNewTermModal] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [pendingDeleteTermId, setPendingDeleteTermId] = useState<string | null>(null);
  const [pendingDeleteYearId, setPendingDeleteYearId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState<"TERM" | "YEAR" | null>(null);
  const [deleteAnimateState, setDeleteAnimateState] = useState<"enter" | "exit">("enter");
  const [deletingItemName, setDeletingItemName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newYearData, setNewYearData] = useState({ name: "", isCurrent: false });
  const [newTermData, setNewTermData] = useState({
    academicYearId: "",
    name: "",
    startsOn: "",
    endsOn: "",
  });
  const [editTermData, setEditTermData] = useState({
    id: "",
    name: "",
    startsOn: "",
    endsOn: "",
  });

  const resolveSchoolName = async (backendUrl: string) => {
    try {
      const verifyResponse = await fetch(`${backendUrl}/api/admin/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!verifyResponse.ok) {
        return "";
      }

      const verifyData = await verifyResponse.json().catch(() => null);
      if (!verifyData?.authenticated || !verifyData.session?.schoolId) {
        return "";
      }

      const schoolResponse = await fetch(`${backendUrl}/api/admin/school/${verifyData.session.schoolId}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!schoolResponse.ok) {
        return "";
      }

      const schoolData = await schoolResponse.json().catch(() => null);
      return schoolData?.name || "";
    } catch {
      return "";
    }
  };

  const handleSubscriptionBlock = async (response: Response, backendUrl: string) => {
    if (response.status !== 403) {
      return false;
    }

    const errorData = await response.json().catch(() => null);
    if (errorData?.code !== "SUBSCRIPTION_INACTIVE") {
      return false;
    }

    const resolvedSchoolName = await resolveSchoolName(backendUrl);
    setSubscriptionBlocked({
      reason: errorData.reason || "Your school subscription is not active",
      schoolName: resolvedSchoolName || undefined,
    });
    setSchoolName(resolvedSchoolName);
    return true;
  };

  // Fetch academic years
  useEffect(() => {
    loadAcademicYears();
  }, []);

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      setError(null);
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/academic-years`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (await handleSubscriptionBlock(response, backendUrl)) {
          setLoading(false);
          return;
        }
        throw new Error("Failed to load academic years");
      }

      const data = await response.json();
      setAcademicYears(data.academicYears || []);
      // Set default academic year for term creation
      if (data.academicYears?.length > 0) {
        setNewTermData((prev) => ({
          ...prev,
          academicYearId: data.academicYears[0].id,
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load academic years"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/academic-years`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newYearData),
      });

      if (!response.ok) {
        throw new Error("Failed to create academic year");
      }

      setNewYearData({ name: "", isCurrent: false });
      setShowNewYearModal(false);
      await loadAcademicYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create year");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/terms`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTermData),
      });

      if (!response.ok) {
        throw new Error("Failed to create term");
      }

      setNewTermData({
        academicYearId: newTermData.academicYearId,
        name: "",
        startsOn: "",
        endsOn: "",
      });
      setShowNewTermModal(false);
      await loadAcademicYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create term");
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrentYear = async (id: string) => {
    setSaving(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/admin/academic-years/${id}/set-current`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set current year");
      }

      await loadAcademicYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set current year");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYear = async (id: string) => {
    const year = academicYears.find((item) => item.id === id);
    setPendingDeleteTermId(null);
    setPendingDeleteYearId(id);
    setDeletingItemName(year?.name || "this academic year");
    setDeleteModalType("YEAR");
    setDeleteAnimateState("enter");
    setDeleteModalOpen(true);
    playOpenTone();
  };

  const confirmDeleteYear = async () => {
    if (!pendingDeleteYearId) return;

    setSaving(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/admin/academic-years/${pendingDeleteYearId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete academic year");
      }

      setPendingDeleteYearId(null);
      setDeleteModalOpen(false);
      setDeleteModalType(null);
      setDeletingItemName("");
      await loadAcademicYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete year");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerm = (termId: string) => {
    const term = academicYears.flatMap((year) => year.terms).find((item) => item.id === termId);
    setPendingDeleteTermId(termId);
    setDeletingItemName(term?.name || "this term");
    setDeleteModalType("TERM");
    setDeleteAnimateState("enter");
    setDeleteModalOpen(true);
    playOpenTone();
  };

  const confirmDeleteTerm = async () => {
    if (!pendingDeleteTermId) return;

    setSaving(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/admin/terms/${pendingDeleteTermId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete term");
      }

      setPendingDeleteTermId(null);
      setDeleteModalOpen(false);
      setDeleteModalType(null);
      setDeletingItemName("");
      await loadAcademicYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete term");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTerm = (term: Term, yearId: string) => {
    setEditTermData({
      id: term.id,
      name: term.name,
      startsOn: term.startsOn ? new Date(term.startsOn).toISOString().split('T')[0] : "",
      endsOn: term.endsOn ? new Date(term.endsOn).toISOString().split('T')[0] : "",
    });
    setEditingTermId(term.id);
  };

  const handleUpdateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/admin/terms/${editTermData.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editTermData.name,
            startsOn: editTermData.startsOn ? new Date(editTermData.startsOn) : null,
            endsOn: editTermData.endsOn ? new Date(editTermData.endsOn) : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update term");
      }

      setEditingTermId(null);
      await loadAcademicYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update term");
    } finally {
      setSaving(false);
    }
  };

  const filteredYears = useMemo(() => {
    if (!searchQuery.trim()) return academicYears;

    const query = searchQuery.toLowerCase();
    return academicYears
      .map((year) => ({
        ...year,
        terms: year.terms.filter((term) =>
          [year.name, term.name]
            .join(" ")
            .toLowerCase()
            .includes(query)
        ),
      }))
      .filter(
        (year) =>
          year.name.toLowerCase().includes(query) || year.terms.length > 0
      );
  }, [academicYears, searchQuery]);

  const totalTerms = academicYears.reduce(
    (count, year) => count + year.terms.length,
    0
  );
  const currentYear = academicYears.find((year) => year.isCurrent);

  const formatDate = (date?: string | null) => {
    if (!date) return "Not set";
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  if (subscriptionBlocked) {
    return (
      <SubscriptionModal
        reason={subscriptionBlocked.reason}
        schoolName={subscriptionBlocked.schoolName || schoolName || "Your School"}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><CalendarDays size={17} /> Academic operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Academic Years &amp; Terms</h1>
          <p className="mt-1 text-muted">Manage school years, term dates, and the active academic cycle</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowNewTermModal(true)}
            variant="secondary"
            disabled={academicYears.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
          >
            <PlusCircle className="h-4 w-4" />
            Add Term
          </Button>
          <Button
            onClick={() => setShowNewYearModal(true)}
            variant="primary"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            <CalendarDays className="h-4 w-4" />
            Add Year
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AcademicStat icon={<CalendarDays size={18} />} label="Academic years" value={String(academicYears.length)} detail="Configured school cycles" />
        <AcademicStat icon={<Clock3 size={18} />} label="Total terms" value={String(totalTerms)} detail="Defined term periods" />
        <AcademicStat icon={<CheckCircle2 size={18} />} label="Current year" value={currentYear?.name || "Not set"} detail="Active academic cycle" />
        <AcademicStat icon={<Search size={18} />} label="View" value={searchQuery ? "Filtered" : "All years"} detail="Current search scope" />
      </section>

      <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-brand"><Search className="h-4 w-4" /><span className="text-sm font-semibold text-foreground">Find a year or term</span></div>
          <p className="mt-1 text-sm text-muted">Search the academic calendar before editing dates or setting the active year.</p>
        </div>
        <label className="w-full text-sm font-medium text-foreground sm:max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by year or term name..."
            aria-label="Search academic years or terms"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand"
          />
        </label>
      </section>

      {/* Content */}
      {loading ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-muted">Loading academic years...</p>
        </div>
      ) : filteredYears.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center">
          <p className="text-muted">
            {searchQuery
              ? "No academic years or terms match your search"
              : "No academic years configured yet"}
          </p>
          <Button
            onClick={() => setShowNewYearModal(true)}
            variant="primary"
            className="mt-4 h-9 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0858a8]"
          >
            <CalendarDays className="h-4 w-4" />
            Create First Year
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredYears.map((year) => (
            <div key={year.id} className="border border-border bg-surface overflow-hidden">
              {/* Year Header */}
              <div className="border-b border-border bg-background px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {year.name}
                  </h2>
                  {year.isCurrent && <Badge>Current Year</Badge>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {!year.isCurrent && (
                    <Button
                      onClick={() => handleSetCurrentYear(year.id)}
                      variant="primary"
                      disabled={saving}
                      className="h-9 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0858a8] sm:text-sm"
                    >
                      <BookOpen className="h-4 w-4" />
                      Set as Current
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteYear(year.id)}
                    variant="destructive"
                    disabled={saving}
                    className="h-9 rounded-lg px-3 py-1.5 text-xs font-semibold sm:text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Terms Table */}
              {year.terms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background">
                        <th className="px-6 py-3 text-left font-medium text-foreground">
                          Term Name
                        </th>
                        <th className="hidden px-6 py-3 text-left font-medium text-foreground sm:table-cell">
                          Starts On
                        </th>
                        <th className="hidden px-6 py-3 text-left font-medium text-foreground sm:table-cell">
                          Ends On
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {year.terms.map((term) => (
                        <tr
                          key={term.id}
                          className="hover:bg-background/50 transition-colors"
                        >
                          <td className="px-6 py-3 font-medium text-foreground">
                            {term.name}
                          </td>
                          <td className="hidden px-6 py-3 text-sm text-muted sm:table-cell">
                            {formatDate(term.startsOn)}
                          </td>
                          <td className="hidden px-6 py-3 text-sm text-muted sm:table-cell">
                            {formatDate(term.endsOn)}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditTerm(term, year.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0858a8]"
                              >
                                <BookOpen className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTerm(term.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted">
                  No terms defined for this academic year yet.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes ay_delete_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes ay_delete_exit { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(220,38,38,0.16)]"
            style={{ animation: `${deleteAnimateState === "enter" ? "ay_delete_enter" : "ay_delete_exit"} 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="border-b border-slate-100 px-6 py-5" style={{ background: "linear-gradient(90deg, rgba(220,38,38,0.12), rgba(220,38,38,0.04))" }}>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-red-100 shadow-sm">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{deleteModalType === "YEAR" ? "Delete Academic Year?" : "Delete Term?"}</h2>
                  <p className="mt-1 text-sm text-slate-600">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-slate-700">
                You are about to permanently delete <strong>“{deletingItemName}”</strong>.
              </p>
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-700">
                  <strong>Warning:</strong> {deleteModalType === "YEAR" ? "This will remove the academic year and all associated terms." : "This will remove the term from the academic year."}
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setDeleteAnimateState("exit");
                  playCloseTone();
                  setTimeout(() => {
                    setDeleteModalOpen(false);
                    setDeleteModalType(null);
                    setDeletingItemName("");
                    setPendingDeleteTermId(null);
                    setPendingDeleteYearId(null);
                  }, 320);
                }}
                disabled={saving}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-100 disabled:opacity-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteModalType === "YEAR" ? confirmDeleteYear : confirmDeleteTerm}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: "#DC2626" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#991B1B")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#DC2626")}
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Year Modal */}
      {showNewYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-foreground">
              Create Academic Year
            </h2>
            <p className="mt-2 text-sm text-muted">
              Add a new academic year to the system.
            </p>

            <form onSubmit={handleCreateYear} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Academic Year Name
                </label>
                <input
                  type="text"
                  placeholder="2024/2025"
                  value={newYearData.name}
                  onChange={(e) =>
                    setNewYearData({
                      ...newYearData,
                      name: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newYearData.isCurrent}
                  onChange={(e) =>
                    setNewYearData({
                      ...newYearData,
                      isCurrent: e.target.checked,
                    })
                  }
                  className="rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">
                  Set as current academic year
                </span>
              </label>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  className="flex-1 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0858a8]"
                >
                  {saving ? "Creating..." : "Create Year"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowNewYearModal(false)}
                  className="flex-1 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0858a8]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Term Modal */}
      {showNewTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-foreground">Add Term</h2>
            <p className="mt-2 text-sm text-muted">Create a new term in an academic year.</p>

            <form onSubmit={handleCreateTerm} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Academic Year
                </label>
                <select
                  value={newTermData.academicYearId}
                  onChange={(e) =>
                    setNewTermData({
                      ...newTermData,
                      academicYearId: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">Select academic year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Term Name
                </label>
                <input
                  type="text"
                  placeholder="Term 1"
                  value={newTermData.name}
                  onChange={(e) =>
                    setNewTermData({
                      ...newTermData,
                      name: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Starts On
                  </label>
                  <input
                    type="date"
                    value={newTermData.startsOn}
                    onChange={(e) =>
                      setNewTermData({
                        ...newTermData,
                        startsOn: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ends On
                  </label>
                  <input
                    type="date"
                    value={newTermData.endsOn}
                    onChange={(e) =>
                      setNewTermData({
                        ...newTermData,
                        endsOn: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  className="flex-1 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0858a8]"
                >
                  {saving ? "Creating..." : "Create Term"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowNewTermModal(false)}
                  className="flex-1 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0858a8]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Term Modal */}
      {editingTermId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-foreground">Edit Term</h2>
            <p className="mt-2 text-sm text-muted">Update term details.</p>

            <form onSubmit={handleUpdateTerm} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Term Name
                </label>
                <input
                  type="text"
                  value={editTermData.name}
                  onChange={(e) =>
                    setEditTermData({
                      ...editTermData,
                      name: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Starts On
                  </label>
                  <input
                    type="date"
                    value={editTermData.startsOn}
                    onChange={(e) =>
                      setEditTermData({
                        ...editTermData,
                        startsOn: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ends On
                  </label>
                  <input
                    type="date"
                    value={editTermData.endsOn}
                    onChange={(e) =>
                      setEditTermData({
                        ...editTermData,
                        endsOn: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  className="flex-1 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0858a8]"
                >
                  {saving ? "Updating..." : "Update Term"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setEditingTermId(null)}
                  className="flex-1 rounded-lg border border-[#0A66C2] bg-[#0A66C2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0858a8]"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AcademicStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-border bg-surface p-5 transition hover:border-brand/50">
      <div className="mb-4 flex items-center gap-2 text-brand">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</span>
      </div>
      <div className="truncate text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted">{detail}</div>
    </div>
  );
}

function playOpenTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const playTone = (freq: number, duration: number, gain: number, delay = 0) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delay);
      gainNode.gain.setValueAtTime(0.0001, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration);
    };

    playTone(860, 0.14, 0.05, 0);
    playTone(1180, 0.14, 0.05, 0.07);
    setTimeout(() => ctx.close(), 700);
  } catch (e) {
    // ignore
  }
}

function playCloseTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 410;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.04, now + 0.01);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.stop(now + 0.24);
    setTimeout(() => ctx.close(), 500);
  } catch (e) {
    // ignore
  }
}
