'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Search,
  Users,
  X,
} from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import { resolveFileUrl } from '@/lib/api-client';

interface Class {
  id: string;
  name: string;
  arm?: string;
  phase?: string;
  studentCount: number;
}

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  email: string;
  status?: string;
  photoUrl?: string | null;
}

type ViewMode = 'grid' | 'list';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_ITEMS_PER_PAGE = 20;

export default function ClassPage() {
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    async function loadClasses() {
      try {
        setLoading(true);
        setError(null);

        const backendUrl = getBackendUrl();

        const res = await fetch(`${backendUrl}/api/teacher/classes`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to load classes');
        }

        const data = await res.json();
        const loadedClasses: Class[] = Array.isArray(data.classes)
          ? data.classes
          : [];

        setClasses(loadedClasses);

        const classId = searchParams.get('id');

        if (classId) {
          const matchingClass = loadedClasses.find(
            (cls) => cls.id === classId,
          );

          if (matchingClass) {
            setSelectedClass(matchingClass);
          } else if (loadedClasses.length > 0) {
            setSelectedClass(loadedClasses[0]);
          } else {
            setSelectedClass(null);
          }
        } else if (loadedClasses.length > 0) {
          setSelectedClass(loadedClasses[0]);
        } else {
          setSelectedClass(null);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load classes';

        setError(message);
        setClasses([]);
        setSelectedClass(null);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedClass?.id) {
      return;
    }

    async function loadStudents() {
      try {
        setStudentsLoading(true);
        setError(null);

        const backendUrl = getBackendUrl();

        const res = await fetch(
          `${backendUrl}/api/teacher/classes/${selectedClass!.id}/students`,
          {
            credentials: 'include',
          },
        );

        if (!res.ok) {
          throw new Error('Failed to load students');
        }

        const data = await res.json();

        const normalizedStudents: Student[] = (data.students || []).map(
          (student: Record<string, unknown>) => ({
            ...student,
            name:
              (student.name as string) ||
              [student.firstName, student.lastName]
                .filter(Boolean)
                .join(' ') as string ||
              'Unknown student',
            admissionNo: (student.admissionNo as string) || '',
            email: (student.email as string) || '',
            photoUrl: (student.photoUrl as string) || null,
          }),
        );

        setStudents(normalizedStudents);
        setCurrentPage(1);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load students';

        setError(message);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    }

    loadStudents();
  }, [selectedClass]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const name = student.name.toLowerCase();
      const admissionNo = (student.admissionNo || '').toLowerCase();
      const email = (student.email || '').toLowerCase();

      return (
        name.includes(query) ||
        admissionNo.includes(query) ||
        email.includes(query)
      );
    });
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    const total = students.length;

    const active = students.filter(
      (student) => student.status !== 'INACTIVE',
    ).length;

    const inactive = students.filter(
      (student) => student.status === 'INACTIVE',
    ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [students]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / itemsPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStudents = filteredStudents.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const startItem =
    filteredStudents.length === 0
      ? 0
      : (safeCurrentPage - 1) * itemsPerPage + 1;

  const endItem = Math.min(
    safeCurrentPage * itemsPerPage,
    filteredStudents.length,
  );

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const getStudentStatus = (student: Student) =>
    student.status === 'INACTIVE' ? 'Inactive' : 'Active';

  const getStudentInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'NA';

  if (loading) {
    return (
      <main className="min-h-screen pb-12">
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded-lg bg-surface" />
            <div className="h-4 w-72 animate-pulse rounded bg-surface" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse border border-border bg-surface" />
            ))}
          </div>
          <div className="h-96 animate-pulse border border-border bg-surface" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <BookOpen className="h-[17px] w-[17px]" /> Teacher workspace
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">My Class</h1>
          <p className="mt-1 text-muted">View your students and manage your class roster.</p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">
              Unable to load class information
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Class selector / class identity */}
      <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Selected Class
          </p>

          {selectedClass ? (
            <>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                {selectedClass.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {selectedClass.arm && (
                  <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                    {selectedClass.arm}
                  </span>
                )}
                {selectedClass.phase && (
                  <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                    {selectedClass.phase}
                  </span>
                )}
                <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                  {selectedClass.studentCount} students
                </span>
              </div>
            </>
          ) : (
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              No class selected
            </h2>
          )}
        </div>

        {classes.length > 1 && (
            <div className="w-full sm:w-64">
              <label
                htmlFor="class-selector"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                Class
              </label>

              <div className="relative">
                <select
                  id="class-selector"
                  value={selectedClass?.id || ''}
                  onChange={(event) => {
                    const cls = classes.find(
                      (item) => item.id === event.target.value,
                    );

                    setSelectedClass(cls || null);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                    className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-sm font-semibold text-foreground outline-none transition focus:border-brand"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                      {cls.arm ? ` - ${cls.arm}` : ''}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          )}
      </section>

      {/* Stats */}
      {selectedClass && (
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
                  {stats.total}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted">
              Students assigned to this class
            </p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                <CheckCircle className="h-5 w-5 text-violet-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Active Students
                </p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {stats.active}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted">
              Currently active in the class
            </p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Users className="h-5 w-5 text-amber-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Inactive Students
                </p>

                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {stats.inactive}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted">
              Currently marked inactive
            </p>
          </article>
        </section>
      )}

      {/* Students */}
      {selectedClass && (
        <section className="border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Students
              </h2>

              <p className="mt-1 text-sm text-muted">
                View and search students in this class.
              </p>
            </div>

            <div className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {students.length}
              </span>{' '}
              {students.length === 1 ? 'student' : 'students'}
            </div>
          </div>

          {studentsLoading ? (
            <div className="mt-5 space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-2xl bg-background"
                />
              ))}
            </div>
          ) : students.length > 0 ? (
            <>
              {/* Controls */}
              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search students by name, admission number, or email..."
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:bg-surface hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border bg-background p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      aria-label="List view"
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        viewMode === 'list'
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                      <span>List</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="Grid view"
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        viewMode === 'grid'
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      <Grid3X3 className="h-3.5 w-3.5" />
                      <span>Grid</span>
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
                    <span>Show</span>

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
              </div>

              {/* Result count */}
              <div className="mt-4 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {startItem}–{endItem} of {filteredStudents.length}{' '}
                  {filteredStudents.length === 1 ? 'student' : 'students'}
                  {searchQuery ? ` matching "${searchQuery}"` : ''}
                </p>
              </div>

              {filteredStudents.length > 0 ? (
                <>
                  {/* Desktop List */}
                  {viewMode === 'list' && (
                    <div className="mt-4 hidden overflow-hidden rounded-lg border border-border sm:block">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                          <thead className="border-b border-border bg-background">
                            <tr>
                              <th className="px-4 py-3 font-medium text-muted">
                                Student
                              </th>

                              <th className="px-4 py-3 font-medium text-muted">
                                Admission No.
                              </th>

                              <th className="px-4 py-3 font-medium text-muted">
                                Email
                              </th>

                              <th className="px-4 py-3 font-medium text-muted">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-border">
                            {paginatedStudents.map((student) => (
                              <tr
                                key={student.id}
                                className="bg-surface transition-colors hover:bg-background/60"
                              >
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand">
                                      {student.photoUrl ? (
                                        <img
                                          src={resolveFileUrl(student.photoUrl, student.id) ?? undefined}
                                          alt={student.name}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-brand/10 text-brand">
                                          <span className="text-xs font-semibold">
                                            {getStudentInitials(student.name)}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <span className="font-medium text-foreground">
                                      {student.name}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5 text-muted">
                                  {student.admissionNo || '—'}
                                </td>

                                <td className="max-w-[280px] truncate px-4 py-3.5 text-muted">
                                  {student.email || '—'}
                                </td>

                                <td className="px-4 py-3.5">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                      student.status === 'INACTIVE'
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-green-50 text-green-700'
                                    }`}
                                  >
                                    {getStudentStatus(student)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Mobile List */}
                  {viewMode === 'list' && (
                    <div className="mt-4 space-y-2 sm:hidden">
                      {paginatedStudents.map((student) => (
                        <div
                          key={student.id}
                          className="border border-border bg-background p-3.5 transition-colors hover:border-brand/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand">
                                {student.photoUrl ? (
                                  <img
                                    src={resolveFileUrl(student.photoUrl, student.id) ?? undefined}
                                    alt={student.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-brand/10 text-brand">
                                    <span className="text-xs font-semibold">
                                      {getStudentInitials(student.name)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {student.name}
                                </p>

                                <p className="mt-0.5 text-xs text-muted">
                                  {student.admissionNo || 'No admission number'}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                student.status === 'INACTIVE'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-green-50 text-green-700'
                              }`}
                            >
                              {getStudentStatus(student)}
                            </span>
                          </div>

                          {student.email && (
                            <p className="mt-3 truncate border-t border-border pt-3 text-xs text-muted">
                              {student.email}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grid */}
                  {viewMode === 'grid' && (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {paginatedStudents.map((student) => (
                        <div
                          key={student.id}
                          className="border border-border bg-background p-4 transition-colors hover:border-brand/30 hover:bg-brand/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand">
                                {student.photoUrl ? (
                                  <img
                                    src={resolveFileUrl(student.photoUrl, student.id) ?? undefined}
                                    alt={student.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-brand/10 text-brand">
                                    <span className="text-xs font-semibold">
                                      {getStudentInitials(student.name)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {student.name}
                                </p>

                                <p className="mt-1 truncate text-xs text-muted">
                                  {student.admissionNo || 'No admission number'}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                student.status === 'INACTIVE'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-green-50 text-green-700'
                              }`}
                            >
                              {getStudentStatus(student)}
                            </span>
                          </div>

                          <div className="mt-4 border-t border-border pt-3">
                            <p className="truncate text-xs text-muted">
                              {student.email || 'No email available'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted">
                        Page {safeCurrentPage} of {totalPages}
                      </p>

                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((page) => Math.max(1, page - 1))
                          }
                          disabled={safeCurrentPage === 1}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Previous
                        </button>

                        <div className="hidden items-center gap-1 sm:flex">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, index) => {
                              let pageNumber: number;

                              if (totalPages <= 5) {
                                pageNumber = index + 1;
                              } else if (safeCurrentPage <= 3) {
                                pageNumber = index + 1;
                              } else if (
                                safeCurrentPage >=
                                totalPages - 2
                              ) {
                                pageNumber = totalPages - 4 + index;
                              } else {
                                pageNumber = safeCurrentPage - 2 + index;
                              }

                              return (
                                <button
                                  key={pageNumber}
                                  type="button"
                                  onClick={() => setCurrentPage(pageNumber)}
                                  className={`h-9 min-w-9 rounded-lg px-2.5 text-xs font-medium transition ${
                                    safeCurrentPage === pageNumber
                                      ? 'bg-brand text-white shadow-sm'
                                      : 'border border-border text-foreground hover:bg-background'
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            },
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.min(totalPages, page + 1),
                            )
                          }
                          disabled={safeCurrentPage === totalPages}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-5 rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-12 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Search className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-foreground">
                    No students found
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    No students match &quot;{searchQuery}&quot;.
                  </p>

                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-4 rounded-lg bg-brand px-4 py-2 text-xs font-medium text-white transition hover:bg-brand/90"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Users className="h-6 w-6" />
              </div>

              <p className="mt-3 text-sm font-semibold text-foreground">
                No students in this class
              </p>

              <p className="mt-1 text-sm text-muted">
                There are currently no students assigned to this class.
              </p>
            </div>
          )}
        </section>
      )}

      {/* No class */}
      {!selectedClass && !error && (
        <section className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <BookOpen className="h-6 w-6" />
          </div>

          <p className="mt-3 text-sm font-semibold text-foreground">
            No classes assigned
          </p>

          <p className="mt-1 text-sm text-muted">
            Your assigned classes will appear here.
          </p>
        </section>
      )}
      </div>
    </main>
  );
}