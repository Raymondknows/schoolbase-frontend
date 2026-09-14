'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, ChevronLeft, ChevronRight, AlertCircle, Loader2, BarChart2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getBackendUrl } from '@/lib/backend-url';
import AdminSkeleton from '@/components/ui/skeleton';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance Summary</h1>
        <p className="mt-2 text-sm text-muted">View and analyze attendance patterns by date</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-error bg-error/10 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Error</h3>
            <p className="text-sm text-error/80">{error}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">Class</label>
          <select
            className="w-full mt-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phase})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            className="w-full mt-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">End Date</label>
          <input
            type="date"
            className="w-full mt-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handlePreviousWeek}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition"
          >
            <ChevronLeft className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={handleNextWeek}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition"
          >
            <ChevronRight className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* Stats */}
      {/* Desktop Stats */}
      <div className="hidden sm:grid grid-cols-5 gap-4">
        <div className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">Present</p>
              <p className="mt-1 text-lg font-bold text-foreground">{stats.present}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">{stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : 0}% attendance</p>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 shadow-sm">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">Absent</p>
              <p className="mt-1 text-lg font-bold text-foreground">{stats.absent}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">{stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(0) : 0}% rate</p>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 shadow-sm">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">Late</p>
              <p className="mt-1 text-lg font-bold text-foreground">{stats.late}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">{stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(0) : 0}% rate</p>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">Excused</p>
              <p className="mt-1 text-lg font-bold text-foreground">{stats.excused}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">Justified absences</p>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 shadow-sm">
              <BarChart2 className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted">Unmarked</p>
              <p className="mt-1 text-lg font-bold text-foreground">{stats.unmarked}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted">Not recorded</p>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="sm:hidden space-y-3">
        <div className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted font-medium">Present</p>
            <p className="mt-1.5 text-xl font-bold text-foreground">{stats.present}</p>
            <p className="mt-1 text-xs text-muted">{stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(0) : 0}% attendance</p>
          </div>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 shadow-sm">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted font-medium">Absent</p>
            <p className="mt-1.5 text-xl font-bold text-foreground">{stats.absent}</p>
            <p className="mt-1 text-xs text-muted">{stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(0) : 0}% rate</p>
          </div>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 shadow-sm">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted font-medium">Late</p>
            <p className="mt-1.5 text-xl font-bold text-foreground">{stats.late}</p>
            <p className="mt-1 text-xs text-muted">{stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(0) : 0}% rate</p>
          </div>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted font-medium">Excused</p>
            <p className="mt-1.5 text-xl font-bold text-foreground">{stats.excused}</p>
            <p className="mt-1 text-xs text-muted">Justified absences</p>
          </div>
        </div>

        <div className="group rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer hover:border-brand/50 flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 shadow-sm">
            <BarChart2 className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted font-medium">Unmarked</p>
            <p className="mt-1.5 text-xl font-bold text-foreground">{stats.unmarked}</p>
            <p className="mt-1 text-xs text-muted">Not recorded</p>
          </div>
        </div>
      </div>

      {/* Excel-like Grid */}
      {students.length > 0 ? (
        <>
          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand/90 transition"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-4 py-2 text-left font-semibold text-foreground sticky left-0 bg-background z-10 w-32">
                      Student
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-foreground w-24">
                      Adm. No
                    </th>
                    {dateRange.map((date) => (
                      <th
                        key={date.toISOString()}
                        className="px-2 py-2 text-center font-semibold text-foreground w-12"
                        title={date.toLocaleDateString()}
                      >
                        {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-center font-semibold text-foreground w-16">
                      Summary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const studentStats = {
                      present: 0,
                      absent: 0,
                      late: 0,
                      excused: 0,
                    };

                    dateRange.forEach((date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const status = student.attendance[dateStr]?.status;
                      if (status === 'PRESENT') studentStats.present++;
                      else if (status === 'ABSENT') studentStats.absent++;
                      else if (status === 'LATE') studentStats.late++;
                      else if (status === 'EXCUSED') studentStats.excused++;
                    });

                    return (
                      <tr key={student.id} className="border-t border-border hover:bg-background/50 transition-colors">
                        <td className="px-4 py-2 font-medium text-foreground sticky left-0 bg-surface hover:bg-background/50 z-10 truncate">
                          {`${student.firstName} ${student.lastName}`}
                        </td>
                        <td className="px-4 py-2 text-muted">{student.admissionNo || '—'}</td>
                        {dateRange.map((date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const status = student.attendance[dateStr]?.status;
                          const config = STATUS_CONFIG[status || 'undefined'];
                          return (
                            <td key={dateStr} className="px-2 py-2 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded font-semibold ${config.color}`}
                                title={config.fullLabel}
                              >
                                {config.label}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-2 text-center text-xs">
                          <div className="flex gap-1 justify-center flex-wrap">
                            {studentStats.present > 0 && (
                              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                                {studentStats.present}P
                              </span>
                            )}
                            {studentStats.absent > 0 && (
                              <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                                {studentStats.absent}A
                              </span>
                            )}
                            {studentStats.late > 0 && (
                              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                                {studentStats.late}L
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-muted mb-3">Legend:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-800 text-xs font-semibold">
                  P
                </span>
                <span className="text-xs text-foreground">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-800 text-xs font-semibold">
                  A
                </span>
                <span className="text-xs text-foreground">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                  L
                </span>
                <span className="text-xs text-foreground">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                  E
                </span>
                <span className="text-xs text-foreground">Excused</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-border bg-surface px-6 py-12 text-center">
          <Calendar className="h-12 w-12 text-muted/30 mx-auto mb-4" />
          <p className="text-muted">No attendance data available for the selected period</p>
        </div>
      )}
    </div>
  );
}
