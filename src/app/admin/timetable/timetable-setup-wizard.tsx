"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { playCloseTone, playOpenTone } from "@/lib/sounds";

type Option = { id: string; name: string; email?: string };
type Period = {
  id: string;
  dayOfWeek: number;
  name: string;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
};
type DraftLesson = {
  id?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  periodId: string;
  room: string;
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const defaultLesson = {
  classId: "",
  subjectId: "",
  teacherId: "",
  periodId: "",
  room: "",
};

export default function TimetableSetupWizard({
  academicYears,
  classes,
  subjects,
  teachers,
  onClose,
  onCreated,
}: {
  academicYears: Option[];
  classes: Option[];
  subjects: Option[];
  teachers: Option[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [academicYearId, setAcademicYearId] = useState(
    academicYears[0]?.id || "",
  );
  const [configId, setConfigId] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [lessons, setLessons] = useState<DraftLesson[]>([]);
  const [lesson, setLesson] = useState<DraftLesson>(defaultLesson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!academicYearId && academicYears[0])
      setAcademicYearId(academicYears[0].id);
  }, [academicYearId, academicYears]);

  useEffect(() => {
    playOpenTone();
  }, []);

  function closeWizard() {
    playCloseTone();
    onClose();
  }

  const availablePeriods = useMemo(
    () => periods.filter((period) => period.name.toLowerCase() !== "break"),
    [periods],
  );
  const selectedPeriod = periods.find(
    (period) => period.id === lesson.periodId,
  );

  async function createBoard(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/timetable/configs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, academicYearId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not create timetable");
      setConfigId(data.config.id);
      setPeriods(data.config.periods || []);
      setStep(2);
    } catch (requestError: any) {
      setError(requestError.message || "Could not create timetable");
    } finally {
      setSaving(false);
    }
  }

  async function addLesson(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/timetable/configs/${configId}/entries`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lesson),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        const conflictText = Array.isArray(data.conflicts)
          ? ` ${data.conflicts.map((item: any) => item.message).join(" ")}`
          : "";
        throw new Error(
          (data.message || data.error || "Could not add lesson") + conflictText,
        );
      }
      setLessons((current) => [...current, { ...lesson, id: data.entry?.id }]);
      setLesson(defaultLesson);
    } catch (requestError: any) {
      setError(requestError.message || "Could not add lesson");
    } finally {
      setSaving(false);
    }
  }

  async function removeLesson(index: number) {
    const selectedLesson = lessons[index];
    if (selectedLesson?.id) {
      const response = await fetch(
        `/api/admin/timetable/entries/${selectedLesson.id}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error || "Could not remove lesson");
        return;
      }
    }
    setLessons((current) =>
      current.filter((_, lessonIndex) => lessonIndex !== index),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]">
        <header className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-6 py-5 sm:px-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand">
              <CalendarDays size={15} /> Timetable setup
            </div>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              {step === 1
                ? "Create your school board"
                : "Add lessons to your board"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {step === 1
                ? "Choose the academic context for this weekly timetable."
                : "Assign each subject to a class, teacher, and period."}
            </p>
          </div>
          <button
            type="button"
            onClick={closeWizard}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-background"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex border-b border-border px-5 sm:px-7">
          <div
            className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold ${step === 1 ? "border-brand text-brand" : "border-transparent text-muted"}`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-white">
              1
            </span>{" "}
            Board details
          </div>
          <div
            className={`ml-6 flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-semibold ${step === 2 ? "border-brand text-brand" : "border-transparent text-muted"}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 2 ? "bg-brand text-white" : "bg-background text-muted"}`}
            >
              2
            </span>{" "}
            Lessons
          </div>
        </div>
        {step === 1 ? (
          <form onSubmit={createBoard} className="p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-foreground sm:col-span-2">
                Timetable name
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="2026/2027 First Term"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3 font-normal outline-none focus:border-brand"
                />
              </label>
              <label className="text-sm font-semibold text-foreground sm:col-span-2">
                Academic year
                <select
                  required
                  value={academicYearId}
                  onChange={(event) => setAcademicYearId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-3 font-normal outline-none focus:border-brand"
                >
                  <option value="">Select academic year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-[#fff5f5] px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}
            <div className="mt-8 flex justify-end">
              <button
                disabled={saving || !academicYearId}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Creating board..." : "Continue to lessons"}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 sm:p-7">
            <div className="mb-5 rounded-lg border border-[#b7dfc1] bg-[#f1fbf3] px-4 py-3 text-sm text-[#176b2c]">
              <Check className="mr-2 inline" size={16} /> {name} is ready with{" "}
              {availablePeriods.length} teaching periods across Monday to
              Friday.
            </div>
            <form
              onSubmit={addLesson}
              className="grid gap-4 rounded-lg border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Field label="Day and period">
                <select
                  required
                  value={lesson.periodId}
                  onChange={(event) =>
                    setLesson({ ...lesson, periodId: event.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="">Select period</option>
                  {days.map((day, index) => (
                    <optgroup key={day} label={day}>
                      {availablePeriods
                        .filter((period) => period.dayOfWeek === index + 1)
                        .map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.name} · {period.startsAt}-{period.endsAt}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Class">
                <select
                  required
                  value={lesson.classId}
                  onChange={(event) =>
                    setLesson({ ...lesson, classId: event.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subject">
                <select
                  required
                  value={lesson.subjectId}
                  onChange={(event) =>
                    setLesson({ ...lesson, subjectId: event.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="">Select subject</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Teacher">
                <select
                  required
                  value={lesson.teacherId}
                  onChange={(event) =>
                    setLesson({ ...lesson, teacherId: event.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Room (optional)">
                <input
                  value={lesson.room}
                  onChange={(event) =>
                    setLesson({ ...lesson, room: event.target.value })
                  }
                  placeholder="e.g. Lab 1"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
              </Field>
              <div className="flex items-end">
                <button
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Plus size={16} /> {saving ? "Adding..." : "Add lesson"}
                </button>
              </div>
            </form>
            {error && (
              <p className="mt-4 rounded-lg bg-[#fff5f5] px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Lessons added{" "}
                  <span className="ml-1 rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand">
                    {lessons.length}
                  </span>
                </h3>
                <span className="text-xs text-muted">
                  You can continue adding lessons after closing
                </span>
              </div>
              <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
                {lessons.map((item, index) => {
                  const period = periods.find(
                    (entry) => entry.id === item.periodId,
                  );
                  const day = period ? days[period.dayOfWeek - 1] : "";
                  return (
                    <div
                      key={`${item.periodId}-${item.classId}-${index}`}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {
                            subjects.find(
                              (entry) => entry.id === item.subjectId,
                            )?.name
                          }{" "}
                          <span className="font-normal text-muted">
                            ·{" "}
                            {
                              classes.find((entry) => entry.id === item.classId)
                                ?.name
                            }
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {day} · {period?.name} ·{" "}
                          {
                            teachers.find(
                              (entry) => entry.id === item.teacherId,
                            )?.name
                          }
                          {item.room ? ` · ${item.room}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLesson(index)}
                        aria-label="Remove lesson"
                        className="text-muted hover:text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                {!lessons.length && (
                  <p className="p-8 text-center text-sm text-muted">
                    Your lesson list will appear here as you build the week.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-7 flex flex-col-reverse justify-between gap-3 border-t border-border pt-5 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"
              >
                <ArrowLeft size={16} /> Board details
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreated();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Check size={16} /> Finish timetable
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-muted">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
