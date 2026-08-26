"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarClock, X } from "lucide-react";

type TimetableEntry = {
  id: string;
  period: { dayOfWeek: number; name: string; startsAt: string; endsAt: string };
  class?: { name: string; arm?: string | null };
  subject?: { name: string };
};

const ALERT_WINDOW_MINUTES = 15;

function getLessonDate(now: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const lessonDate = new Date(now);
  lessonDate.setHours(hours, minutes, 0, 0);
  return lessonDate;
}

function getActiveLesson(entries: TimetableEntry[], now: Date) {
  const dayOfWeek = now.getDay();
  if (dayOfWeek < 1 || dayOfWeek > 5) return null;

  return entries.find((entry) => {
    if (entry.period.dayOfWeek !== dayOfWeek) return false;
    const start = getLessonDate(now, entry.period.startsAt);
    const end = getLessonDate(now, entry.period.endsAt);
    const minutesUntilStart = (start.getTime() - now.getTime()) / 60000;
    return now < end && minutesUntilStart <= ALERT_WINDOW_MINUTES;
  }) || null;
}

export default function TeacherClassAlert() {
  const [lesson, setLesson] = useState<TimetableEntry | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [dismissedKey, setDismissedKey] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.sessionStorage.getItem("teacher-class-alert-dismissed"),
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/teacher/timetable", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setLesson(getActiveLesson((data.configs?.[0]?.entries || []) as TimetableEntry[], new Date()));
        }
      } catch {
      }
    };

    load();
    const interval = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  if (!lesson) return null;

  const alertKey = `${new Date().toDateString()}-${lesson.id}`;
  if (dismissedKey === alertKey) return null;

  const start = getLessonDate(now, lesson.period.startsAt);
  const isInProgress = start <= now;
  const className = `${lesson.class?.name || "Class"}${lesson.class?.arm ? ` · ${lesson.class.arm}` : ""}`;

  const dismiss = () => {
    setDismissedKey(alertKey);
    window.sessionStorage.setItem("teacher-class-alert-dismissed", alertKey);
    setLesson(null);
  };

  return (
    <div className="fixed inset-x-0 top-16 z-[80] flex justify-center px-3 print:hidden sm:top-20 sm:px-4" role="alertdialog" aria-label="Upcoming class reminder">
      <div className="w-full max-w-xl rounded-[20px] border border-brand/20 bg-blue-50/95 p-4 shadow-2xl shadow-blue-600/15 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-lg shadow-blue-500/20">
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {isInProgress ? "Your class is in progress" : "Your next class is coming up"}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-slate-700">
              {lesson.subject?.name || "Lesson"} · {className}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {lesson.period.startsAt} - {lesson.period.endsAt} · {isInProgress ? "Please head to class now" : `Starts within ${Math.max(1, Math.ceil((start.getTime() - now.getTime()) / 60000))} minutes`}
            </p>
          </div>
          <button type="button" onClick={dismiss} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900" aria-label="Dismiss class reminder" title="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-brand/10 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand"><CalendarClock className="h-3.5 w-3.5" /> Timetable reminder</span>
          <Link href="/teacher/timetable" className="rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand/90">Open timetable</Link>
        </div>
      </div>
    </div>
  );
}