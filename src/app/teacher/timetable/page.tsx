"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Timer,
} from "lucide-react";

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
  const [countdownPosition, setCountdownPosition] = useState({ x: 24, y: 96 });
  const [isDraggingCountdown, setIsDraggingCountdown] = useState(false);
  const countdownDragOffsetRef = useRef({ x: 0, y: 0 });

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
    } catch (requestError: any) {
      setError(requestError.message || "Unable to load timetable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isDraggingCountdown) return;

    const handlePointerMove = (event: PointerEvent) => {
      setCountdownPosition({
        x: Math.max(12, Math.min(window.innerWidth - 280, event.clientX - countdownDragOffsetRef.current.x)),
        y: Math.max(72, Math.min(window.innerHeight - 120, event.clientY - countdownDragOffsetRef.current.y)),
      });
    };
    const handlePointerUp = () => setIsDraggingCountdown(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingCountdown]);

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
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-7 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <CalendarDays size={17} /> Teacher workspace
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              Timetable
            </h1>
            <p className="mt-1 text-muted">
              View your published classes, subjects, and rooms for the week
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </div>
        {error && (
          <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {loading ? (
          <div className="rounded-lg border border-border bg-surface p-16 text-center text-muted">
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
            {countdown && nextLesson ? (
              <div
                className="fixed z-40 w-[min(280px,calc(100vw-24px))] touch-none select-none rounded-2xl border border-brand/20 bg-surface/95 p-3 shadow-xl shadow-blue-900/10 backdrop-blur-sm print:hidden"
                style={{ left: countdownPosition.x, top: countdownPosition.y }}
              >
                <div
                  className={`flex cursor-grab items-center gap-3 ${isDraggingCountdown ? "cursor-grabbing" : ""}`}
                  onPointerDown={(event) => {
                    countdownDragOffsetRef.current = {
                      x: event.clientX - countdownPosition.x,
                      y: event.clientY - countdownPosition.y,
                    };
                    setIsDraggingCountdown(true);
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Timer size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Next lesson</p>
                    <p className="truncate text-sm font-semibold text-foreground">{nextLesson.subject?.name || "Lesson"}</p>
                    <p className="text-xs text-muted">Starts in <span className="font-bold text-brand">{countdown}</span> · {nextLesson.period.startsAt}</p>
                  </div>
                </div>
              </div>
            ) : null}
            <section className="rounded-[24px] border border-border/70 bg-surface/80 p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">
                    Select a day
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">
                    {days[selectedDay]}
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-brand-light px-3 py-2 text-sm text-brand">
                  <Clock3 size={15} />
                  <span>
                    <span className="font-semibold">{todayEntries.length}</span>{" "}
                    {todayEntries.length === 1 ? "lesson" : "lessons"} scheduled
                  </span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {days.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(index)}
                    className={`rounded-lg border px-2 py-3 text-sm font-semibold transition-colors ${selectedDay === index ? "border-brand bg-brand text-white" : "border-border bg-background text-muted hover:border-brand hover:text-brand"}`}
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
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[20px] border border-border/70 bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
                    <span className="rounded-full bg-brand-light px-2 py-1 text-xs font-bold text-brand">
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
                <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-10 text-center md:col-span-2 lg:col-span-3">
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
    <div className="rounded-[20px] border border-border/70 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-brand">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">
          {label}
        </span>
      </div>
      <p className="mt-3 truncate text-xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}
