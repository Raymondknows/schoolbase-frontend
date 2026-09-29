"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Clock3, RefreshCw } from "lucide-react";
import ParentPageShell from "@/components/parent-page-shell";
import ParentPageHeader from "@/components/parent-page-header";
import { getBackendUrl } from "@/lib/backend-url";

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
    dayOfWeek: number;
    name: string;
    startsAt: string;
    endsAt: string;
    sortOrder: number;
  };
  subject?: { name: string } | null;
  teacher?: { name: string } | null;
};

type TimetableData = {
  child: Child;
  timetable: {
    name: string;
    academicYear: string;
    term: string | null;
    publishedAt: string | null;
  } | null;
  entries: TimetableEntry[];
};

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ParentTimetablePage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

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

  return (
    <ParentPageShell onRefresh={refreshPage}>
      <div className="space-y-5 pb-6">
        <ParentPageHeader
          icon={CalendarDays}
          eyebrow="School schedule"
          title="Timetable"
          description="View the published weekly schedule for each child."
        />

        {children.length > 0 ? (
          <div className="flex flex-col gap-3 border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="w-full max-w-md text-sm font-semibold text-foreground">
              Child
              <select
                value={selectedChildId}
                onChange={(event) => setSelectedChildId(event.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-2.5 font-normal outline-none focus:border-brand"
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
              <div className="text-xs text-muted sm:text-right">
                <p className="font-semibold text-foreground">{timetableData.timetable.name}</p>
                <p className="mt-1">{timetableData.timetable.academicYear}{timetableData.timetable.term ? ` · ${timetableData.timetable.term}` : ""}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">{error}</div>
            <button type="button" onClick={refreshPage} className="inline-flex items-center gap-1 font-semibold hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : null}

        {loadingChildren || loadingTimetable ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse border border-border bg-surface" />)}
          </div>
        ) : !children.length ? (
          <div className="border border-border bg-surface px-5 py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted" />
            <h2 className="mt-3 text-base font-semibold text-foreground">No children linked</h2>
            <p className="mt-1 text-sm text-muted">Linked child profiles will appear here.</p>
          </div>
        ) : !timetableData?.timetable ? (
          <div className="border border-border bg-surface px-5 py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-muted" />
            <h2 className="mt-3 text-base font-semibold text-foreground">
              {selectedChild?.class ? "No published timetable yet" : "Class not assigned"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              {selectedChild?.class
                ? "The school has not published a timetable for the current academic year."
                : "A timetable will appear after the school assigns this child to a class and publishes its schedule."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock3 className="h-3.5 w-3.5" />
              {selectedChild?.class?.name || timetableData.child.class?.name || "Class schedule"}
              {selectedChild?.class?.arm || timetableData.child.class?.arm ? ` · ${selectedChild?.class?.arm || timetableData.child.class?.arm}` : ""}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {entriesByDay.map(({ day, entries }) => (
                <section key={day} className="border border-border bg-surface">
                  <h2 className="border-b border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">{day}</h2>
                  {entries.length ? (
                    <ol className="divide-y divide-border">
                      {entries.map((entry) => (
                        <li key={entry.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{entry.subject?.name || "Lesson"}</p>
                              <p className="mt-1 text-xs text-muted">{entry.teacher?.name || "Teacher"}{entry.room ? ` · ${entry.room}` : ""}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs font-semibold text-brand">{entry.period.name}</p>
                              <p className="mt-1 text-[11px] text-muted">{entry.period.startsAt}–{entry.period.endsAt}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="px-4 py-6 text-center text-xs text-muted">No lessons scheduled</p>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </ParentPageShell>
  );
}
