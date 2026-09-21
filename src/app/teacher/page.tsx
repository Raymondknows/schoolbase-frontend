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
  X,
} from 'lucide-react';
import {
  getTeacherDashboard,
  getTeacherDashboardMetrics,
  type TeacherDashboardData,
  detectSchoolPhase,
} from '@/lib/teacher-utils';
import { SubscriptionBlockedError } from '@/lib/subscription-utils';
import { playCloseTone, playOpenTone } from '@/lib/sounds';
import SubscriptionModal from '@/components/subscription-modal';
import AdminSkeleton from "@/components/ui/skeleton";

type TeacherScheduleEntry = {
  id: string;
  room?: string | null;
  period: { dayOfWeek: number; name: string; startsAt: string; endsAt: string };
  class?: { name: string; arm?: string | null };
  subject?: { name: string };
};

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
  const [selectedLesson, setSelectedLesson] = useState<TeacherScheduleEntry | null>(null);
  const [scheduleSnoozedUntil, setScheduleSnoozedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [selectedDay] = useState(() => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5 ? day - 1 : 0;
  });

  function openLessonDrawer(lesson: TeacherScheduleEntry | null) {
    if (!lesson) return;
    setSelectedLesson(lesson);
    setScheduleSnoozedUntil(null);
    playOpenTone();
  }

  function closeLessonDrawer() {
    setSelectedLesson(null);
    setScheduleSnoozedUntil(Date.now() + 120000);
    playCloseTone();
  }

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

  useEffect(() => {
    if (!selectedLesson) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLessonDrawer();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLesson]);

  useEffect(() => {
    const currentDay = new Date().getDay();
    if (currentDay < 1 || currentDay > 5) return;

    const upcomingLesson = schedule
      .filter((entry) => entry.period.dayOfWeek === currentDay)
      .sort((a, b) => a.period.startsAt.localeCompare(b.period.startsAt))
      .find((entry) => {
        const [hours, minutes] = entry.period.startsAt.split(':').map(Number);
        const start = new Date(now);
        start.setHours(hours, minutes, 0, 0);
        const minutesUntilStart = (start.getTime() - now.getTime()) / 60000;
        return minutesUntilStart >= 0 && minutesUntilStart <= 15;
      });

    if (!selectedLesson && upcomingLesson && (!scheduleSnoozedUntil || Date.now() >= scheduleSnoozedUntil)) {
      void Promise.resolve().then(() => openLessonDrawer(upcomingLesson));
    }
  }, [now, schedule, scheduleSnoozedUntil, selectedLesson]);

  if (loading) {
    return <AdminSkeleton />;
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
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-8 sm:px-8 lg:px-12">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-10 sm:px-8 sm:pb-9 sm:pt-12">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand"><CalendarDays className="h-4 w-4" /> Teacher workspace</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Good morning, {data.teacher.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Your teaching day at {data.school?.name}. Stay on top of classes, attendance, assessments, and student progress.</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted"><span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Workspace active</span><span className="border border-border bg-background px-3 py-2">{schoolPhase.replace('_', ' ')}</span></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/teacher/timetable" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"><CalendarDays className="h-4 w-4" /> Timetable</Link>
              <button type="button" onClick={() => openLessonDrawer(todayEntries[0] || null)} disabled={!todayEntries.length} className="inline-flex items-center gap-2 rounded-md border border-brand/30 bg-brand-light px-4 py-2.5 text-sm font-semibold text-brand transition hover:border-brand/50 hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"><CalendarDays className="h-4 w-4" /> Today&apos;s schedule</button>
              <button type="button" onClick={() => { setRefreshing(true); window.location.reload(); }} disabled={refreshing} className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh'}</button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <article key={stat.label} className="group border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.tone}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-brand" />
                </div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{stat.label}</p>
                <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 truncate text-xs text-muted">{stat.detail}</p>
              </article>
            );
          })}
        </section>

        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex md:left-64" role="dialog" aria-modal="true" aria-labelledby="lesson-drawer-title">
            <button
              type="button"
              aria-label="Close lesson details"
              onClick={closeLessonDrawer}
              className="absolute inset-0 cursor-pointer bg-slate-950/35 backdrop-blur-[2px]"
            />
            <aside className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-surface shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">{weekDays[selectedLesson.period.dayOfWeek - 1]} schedule</p>
                  <h2 id="lesson-drawer-title" className="mt-1 text-xl font-semibold text-foreground">Lesson details</h2>
                  <p className="mt-1 text-sm text-muted">{boardName}</p>
                </div>
                <button
                  type="button"
                  onClick={closeLessonDrawer}
                  aria-label="Close lesson details"
                  className="rounded-lg p-2 text-muted transition hover:bg-background hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto bg-background p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3 border border-border bg-surface px-4 py-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.1em] text-muted">Today · {weekDays[todayIndex]}</p>
                    <p className="mt-1 text-sm text-muted">{todayEntries.length} {todayEntries.length === 1 ? 'lesson' : 'lessons'} scheduled from your published board.</p>
                  </div>
                  {nextLesson && <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-amber-700"><Timer className="h-4 w-4" /> {formatCountdown(nextLesson.period.startsAt, now)}</span>}
                </div>
                <div className="border border-border bg-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.1em] text-muted">{selectedLesson.period.name}</p>
                      <h3 className="mt-2 text-2xl font-bold text-foreground">{selectedLesson.subject?.name || 'Lesson'}</h3>
                    </div>
                    <span className="rounded-full bg-brand-light px-3 py-1.5 text-sm font-bold text-brand">{selectedLesson.period.startsAt}</span>
                  </div>
                  <div className="mt-6 space-y-4 border-t border-border pt-5">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 text-brand" />
                      <div><p className="text-xs font-bold uppercase tracking-[.1em] text-muted">Time</p><p className="mt-1 font-semibold text-foreground">{selectedLesson.period.startsAt} - {selectedLesson.period.endsAt}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users2 className="mt-0.5 h-5 w-5 text-brand" />
                      <div><p className="text-xs font-bold uppercase tracking-[.1em] text-muted">Class</p><p className="mt-1 font-semibold text-foreground">{selectedLesson.class?.name || 'Class'}{selectedLesson.class?.arm ? ` · ${selectedLesson.class.arm}` : ''}</p></div>
                    </div>
                    {selectedLesson.room && <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-brand" /><div><p className="text-xs font-bold uppercase tracking-[.1em] text-muted">Room</p><p className="mt-1 font-semibold text-foreground">{selectedLesson.room}</p></div></div>}
                  </div>
                </div>
                <Link href="/teacher/timetable" onClick={closeLessonDrawer} className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">Open full timetable</Link>
              </div>
            </aside>
          </div>
        )}

        <section className="border-b border-border pb-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground"><CheckCircle2 className="h-4 w-4 text-brand" /> Work shortcuts</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              const detail = action.label === 'Attendance' ? 'Mark today&apos;s register' : action.label === 'Results' ? 'Enter and review scores' : action.label === 'Subjects' ? 'Open assigned subjects' : 'View class rosters';
              return (
                <Link key={action.label} href={action.href} className="group flex items-center gap-3 border border-border bg-surface px-4 py-4 transition hover:border-brand/50 hover:bg-brand-light/30">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand text-white"><IconComponent className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{action.label}</span><span className="mt-0.5 block truncate text-xs text-muted">{detail}</span></span>
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

