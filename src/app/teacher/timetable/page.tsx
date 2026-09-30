"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Printer,
  RefreshCw,
  Timer,
} from "lucide-react";
import { resolveSchoolAssetUrl } from "@/lib/asset-urls";
import TeacherPageHeader from "@/components/teacher-page-header";

type Entry = {
  id: string;
  room?: string | null;
  period: { dayOfWeek: number; name: string; startsAt: string; endsAt: string; sortOrder: number };
  class?: { name: string; arm?: string | null };
  subject?: { name: string };
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
  const [teacherName, setTeacherName] = useState("Teacher");
  const [schoolName, setSchoolName] = useState("School");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("");
  const [termName, setTermName] = useState("");
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
      const [response, identityResponse] = await Promise.all([
        fetch("/api/teacher/timetable", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/teacher/dashboard", {
          credentials: "include",
          cache: "no-store",
        }).catch(() => null),
      ]);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load timetable");
      const config = data.configs?.[0];
      setBoardName(config?.name || "Published timetable");
      setAcademicYear(config?.academicYear?.name || "");
      setTermName(config?.term?.name || "");
      setEntries((config?.entries || []) as Entry[]);
      if (identityResponse?.ok) {
        const identity = await identityResponse.json().catch(() => ({}));
        setTeacherName(identity.teacher?.name || "Teacher");
        setSchoolName(identity.school?.name || "School");
        setSchoolLogoUrl(identity.school?.logoUrl
          ? identity.school?.id
            ? `/api/school-logo/${encodeURIComponent(identity.school.id)}`
            : resolveSchoolAssetUrl(identity.school.logoUrl)
          : null);
      }
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
  const todayDayOfWeek = now.getDay();
  const todayEntries = sortedEntries.filter(
    (entry) => entry.period.dayOfWeek === todayDayOfWeek,
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
  const entriesByDay = days.map((day, index) => ({
    day,
    entries: sortedEntries.filter((entry) => entry.period.dayOfWeek === index + 1),
  }));
  const printPeriods = Array.from(
    new Map(
      sortedEntries
        .filter((entry) => entry.period.dayOfWeek >= 1 && entry.period.dayOfWeek <= days.length)
        .map((entry) => [entry.period.sortOrder, entry.period]),
    ).values(),
  ).sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <main className="min-h-screen px-2 py-8 sm:px-8 lg:px-12">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          .teacher-timetable-print,
          .teacher-timetable-print * { visibility: visible !important; }
          .teacher-timetable-print {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            background: #fff !important;
            color: #111 !important;
          }
          .teacher-timetable-print-grid {
            display: grid !important;
            grid-template-columns: 30mm repeat(5, minmax(0, 1fr)) !important;
            width: 100% !important;
          }
          .teacher-timetable-print-cell {
            min-height: 22mm !important;
            padding: 2.5mm !important;
            border-right: 1px solid #d5dbe1 !important;
            border-bottom: 1px solid #d5dbe1 !important;
            background: #fff !important;
            color: #111 !important;
            break-inside: avoid;
          }
          .teacher-timetable-print-heading {
            min-height: 10mm !important;
            background: #f2f5f7 !important;
            font-size: 8pt !important;
            font-weight: 700 !important;
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl space-y-6">
        <TeacherPageHeader icon={CalendarDays} title="Timetable" description="Plan your teaching week with published classes, subjects, rooms, and live lesson timing." count={boardName}>
          <button type="button" onClick={() => window.print()} disabled={loading || entries.length === 0} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 print:hidden"><Printer size={16} /> Print my timetable</button>
          <button onClick={() => load(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:border-brand hover:text-brand disabled:opacity-50"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
        </TeacherPageHeader>
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
            <section className="teacher-timetable-print hidden space-y-4 print:block">
              <header className="flex items-center gap-5 border-b border-border pb-4">
                {schoolLogoUrl ? (
                  <Image
                    src={schoolLogoUrl}
                    alt={`${schoolName} logo`}
                    width={112}
                    height={80}
                    unoptimized
                    priority
                    className="hidden h-20 w-28 object-contain print:block"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold text-black">{schoolName}</h1>
                  <h2 className="mt-3 text-lg font-bold text-black">{teacherName} · Personal Teaching Timetable</h2>
                  <p className="mt-1 text-sm text-black">
                    {[academicYear, termName, boardName].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </header>
              <div className="teacher-timetable-print-grid grid grid-cols-[30mm_repeat(5,minmax(0,1fr))] border-l border-t border-border">
                <div className="teacher-timetable-print-cell teacher-timetable-print-heading">Period</div>
                {days.map((day) => (
                  <div key={day} className="teacher-timetable-print-cell teacher-timetable-print-heading">{day}</div>
                ))}
                {printPeriods.map((period) => (
                  <div key={period.sortOrder} className="contents">
                    <div className="teacher-timetable-print-cell">
                      <p className="text-[8pt] font-bold">{period.name}</p>
                    </div>
                    {days.map((day, index) => {
                      const lessons = sortedEntries.filter((entry) =>
                        entry.period.dayOfWeek === index + 1 && entry.period.sortOrder === period.sortOrder,
                      );
                      return (
                        <div key={`${period.sortOrder}-${day}`} className="teacher-timetable-print-cell">
                          {lessons.map((lesson) => (
                            <div key={lesson.id} className="mb-1 border-l-2 border-gray-500 pl-1.5 last:mb-0">
                              <p className="mb-1 text-[7pt] font-medium text-gray-600">{lesson.period.startsAt}–{lesson.period.endsAt}</p>
                              <p className="text-[8pt] font-bold">{lesson.subject?.name || "Lesson"}</p>
                              <p className="text-[7pt] text-gray-700">
                                {lesson.class?.name || "Class"}{lesson.class?.arm ? ` ${lesson.class.arm}` : ""}{lesson.room ? ` · ${lesson.room}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
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
                className="fixed z-40 w-[min(280px,calc(100vw-24px))] touch-none select-none rounded-lg border border-brand/20 bg-surface/95 p-3 shadow-xl shadow-blue-900/10 backdrop-blur-sm print:hidden"
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
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
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {entriesByDay.map(({ day, entries: dayEntries }) => (
                <section key={day} className="border border-border bg-white">
                  <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Weekly schedule</p>
                      <h2 className="mt-1 text-sm font-semibold text-foreground">{day}</h2>
                    </div>
                    <span className="border border-border bg-surface px-2 py-1 text-[10px] font-bold text-muted">
                      {dayEntries.length} {dayEntries.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  {dayEntries.length ? (
                    <ol className="divide-y divide-border">
                      {dayEntries.map((entry) => (
                        <li key={entry.id} className="px-5 py-4 transition-colors hover:bg-background/50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{entry.subject?.name || "Lesson"}</p>
                              <p className="mt-1 text-xs text-muted">
                                {entry.class?.name || "Class"}{entry.class?.arm ? ` · ${entry.class.arm}` : ""}{entry.room ? ` · ${entry.room}` : ""}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="border border-brand/15 bg-brand/5 px-2 py-1 text-[10px] font-bold text-brand">{entry.period.name}</p>
                              <p className="mt-1 text-[11px] text-muted">{entry.period.startsAt}–{entry.period.endsAt}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-xs font-semibold text-foreground">No lessons scheduled</p>
                      <p className="mt-1 text-[11px] text-muted">There are no class periods for this day.</p>
                    </div>
                  )}
                </section>
              ))}
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
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">{icon}</div>
        <CalendarDays className="h-4 w-4 text-muted transition group-hover:text-brand" />
      </div>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}
