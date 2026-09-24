"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import TeacherPageHeader from "@/components/teacher-page-header";

type Entry = {
  id: string;
  room?: string | null;
  period: { dayOfWeek: number; name: string; startsAt: string; endsAt: string };
  class?: { name: string; arm?: string | null };
  subject?: { name: string };
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const accents = ["#0a66c2", "#0b7a75", "#7a5af8", "#c2410c", "#b42318"];

function formatCountdown(startsAt: string, now: Date) {
  const [hours, minutes] = startsAt.split(":").map(Number);
  const lessonStart = new Date(now);
  lessonStart.setHours(hours, minutes, 0, 0);
  const remainingMinutes = Math.max(
    0,
    Math.ceil((lessonStart.getTime() - now.getTime()) / 60000),
  );
  if (remainingMinutes < 60) return `${remainingMinutes} min`;
  const remainingHours = Math.floor(remainingMinutes / 60);
  const minutesAfterHour = remainingMinutes % 60;
  return minutesAfterHour
    ? `${remainingHours}h ${minutesAfterHour}m`
    : `${remainingHours}h`;
}

export default function TeacherTimetablePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [boardName, setBoardName] = useState("Published timetable");
  const [selectedDay, setSelectedDay] = useState(
    new Date().getDay() >= 1 && new Date().getDay() <= 5
      ? new Date().getDay() - 1
      : 0,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [dismissedNextLessonId, setDismissedNextLessonId] = useState<string | null>(null);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await fetch("/api/teacher/timetable", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load timetable");
      setBoardName(data.configs?.[0]?.name || "Published timetable");
      setEntries((data.configs?.[0]?.entries || []) as Entry[]);
      setError("");
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load timetable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // Initial data fetch intentionally updates the loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          a.period.dayOfWeek - b.period.dayOfWeek ||
          a.period.startsAt.localeCompare(b.period.startsAt),
      ),
    [entries],
  );
  const todayEntries = sortedEntries.filter(
    (entry) => entry.period.dayOfWeek === selectedDay + 1,
  );
  const nextLesson = todayEntries.find((entry) => {
    const [hours, minutes] = entry.period.startsAt.split(":").map(Number);
    const lessonStart = new Date(now);
    lessonStart.setHours(hours, minutes, 0, 0);
    return lessonStart.getTime() > now.getTime();
  });
  const countdown = nextLesson
    ? formatCountdown(nextLesson.period.startsAt, now)
    : null;
  const lessonDays = new Set(entries.map((entry) => entry.period.dayOfWeek))
    .size;

  return (
    <main className="min-h-screen px-2 py-8 sm:px-8 lg:px-12">
      <style jsx>{`
        @keyframes sb_timetable_drawer_in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <TeacherPageHeader icon={CalendarDays} title="Timetable" description="Plan your teaching week with published classes, subjects, rooms, and live lesson timing." count={boardName}>
          <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 border border-brand/25 bg-brand-light px-4 py-2.5 text-sm font-semibold text-brand hover:border-brand hover:bg-brand hover:text-white disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
        </TeacherPageHeader>
        {error && (
          <div className="border-l-4 border-error border-y border-r border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {loading ? (
          <div className="border border-border bg-surface p-16 text-center text-muted">
            Loading your published timetable...
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <Summary
                icon={<CalendarDays size={18} />}
                label="Current board"
                value={boardName}
                detail="Published by your school"
              />
              <Summary
                icon={<Clock3 size={18} />}
                label="Your lessons"
                value={String(entries.length)}
                detail="Scheduled this week"
              />
              <Summary
                icon={<CheckCircle2 size={18} />}
                label="Teaching days"
                value={String(lessonDays)}
                detail="Days with a class"
              />
            </section>
            <section className="border border-border bg-surface">
              <div className="flex flex-col justify-between gap-4 border-b border-border bg-background px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Weekly plan</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {days[selectedDay]}
                  </h2>
                  <p className="mt-1 text-sm text-muted">Choose a day to review your scheduled lessons.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex items-center gap-2 border border-brand/20 bg-brand-light px-3 py-2 text-sm text-brand">
                    <Clock3 size={15} />
                    <span>
                      <span className="font-semibold">{todayEntries.length}</span>{" "}
                      {todayEntries.length === 1 ? "lesson" : "lessons"} scheduled
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 p-4">
                {days.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(index)}
                    className={`border px-2 py-3 text-sm font-semibold transition-colors ${selectedDay === index ? "border-brand bg-brand text-white" : "border-border bg-background text-muted hover:border-brand hover:text-brand"}`}
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                    <span className="mt-1 block text-xs font-normal opacity-75">
                      {
                        entries.filter(
                          (entry) => entry.period.dayOfWeek === index + 1,
                        ).length
                      }{" "}
                      lessons
                    </span>
                  </button>
                ))}
              </div>
            </section>
            {countdown && nextLesson && dismissedNextLessonId !== nextLesson.id && (
              <div className="fixed inset-0 z-50 flex">
                <div
                  className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
                  onClick={() => setDismissedNextLessonId(nextLesson.id)}
                />
                <aside
                  className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-surface shadow-2xl motion-safe:animate-[sb_timetable_drawer_in_300ms_ease-out]"
                  role="dialog"
                  aria-label="Next lesson notification"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-border bg-surface px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand/10 text-brand">
                        <Clock3 size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Timetable notification</p>
                        <h2 className="mt-1 text-xl font-semibold text-foreground">Next lesson</h2>
                        <p className="mt-1 text-sm text-muted">Your next scheduled class is approaching.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissedNextLessonId(nextLesson.id)}
                      aria-label="Dismiss next lesson notification"
                      className="p-2 text-muted transition hover:bg-background hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 bg-background p-4 sm:p-6">
                    <div className="border-l-4 border-brand border-y border-r border-border bg-surface p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Starts in</p>
                      <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{countdown}</p>
                      <p className="mt-2 text-sm text-muted">{nextLesson.period.startsAt} · {nextLesson.subject?.name || "Lesson"}</p>
                      <p className="mt-1 text-sm text-muted">
                        {nextLesson.class?.name || "Class"}
                        {nextLesson.class?.arm ? ` · ${nextLesson.class.arm}` : ""}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            )}
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="border border-border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-light"
                  style={{ borderTop: `4px solid ${accents[selectedDay]}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.1em] text-muted">
                        {entry.period.name}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-foreground">
                        {entry.subject?.name || "Lesson"}
                      </h3>
                    </div>
                    <span className="border border-brand/20 bg-brand-light px-2 py-1 text-xs font-bold text-brand">
                      {entry.period.startsAt}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted">
                    {entry.class?.name || "Class"}
                    {entry.class?.arm ? ` · ${entry.class.arm}` : ""}
                  </p>
                  <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} /> {entry.period.startsAt} -{" "}
                      {entry.period.endsAt}
                    </div>
                    {entry.room && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} /> {entry.room}
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {!todayEntries.length && (
                <div className="border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-10 text-center md:col-span-2 lg:col-span-3">
                  <CalendarDays className="mx-auto text-brand" size={28} />
                  <h2 className="mt-3 font-semibold text-foreground">
                    No lessons scheduled for {days[selectedDay]}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Your school has not assigned you a published class on this
                    day.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Summary({
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
    <div className="group border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center bg-brand/10 text-brand">{icon}</div>
        <CalendarDays className="h-4 w-4 text-muted transition group-hover:text-brand" />
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}
