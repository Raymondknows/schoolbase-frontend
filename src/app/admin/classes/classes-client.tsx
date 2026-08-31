"use client";

import { getBackendUrl } from "@/lib/backend-url";




import { useMemo, useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorModal } from "@/components/ui/error-modal";
import { UserGuide } from "@/components/ui/user-guide";
import SubscriptionModal from "@/components/subscription-modal";
import AdminSkeleton from "@/components/ui/skeleton";
import { BookOpen, Users, Plus, Edit2, Search, School, AlertCircle, Trash2, LayoutGrid } from "lucide-react";

const CLASS_GUIDE = {
  title: "Classes Management",
  overview: "Manage school classes by phase (Early Years, Primary, Secondary) and arm (A, B, C). Classes organize students for fee invoicing and result publishing.",
  steps: [
    "Click 'Add class' to create a new class",
    "Enter class name (e.g., 'JSS 1', 'Primary 4'), phase, and arm if applicable",
    "Click 'Create' to save the class",
    "Classes appear in the list, color-coded by phase",
    "Click 'Edit' to modify class details or 'Delete' to remove a class"
  ],
  commonTasks: [
    {
      title: "Create a new class",
      description: "Use consistent naming conventions (e.g., 'JSS 1', 'Primary 4 A'). This helps with student enrollment and fee tracking."
    },
    {
      title: "Assign students to a class",
      description: "Go to the Students page and assign each student to their class. Students inherit fee terms from their class."
    },
    {
      title: "Filter classes by phase",
      description: "Use the phase tabs (Early Years, Primary, Secondary) to quickly see classes in each section."
    },
    {
      title: "Search for a class",
      description: "Use the search bar to find specific classes by name, arm, or phase."
    },
    {
      title: "Archive vs Delete",
      description: "Avoid deleting classes with students. Instead, mark them as inactive or archive them to maintain historical records."
    }
  ],
  faqs: [
    {
      question: "What phases are available?",
      answer: "Three phases: Early Years (preschool), Primary (ages 6-11), Secondary (ages 12+). Choose based on your school structure."
    },
    {
      question: "What is an 'Arm'?",
      answer: "An arm is a suffix for the class name, typically used when there are multiple classes at the same level (e.g., Primary 4 A, Primary 4 B, Primary 4 C)."
    },
    {
      question: "Can I rename a class?",
      answer: "Yes, click 'Edit' on the class row to modify the name, phase, or arm. Changes take effect immediately."
    },
    {
      question: "What happens if I delete a class?",
      answer: "Deleting a class removes it and all associated student enrollments. Use caution, as this may affect fee invoicing for those students."
    },
    {
      question: "How many classes can I create?",
      answer: "You can create unlimited classes. However, keep your structure manageable for easy administration."
    }
  ],
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
};

const PHASE_OPTIONS = [
  { value: "ALL", label: "All classes" },
  { value: "EARLY_YEARS", label: "Early Years" },
  { value: "PRIMARY", label: "Primary" },
  { value: "SECONDARY", label: "Secondary" },
];

function getPhaseLabel(phase: string) {
  return PHASE_OPTIONS.find((option) => option.value === phase)?.label ?? phase;
}

function getPhaseColor(phase: string): { bg: string; text: string; icon: string; row: string } {
  switch (phase) {
    case "EARLY_YEARS":
      return { bg: "bg-purple-100", text: "text-purple-800", icon: "text-purple-600", row: "border-l-4 border-l-purple-400 bg-background/5" };
    case "PRIMARY":
      return { bg: "bg-blue-100", text: "text-blue-800", icon: "text-blue-600", row: "border-l-4 border-l-blue-400 bg-background/5" };
    case "SECONDARY":
      return { bg: "bg-green-100", text: "text-green-800", icon: "text-green-600", row: "border-l-4 border-l-green-500 bg-background/5" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800", icon: "text-gray-600", row: "border-l-4 border-l-slate-400 bg-background/5" };
  }
}

export default function ClassesPageClient({ classes: initialClasses }: { classes: any[] }) {
  const [classes, setClasses] = useState<any[]>(initialClasses || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error'>('success');
  const [statusModalTitle, setStatusModalTitle] = useState<string | undefined>(undefined);
  const [statusModalMessage, setStatusModalMessage] = useState("");
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string; schoolName?: string } | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [activePhase, setActivePhase] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [className, setClassName] = useState("");
  const [classPhase, setClassPhase] = useState("PRIMARY");
  const [classArm, setClassArm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [deletingClassName, setDeletingClassName] = useState("");
  const [deleteAnimateState, setDeleteAnimateState] = useState<"enter" | "exit">("enter");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      const [response, verifyResponse] = await Promise.all([
        fetch(`${backendUrl}/api/admin/classes/data`, {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`${backendUrl}/api/admin/verify`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      let schoolNameToUse = "";
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json().catch(() => null);
        if (verifyData?.authenticated && verifyData.session?.schoolId) {
          try {
            const schoolResponse = await fetch(`${backendUrl}/api/admin/school/${verifyData.session.schoolId}`, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });
            if (schoolResponse.ok) {
              const schoolData = await schoolResponse.json().catch(() => null);
              schoolNameToUse = schoolData?.name || "";
            }
          } catch (err) {
            console.error("Error fetching school name:", err);
          }
        }
      }

      if (!response.ok) {
        if (response.status === 403) {
          const errorBody = await response.json().catch(() => null);
          if (errorBody?.code === 'SUBSCRIPTION_INACTIVE') {
            setSubscriptionBlocked({
              reason: errorBody.reason || 'Your school subscription is not active',
              schoolName: schoolNameToUse || undefined,
            });
            setSchoolName(schoolNameToUse);
            setLoading(false);
            return;
          }
        }
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      setSchoolName(schoolNameToUse);
      setClasses(data.classes || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = useMemo(() => {
    let visible = classes;

    if (activePhase !== "ALL") {
      visible = visible.filter((classItem) => classItem.phase === activePhase);
    }

    if (!searchQuery.trim()) {
      return visible;
    }

    const query = searchQuery.toLowerCase();
    return visible.filter((classItem) => {
      return (
        classItem.name.toLowerCase().includes(query) ||
        (classItem.arm ?? "").toLowerCase().includes(query) ||
        classItem.phase.toLowerCase().includes(query)
      );
    });
  }, [classes, activePhase, searchQuery]);

  const getPhaseCount = (phase: string) => {
    if (phase === "ALL") return classes.length;
    return classes.filter((classItem) => classItem.phase === phase).length;
  };

  const openModal = (classItem?: any) => {
    if (classItem) {
      setSelectedClass(classItem);
      setClassName(classItem.name ?? "");
      setClassPhase(classItem.phase ?? "PRIMARY");
      setClassArm(classItem.arm ?? "");
    } else {
      setSelectedClass(null);
      setClassName("");
      setClassPhase("PRIMARY");
      setClassArm("");
    }
    setIsOpen(true);
    playOpenTone();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      const backendUrl = getBackendUrl();

      const payload = {
        name: className,
        phase: classPhase,
        arm: classArm.trim() === "" ? null : classArm.trim(),
      };

      const url = selectedClass
        ? `${backendUrl}/api/admin/classes/${selectedClass.id}`
        : `${backendUrl}/api/admin/classes`;

      const method = selectedClass ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save class');
      }

      await fetchClasses();
      setIsOpen(false);
      setStatusModalType('success');
      setStatusModalTitle(selectedClass ? 'Class updated' : 'Class created');
      setStatusModalMessage(selectedClass ? 'Class updated successfully.' : 'Class created successfully.');
      setStatusModalOpen(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (classItem: any) => {
    setDeletingClassId(classItem.id);
    setDeletingClassName(classItem.name ?? "this class");
    setDeleteAnimateState("enter");
    setDeleteModalOpen(true);
    playOpenTone();
  };

  const closeDeleteModal = () => {
    setDeleteAnimateState("exit");
    playCloseTone();
    setTimeout(() => {
      setDeleteModalOpen(false);
      setDeletingClassId(null);
      setDeletingClassName("");
    }, 320);
  };

  const handleDelete = async (classItem: any) => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/admin/classes/${classItem.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete class');
      }

      // Refresh the classes list
      const classesResponse = await fetch(`${backendUrl}/api/admin/classes/data`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (classesResponse.ok) {
        const data = await classesResponse.json();
        setClasses(data.classes || []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteClass = async () => {
    if (!deletingClassId) return;

    setIsDeleting(true);
    try {
      await handleDelete({ id: deletingClassId });
      setIsOpen(false);
      closeDeleteModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
    } finally {
      setIsDeleting(false);
    }
  };

  if (subscriptionBlocked) {
    return <SubscriptionModal reason={subscriptionBlocked.reason} schoolName={subscriptionBlocked.schoolName || schoolName || 'Your School'} />;
  }

  return (
    <>
      {loading && (
        <div className="min-h-screen bg-background">
          <AdminSkeleton />
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-brand">
                <LayoutGrid size={17} /> School Structure
              </div>
              <h1 className="mt-2 text-3xl font-bold text-foreground">Classes</h1>
              <p className="mt-1 text-muted">Manage school classes, phases, and student assignments</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className={`overflow-hidden transition-all duration-300 ease-out ${isSearchOpen ? "w-72 opacity-100" : "w-0 opacity-0"}`}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search classes..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none transition focus:border-brand"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
              >
                <Search size={16} /> Search
              </button>
              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                <Plus size={17} /> Add class
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-error/20 bg-error/10 p-4">
              <p className="text-sm text-error">Error: {error}</p>
            </div>
          )}

          {/* Summary Stats Grid */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ClassStat
              icon={<BookOpen size={18} />}
              label="Total Classes"
              value={String(classes.length)}
              detail="Classes created"
            />
            <ClassStat
              icon={<Users size={18} />}
              label="Total Students"
              value={String(classes.reduce((sum, c) => sum + (c._count?.pupils ?? 0), 0))}
              detail="Enrolled across classes"
            />
            <ClassStat
              icon={<School size={18} />}
              label="Total Subjects"
              value={String(classes.reduce((sum, c) => sum + (c._count?.subjectClasses ?? 0), 0))}
              detail="Assigned to classes"
            />
            <ClassStat
              icon={<LayoutGrid size={18} />}
              label="School Phases"
              value={String(new Set(classes.map((c) => c.phase)).size)}
              detail="Active phases"
            />
          </section>

          {/* Phase Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted self-center">School Phase:</span>
            {PHASE_OPTIONS.map((phaseOption) => {
              const isActive = activePhase === phaseOption.value;
              const count = getPhaseCount(phaseOption.value);

              return (
                <button
                  key={phaseOption.value}
                  type="button"
                  onClick={() => setActivePhase(phaseOption.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "bg-brand text-white"
                      : "bg-background text-muted hover:bg-surface"
                  }`}
                >
                  {phaseOption.label}
                  <span className="ml-1 inline-block">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="mb-4 text-sm text-muted">
            Showing {filteredClasses.length} class{filteredClasses.length === 1 ? "" : "es"} in {getPhaseLabel(activePhase)}
          </div>

          {/* Classes Grid/Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {/* Desktop Table */}
            <table className="hidden sm:table w-full text-left text-sm">
              <thead className="border-b border-border/70 bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Class</th>
                  <th className="px-3 py-2 font-semibold">Phase</th>
                  <th className="px-3 py-2 font-semibold">Arm</th>
                  <th className="px-3 py-2 font-semibold">Pupils</th>
                  <th className="px-3 py-2 font-semibold">Subjects</th>
                  <th className="px-3 py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((classItem) => {
                    const colors = getPhaseColor(classItem.phase);
                    return (
                      <tr key={classItem.id} className={`transition-colors hover:bg-background/50 ${colors.row}`}>
                        <td className="px-3 py-2 font-medium text-foreground">{classItem.name}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {getPhaseLabel(classItem.phase)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-muted">{classItem.arm ?? "—"}</td>
                        <td className="px-3 py-2 text-sm text-foreground font-medium">{classItem._count?.pupils ?? 0}</td>
                        <td className="px-3 py-2 text-sm text-foreground font-medium">{classItem._count?.subjectClasses ?? 0}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openModal(classItem)}
                              className="flex items-center gap-2 inline-flex px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-background text-sm font-medium transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(classItem)}
                              className="inline-flex px-3 py-1.5 rounded-lg border border-error/20 bg-error/10 hover:bg-error/20 text-error text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted">
                      No classes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile List */}
            <div className="sm:hidden space-y-2 p-4">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((classItem) => {
                  const colors = getPhaseColor(classItem.phase);
                  return (
                    <button
                      key={classItem.id}
                      onClick={() => openModal(classItem)}
                      className="block w-full text-left rounded-lg border border-border bg-surface p-4 hover:border-border/80 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">{classItem.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              {getPhaseLabel(classItem.phase)}
                            </span>
                            {classItem.arm && (
                              <span className="text-xs text-muted">Arm {classItem.arm}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-muted mb-1">Pupils</p>
                          <p className="text-sm font-bold text-foreground">{classItem._count?.pupils ?? 0}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center text-sm text-muted py-8">
                  No classes found.
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteModalOpen && (
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
                      <h2 className="text-lg font-semibold text-foreground">Delete Class?</h2>
                      <p className="mt-1 text-sm text-muted">This action cannot be undone.</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <p className="text-sm leading-6 text-muted">
                    You are about to permanently delete <strong>“{deletingClassName}”</strong>.
                  </p>
                  <div className="mt-4 rounded-lg border border-error/20 bg-error/10 p-3">
                    <p className="text-xs text-error">
                      <strong>Warning:</strong> This will remove the class from the system and may affect related student assignments.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-border/70 bg-background px-6 py-4">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={isDeleting}
                    className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50 text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteClass}
                    disabled={isDeleting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-error px-4 py-2.5 text-sm font-medium text-white hover:bg-error/90 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
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

          {/* Modal */}
          {isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
              <style>{`
                @keyframes classes_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
                @keyframes classes_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
              `}</style>

              <div
                className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
                style={{ animation: `classes_modal_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
              >
                <div className="border-b border-border/70 bg-brand/10 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {selectedClass ? "Edit class" : "Add new class"}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {selectedClass
                          ? "Update the class details and phase assignment."
                          : "Create a new class group for your school."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playCloseTone();
                        setIsOpen(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-background transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 px-6 py-6"
                >
                  {selectedClass && <input type="hidden" name="id" value={selectedClass.id} />}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Class name
                      </label>
                      <input
                        name="name"
                        value={className}
                        onChange={(event) => setClassName(event.target.value)}
                        required
                        placeholder="Primary 1"
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phase
                      </label>
                      <select
                        name="phase"
                        value={classPhase}
                        onChange={(event) => setClassPhase(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        {PHASE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Arm / section
                    </label>
                    <input
                      name="arm"
                      value={classArm}
                      onChange={(event) => setClassArm(event.target.value)}
                      placeholder="A"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="flex justify-between gap-3 pt-4 border-t border-border">
                    <div>
                      {selectedClass && (
                        <button
                          type="button"
                          onClick={() => openDeleteModal(selectedClass)}
                          className="px-4 py-2 rounded-lg border border-error/20 bg-error/10 hover:bg-error/20 text-error text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          playCloseTone();
                          setIsOpen(false);
                        }}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-background transition-colors"
                      >
                        Cancel
                      </button>
                      <Button type="submit">{selectedClass ? "Save changes" : "Add class"}</Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      <UserGuide guide={CLASS_GUIDE} />
      <ErrorModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        type={statusModalType}
        title={statusModalTitle}
        message={statusModalMessage}
        confirmLabel="Okay"
      />
    </>
  );
}

function ClassStat({
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
    // ignore it
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
