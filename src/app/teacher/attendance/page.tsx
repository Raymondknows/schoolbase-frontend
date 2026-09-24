'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid3X3,
  List,
  Search,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import { ErrorModal } from '@/components/ui/error-modal';
import AdminSkeleton from '@/components/ui/skeleton';
import TeacherPageHeader from '@/components/teacher-page-header';

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

const STATUS_CONFIG: Record<AttendanceRecord['status'], { label: string; icon: LucideIcon; active: string; idle: string }> = {
  PRESENT: { label: 'Present', icon: CheckCircle2, active: 'border-emerald-300 bg-emerald-100 text-emerald-800', idle: 'bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100' },
  ABSENT: { label: 'Absent', icon: AlertCircle, active: 'border-red-300 bg-red-100 text-red-800', idle: 'bg-red-50/70 text-red-700 hover:bg-red-100' },
  LATE: { label: 'Late', icon: Clock, active: 'border-amber-300 bg-amber-100 text-amber-800', idle: 'bg-amber-50/70 text-amber-700 hover:bg-amber-100' },
  EXCUSED: { label: 'Excused', icon: CheckCircle2, active: 'border-sky-300 bg-sky-100 text-sky-800', idle: 'bg-sky-50/70 text-sky-700 hover:bg-sky-100' },
};

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
  const [draftSaved, setDraftSaved] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const getDraftKey = (classId: string, attendanceDate: string) =>
    `schoolbase-teacher-attendance-draft:${classId}:${attendanceDate}`;

  const getLastSyncKey = (classId: string, attendanceDate: string) =>
    `schoolbase-teacher-attendance-last-sync:${classId}:${attendanceDate}`;

  const formatLastSync = (value: string | null) => {
    if (!value) return 'Not synced yet';

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return 'Not synced yet';

    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsedDate);
  };

  const persistDraft = (nextAttendance: Record<string, AttendanceRecord>) => {
    if (!selectedClass || !date) return;
    window.sessionStorage.setItem(getDraftKey(selectedClass, date), JSON.stringify(nextAttendance));
    setDraftSaved(true);
    setSyncPending(true);
    setLastSyncAt(null);
    setLastSyncError(null);
  };

  const clearDraft = useCallback(() => {
    if (!selectedClass || !date) return;
    const timestamp = new Date().toISOString();
    window.sessionStorage.removeItem(getDraftKey(selectedClass, date));
    window.sessionStorage.setItem(getLastSyncKey(selectedClass, date), timestamp);
    setDraftSaved(false);
    setSyncPending(false);
    setLastSyncAt(timestamp);
    setLastSyncError(null);
  }, [date, selectedClass]);

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

        const draftKey = getDraftKey(selectedClass, date);
        const syncKey = getLastSyncKey(selectedClass, date);
        let restoredAttendance = initial;
        try {
          const storedDraft = window.sessionStorage.getItem(draftKey);
          const storedSync = window.sessionStorage.getItem(syncKey);
          if (storedSync) {
            setLastSyncAt(storedSync);
          } else {
            setLastSyncAt(null);
          }

          if (storedDraft) {
            const parsedDraft = JSON.parse(storedDraft) as Record<string, AttendanceRecord>;
            restoredAttendance = Object.fromEntries(
              Object.entries(initial).map(([studentId, record]) => [
                studentId,
                parsedDraft[studentId]?.studentId === studentId ? parsedDraft[studentId] : record,
              ]),
            );
            setDraftSaved(true);
          } else {
            setDraftSaved(false);
          }
        } catch {
          setDraftSaved(false);
          setLastSyncAt(null);
        }

        setAttendance(restoredAttendance);
        setCurrentPage(1);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load students');
        setStudents([]);
      }
    }

    loadStudents();
  }, [selectedClass, date]);

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
    setAttendance((prev) => {
      const nextAttendance = {
        ...prev,
        [studentId]: { ...prev[studentId], status },
      };
      if (selectedClass && date) {
        persistDraft(nextAttendance);
      }
      return nextAttendance;
    });
  };

  const retryQueuedAttendance = useCallback(async () => {
    if (!selectedClass || !date) return;
    if (!navigator.onLine) {
      setLastSyncError('Connection unavailable. The draft will retry when the connection returns.');
      return;
    }

    const queuedDraft = window.sessionStorage.getItem(getDraftKey(selectedClass, date));
    if (!queuedDraft) {
      setSyncPending(false);
      setDraftSaved(false);
      return;
    }

    try {
      const backendUrl = getBackendUrl();
      const parsedDraft = JSON.parse(queuedDraft) as Record<string, AttendanceRecord>;
      const res = await fetch(`${backendUrl}/api/teacher/attendance`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          date,
          attendanceData: Object.values(parsedDraft),
        }),
      });

      if (!res.ok) throw new Error('Failed to save attendance');

      const timestamp = new Date().toISOString();
      window.sessionStorage.setItem(getLastSyncKey(selectedClass, date), timestamp);
      setLastSyncAt(timestamp);
      clearDraft();
      setSaveModalType('success');
      setSaveModalTitle('Attendance saved');
      setSaveModalMessage('Attendance was saved successfully.');
      setSaveModalOpen(true);
    } catch (err: unknown) {
      setSyncPending(true);
      setLastSyncError(err instanceof Error ? err.message : 'Failed to save attendance');
    }
  }, [clearDraft, date, selectedClass]);

  useEffect(() => {
    if (!selectedClass || !date) return;

    const handleOnline = () => {
      const draftKey = getDraftKey(selectedClass, date);
      if (window.sessionStorage.getItem(draftKey)) {
        void retryQueuedAttendance();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [date, retryQueuedAttendance, selectedClass]);

  const handleSave = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    if (!navigator.onLine) {
      persistDraft(attendance);
      setError('Connection lost. Your attendance draft has been saved on this device and will retry automatically when you are back online.');
      setSyncPending(true);
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

      const timestamp = new Date().toISOString();
      window.sessionStorage.setItem(getLastSyncKey(selectedClass, date), timestamp);
      setLastSyncAt(timestamp);
      clearDraft();
      setSaveModalType('success');
      setSaveModalTitle('Attendance saved');
      setSaveModalMessage('Attendance was saved successfully.');
      setSaveModalOpen(true);
    } catch (err: unknown) {
      persistDraft(attendance);
      setSyncPending(true);
      setLastSyncError(err instanceof Error ? err.message : 'Failed to save attendance');
      setError('Connection issue while saving. Your attendance is queued and will retry automatically when online.');
    } finally {
      setSaving(false);
    }
  };

  const renderStatusControls = (studentId: string) => (
    <div className="w-full max-w-full" role="group" aria-label="Attendance status">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Attendance status</span>
        <span className="text-[11px] font-semibold text-foreground">
          {attendance[studentId] ? STATUS_CONFIG[attendance[studentId].status].label : 'Not set'}
        </span>
      </div>
      <div className="grid grid-cols-2 overflow-hidden border border-border bg-background sm:grid-cols-4">
      {(Object.keys(STATUS_CONFIG) as AttendanceRecord['status'][]).map((status) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isActive = attendance[studentId]?.status === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusChange(studentId, status)}
            disabled={attendanceAlreadyTaken}
            aria-pressed={isActive}
            title={`Mark ${config.label.toLowerCase()}`}
            className={`inline-flex h-9 min-w-0 items-center justify-center gap-1 border-r border-b border-border px-1.5 text-[10px] font-semibold transition last:border-r-0 focus:relative focus:z-10 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50 sm:border-b-0 sm:gap-1.5 sm:px-2 sm:text-[11px] ${isActive ? config.active : config.idle}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{config.label}</span>
          </button>
        );
      })}
      </div>
    </div>
  );

  if (loading) {
    return <AdminSkeleton />;
  }

  const total = students.length;
  const present = Object.values(attendance).filter((entry) => entry.status === 'PRESENT').length;
  const absent = Object.values(attendance).filter((entry) => entry.status === 'ABSENT').length;
  const late = Object.values(attendance).filter((entry) => entry.status === 'LATE').length;
  const selectedClassName = classes.find((cls) => cls.id === selectedClass)?.name;
  const selectedClassInfo = classes.find((cls) => cls.id === selectedClass) || null;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-8 sm:px-8 lg:px-12">
        <TeacherPageHeader icon={Users} title="Attendance" description="Mark and track student attendance by class and date." actionLabel="Attendance summary" actionHref="/teacher/attendance/summary" />

        {(error || attendanceAlreadyTaken || syncPending || lastSyncError) && (
          <div className="space-y-3">
            {error && (
              <div className="flex gap-3 border border-brand/20 bg-brand-light px-4 py-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Unable to save attendance</p>
                  <p className="mt-1 text-sm text-muted">{error}</p>
                </div>
              </div>
            )}

            {syncPending && (
              <div className="flex items-start gap-3 border border-brand/20 bg-brand-light px-4 py-3 text-sm text-foreground" role="status">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Sync pending</p>
                  <p className="mt-1 text-muted">
                    {lastSyncError || `Your attendance draft is queued and will retry automatically when your connection returns. Last successful sync: ${formatLastSync(lastSyncAt)}.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => void retryQueuedAttendance()}
                    className="mt-2 inline-flex items-center bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
                  >
                    Retry now
                  </button>
                </div>
              </div>
            )}

            {attendanceAlreadyTaken && (
              <div className="flex gap-3 border border-brand/20 bg-brand-light px-4 py-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Attendance already recorded</p>
                  <p className="mt-1 text-sm text-muted">
                    Attendance for {selectedClassName || 'this class'} on {new Date(date).toLocaleDateString()} has already been recorded.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {draftSaved && !attendanceAlreadyTaken && !syncPending && (
          <div className="flex items-start gap-3 border border-brand/20 bg-brand-light px-4 py-3 text-sm text-foreground" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="font-semibold">Draft saved on this device</p>
              <p className="mt-1 text-muted">Your attendance selections will remain available if this page is refreshed before you save.</p>
            </div>
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
                  className="w-full appearance-none border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground outline-none transition focus:border-brand"
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
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand" />
            </label>
            <button type="button" onClick={() => router.push('/teacher/attendance/summary')} className="inline-flex w-fit shrink-0 self-start items-center justify-center gap-2 border border-brand/25 bg-brand-light px-3 py-2.5 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white xl:self-auto">
              <BarChart3 className="h-4 w-4" /> Summary
            </button>
            <div className="flex flex-col items-end gap-2">
              <button type="button" onClick={handleSave} disabled={saving || attendanceAlreadyTaken || !selectedClass} className="bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Saving...' : 'Save attendance'}
              </button>
              <span className="text-[11px] font-medium text-muted">
                {syncPending ? 'Sync pending' : `Last synced: ${formatLastSync(lastSyncAt)}`}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-blue-50">
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50">
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-50">
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-amber-50">
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
                className="w-full border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted transition hover:bg-surface hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition ${
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
                  className="border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/10"
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
            <div className="mt-5 border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-brand/10 text-brand">
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
                  <div className="mt-4 hidden overflow-hidden border border-border sm:block">
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
                                <td className="px-4 py-3.5">{renderStatusControls(student.id)}</td>
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
                          <div className="mt-3">{renderStatusControls(student.id)}</div>
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
                          <span className="shrink-0 border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                            {attendance[student.id] ? STATUS_CONFIG[attendance[student.id].status].label : 'Not set'}
                          </span>
                        </div>
                        <div className="mt-4 border-t border-border pt-3">
                          {renderStatusControls(student.id)}
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
                      className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
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
                            className={`h-9 min-w-[2.25rem] px-2.5 text-xs font-medium transition ${
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
                      className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
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
