"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorModal } from "@/components/ui/error-modal";
import { UserGuide } from "@/components/ui/user-guide";
import { getBackendUrl } from "@/lib/backend-url";
import { X, Plus, Search, UserPlus, AlertCircle, Trash2 } from "lucide-react";

function parseApiErrorMessage(body: any, status: number): string {
  if (!body) return `Server error: ${status}`;

  const payload = body.error ?? body.message ?? body;
  if (typeof payload === 'string' && payload.trim()) return payload;

  if (typeof payload === 'object') {
    if (payload === null) return `Server error: ${status}`;
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    if (Object.keys(payload).length > 0) return JSON.stringify(payload);
  }

  return `Server error: ${status}`;
}

const TEACHER_GUIDE = {
  title: "Teachers Management",
  overview: "Manage teacher profiles, class assignments, and subject allocations. Teachers can mark attendance, enter results, and communicate with parents.",
  steps: [
    "Click 'Add teacher' to create a new teacher account",
    "Fill in teacher details: name, email, and password",
    "Assign the teacher to classes and subjects",
    "Teacher account is created and they receive login credentials via email",
    "Click 'Details' on any teacher to view or edit their assignments"
  ],
  commonTasks: [
    {
      title: "Add a new teacher",
      description: "Use a professional email (not personal Gmail) for better email deliverability. Include the teacher's phone number in the form if available."
    },
    {
      title: "Assign a teacher to a class",
      description: "Teachers can be assigned to multiple classes and subjects. This allows flexibility for specialists or part-time teachers."
    },
    {
      title: "Edit teacher assignments",
      description: "Click 'Details' on any teacher row to view their current classes and subjects. Make updates and save."
    },
    {
      title: "Search for a teacher",
      description: "Use the search bar to find teachers by name, email, class name, or subject. Searches are case-insensitive."
    },
    {
      title: "View teacher statistics",
      description: "The header shows total teachers assigned to classes and subjects. This helps track staffing levels."
    }
  ],
  faqs: [
    {
      question: "Can I assign a teacher to multiple classes?",
      answer: "Yes, teachers can be assigned to multiple classes. This is useful for specialists or teachers who teach multiple grades."
    },
    {
      question: "Can I assign a teacher to multiple subjects?",
      answer: "Yes, teachers can teach multiple subjects. For example, a teacher can teach both English and Literature."
    },
    {
      question: "What happens when I delete a teacher?",
      answer: "Deleting a teacher removes them from all class and subject assignments. Their account is deactivated but historical records remain for audit purposes."
    },
    {
      question: "Can teachers reset their passwords?",
      answer: "Teachers can reset their passwords from the login page. As an admin, you can also reset passwords from the teacher details page."
    },
    {
      question: "How do I bulk import teachers?",
      answer: "Currently, teachers are added one at a time. For bulk imports, contact support or use the admin dashboard with CSV upload (coming soon)."
    }
  ],
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
};

export default function TeachersPageClient({
  classes,
  subjects,
  teachers,
}: {
  classes: any[];
  subjects: any[];
  teachers: any[];
}) {
  const normalizeTeacher = (teacher: any) => ({
    ...teacher,
    id: teacher.id ?? teacher._id ?? teacher.email ?? `teacher-${Math.random().toString(36).slice(2, 10)}`,
    teacherClasses: teacher.teacherClasses ?? [],
    teacherSubjects: teacher.teacherSubjects ?? [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [teacherList, setTeacherList] = useState(() => teachers.map(normalizeTeacher));
  const [isTransitioning, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState<string>("Success");
  const [successModalMessage, setSuccessModalMessage] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  const [deletingTeacherName, setDeletingTeacherName] = useState("");
  const [deleteAnimateState, setDeleteAnimateState] = useState<"enter" | "exit">("enter");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setTeacherList(teachers.map(normalizeTeacher));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    const source = teacherList;
    if (!searchQuery.trim()) return source;
    const query = searchQuery.toLowerCase();
    return source.filter((teacher) => {
      const classNames = teacher.teacherClasses
        .map((assignment: any) => assignment.class?.name ?? "")
        .join(" ")
        .toLowerCase();
      const subjectNames = teacher.teacherSubjects
        .map((assignment: any) => assignment.subject?.name ?? "")
        .join(" ")
        .toLowerCase();
      return (
        teacher.name.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        classNames.includes(query) ||
        subjectNames.includes(query)
      );
    });
  }, [teacherList, searchQuery]);

  const openDeleteModal = (teacher: any) => {
    setDeletingTeacherId(teacher.id);
    setDeletingTeacherName(teacher.name ?? "this teacher");
    setDeleteAnimateState("enter");
    setDeleteModalOpen(true);
    playOpenTone();
  };

  const closeDeleteModal = () => {
    setDeleteAnimateState("exit");
    playCloseTone();
    setTimeout(() => {
      setDeleteModalOpen(false);
      setDeletingTeacherId(null);
      setDeletingTeacherName("");
    }, 320);
  };

  const handleDeleteTeacher = async () => {
    if (!deletingTeacherId) return;

    setIsDeleting(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/teachers/${deletingTeacherId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(parseApiErrorMessage(errorBody, response.status));
      }

      closeDeleteModal();
      window.location.reload();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        setShowErrorModal(true);
      } else {
        setErrorMessage("An unexpected error occurred while deleting the teacher.");
        setShowErrorModal(true);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="w-full">
      <div className="mb-4 text-sm text-brand">
        <Link href="/admin" className="hover:underline">
          ← Admin
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground">Teachers</h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            {teacherList.length} teacher{teacherList.length === 1 ? "" : "s"} assigned to classes and subjects.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center">
          {/* Animated Search Panel - slides out on same line */}
          <div className={`overflow-hidden transition-all duration-300 ease-out flex-shrink-0 ${isSearchOpen ? "w-72 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-full"}`}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, class, or subject..."
              className="w-full rounded-lg border-2 border-[#0A66C2] bg-background px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#0A66C2]"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsSearchOpen((open) => !open)}
            className="h-9 w-full rounded-md border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0858a8] sm:w-auto"
          >
            <Search className="h-4 w-4" />
            {isSearchOpen ? "Close Search" : "Search Teacher"}
          </Button>
          <Button
            onClick={() => {
              setIsOpen(true);
              playOpenTone();
            }}
            className="h-9 w-full rounded-md border border-[#0A66C2] bg-[#0A66C2] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#0858a8] sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            Add teacher
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {/* Desktop Table */}
        <table className="hidden sm:table w-full text-left text-sm">
          <thead className="border-b border-border bg-background text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Classes</th>
              <th className="px-4 py-2 font-medium">Subjects</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher, index) => (
                <tr key={teacher.id ?? `teacher-${index}`} className="border-t border-border hover:bg-background/50 transition-colors">
                  <td className="px-4 py-2 font-medium text-foreground">{teacher.name}</td>
                  <td className="px-4 py-2 text-muted">{teacher.email}</td>
                  <td className="px-4 py-2 text-sm text-muted">
                    { (teacher.teacherClasses?.length ?? 0) > 0 ? (
                      <span>{teacher.teacherClasses.length} class{teacher.teacherClasses.length === 1 ? "" : "es"}</span>
                    ) : (
                      <span>No classes</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted">
                    { (teacher.teacherSubjects?.length ?? 0) > 0 ? (
                      <span>{teacher.teacherSubjects.length} subject{teacher.teacherSubjects.length === 1 ? "" : "s"}</span>
                    ) : (
                      <span>No subjects</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs px-2 py-1"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        playOpenTone();
                      }}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-muted">
                  No teachers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile List */}
        <div className="sm:hidden space-y-2 p-4">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher, index) => (
              <button
                key={teacher.id ?? `teacher-mobile-${index}`}
                onClick={() => {
                  setSelectedTeacher(teacher);
                  playOpenTone();
                }}
                className="block w-full text-left rounded-lg border border-border bg-surface px-3 py-2 hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{teacher.name}</p>
                  </div>
                  <div className="flex-shrink-0 text-right ml-2">
                    <p className="text-xs text-muted">
                      {teacher.teacherClasses.length} class{teacher.teacherClasses.length === 1 ? "" : "es"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-sm text-muted py-8">
              No teachers found.
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes teachers_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes teachers_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: `teachers_modal_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="border-b border-border/70 bg-brand/10 px-6 py-5">
              <div className="mb-0 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Add teacher</h2>
                  <p className="mt-2 text-sm text-muted">
                    Create a teacher account and assign classes and subjects in one place.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playCloseTone();
                    setIsOpen(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
                  aria-label="Close add teacher modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement | null;
                const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement | null;
                const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement | null;
                if (!nameInput || !emailInput || !passwordInput) {
                  setErrorMessage('Form fields not found. Please try again.');
                  setShowErrorModal(true);
                  return;
                }

                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();

                if (!name || !email || !password) {
                  setErrorMessage('Please fill all required fields.');
                  setShowErrorModal(true);
                  return;
                }

                const classIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="classIds"]:checked'))
                  .map((input) => input.value);

                const subjectIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="subjectIds"]:checked'))
                  .map((input) => input.value);

                const assignedTeacherClasses = classIds.map((classId) => {
                  const classItem = classes.find((item) => item.id === classId);
                  return {
                    classId,
                    class: classItem ? { id: classItem.id, name: classItem.name, arm: classItem.arm } : null,
                  };
                });

                const assignedTeacherSubjects = subjectIds.map((subjectId) => {
                  const subject = subjects.find((item) => item.id === subjectId);
                  return {
                    subjectId,
                    subject: subject ? { id: subject.id, name: subject.name } : null,
                  };
                });

                const backendUrl = getBackendUrl();
                setIsSaving(true);
                try {
                  console.log('Creating teacher:', { name, email, classIds, subjectIds });

                  const response = await fetch(`${backendUrl}/api/admin/teachers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      name,
                      email,
                      password,
                      classIds,
                      subjectIds,
                    }),
                  });

                  if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(parseApiErrorMessage(errorBody, response.status));
                  }

                  const data = await response.json();
                  console.log('Teacher created:', data);
                  const createdTeacher = data?.teacher ?? data;
                  if (!createdTeacher || !createdTeacher.id) {
                    throw new Error('Unexpected response from server when creating teacher.');
                  }
                  setTeacherList((current) => [
                    ...current,
                    normalizeTeacher({
                      ...createdTeacher,
                      teacherClasses: assignedTeacherClasses,
                      teacherSubjects: assignedTeacherSubjects,
                    }),
                  ]);
                  setIsOpen(false);
                  setErrorMessage(null);
                  setSuccessModalTitle('Teacher added');
                  setSuccessModalMessage(`${createdTeacher?.name || name} has been added successfully.`);
                  setShowSuccessModal(true);
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    setErrorMessage(error.message);
                  } else {
                    setErrorMessage('An unexpected error occurred. Please try again.');
                  }
                  setShowErrorModal(true);
                } finally {
                  setIsSaving(false);
                }
              }}
              className="space-y-4 px-6 py-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Full name
                  <input
                    name="name"
                    required
                    placeholder="Aisha Bello"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm font-medium">
                  Email address
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="aisha@example.com"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="text-sm font-medium">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Create a secure password"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <fieldset className="text-sm font-medium">
                  <legend>Assign classes</legend>
                  <div className="mt-1 max-h-32 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
                    {classes.map((classItem) => (
                      <label key={classItem.id} className="flex cursor-pointer items-center gap-2 font-normal text-foreground">
                        <input
                          type="checkbox"
                          name="classIds"
                          value={classItem.id}
                          className="h-4 w-4 accent-brand"
                        />
                        <span>{classItem.name}{classItem.arm ? ` ${classItem.arm}` : ""}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="text-sm font-medium">
                  <legend>Assign subjects</legend>
                  <div className="mt-1 max-h-32 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex cursor-pointer items-center gap-2 font-normal text-foreground">
                        <input
                          type="checkbox"
                          name="subjectIds"
                          value={subject.id}
                          className="h-4 w-4 accent-brand"
                        />
                        <span>{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving} className="inline-flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    "Save teacher"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTeacher && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes teachers_modal_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes teachers_modal_exit  { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
            style={{ animation: `teachers_modal_enter 320ms cubic-bezier(.2,.9,.2,1)` }}
          >
            <div className="border-b border-border/70 bg-brand/10 px-6 py-5">
              <div className="mb-0 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Edit teacher</h2>
                  <p className="mt-2 text-sm text-muted">
                    Update teacher information and assign classes and subjects.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openDeleteModal(selectedTeacher)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
                    aria-label="Delete teacher"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playCloseTone();
                      setSelectedTeacher(null);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                startTransition(async () => {
                  try {
                    const idInput = form.querySelector('input[name="id"]') as HTMLInputElement | null;
                    const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement | null;
                    const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement | null;
                    const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement | null;
                    if (!idInput || !nameInput || !emailInput) {
                      throw new Error('Form fields not found. Please try again.');
                    }

                    const id = idInput.value.trim();
                    const name = nameInput.value.trim();
                    const email = emailInput.value.trim();
                    const password = passwordInput?.value.trim() || '';

                    if (!id) throw new Error('Teacher ID is missing');
                    if (!name) throw new Error('Name is required');
                    if (!email) throw new Error('Email is required');

                    const classIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="classIds"]:checked'))
                      .map((input) => input.value);

                    const subjectIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="subjectIds"]:checked'))
                      .map((input) => input.value);

                    const backendUrl = getBackendUrl();
                    console.log('Updating teacher:', { id, name, email, classIds, subjectIds });

                    const body: any = {
                      name,
                      email,
                      classIds,
                      subjectIds,
                    };

                    if (password) {
                      body.password = password;
                    }

                    const response = await fetch(`${backendUrl}/api/admin/teachers/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify(body),
                    });

                    if (!response.ok) {
                      const errorBody = await response.json().catch(() => null);
                      throw new Error(parseApiErrorMessage(errorBody, response.status));
                    }

                    const data = await response.json();
                    console.log('Teacher updated:', data);
                    setSelectedTeacher(null);
                    setErrorMessage(null);
                    window.location.reload();
                  } catch (error: unknown) {
                    if (error instanceof Error) {
                      setErrorMessage(error.message);
                      setShowErrorModal(true);
                    } else {
                      setErrorMessage("An unexpected error occurred. Please try again.");
                      setShowErrorModal(true);
                    }
                  }
                });
              }}
              className="space-y-4 px-6 py-6"
            >
              <input type="hidden" name="id" value={selectedTeacher.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Full name
                  <input
                    name="name"
                    defaultValue={selectedTeacher.name}
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm font-medium">
                  Email address
                  <input
                    name="email"
                    type="email"
                    defaultValue={selectedTeacher.email}
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="text-sm font-medium">
                Password (leave blank to keep current)
                <input
                  name="password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <fieldset className="text-sm font-medium">
                  <legend>Assign classes</legend>
                  <div className="mt-1 max-h-32 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
                    {classes.map((classItem) => (
                      <label key={classItem.id} className="flex cursor-pointer items-center gap-2 font-normal text-foreground">
                        <input
                          type="checkbox"
                          name="classIds"
                          value={classItem.id}
                          defaultChecked={selectedTeacher.teacherClasses.some((t: any) => t.classId === classItem.id)}
                          className="h-4 w-4 accent-brand"
                        />
                        <span>{classItem.name}{classItem.arm ? ` ${classItem.arm}` : ""}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="text-sm font-medium">
                  <legend>Assign subjects</legend>
                  <div className="mt-1 max-h-32 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
                    {subjects.map((subject) => (
                      <label key={subject.id} className="flex cursor-pointer items-center gap-2 font-normal text-foreground">
                        <input
                          type="checkbox"
                          name="subjectIds"
                          value={subject.id}
                          defaultChecked={selectedTeacher.teacherSubjects.some((t: any) => t.subjectId === subject.id)}
                          className="h-4 w-4 accent-brand"
                        />
                        <span>{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Save teacher</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`
            @keyframes teacher_delete_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }
            @keyframes teacher_delete_exit { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }
          `}</style>

          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(220,38,38,0.16)]"
            style={{
              animation: `${deleteAnimateState === "enter" ? "teacher_delete_enter" : "teacher_delete_exit"} 320ms cubic-bezier(.2,.9,.2,1)`,
            }}
          >
            <div className="border-b border-border/70 bg-error/10 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-error/20 bg-error/10 shadow-sm">
                  <AlertCircle className="h-6 w-6 text-error" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Delete Teacher?</h2>
                  <p className="mt-1 text-sm text-muted">This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-muted">
                You are about to permanently delete <strong>“{deletingTeacherName}”</strong>.
              </p>
              <div className="mt-4 rounded-lg border border-error/20 bg-error/10 p-3">
                <p className="text-xs text-error">
                  <strong>Warning:</strong> This will remove the teacher from assigned classes and subjects.
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
                onClick={handleDeleteTeacher}
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

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          setErrorMessage(null);
        }}
        title="Unable to Add Teacher"
        message={errorMessage ?? "An unexpected error occurred. Please try again."}
        type="error"
        confirmLabel="Close"
      />

      <ErrorModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successModalTitle}
        message={successModalMessage}
        type="success"
        confirmLabel="Okay"
      />
      </div>
      <UserGuide guide={TEACHER_GUIDE} />
    </>
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
