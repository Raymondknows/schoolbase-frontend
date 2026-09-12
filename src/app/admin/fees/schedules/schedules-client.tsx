"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { playOpenTone, playCloseTone } from "@/lib/sounds";
import { ErrorModal } from "@/components/ui/error-modal";
import { useRouter } from "next/navigation";
import { X, TrendingUp, CheckCircle, AlertCircle, ArrowUpRight, Edit2, Trash2, Search, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserGuide, type PageHelpGuide } from "@/components/ui/user-guide";
import { formatMoney } from "@/lib/format";
import { getBackendUrl } from "@/lib/backend-url";

type ClassItem = { id: string; name: string; arm?: string | null };
type TermItem = { id: string; name: string; academicYear: { name: string } };
type FeeScheduleLineItem = {
  id: string;
  name: string;
  amount: number;
  description?: string | null;
  isRequired?: boolean;
  sortOrder?: number;
};
type FeeScheduleItem = {
  id: string;
  name: string;
  amount: number;
  createdAt: string | Date;
  term: TermItem;
  class?: ClassItem | null;
  items?: FeeScheduleLineItem[];
};

type ScheduleDraftItem = {
  id?: string;
  name: string;
  amount: string;
  description?: string;
  isRequired?: boolean;
  isNew?: boolean;
};

export default function FeeSchedulesPageClient({
  feeSchedules,
  currency,
  terms,
  classes,
  success,
}: {
  feeSchedules: FeeScheduleItem[];
  currency: string;
  terms: TermItem[];
  classes: ClassItem[];
  success?: boolean;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState("ALL");
  const [selectedAcademicYearName, setSelectedAcademicYearName] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ name: string; amount: string; classId: string } | null>(null);
  const [editScheduleContext, setEditScheduleContext] = useState<{ termName: string; academicYearName: string; className: string } | null>(null);
  const [editDraftItems, setEditDraftItems] = useState<ScheduleDraftItem[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState<string>("");
  const [feeScheduleItems, setFeeScheduleItems] = useState<FeeScheduleItem[]>(feeSchedules);
  const [createDraftItems, setCreateDraftItems] = useState<ScheduleDraftItem[]>([]);
  
  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteAnimateState, setDeleteAnimateState] = useState<"enter" | "exit">("enter");

  const addDraftItem = (setter: React.Dispatch<React.SetStateAction<ScheduleDraftItem[]>>) => {
    setter((current) => [
      ...current,
      { name: "", amount: "", description: "", isRequired: true, isNew: true },
    ]);
  };

  const removeDraftItem = (
    setter: React.Dispatch<React.SetStateAction<ScheduleDraftItem[]>>,
    index: number,
  ) => {
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const backendUrl = getBackendUrl();
      const name = String(formData.get("name") ?? "").trim();
      const rawAmount = formData.get("amount");
      const parsedAmount = rawAmount !== null && rawAmount !== "" ? Number(rawAmount) : NaN;

      const itemPayload = createDraftItems
        .filter((item) => item.name.trim() && item.amount !== "" && Number(item.amount) >= 0)
        .map((item, index) => ({
          name: item.name.trim(),
          amount: Number(item.amount),
          description: item.description?.trim() || "",
          isRequired: item.isRequired !== false,
          sortOrder: index,
        }));

      const effectiveAmount = itemPayload.length > 0
        ? itemPayload.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        : parsedAmount;

      if (!name || (!Number.isFinite(effectiveAmount) || effectiveAmount < 0) || (itemPayload.length === 0 && (!rawAmount || rawAmount === ""))) {
        throw new Error("Schedule name and either a total amount or at least one fee item are required.");
      }

      const response = await fetch(`${backendUrl}/api/admin/fees/schedules`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termId: formData.get("termId"),
          classId: formData.get("classId") || null,
          name,
          amount: effectiveAmount,
          items: itemPayload,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create fee schedule");
      }

      const result = await response.json();
      const created = result.feeSchedule ?? result;
      const newSchedule: FeeScheduleItem = {
        id: created.id,
        name: created.name,
        amount: created.amount,
        createdAt: created.createdAt,
        term: created.term,
        class: created.class,
      };

      setFeeScheduleItems((current) => [newSchedule, ...current]);
      setShowModal(false);
      setCreateDraftItems([]);
      setError(null);
      setSuccessModalMessage("A new fee schedule has been created successfully.");
      setSuccessModalOpen(true);
    } catch (err) {
      console.error("Error creating fee schedule:", err);
      setError(err instanceof Error ? err.message : "Failed to create fee schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId || !editFormData) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const backendUrl = getBackendUrl();

      const cleanedName = editFormData.name.trim();
      const parsedAmount = editFormData.amount !== "" ? Number(editFormData.amount) : NaN;

      const itemPayload = editDraftItems
        .filter((item) => item.name.trim() && item.amount !== "" && Number(item.amount) >= 0)
        .map((item, index) => ({
          name: item.name.trim(),
          amount: Number(item.amount),
          description: item.description?.trim() || "",
          isRequired: item.isRequired !== false,
          sortOrder: index,
        }));

      const effectiveAmount = itemPayload.length > 0
        ? itemPayload.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        : parsedAmount;

      if (!cleanedName || (!Number.isFinite(effectiveAmount) || effectiveAmount < 0) || (itemPayload.length === 0 && editFormData.amount === "")) {
        throw new Error("Schedule name and either a total amount or at least one fee item are required.");
      }

      const response = await fetch(`${backendUrl}/api/admin/fees/schedules/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanedName,
          amount: effectiveAmount,
          classId: editFormData.classId || null,
          items: itemPayload,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update fee schedule");
      }

      router.refresh();
      setEditingId(null);
      setEditFormData(null);
      setEditScheduleContext(null);
      setEditDraftItems([]);
    } catch (err) {
      console.error("Error updating fee schedule:", err);
      setEditError(err instanceof Error ? err.message : "Failed to update fee schedule");
    } finally {
        setEditSubmitting(false);
        playCloseTone();
      }
  };

  const startEdit = async (schedule: FeeScheduleItem) => {
    setEditingId(schedule.id);
    setEditFormData({
      name: schedule.name,
      amount: (schedule.amount / 100).toFixed(2),
      classId: schedule.class?.id || "",
    });
    setEditScheduleContext({
      termName: schedule.term.name,
      academicYearName: schedule.term.academicYear.name,
      className: schedule.class
        ? `${schedule.class.name}${schedule.class.arm ? ` ${schedule.class.arm}` : ""}`
        : "All classes",
    });
    setEditError(null);
    setEditDraftItems([]);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/fees/schedules/${schedule.id}/items`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        const items = Array.isArray(data?.items) ? data.items : [];
        setEditDraftItems(items.map((item: any) => ({
          id: item.id,
          name: item.name || "",
          amount: (Number(item.amount || 0) / 100).toFixed(2),
          description: item.description || "",
          isRequired: item.isRequired !== false,
          isNew: false,
        })));
      }
    } catch (error) {
      console.error("Error loading fee schedule items:", error);
    }

    playOpenTone();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/fees/schedules/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete fee schedule");
      }

      setFeeScheduleItems((current) => current.filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting fee schedule:", err);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete fee schedule");
    } finally {
      setDeleteLoading(false);
      playCloseTone();
    }
  };

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(terms.map((term) => term.academicYear.name)));
    return years.sort((a, b) => b.localeCompare(a));
  }, [terms]);

  // Default to the most recent academic year and its first term when the page loads
  useEffect(() => {
    if (!selectedAcademicYearName && yearOptions.length > 0) {
      const firstYear = yearOptions[0];
      setSelectedAcademicYearName(firstYear);
      const firstTerm = terms.find((t) => t.academicYear.name === firstYear);
      if (firstTerm) setTermFilter(firstTerm.id);
    }
  }, [yearOptions, terms, selectedAcademicYearName]);

  // Default selected academic year to first available (if any)
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const filteredTerms = useMemo(() => {
    if (!selectedAcademicYearName) return terms || [];
    return terms.filter((t) => t.academicYear.name === selectedAcademicYearName);
  }, [terms, selectedAcademicYearName]);

  const filteredSchedules = useMemo(() => {
    let filtered = feeScheduleItems;

    if (selectedAcademicYearName) {
      filtered = filtered.filter(
        (schedule) => (schedule.term.academicYear?.name || "") === selectedAcademicYearName,
      );
    }

    if (termFilter !== "ALL") {
      filtered = filtered.filter((schedule) => schedule.term.id === termFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((schedule) => {
        const classLabel = schedule.class
          ? `${schedule.class.name}${schedule.class.arm ? ` ${schedule.class.arm}` : ""}`
          : "all classes";
        return (
          schedule.name.toLowerCase().includes(query) ||
          schedule.term.name.toLowerCase().includes(query) ||
          schedule.term.academicYear.name.toLowerCase().includes(query) ||
          classLabel.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [feeScheduleItems, termFilter, searchQuery, selectedAcademicYearName]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalAmount = filteredSchedules.reduce((sum, s) => sum + Math.max(s.amount, 0), 0);
    const uniqueTerms = new Set(filteredSchedules.map(s => s.term.id));
    const uniqueClasses = new Set(filteredSchedules.filter(s => s.class).map(s => s.class!.id));
    
    return {
      total: totalAmount,
      scheduleCount: filteredSchedules.length,
      termCount: uniqueTerms.size,
      classCount: uniqueClasses.size,
    };
  }, [filteredSchedules]);

  const getScheduleItemTotal = (schedule: FeeScheduleItem) => {
    const itemTotal = (schedule.items ?? []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return itemTotal > 0 ? itemTotal : Math.max(schedule.amount, 0);
  };

  const formatStatMoney = (amount: number) => formatMoney(amount, currency);

  return (
    <>
      <ErrorModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Fee schedule saved"
        message={successModalMessage}
        type="success"
        confirmLabel="Okay"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <CalendarDays size={17} /> Academic operations
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Fee schedules</h1>
            <p className="mt-1 text-muted">Create and manage fee schedules by term, class, and billing category</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
            >
              <Search size={16} /> Search
            </button>
            <button
              type="button"
              onClick={() => { setShowModal(true); playOpenTone(); }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <span className="text-base leading-none">+</span> New schedule
            </button>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<TrendingUp size={18} />}
            label="Total amount"
            value={formatStatMoney(summaryStats.total)}
            detail={`${summaryStats.scheduleCount} schedule${summaryStats.scheduleCount !== 1 ? "s" : ""}`}
          />
          <Stat
            icon={<CheckCircle size={18} />}
            label="Terms covered"
            value={String(summaryStats.termCount)}
            detail="Academic terms"
          />
          <Stat
            icon={<AlertCircle size={18} />}
            label="Classes"
            value={String(summaryStats.classCount)}
            detail="Specific class schedules"
          />
          <Stat
            icon={<CalendarDays size={18} />}
            label="Visible schedules"
            value={String(filteredSchedules.length)}
            detail="Active filters"
          />
        </section>

        <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isSearchOpen ? "w-72 opacity-100" : "w-0 opacity-0"}`}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, term, year, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 text-brand" />
              <select
                value={selectedAcademicYearName}
                onChange={(e) => setSelectedAcademicYearName(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none"
              >
                <option value="">Session</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none"
              >
                <option value="ALL">Select term</option>
                {filteredTerms.map((term) => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex rounded-lg border border-border bg-surface p-1 text-sm">
            <button type="button" className="rounded-md bg-brand px-3 py-1.5 font-semibold text-white">All schedules</button>
          </div>
        </section>

        {/* Mobile list (mobile-only) */}
        <div className="sm:hidden space-y-3">
          {filteredSchedules.length === 0 ? (
            <div className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted">No fee schedules found for the selected filters</div>
          ) : (
            filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{schedule.name}</p>
                    <p className="text-sm text-muted">{schedule.term.name} • {schedule.term.academicYear.name}</p>
                    <p className="text-sm text-muted mt-1">{schedule.class ? `${schedule.class.name}${schedule.class.arm ? ` ${schedule.class.arm}` : ""}` : "All classes"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatStatMoney(getScheduleItemTotal(schedule))}</p>
                    <p className="text-sm text-muted mt-1">{new Date(schedule.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(schedule.items ?? []).slice(0, 3).map((item) => (
                    <span key={item.id} className="rounded-full border border-border bg-surface px-2 py-1 text-[10px] font-medium text-muted">
                      {item.name}
                    </span>
                  ))}
                  {(schedule.items?.length ?? 0) > 3 && (
                    <span className="rounded-full border border-border bg-surface px-2 py-1 text-[10px] font-medium text-muted">
                      +{(schedule.items?.length ?? 0) - 3}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button onClick={() => startEdit(schedule)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <Edit2 className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => { setDeleteAnimateState("enter"); setDeleteId(schedule.id); playOpenTone(); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table (desktop only) */}
        <div className="hidden sm:block overflow-hidden rounded-lg border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Schedule Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Term</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Academic Year</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Class</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Created</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                      No fee schedules found for the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="hover:bg-surface/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div>
                          <div>{schedule.name}</div>
                          {(schedule.items?.length ?? 0) > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {schedule.items!.slice(0, 3).map((item) => (
                                <span key={item.id} className="rounded-full border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] font-medium text-brand">
                                  {item.name}
                                </span>
                              ))}
                              {(schedule.items!.length > 3) && (
                                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
                                  +{schedule.items!.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {schedule.term.name}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {schedule.term.academicYear.name}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {schedule.class
                          ? `${schedule.class.name}${
                              schedule.class.arm ? ` ${schedule.class.arm}` : ""
                            }`
                          : "All classes"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {formatStatMoney(getScheduleItemTotal(schedule))}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(schedule.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => startEdit(schedule)}
                              className="flex items-center gap-2 inline-flex px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-background text-sm font-medium transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                setDeleteAnimateState("enter");
                                setDeleteId(schedule.id);
                                playOpenTone();
                              }}
                              className="inline-flex px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes classes_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes classes_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: `classes_modal_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-6 py-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand">
                  <CalendarDays size={15} /> Academic operations
                </div>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Create Fee Schedule</h2>
                <p className="mt-1 text-sm text-muted">Add a new fee schedule for a term. Leave class empty to apply to all students.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCloseTone();
                  setShowModal(false);
                  setError(null);
                  setCreateDraftItems([]);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-background"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Term *</label>
                  <select name="termId" required className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-brand">
                    <option value="">Select term</option>
                    {filteredTerms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} • {t.academicYear.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Class (optional)</label>
                  <select name="classId" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-brand">
                    <option value="">All classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Schedule Name *</label>
                  <input type="text" name="name" required placeholder="e.g., First Term Tuition or JSS1 Fees" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Amount ({currency}) *</label>
                  <input type="number" name="amount" required min="0" step="0.01" placeholder="0.00" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Fee items</h3>
                    <p className="text-xs text-muted">Add the fee lines that belong to this schedule</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addDraftItem(setCreateDraftItems)}
                    className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-semibold text-brand"
                  >
                    + Add item
                  </button>
                </div>

                {createDraftItems.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-muted">No extra fee items yet. Add one if this schedule should include itemized charges.</p>
                ) : (
                  createDraftItems.map((item, index) => (
                    <div key={`${item.name || "new-item"}-${index}`} className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_auto] sm:items-center">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => setCreateDraftItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: e.target.value } : entry))}
                        placeholder="Item name"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => setCreateDraftItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, amount: e.target.value } : entry))}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                      />
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => setCreateDraftItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: e.target.value } : entry))}
                        placeholder="Description"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => removeDraftItem(setCreateDraftItems, index)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button type="button" onClick={() => { playCloseTone(); setShowModal(false); setError(null); }} disabled={submitting} className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50">
                  {submitting ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Creating...</>) : (<>Create Schedule</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && editFormData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes classes_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes classes_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: `classes_modal_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-6 py-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand">
                  <CalendarDays size={15} /> Academic operations
                </div>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Edit Fee Schedule</h2>
                <p className="mt-1 text-sm text-muted">Update schedule name and amount</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCloseTone();
                  setEditingId(null);
                  setEditFormData(null);
                  setEditScheduleContext(null);
                  setEditError(null);
                  setEditDraftItems([]);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-background"
              >
                <X size={18} />
              </button>
            </div>

            {editScheduleContext && (
              <div className="mx-6 mt-6 grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Term</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{editScheduleContext.termName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Academic year</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{editScheduleContext.academicYearName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Class</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{editScheduleContext.className}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleEditSubmit} noValidate className="space-y-6 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Class (optional)</label>
                  <select
                    value={editFormData.classId}
                    onChange={(e) => {
                      const classId = e.target.value;
                      const selectedClass = classes.find((item) => item.id === classId);
                      setEditFormData({ ...editFormData, classId });
                      setEditScheduleContext((current) => current ? {
                        ...current,
                        className: selectedClass
                          ? `${selectedClass.name}${selectedClass.arm ? ` ${selectedClass.arm}` : ""}`
                          : "All classes",
                      } : current);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-brand"
                  >
                    <option value="">All classes</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}{item.arm ? ` ${item.arm}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Schedule Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g., First Term Tuition or JSS1 Fees"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Amount ({currency}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Fee items</h3>
                    <p className="text-xs text-muted">Add extra fee lines to this schedule</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditDraftItems((current) => [...current, { name: "", amount: "", description: "", isRequired: true, isNew: true }])}
                    className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-semibold text-brand"
                  >
                    + Add item
                  </button>
                </div>

                {editDraftItems.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-muted">No extra fee items on this schedule yet.</p>
                ) : (
                  editDraftItems.map((item, index) => (
                    <div key={`${item.id || "new-item"}-${index}`} className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_auto] sm:items-center">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => setEditDraftItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: e.target.value } : entry))}
                        placeholder="Item name"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => setEditDraftItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, amount: e.target.value } : entry))}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                      />
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => setEditDraftItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: e.target.value } : entry))}
                        placeholder="Description"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => setEditDraftItems((current) => current.filter((_, entryIndex) => entryIndex !== index))}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              {editError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-800">{editError}</p>
                </div>
              )}

              <div className="flex gap-3 border-t border-border bg-surface/80 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    playCloseTone();
                    setEditingId(null);
                    setEditFormData(null);
                    setEditScheduleContext(null);
                    setEditError(null);
                    setEditDraftItems([]);
                  }}
                  disabled={editSubmitting}
                  className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    <>Update Schedule</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes classes_delete_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes classes_delete_exit { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(220,38,38,0.16)]"
            style={{
              animation: `${deleteAnimateState === "enter" ? "classes_delete_enter" : "classes_delete_exit"} 320ms cubic-bezier(.2,.9,.2,1)`,
            }}
          >
            <div className="border-b border-border/70 bg-error/10 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-error/20 bg-error/10 shadow-sm">
                  <AlertCircle className="h-6 w-6 text-error" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Delete Schedule?</h2>
                  <p className="mt-1 text-sm text-muted">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              {deleteError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{deleteError}</p>
                </div>
              )}
              <p className="text-sm leading-6 text-foreground">
                You are about to permanently delete this fee schedule.
              </p>
            </div>

            <div className="flex gap-3 border-t border-border bg-surface/80 px-6 py-4">
                <button
                type="button"
                onClick={() => {
                  playCloseTone();
                  setDeleteId(null);
                  setDeleteError(null);
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface/90 disabled:opacity-50 text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteAnimateState("exit");
                  setTimeout(() => {
                    handleDelete();
                  }, 220);
                }}
                disabled={deleteLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: "#DC2626" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#991B1B")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#DC2626")}
              >
                {deleteLoading ? (
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
      <UserGuide
        guide={SCHEDULES_HELP}
      />
    </>
  );
}

function Stat({
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
    <div className="border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2 text-brand">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">
          {label}
        </span>
      </div>
      <div className="text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted">{detail}</div>
    </div>
  );
}

const SCHEDULES_HELP: PageHelpGuide = {
  title: "Managing Fee Schedules",
  overview: "Create and manage fee schedules for terms and classes. Use schedules to automate invoicing and apply consistent fees across students.",
  steps: [
    "Create a fee schedule and set an amount for a term. Leave class empty to apply to all students.",
    "Edit a schedule to update amounts or names — edits affect future invoices.",
    "Delete schedules you no longer need; this will not retroactively remove invoices already issued.",
    "Use the search, session and term filters to find specific schedules quickly.",
  ],
  commonTasks: [
    {
      title: "Create a New Schedule",
      description: "Click '+ New Schedule', choose term and class (optional), set the name and amount, then create.",
      tips: ["Use clear schedule names (e.g., 'First Term Tuition').", "Amounts are entered in the school's currency."],
    },
    {
      title: "Apply Schedule to All Classes",
      description: "Leave the Class field empty when creating a schedule to apply it to all students in the term.",
      tips: ["This is useful for school-wide fees like examination or registration charges."],
    },
  ],
  faqs: [
    { question: "Will deleting a schedule remove issued invoices?", answer: "No — deleting only removes the schedule; issued invoices remain unchanged." },
    { question: "How do I find schedules for a past academic year?", answer: "Use the Session dropdown to select the academic year, then choose the term." },
  ],
};