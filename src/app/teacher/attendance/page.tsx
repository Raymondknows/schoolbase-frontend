'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid3X3,
  Loader2,
  List,
  Search,
  Users,
  X,
} from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import { ErrorModal } from '@/components/ui/error-modal';

interface Class {
  id: string;
  name: string;
  studentCount: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  email?: string;
  status?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

type ViewMode = 'grid' | 'list';

export default function AttendancePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'success' | 'error'>('success');
  const [saveModalTitle, setSaveModalTitle] = useState('Attendance saved');
  const [saveModalMessage, setSaveModalMessage] = useState('');
  const [attendanceAlreadyTaken, setAttendanceAlreadyTaken] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const admissionNo = (student.admissionNo || '').toLowerCase();
      return fullName.includes(query) || admissionNo.includes(query);
    });
  }, [students, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startItem = filteredStudents.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, filteredStudents.length);
  const paginatedStudents = filteredStudents.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  useEffect(() => {
    async function loadClasses() {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/teacher/classes`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to load classes');

        const data = await res.json();
        setClasses(data.classes || []);

        if (data.classes?.length > 0) {
          setSelectedClass(data.classes[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      return;
    }

    async function loadStudents() {
      try {
        setError(null);
        const backendUrl = getBackendUrl();
        const res = await fetch(`${backendUrl}/api/teacher/classes/${selectedClass}/students`, {
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to load students');

        const data = await res.json();
        setStudents(data.students || []);

        const initial: Record<string, AttendanceRecord> = {};
        (data.students || []).forEach((student: Student) => {
          initial[student.id] = { studentId: student.id, status: 'PRESENT' };
        });

        setAttendance(initial);
        setCurrentPage(1);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
        setStudents([]);
      }
    }

    loadStudents();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !date) return;

    async function checkAttendance() {
      try {
        const backendUrl = getBackendUrl();
        const res = await fetch(
          `${backendUrl}/api/teacher/attendance/check?classId=${selectedClass}&date=${date}`,
          { credentials: 'include' },
        );

        if (!res.ok) throw new Error('Failed to check attendance');

        const data = await res.json();
        setAttendanceAlreadyTaken(Boolean(data.exists));
      } catch (err) {
        console.error('Error checking attendance:', err);
        setAttendanceAlreadyTaken(false);
      }
    }

    checkAttendance();
  }, [selectedClass, date]);

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/teacher/attendance`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          date,
          attendanceData: Object.values(attendance),
        }),
      });

      if (!res.ok) throw new Error('Failed to save attendance');

      setSaveModalType('success');
      setSaveModalTitle('Attendance saved');
      setSaveModalMessage('Attendance was saved successfully.');
      setSaveModalOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const total = students.length;
  const present = Object.values(attendance).filter((entry) => entry.status === 'PRESENT').length;
  const absent = Object.values(attendance).filter((entry) => entry.status === 'ABSENT').length;
  const late = Object.values(attendance).filter((entry) => entry.status === 'LATE').length;
  const selectedClassName = classes.find((cls) => cls.id === selectedClass)?.name;
  const selectedClassInfo = classes.find((cls) => cls.id === selectedClass) || null;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <Users className="h-[17px] w-[17px]" /> Teacher workspace
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Attendance</h1>
            <p className="mt-1 text-muted">Mark and track student attendance by class and date.</p>
          </div>
        </header>

        {(error || attendanceAlreadyTaken) && (
          <div className="space-y-3">
            {error && (
              <div className="border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-800">Unable to save attendance</p>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {attendanceAlreadyTaken && (
              <div className="border border-[#f0d58a] bg-[#fff9e8] px-4 py-3 flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Attendance Already Recorded</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Attendance for {selectedClassName || 'this class'} on {new Date(date).toLocaleDateString()} has already been recorded.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <section className="border border-border bg-surface px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="shrink-0 xl:w-[190px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Selected class</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{selectedClassName || 'No class selected'}</h2>
                {selectedClassInfo && <span className="border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{selectedClassInfo.studentCount} students</span>}
              </div>
            </div>

            {classes.length > 1 && (
              <div className="w-full xl:w-[190px]">
                <label htmlFor="class-selector" className="sr-only">Class</label>
                <select
                  id="class-selector"
                  value={selectedClass}
                  onChange={(event) => {
                    setSelectedClass(event.target.value);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground outline-none transition focus:border-brand"
                >
                  {classes.map((teacherClass) => <option key={teacherClass.id} value={teacherClass.id}>{teacherClass.name}</option>)}
                </select>
              </div>
            )}

            <div className="hidden h-8 w-px bg-border xl:block" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Register details</p>
              <p className="mt-1 truncate text-sm text-muted">Choose the date, then mark each student below.</p>
            </div>
            <label className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-foreground">
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand" />
            </label>
            <button type="button" onClick={() => router.push('/teacher/attendance/summary')} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
              <BarChart3 className="h-4 w-4" /> Summary
            </button>
            <button type="button" onClick={handleSave} disabled={saving || attendanceAlreadyTaken || !selectedClass} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Saving...' : 'Save attendance'}
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Total Students</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{total}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Students assigned to the selected class.</p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Present</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{present}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Marked present for the selected date.</p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Absent</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{absent}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Marked absent for the selected date.</p>
          </article>

          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Late</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{late}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Marked late for the selected date.</p>
          </article>
        </section>

        <section className="border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Students</h2>
              <p className="mt-1 text-sm text-muted">Search and mark attendance for each student below.</p>
            </div>
            <div className="text-sm text-muted">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search students by name or admission number..."
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand"
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
                      ? 'bg-brand text-white'
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
                      ? 'bg-brand text-white'
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
                  onChange={(event) => {
                    setItemsPerPage(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/10"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {startItem}-{endItem} of {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </p>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Users className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">No students found</p>
              <p className="mt-1 text-sm text-muted">
                {searchQuery ? `No students match "${searchQuery}".` : 'There are currently no students in this class.'}
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'list' ? (
                <>
                  <div className="mt-4 hidden overflow-hidden rounded-lg border border-border sm:block">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left text-sm">
                        <thead className="border-b border-border bg-background">
                          <tr>
                            <th className="px-4 py-3 font-medium text-muted">Student</th>
                            <th className="px-4 py-3 font-medium text-muted">Admission #</th>
                            <th className="px-4 py-3 font-medium text-muted">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {paginatedStudents.map((student) => {
                            const studentName = `${student.firstName} ${student.lastName}`.trim() || `Student ${student.admissionNo || student.id}`;
                            return (
                              <tr key={student.id} className="bg-surface transition-colors hover:bg-background/60">
                                <td className="px-4 py-3.5 font-medium text-foreground">{studentName}</td>
                                <td className="px-4 py-3.5 text-muted">{student.admissionNo || '—'}</td>
                                <td className="px-4 py-3.5">
                                  <div className="flex flex-wrap gap-2">
                                    {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => {
                                      const isActive = attendance[student.id]?.status === status;
                                      return (
                                        <button
                                          key={status}
                                          type="button"
                                          onClick={() => handleStatusChange(student.id, status)}
                                          disabled={attendanceAlreadyTaken}
                                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                            isActive
                                              ? {
                                                  PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                  ABSENT: 'bg-red-100 text-red-700 border-red-200',
                                                  LATE: 'bg-amber-100 text-amber-700 border-amber-200',
                                                  EXCUSED: 'bg-blue-100 text-blue-700 border-blue-200',
                                                }[status]
                                              : 'bg-background text-muted border-border hover:border-brand/50 disabled:opacity-50 disabled:cursor-not-allowed'
                                          }`}
                                        >
                                          {status}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 sm:hidden">
                    {paginatedStudents.map((student) => {
                      const studentName = `${student.firstName} ${student.lastName}`.trim() || `Student ${student.admissionNo || student.id}`;
                      return (
                        <div key={student.id} className="border border-border bg-background p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-sm text-foreground">{studentName}</p>
                              <p className="mt-1 text-xs text-muted">{student.admissionNo || '—'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => {
                              const isActive = attendance[student.id]?.status === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, status)}
                                  disabled={attendanceAlreadyTaken}
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                    isActive
                                      ? {
                                          PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                          ABSENT: 'bg-red-100 text-red-700 border-red-200',
                                          LATE: 'bg-amber-100 text-amber-700 border-amber-200',
                                          EXCUSED: 'bg-blue-100 text-blue-700 border-blue-200',
                                        }[status]
                                      : 'bg-background text-muted border-border disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedStudents.map((student) => {
                    const studentName = `${student.firstName} ${student.lastName}`.trim() || `Student ${student.admissionNo || student.id}`;
                    return (
                      <div key={student.id} className="border border-border bg-background p-4 transition-colors hover:border-brand/30 hover:bg-brand/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{studentName}</p>
                            <p className="mt-1 truncate text-xs text-muted">{student.admissionNo || '—'}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted border border-border">
                            {attendance[student.id]?.status || 'Not set'}
                          </span>
                        </div>
                        <div className="mt-4 border-t border-border pt-3">
                          <div className="flex flex-wrap gap-2">
                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((status) => {
                              const isActive = attendance[student.id]?.status === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, status)}
                                  disabled={attendanceAlreadyTaken}
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                    isActive
                                      ? {
                                          PRESENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                          ABSENT: 'bg-red-100 text-red-700 border-red-200',
                                          LATE: 'bg-amber-100 text-amber-700 border-amber-200',
                                          EXCUSED: 'bg-blue-100 text-blue-700 border-blue-200',
                                        }[status]
                                      : 'bg-background text-muted border-border disabled:opacity-50 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">
                    Page {safeCurrentPage} of {totalPages}
                  </p>

                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={safeCurrentPage === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </button>

                    <div className="hidden items-center gap-1 sm:flex">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                        let pageNumber: number;

                        if (totalPages <= 5) {
                          pageNumber = index + 1;
                        } else if (safeCurrentPage <= 3) {
                          pageNumber = index + 1;
                        } else if (safeCurrentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + index;
                        } else {
                          pageNumber = safeCurrentPage - 2 + index;
                        }

                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`h-9 min-w-[2.25rem] rounded-lg px-2.5 text-xs font-medium transition ${
                              safeCurrentPage === pageNumber
                                ? 'bg-brand text-white shadow-sm'
                                : 'border border-border text-foreground hover:bg-background'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
          )}
        </section>
        <ErrorModal
          isOpen={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          title={saveModalTitle}
          message={saveModalMessage}
          type={saveModalType}
          confirmLabel={saveModalType === 'success' ? 'Done' : 'Review'}
        />
      </div>
    </main>
  );
}
