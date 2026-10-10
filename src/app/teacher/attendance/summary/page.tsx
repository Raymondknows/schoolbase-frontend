'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, ChevronLeft, ChevronRight, AlertCircle, BarChart2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import AdminSkeleton from '@/components/ui/skeleton';
import TeacherPageHeader from '@/components/teacher-page-header';

interface AttendanceData {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
}

interface StudentAttendance {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  attendance: Record<string, AttendanceData>;
}

interface Class {
  id: string;
  name: string;
  phase: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; fullLabel: string }> = {
  PRESENT: { label: 'P', color: 'bg-green-100 text-green-800', fullLabel: 'Present' },
  ABSENT: { label: 'A', color: 'bg-red-100 text-red-800', fullLabel: 'Absent' },
  LATE: { label: 'L', color: 'bg-amber-100 text-amber-800', fullLabel: 'Late' },
  EXCUSED: { label: 'E', color: 'bg-blue-100 text-blue-800', fullLabel: 'Excused' },
  undefined: { label: '—', color: 'bg-gray-50 text-gray-500', fullLabel: 'Not marked' },
};

export default function AttendanceSummaryPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize dates to current week
  useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setStartDate(monday.toISOString().split('T')[0]);
    setEndDate(sunday.toISOString().split('T')[0]);
  }, []);

  // Load classes
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  // Load attendance data
  useEffect(() => {
    if (!selectedClass || !startDate || !endDate) return;

    async function loadAttendance() {
      try {
        setLoading(true);
        const backendUrl = getBackendUrl();
        
        // Fetch attendance summary from the new endpoint
        const res = await fetch(
          `${backendUrl}/api/teacher/attendance/summary?classId=${selectedClass}&startDate=${startDate}&endDate=${endDate}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('Failed to load attendance');
        const data = await res.json();

        setStudents(data.students);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [selectedClass, startDate, endDate]);

  // Generate date range
  const dateRange = useMemo(() => {
    if (!startDate || !endDate) return [];
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCells = students.length * dateRange.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let unmarked = 0;

    students.forEach((student) => {
      dateRange.forEach((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const status = student.attendance[dateStr]?.status;
        switch (status) {
          case 'PRESENT':
            present++;
            break;
          case 'ABSENT':
            absent++;
            break;
          case 'LATE':
            late++;
            break;
          case 'EXCUSED':
            excused++;
            break;
          default:
            unmarked++;
        }
      });
    });

    return { present, absent, late, excused, unmarked, total: totalCells };
  }, [students, dateRange]);

  // Previous week
  const handlePreviousWeek = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Next week
  const handleNextWeek = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Admission No', ...dateRange.map((d) => d.toLocaleDateString('en-GB'))];
    const rows = students.map((s) => [
      `${s.firstName} ${s.lastName}`,
      s.admissionNo || '—',
      ...dateRange.map((d) => {
        const dateStr = d.toISOString().split('T')[0];
        const status = s.attendance[dateStr]?.status;
        return STATUS_CONFIG[status || 'undefined']?.label || '—';
      }),
    ]);

    const csvContent = [
      [dateRange[0]?.toLocaleDateString() || '', ' - ', dateRange[dateRange.length - 1]?.toLocaleDateString() || ''].join(''),
      '',
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      '',
      ['Summary', 'Count'].join(','),
      ['Present', stats.present].join(','),
      ['Absent', stats.absent].join(','),
      ['Late', stats.late].join(','),
      ['Excused', stats.excused].join(','),
      ['Unmarked', stats.unmarked].join(','),
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `attendance-${startDate}-to-${endDate}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading && classes.length === 0) {
    return <AdminSkeleton />;
  }

  const statCards = [
    { label: 'Present', value: stats.present, detail: `${stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : 0}% attendance`, icon: CheckCircle2, tone: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Absent', value: stats.absent, detail: `${stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(0) : 0}% rate`, icon: XCircle, tone: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Late', value: stats.late, detail: `${stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(0) : 0}% rate`, icon: Clock, tone: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Excused', value: stats.excused, detail: 'Justified absences', icon: CheckCircle2, tone: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Unmarked', value: stats.unmarked, detail: 'Not recorded', icon: BarChart2, tone: 'text-muted', bg: 'bg-background' },
  ];

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-8 sm:px-8 lg:px-12">
        <TeacherPageHeader
          icon={BarChart2}
          title="Attendance summary"
          description="Review attendance patterns for a class across a selected date range."
          count={`${students.length} students`}
          actionLabel="Attendance"
          actionHref="/teacher/attendance"
        >
          {students.length > 0 ? (
            <button type="button" onClick={exportToCSV} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          ) : null}
        </TeacherPageHeader>

        {error ? (
          <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3" role="alert">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">Unable to load attendance summary</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        ) : null}

        <section className="border border-border bg-surface p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Report filters</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Choose class and dates</h2>
            </div>
            <p className="text-xs text-muted">Use the arrows to move one week at a time.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-end">
            <label className="block text-sm font-semibold text-foreground">
              Class
              <select
                className="mt-1.5 h-11 w-full border border-border bg-background px-3 text-sm font-normal text-foreground outline-none transition focus:border-brand"
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
              >
                <option value="">Select a class</option>
                {classes.map((teacherClass) => (
                  <option key={teacherClass.id} value={teacherClass.id}>{teacherClass.name} ({teacherClass.phase})</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-foreground">
              Start date
              <input
                type="date"
                className="mt-1.5 h-11 w-full border border-border bg-background px-3 text-sm font-normal text-foreground outline-none transition focus:border-brand"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label className="block text-sm font-semibold text-foreground">
              End date
              <input
                type="date"
                className="mt-1.5 h-11 w-full border border-border bg-background px-3 text-sm font-normal text-foreground outline-none transition focus:border-brand"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>

            <div className="flex items-end gap-2">
              <button type="button" onClick={handlePreviousWeek} aria-label="Previous week" title="Previous week" className="inline-flex h-11 w-11 items-center justify-center border border-border bg-background text-foreground transition hover:border-brand hover:text-brand">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleNextWeek} aria-label="Next week" title="Next week" className="inline-flex h-11 w-11 items-center justify-center border border-border bg-background text-foreground transition hover:border-brand hover:text-brand">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.tone}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted">{stat.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden border border-border bg-surface">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Attendance register</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">Student-by-day summary</h2>
              <p className="mt-1 text-sm text-muted">
                {dateRange.length > 0 ? `${dateRange[0].toLocaleDateString('en-GB')} – ${dateRange[dateRange.length - 1].toLocaleDateString('en-GB')}` : 'Select a date range'}
              </p>
            </div>
            <span className="text-xs font-semibold text-muted">{students.length} student{students.length === 1 ? '' : 's'} · {dateRange.length} days</span>
          </div>

          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-xs">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="sticky left-0 z-10 w-48 bg-background px-4 py-3 text-left font-semibold text-foreground">Student</th>
                    <th className="w-28 px-4 py-3 text-left font-semibold text-foreground">Admission no.</th>
                    {dateRange.map((date) => (
                      <th key={date.toISOString()} className="w-16 px-2 py-3 text-center font-semibold text-foreground" title={date.toLocaleDateString()}>
                        {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                      </th>
                    ))}
                    <th className="w-28 px-4 py-3 text-center font-semibold text-foreground">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentStats = { present: 0, absent: 0, late: 0, excused: 0 };
                    dateRange.forEach((date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const status = student.attendance[dateStr]?.status;
                      if (status === 'PRESENT') studentStats.present++;
                      else if (status === 'ABSENT') studentStats.absent++;
                      else if (status === 'LATE') studentStats.late++;
                      else if (status === 'EXCUSED') studentStats.excused++;
                    });

                    return (
                      <tr key={student.id} className="border-b border-border last:border-b-0 hover:bg-background/60">
                        <td className="sticky left-0 bg-surface px-4 py-2.5 font-semibold text-foreground">{`${student.firstName} ${student.lastName}`}</td>
                        <td className="px-4 py-2.5 text-muted">{student.admissionNo || '—'}</td>
                        {dateRange.map((date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const status = student.attendance[dateStr]?.status;
                          const config = STATUS_CONFIG[status || 'undefined'];
                          return (
                            <td key={dateStr} className="px-2 py-2 text-center">
                              <span className={`inline-flex h-8 w-8 items-center justify-center font-semibold ${config.color}`} title={config.fullLabel}>{config.label}</span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-center text-xs">
                          <div className="flex flex-wrap justify-center gap-1">
                            {studentStats.present > 0 ? <span className="bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">{studentStats.present}P</span> : null}
                            {studentStats.absent > 0 ? <span className="bg-red-50 px-2 py-1 font-semibold text-red-800">{studentStats.absent}A</span> : null}
                            {studentStats.late > 0 ? <span className="bg-amber-50 px-2 py-1 font-semibold text-amber-800">{studentStats.late}L</span> : null}
                            {studentStats.excused > 0 ? <span className="bg-sky-50 px-2 py-1 font-semibold text-sky-800">{studentStats.excused}E</span> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-muted/40" />
              <p className="mt-3 text-sm font-semibold text-foreground">No attendance data available</p>
              <p className="mt-1 text-sm text-muted">Try another class or date range.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-background/50 px-5 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Legend</span>
            {[
              ['P', 'Present', 'bg-emerald-100 text-emerald-800'],
              ['A', 'Absent', 'bg-red-100 text-red-800'],
              ['L', 'Late', 'bg-amber-100 text-amber-800'],
              ['E', 'Excused', 'bg-sky-100 text-sky-800'],
              ['—', 'Not marked', 'bg-background text-muted'],
            ].map(([label, name, color]) => (
              <span key={name} className="inline-flex items-center gap-2 text-xs text-muted">
                <span className={`inline-flex h-6 w-6 items-center justify-center font-semibold ${color}`}>{label}</span>{name}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
