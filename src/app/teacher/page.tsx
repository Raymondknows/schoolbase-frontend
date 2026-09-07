'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ClipboardList,
  AlertCircle,
  BookOpen,
  Gauge,
  MapPin,
  RefreshCw,
  Timer,
  Users2,
} from 'lucide-react';
import {
  getTeacherDashboard,
  getTeacherDashboardMetrics,
  type TeacherDashboardData,
  detectSchoolPhase,
} from '@/lib/teacher-utils';
import { SubscriptionBlockedError } from '@/lib/subscription-utils';
import SubscriptionModal from '@/components/subscription-modal';

type TeacherScheduleEntry = {
  id: string;
  room?: string | null;
  period: { dayOfWeek: number; name: string; startsAt: string; endsAt: string };
  class?: { name: string; arm?: string | null };
  subject?: { name: string };
};

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const dayAccents = ['#0a66c2', '#0b7a75', '#7a5af8', '#c2410c', '#b42318'];

function formatCountdown(startsAt: string, now: Date) {
  const [hours, minutes] = startsAt.split(':').map(Number);
  const start = new Date(now);
  start.setHours(hours, minutes, 0, 0);
  const remaining = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 60000));
  if (remaining < 60) return `${remaining} min`;
  const hoursRemaining = Math.floor(remaining / 60);
  const minutesRemaining = remaining % 60;
  return minutesRemaining ? `${hoursRemaining}h ${minutesRemaining}m` : `${hoursRemaining}h`;
}

export default function TeacherDashboardPage() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{ reason: string } | null>(null);
  const [schedule, setSchedule] = useState<TeacherScheduleEntry[]>([]);
  const [boardName, setBoardName] = useState('Published timetable');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5 ? day - 1 : 0;
  });

  useEffect(() => {
    async function loadData(isRefresh = false) {
      if (isRefresh) setRefreshing(true);
      try {
        const [dashboardData, timetableResponse] = await Promise.all([
          getTeacherDashboard(),
          fetch('/api/teacher/timetable', { credentials: 'include', cache: 'no-store' }),
        ]);
        const metrics = await getTeacherDashboardMetrics(dashboardData.classes).catch(() => ({
          pendingResultAssessments: 0,
          pendingAttendanceRegisters: 0,
          publishedAnnouncements: 0,
        }));

        setData({ ...dashboardData, metrics });
        if (timetableResponse.ok) {
          const timetableData = await timetableResponse.json();
          setBoardName(timetableData.configs?.[0]?.name || 'Published timetable');
          setSchedule((timetableData.configs?.[0]?.entries || []) as TeacherScheduleEntry[]);
        }
      } catch (err: unknown) {
        console.error('Error loading teacher dashboard:', err);
        
        // Check if it's a subscription error
        if (err instanceof SubscriptionBlockedError) {
          setSubscriptionBlocked({ reason: err.reason });
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand"></div>
          <p className="mt-4 text-sm text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (subscriptionBlocked) {
    return <SubscriptionModal reason={subscriptionBlocked.reason} />;
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
          No data available
        </div>
      </div>
    );
  }

  const schoolPhase = detectSchoolPhase(data.school);
  const metrics = data.metrics ?? {
    pendingResultAssessments: 0,
    pendingAttendanceRegisters: 0,
    publishedAnnouncements: 0,
  };
  const pendingAssessmentCount = metrics.pendingResultAssessments;
  const pendingAttendanceCount = metrics.pendingAttendanceRegisters;
  const announcementCount = metrics.publishedAnnouncements;

  const quickActions = [
    { href: '/teacher/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/teacher/results', label: 'Results', icon: FileText },
    { href: '/teacher/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/teacher/class', label: 'Classes', icon: Gauge },
  ];

  const todayIndex = selectedDay;
  const todayEntries = schedule
    .filter((entry) => entry.period.dayOfWeek === todayIndex + 1)
    .sort((a, b) => a.period.startsAt.localeCompare(b.period.startsAt));
  const nextLesson = todayEntries.find((entry) => {
    const [hours, minutes] = entry.period.startsAt.split(':').map(Number);
    const start = new Date(now);
    start.setHours(hours, minutes, 0, 0);
    return start.getTime() > now.getTime();
  });
  const teachingDays = new Set(schedule.map((entry) => entry.period.dayOfWeek)).size;
  const dashboardStats = [
    { label: 'Lessons this week', value: schedule.length, detail: boardName, icon: Clock3, tone: 'text-brand', bg: 'bg-brand-light' },
    { label: 'Teaching days', value: teachingDays, detail: 'Days with a class', icon: CalendarDays, tone: 'text-teal-700', bg: 'bg-teal-50' },
    { label: 'Assigned classes', value: data.classCount, detail: `${data.totalStudents} students`, icon: Users2, tone: 'text-violet-700', bg: 'bg-violet-50' },
    { label: 'Work queue', value: pendingAssessmentCount + pendingAttendanceCount, detail: `${announcementCount} published updates`, icon: CheckCircle2, tone: 'text-amber-700', bg: 'bg-amber-50' },
  ];

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <section className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <CalendarDays className="h-[17px] w-[17px]" /> Teacher workspace
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Dashboard</h1>
            <p className="mt-1 text-muted">Welcome back, {data.teacher.name} · {data.school?.name} · {schoolPhase}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/teacher/timetable" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light">
              <CalendarDays className="h-4 w-4" /> View timetable
            </Link>
            <button type="button" onClick={() => { setRefreshing(true); window.location.reload(); }} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh workspace'}
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <article key={stat.label} className="border border-border bg-surface p-5 transition hover:border-brand/30">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.tone}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{stat.label}</p>
                    <p className="mt-1 truncate text-xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
                <p className="mt-3 truncate text-xs text-muted">{stat.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="border-b border-border pb-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-muted">
                <CalendarDays className="h-4 w-4 text-brand" /> Today · {weekDays[todayIndex]}
              </div>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Your teaching schedule</h2>
              <p className="mt-1 text-sm text-muted">{todayEntries.length} {todayEntries.length === 1 ? 'lesson' : 'lessons'} scheduled from your published board.</p>
            </div>
            {nextLesson && (
              <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                <Timer className="h-5 w-5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.1em]">Next lesson</p>
                  <p className="text-sm font-semibold">{nextLesson.subject?.name || 'Lesson'} · in {formatCountdown(nextLesson.period.startsAt, now)}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {weekDays.map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(index)}
                className={`rounded-lg border px-2 py-3 text-sm font-semibold transition-colors ${selectedDay === index ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-muted hover:border-brand hover:text-brand'}`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
                <span className="mt-1 block text-xs font-normal opacity-75">
                  {schedule.filter((entry) => entry.period.dayOfWeek === index + 1).length} lessons
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todayEntries.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-border bg-background p-4" style={{ borderTop: `3px solid ${dayAccents[todayIndex]}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.1em] text-muted">{entry.period.name}</p>
                    <h3 className="mt-1 font-bold text-foreground">{entry.subject?.name || 'Lesson'}</h3>
                  </div>
                  <span className="rounded-full bg-brand-light px-2 py-1 text-xs font-bold text-brand">{entry.period.startsAt}</span>
                </div>
                <p className="mt-3 text-sm font-medium text-muted">{entry.class?.name || 'Class'}{entry.class?.arm ? ` · ${entry.class.arm}` : ''}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {entry.period.startsAt} - {entry.period.endsAt}</span>
                  {entry.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {entry.room}</span>}
                </div>
              </article>
            ))}
            {!todayEntries.length && <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-8 text-center text-sm text-muted md:col-span-2 lg:col-span-3">No lessons scheduled for {weekDays[todayIndex]}. Open your timetable to review the full week.</div>}
          </div>
        </section>

        <section className="border-b border-border pb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Work shortcuts</h2>
              <p className="mt-1 text-sm text-muted">Go straight to the tasks that keep your classes moving.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group inline-flex w-full cursor-pointer items-center justify-between border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:bg-brand-light"
                >
                  <span className="inline-flex items-center gap-2"><IconComponent className="h-4 w-4 text-brand" />{action.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-brand" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border border-border bg-surface">
          <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-muted">
                <BookOpen className="h-4 w-4 text-brand" /> Teaching assignments
              </div>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Your classes</h2>
              <p className="mt-1 text-sm text-muted">Manage the classes assigned to you.</p>
            </div>
            <span className="text-sm font-semibold text-muted">{data.classes.length} {data.classes.length === 1 ? 'class' : 'classes'}</span>
          </div>

          {data.classes.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[minmax(240px,1.5fr)_1fr_120px_100px] border-b border-border bg-background px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-muted">
                  <span>Class</span>
                  <span>Phase</span>
                  <span className="text-right">Students</span>
                  <span className="text-right">Action</span>
                </div>
                {data.classes.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/teacher/class?id=${cls.id}`}
                    className="group grid grid-cols-[minmax(240px,1.5fr)_1fr_120px_100px] items-center border-b border-border px-5 py-4 transition last:border-b-0 hover:bg-brand-light"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-foreground">{cls.name}{cls.arm ? ` · ${cls.arm}` : ''}</span>
                    </span>
                    <span className="text-sm text-muted">{cls.phase}</span>
                    <span className="text-right text-sm font-semibold text-foreground">{cls.studentCount}</span>
                    <span className="inline-flex items-center justify-end gap-1 text-sm font-semibold text-brand">
                      Open <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="m-5 rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-8 text-center text-sm text-muted">
              No classes assigned yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

