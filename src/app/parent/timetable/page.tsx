"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, CalendarDays, Printer, RefreshCw } from "lucide-react";
import ParentPageShell from "@/components/parent-page-shell";
import { getBackendUrl } from "@/lib/backend-url";
import { resolveSchoolAssetUrl } from "@/lib/asset-urls";
import { useParentSchool } from "../parent-school-context";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  class?: { name: string; arm?: string | null } | null;
};

type TimetableEntry = {
  id: string;
  room?: string | null;
  period: {
    id: string;
    dayOfWeek: number;
    name: string;
    startsAt: string;
    endsAt: string;
    sortOrder: number;
  };
  subject?: { name: string } | null;
  teacher?: { name: string } | null;
};

type Period = {
  id: string;
  dayOfWeek: number;
  name: string;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
};

type TimetableData = {
  child: Child;
  timetable: {
    name: string;
    academicYear: string;
    term: string | null;
    publishedAt: string | null;
  } | null;
  periods: Period[];
  entries: TimetableEntry[];
};

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const schoolDays = weekdays.slice(0, 5);

export default function ParentTimetablePage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const { school } = useParentSchool();
  const schoolLogoUrl = school?.logoUrl
    ? school.id
      ? `/api/school-logo/${encodeURIComponent(school.id)}`
      : resolveSchoolAssetUrl(school.logoUrl)
    : null;

  async function loadChildren() {
    setLoadingChildren(true);
    setError("");
    try {
      const response = await fetch(`${getBackendUrl()}/api/parent/children`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Could not load linked children.");
      const data = await response.json();
      const linkedChildren = (data.children || []) as Child[];
      setChildren(linkedChildren);
      if (!linkedChildren.length) setTimetableData(null);
      setSelectedChildId((current) => linkedChildren.some((child) => child.id === current)
        ? current
        : linkedChildren[0]?.id || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load linked children.");
    } finally {
      setLoadingChildren(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadChildren);
  }, []);

  async function refreshPage() {
    await loadChildren();
    setRefreshVersion((current) => current + 1);
  }

  useEffect(() => {
    if (!selectedChildId) {
      return;
    }

    const controller = new AbortController();
    async function loadTimetable() {
      setLoadingTimetable(true);
      setTimetableData(null);
      setError("");
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/parent/children/${encodeURIComponent(selectedChildId)}/timetable`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load this timetable.");
        setTimetableData(data as TimetableData);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Could not load this timetable.");
        setTimetableData(null);
      } finally {
        if (!controller.signal.aborted) setLoadingTimetable(false);
      }
    }

    void loadTimetable();
    return () => controller.abort();
  }, [selectedChildId, refreshVersion]);

  const selectedChild = children.find((child) => child.id === selectedChildId);
  const entriesByDay = weekdays.map((day, index) => ({
    day,
    entries: (timetableData?.entries || [])
      .filter((entry) => entry.period.dayOfWeek === index + 1)
      .sort((left, right) => left.period.sortOrder - right.period.sortOrder),
  }));
  const printPeriods = Array.from(
    (timetableData?.periods || [])
      .filter((period) => period.dayOfWeek >= 1 && period.dayOfWeek <= schoolDays.length)
      .sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.sortOrder - right.sortOrder)
      .reduce((periodsByOrder, period) => {
        if (!periodsByOrder.has(period.sortOrder)) periodsByOrder.set(period.sortOrder, period);
        return periodsByOrder;
      }, new Map<number, Period>())
      .values(),
  ).sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <ParentPageShell onRefresh={refreshPage}>
      <div className="w-full space-y-6 pb-6">
        <style>{`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body * { visibility: hidden !important; }
            .parent-timetable-print,
            .parent-timetable-print * { visibility: visible !important; }
            .parent-timetable-print {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              background: #fff !important;
              color: #111 !important;
            }
            .parent-timetable-print-grid {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 4mm !important;
            }
            .parent-timetable-print-grid > section { break-inside: avoid; }
            .parent-timetable-school-board {
              display: block !important;
              border: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
            }
            .parent-timetable-school-board-grid {
              display: grid !important;
              grid-template-columns: 30mm repeat(5, minmax(0, 1fr)) !important;
              width: 100% !important;
              min-width: 0 !important;
            }
            .parent-timetable-school-board-cell {
              min-height: 22mm !important;
              padding: 2.5mm !important;
              border-right: 1px solid #d5dbe1 !important;
              border-bottom: 1px solid #d5dbe1 !important;
              background: #fff !important;
              color: #111 !important;
              break-inside: avoid;
            }
            .parent-timetable-school-board-heading {
              min-height: 10mm !important;
              background: #f2f5f7 !important;
              font-size: 8pt !important;
              font-weight: 700 !important;
            }
            .parent-timetable-screen-days { display: none !important; }
            .parent-timetable-school-brand img {
              display: block !important;
              max-width: 27mm !important;
              max-height: 20mm !important;
              object-fit: contain !important;
            }
          }
        `}</style>
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-10 sm:px-8 sm:pb-9 sm:pt-12">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand">
                <CalendarDays className="h-4 w-4" /> Parent workspace
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Timetable</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                View the published weekly schedule for each child.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshPage}
              disabled={loadingChildren || loadingTimetable}
              className="inline-flex items-center gap-2 self-start rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand disabled:opacity-60 lg:self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loadingChildren || loadingTimetable ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {children.length > 0 ? (
          <div className="border border-border bg-surface">
            <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Family schedule</p>
                <h2 className="mt-1 font-semibold text-foreground">Choose a child</h2>
              </div>
              {timetableData?.timetable ? (
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-foreground">{timetableData.timetable.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {timetableData.timetable.academicYear}{timetableData.timetable.term ? ` · ${timetableData.timetable.term}` : ""}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
              <label className="block w-full max-w-md text-xs font-bold uppercase tracking-[.12em] text-muted">
                Child
                <select
                  value={selectedChildId}
                  onChange={(event) => setSelectedChildId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-brand"
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {[child.firstName, child.lastName].filter(Boolean).join(" ")}
                      {child.class?.name ? ` · ${child.class.name}${child.class.arm ? ` ${child.class.arm}` : ""}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {timetableData?.timetable ? (
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <p className="text-sm font-semibold text-foreground">
                    Class schedule: {selectedChild?.class?.name || timetableData.child.class?.name || "Class"}
                    {selectedChild?.class?.arm || timetableData.child.class?.arm ? ` · ${selectedChild?.class?.arm || timetableData.child.class?.arm}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="print:hidden inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
                  >
                    <Printer className="h-4 w-4" /> Print timetable
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="border border-red-200 bg-red-50 p-5 text-red-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-semibold">We could not load the timetable</h2>
                <p className="mt-1 text-sm text-red-800">{error}</p>
                <button type="button" onClick={refreshPage} className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-900 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800">
                  <RefreshCw className="h-4 w-4" /> Try again
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {loadingChildren || loadingTimetable ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-56 animate-pulse border border-border bg-surface p-5">
                <div className="h-3 w-20 bg-slate-200" />
                <div className="mt-5 h-5 w-36 bg-slate-200" />
                <div className="mt-4 h-4 w-full bg-slate-100" />
                <div className="mt-3 h-4 w-4/5 bg-slate-100" />
                <div className="mt-6 h-10 w-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : !children.length ? (
          <div className="border border-border bg-surface px-5 py-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted" />
            <h2 className="mt-3 text-sm font-semibold text-foreground">No children connected yet</h2>
            <p className="mt-1 text-xs text-muted">Linked student profiles will appear here.</p>
          </div>
        ) : !timetableData?.timetable ? (
          <div className="border border-border bg-surface px-5 py-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted" />
            <h2 className="mt-3 text-sm font-semibold text-foreground">
              {selectedChild?.class ? "No published timetable yet" : "Class not assigned"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted">
              {selectedChild?.class
                ? "The school has not published a timetable for the current academic year."
                : "A timetable will appear after the school assigns this child to a class and publishes its schedule."}
            </p>
          </div>
        ) : (
          <div className="parent-timetable-print space-y-4">
            <div className="parent-timetable-school-brand hidden items-center gap-5 border-b border-border pb-4 print:flex">
              {schoolLogoUrl ? (
                <Image
                  src={schoolLogoUrl}
                  alt={`${school?.name || "School"} logo`}
                  width={112}
                  height={80}
                  unoptimized
                  priority
                  className="hidden h-20 w-28 object-contain print:block"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-black">{school?.name || "School"}</h1>
                <p className="mt-1 text-xs text-gray-700">
                  {[school?.address, school?.phone, school?.email].filter(Boolean).join(" · ")}
                </p>
                <h2 className="mt-3 text-lg font-bold text-black">
                  {[timetableData.child.firstName, timetableData.child.lastName].filter(Boolean).join(" ")} · Class Timetable
                </h2>
                <p className="mt-1 text-sm text-black">
                  {timetableData.child.class?.name || "Class"}
                  {timetableData.child.class?.arm ? ` ${timetableData.child.class.arm}` : ""}
                  {` · ${timetableData.timetable.academicYear}`}
                  {timetableData.timetable.term ? ` · ${timetableData.timetable.term}` : ""}
                  {` · ${timetableData.timetable.name}`}
                </p>
              </div>
            </div>
            <div className="parent-timetable-school-board hidden overflow-hidden border border-border bg-surface print:block">
              <div className="parent-timetable-school-board-grid grid grid-cols-[30mm_repeat(5,minmax(0,1fr))]">
                <div className="parent-timetable-school-board-cell parent-timetable-school-board-heading">Period</div>
                {schoolDays.map((day) => (
                  <div key={day} className="parent-timetable-school-board-cell parent-timetable-school-board-heading">{day}</div>
                ))}
                {printPeriods.map((period) => (
                  <div key={period.sortOrder} className="contents">
                    <div className="parent-timetable-school-board-cell">
                      <p className="text-[9pt] font-bold">{period.name}</p>
                    </div>
                    {schoolDays.map((day, index) => {
                      const dayOfWeek = index + 1;
                      const dayPeriod = timetableData.periods.find((item) => item.dayOfWeek === dayOfWeek && item.sortOrder === period.sortOrder);
                      const lessons = dayPeriod
                        ? timetableData.entries.filter((entry) => entry.period.id === dayPeriod.id)
                        : [];
                      return (
                        <div key={`${period.sortOrder}-${day}`} className="parent-timetable-school-board-cell">
                          {dayPeriod ? <p className="mb-1 text-[7pt] font-medium text-gray-600">{dayPeriod.startsAt}–{dayPeriod.endsAt}</p> : null}
                          {lessons.map((entry) => (
                            <div key={entry.id} className="mb-1 border-l-2 border-gray-500 pl-1.5 last:mb-0">
                              <p className="text-[8pt] font-bold">{entry.subject?.name || "Lesson"}</p>
                              <p className="text-[7pt] text-gray-700">{entry.teacher?.name || "Teacher"}{entry.room ? ` · ${entry.room}` : ""}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="parent-timetable-print-grid parent-timetable-screen-days grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {entriesByDay.map(({ day, entries }) => (
                <section key={day} className="border border-border bg-white">
                  <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">Weekly schedule</p>
                      <h2 className="mt-1 text-sm font-semibold text-foreground">{day}</h2>
                    </div>
                    <span className="border border-border bg-surface px-2 py-1 text-[10px] font-bold text-muted">
                      {entries.length} {entries.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  {entries.length ? (
                    <ol className="divide-y divide-border">
                      {entries.map((entry) => (
                        <li key={entry.id} className="px-5 py-4 transition-colors hover:bg-background/50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{entry.subject?.name || "Lesson"}</p>
                              <p className="mt-1 text-xs text-muted">{entry.teacher?.name || "Teacher"}{entry.room ? ` · ${entry.room}` : ""}</p>
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
            </div>
          </div>
        )}
      </div>
    </ParentPageShell>
  );
}
