"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  ListPlus,
  Plus,
  Printer,
  Send,
  Sparkles,
  Trash2,
  Users2,
  X,
  Undo2,
} from "lucide-react";
import { buildApiUrl } from "@/lib/api-client";
import { playCloseTone, playOpenTone } from "@/lib/sounds";
import TimetableSetupWizard from "./timetable-setup-wizard";
import AdminBellManager from "@/components/admin-bell-manager";
import AdminPeriodsManager from "@/components/admin-periods-manager";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const accents = ["#0a66c2", "#0b7a75", "#7a5af8", "#c2410c", "#b42318"];

type Entry = {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  periodId: string;
  room?: string | null;
  period: Period;
  class?: { name: string; arm?: string | null };
  subject?: { name: string };
  teacher?: { name: string };
};
type Period = {
  id: string;
  dayOfWeek: number;
  name: string;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
};
type Config = {
  id: string;
  name: string;
  status: string;
  periods: Period[];
  entries: Entry[];
};
type SelectorData = { id: string; name: string; email?: string };

function api(path: string, options?: RequestInit) {
  const endpoint = path.startsWith("/admin/timetable")
    ? `/api${path}`
    : buildApiUrl(path);
  return fetch(endpoint, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
}

export default function TimetableClient() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [academicYears, setAcademicYears] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [classes, setClasses] = useState<SelectorData[]>([]);
  const [subjects, setSubjects] = useState<SelectorData[]>([]);
  const [teachers, setTeachers] = useState<SelectorData[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [view, setView] = useState<"week" | "list">("week");
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [addingLesson, setAddingLesson] = useState(false);
  const [configActionModalOpen, setConfigActionModalOpen] = useState(false);
  const [configActionAnimateState, setConfigActionAnimateState] = useState<
    "enter" | "exit"
  >("enter");
  const [configActionSaving, setConfigActionSaving] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishModalSaving, setPublishModalSaving] = useState(false);
  const [publishModalSuccess, setPublishModalSuccess] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    kind: "deleteLesson" | "unpublish";
    entry?: Entry;
  } | null>(null);
  const [pendingConfirmationSaving, setPendingConfirmationSaving] = useState(false);
  const [bellModalOpen, setBellModalOpen] = useState(false);
  const [periodsModalOpen, setPeriodsModalOpen] = useState(false);

  function openComposer() {
    setShowComposer(true);
    playOpenTone();
  }
  function closeComposer() {
    setShowComposer(false);
    playCloseTone();
  }
  function openAddingLesson() {
    setAddingLesson(true);
    playOpenTone();
  }
  function closeAddingLesson() {
    setAddingLesson(false);
    playCloseTone();
  }
  function openEditingEntry(entry: Entry) {
    setEditingEntry(entry);
    playOpenTone();
  }
  function closeEditingEntry() {
    setEditingEntry(null);
    playCloseTone();
  }

  function openBellModal() {
    setBellModalOpen(true);
    playOpenTone();
  }

  function closeBellModal() {
    setBellModalOpen(false);
    playCloseTone();
  }

  function closePeriodsModal() {
    setPeriodsModalOpen(false);
    playCloseTone();
  }

  async function load() {
    setLoading(true);
    try {
      const [response, yearsResponse] = await Promise.all([
        api("/admin/timetable"),
        fetch("/api/admin/academic-years", { credentials: "include" }),
      ]);
      const data = await response.json();
      const yearsData = await yearsResponse
        .json()
        .catch(() => ({ academicYears: [] }));
      setAcademicYears(data.academicYears || yearsData.academicYears || []);
      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
      setTeachers(data.teachers || []);
      if (!response.ok)
        throw new Error(data.error || "Unable to load timetable");
      setConfigs(data.configs || []);
      if (!selectedConfigId && data.configs?.[0])
        setSelectedConfigId(data.configs[0].id);
    } catch (requestError: any) {
      setError(requestError.message || "Unable to load timetable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openPublishModal() {
    setPublishModalSuccess(false);
    setPublishModalOpen(true);
    playOpenTone();
  }

  function closePublishModal() {
    setPublishModalOpen(false);
    setPublishModalSuccess(false);
    playCloseTone();
  }

  async function publishConfig() {
    if (!config) return;
    setPublishModalSaving(true);
    const response = await api(
      `/admin/timetable/configs/${config.id}/publish`,
      { method: "POST" },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || data.error || "Unable to publish timetable");
      setPublishModalSaving(false);
      return;
    }
    setPublishModalSuccess(true);
    setPublishModalSaving(false);
    await load();
  }

  async function unpublishConfig() {
    if (!config) return;
    setPendingConfirmation({ kind: "unpublish" });
    playOpenTone();
  }

  async function confirmPendingAction() {
    if (!pendingConfirmation || !config) return;
    setPendingConfirmationSaving(true);
    const endpoint = pendingConfirmation.kind === "unpublish"
      ? `/admin/timetable/configs/${config.id}/unpublish`
      : `/admin/timetable/entries/${pendingConfirmation.entry?.id}`;
    const response = await api(endpoint, { method: pendingConfirmation.kind === "unpublish" ? "POST" : "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to complete timetable action");
      setPendingConfirmationSaving(false);
      return;
    }
    closePendingConfirmation();
    await load();
    setPendingConfirmationSaving(false);
  }

  function closePendingConfirmation() {
    setPendingConfirmation(null);
    setPendingConfirmationSaving(false);
    playCloseTone();
  }

  async function deleteEntry(entry: Entry) {
    setPendingConfirmation({ kind: "deleteLesson", entry });
    playOpenTone();
  }

  async function removeConfig() {
    if (!config) return;
    const action = published ? "archive" : "delete";
    setConfigActionSaving(true);
    const response = await api(
      `/admin/timetable/configs/${config.id}${published ? "/archive" : ""}`,
      { method: published ? "POST" : "DELETE" },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || `Unable to ${action} timetable`);
      setConfigActionSaving(false);
      return;
    }
    closeConfigActionModal();
    setSelectedConfigId("");
    await load();
    setConfigActionSaving(false);
  }

  function openConfigActionModal() {
    setConfigActionAnimateState("enter");
    setConfigActionModalOpen(true);
    playOpenTone();
  }

  function closeConfigActionModal() {
    setConfigActionAnimateState("exit");
    playCloseTone();
    window.setTimeout(() => setConfigActionModalOpen(false), 320);
  }

  const config =
    configs.find((item) => item.id === selectedConfigId) || configs[0];
  const periods = useMemo(() => {
    const unique = new Map<string, Period>();
    (config?.periods || []).forEach((period) =>
      unique.set(String(period.sortOrder), period),
    );
    return [...unique.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [config]);
  const entries = config?.entries || [];
  const published = config?.status === "PUBLISHED";
  const coverage = periods.length
    ? Math.round((entries.length / (periods.length * days.length)) * 100)
    : 0;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand">
              <CalendarDays size={17} /> Academic operations
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              Timetable
            </h1>
            <p className="mt-1 text-muted">
              Create and manage class schedules by term, teacher, and subject
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setPeriodsModalOpen(true);
                playOpenTone();
              }}
              disabled={!config}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
              title="Configure school periods"
            >
              <Clock3 size={16} /> School periods
            </button>
            <button
              type="button"
              onClick={openBellModal}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              title="Open school bell settings"
            >
              <Bell size={16} /> School bell
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"
            >
              <Printer size={16} /> Print board
            </button>
            <button
              onClick={openComposer}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <Plus size={17} /> New timetable
            </button>
          </div>
        </div>
        <AdminBellManager isOpen={bellModalOpen} onClose={closeBellModal} />
        <AdminPeriodsManager
          isOpen={periodsModalOpen}
          configId={config?.id}
          periods={config?.periods || []}
          published={published}
          onClose={closePeriodsModal}
          onSaved={(savedPeriods) => {
            setConfigs((current) => current.map((item) => item.id === config?.id ? { ...item, periods: savedPeriods } : item));
          }}
        />
        {error && (
          <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#a61b29]">
            {error}
          </div>
        )}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Clock3 size={18} />}
            label="Lessons scheduled"
            value={String(entries.length)}
            detail={published ? "Live across the school" : "Draft workspace"}
          />
          <Stat
            icon={<Users2 size={18} />}
            label="Teacher load"
            value={String(
              new Set(entries.map((entry) => entry.teacherId)).size,
            )}
            detail="Teachers on this board"
          />
          <Stat
            icon={<CheckCircle2 size={18} />}
            label="Board coverage"
            value={`${Math.min(coverage, 100)}%`}
            detail="Weekly periods filled"
          />
          <Stat
            icon={<Sparkles size={18} />}
            label="Board status"
            value={published ? "Published" : "Draft"}
            detail={
              published
                ? "Ready for staff and families"
                : "Private until you publish"
            }
          />
        </section>

        <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={config?.id || ""}
              onChange={(event) => setSelectedConfigId(event.target.value)}
              className="min-w-64 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:border-brand"
            >
              {!configs.length && <option value="">No timetables yet</option>}
              {configs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {config && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${published ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#fff4d6] text-[#8a5a00]"}`}
              >
                {published ? "PUBLISHED" : "DRAFT"}
              </span>
            )}
            {config && !published && (
              <button
                onClick={openPublishModal}
                disabled={!entries.length}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Send size={15} /> Publish
              </button>
            )}
            {config && published && (
              <button
                onClick={unpublishConfig}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light"
              >
                <Undo2 size={15} /> Return to draft
              </button>
            )}
            {config && !published && (
              <button
                onClick={openAddingLesson}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light"
              >
                <ListPlus size={15} /> Add lesson
              </button>
            )}
            {config && (
              <button
                onClick={openConfigActionModal}
                className="inline-flex items-center gap-2 rounded-lg border border-[#f5c2c7] bg-surface px-3 py-2 text-sm font-semibold text-error hover:bg-[#fff5f5]"
              >
                {published ? <Archive size={15} /> : <Trash2 size={15} />}{" "}
                {published ? "Archive" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex rounded-lg border border-border bg-surface p-1 text-sm">
            <button
              onClick={() => setView("week")}
              className={`rounded-md px-3 py-1.5 font-semibold ${view === "week" ? "bg-brand text-white" : "text-muted"}`}
            >
              Week view
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1.5 font-semibold ${view === "list" ? "bg-brand text-white" : "text-muted"}`}
            >
              List view
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-lg border border-border bg-surface p-16 text-center text-muted">
            Loading your timetable workspace...
          </div>
        ) : !config ? (
          <EmptyState onCreate={openComposer} />
        ) : view === "week" ? (
          <WeekBoard
            config={config}
            periods={periods}
            editable={!published}
            onEdit={openEditingEntry}
            onDelete={deleteEntry}
          />
        ) : (
          <ListView
            entries={entries}
            editable={!published}
            onEdit={openEditingEntry}
            onDelete={deleteEntry}
          />
        )}
      </div>
      {showComposer && (
        <TimetableSetupWizard
          academicYears={academicYears}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          onClose={closeComposer}
          onCreated={load}
        />
      )}
      {editingEntry && config && (
        <LessonEditor
          timetableName={config.name}
          existingEntries={entries}
          entry={editingEntry}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          periods={config.periods}
          onClose={closeEditingEntry}
          onSaved={() => {
            closeEditingEntry();
            load();
          }}
        />
      )}
      {addingLesson && config && (
        <LessonEditor
          timetableName={config.name}
          existingEntries={entries}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          periods={config.periods}
          configId={config.id}
          onClose={closeAddingLesson}
          onSaved={() => {
            closeAddingLesson();
            load();
          }}
        />
      )}
      {configActionModalOpen && config && (
        <ActionConfirmationModal
          configName={config.name}
          action={published ? "archive" : "delete"}
          saving={configActionSaving}
          onCancel={closeConfigActionModal}
          onConfirm={removeConfig}
        />
      )}
      {pendingConfirmation && config && (
        <ActionConfirmationModal
          configName={pendingConfirmation.entry?.subject?.name || config.name}
          action={pendingConfirmation.kind === "unpublish" ? "unpublish" : "deleteLesson"}
          saving={pendingConfirmationSaving}
          onCancel={closePendingConfirmation}
          onConfirm={confirmPendingAction}
        />
      )}
      {publishModalOpen && config && (
        <PublishModal
          configName={config.name}
          success={publishModalSuccess}
          saving={publishModalSaving}
          onCancel={closePublishModal}
          onConfirm={publishConfig}
        />
      )}
    </main>
  );
}

function Stat({
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
    <div className="border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2 text-brand">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">
          {label}
        </span>
      </div>
      <div className="text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted">{detail}</div>
    </div>
  );
}
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-[#9ac7ea] bg-[#f3f9fe] p-14 text-center">
      <CalendarDays className="mx-auto text-brand" size={34} />
      <h2 className="mt-4 text-xl font-semibold text-foreground">
        Your weekly board is ready to be designed
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Start with a timetable configuration, then add periods and lessons for
        your school.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white"
      >
        <Plus size={16} /> Create timetable
      </button>
    </div>
  );
}
function WeekBoard({
  config,
  periods,
  editable,
  onEdit,
  onDelete,
}: {
  config: Config;
  periods: Period[];
  editable: boolean;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <div className="min-w-[880px]">
        <div className="grid grid-cols-[132px_repeat(5,1fr)] border-b border-border bg-[#f6f8fa] text-xs font-bold uppercase tracking-[.1em] text-muted">
          <div className="p-4">Period</div>
          {days.map((day) => (
            <div key={day} className="border-l border-border p-4">
              {day}
            </div>
          ))}
        </div>
        {periods.map((period) => (
          <div
            key={period.sortOrder}
            className="grid min-h-[118px] grid-cols-[132px_repeat(5,1fr)] border-b border-border last:border-0"
          >
            <div className="p-4">
              <div className="font-semibold text-foreground">{period.name}</div>
              <div className="mt-1 text-xs text-muted">
                {period.startsAt} - {period.endsAt}
              </div>
            </div>
            {days.map((_, index) => {
              const dayPeriod = config.periods.find(
                (item) =>
                  item.sortOrder === period.sortOrder &&
                  item.dayOfWeek === index + 1,
              );
              const entry = dayPeriod
                ? config.entries.find((item) => item.periodId === dayPeriod.id)
                : undefined;
              return (
                <div
                  key={`${period.sortOrder}-${index}`}
                  className="border-l border-border p-2"
                >
                  {entry && (
                    <div
                      className="group relative h-full border-l-4 bg-brand-light/30 p-3"
                      style={{ borderColor: accents[index] }}
                    >
                      <div className="pr-12 text-sm font-bold text-foreground">
                        {entry.subject?.name || "Lesson"}
                      </div>
                      <div className="mt-1 text-xs font-medium text-muted">
                        {entry.class?.name || "Class"}
                        {entry.class?.arm ? ` · ${entry.class.arm}` : ""}
                      </div>
                      <div className="mt-3 text-[11px] text-muted">
                        {entry.teacher?.name || "Teacher"}
                        {entry.room ? ` · ${entry.room}` : ""}
                      </div>
                      {editable && (
                        <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                          <button
                            onClick={() => onEdit(entry)}
                            aria-label="Edit lesson"
                            className="rounded bg-surface p-1.5 text-brand shadow-sm hover:bg-brand-light"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => onDelete(entry)}
                            aria-label="Delete lesson"
                            className="rounded bg-surface p-1.5 text-error shadow-sm hover:bg-[#fff5f5]"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
function ListView({
  entries,
  editable,
  onEdit,
  onDelete,
}: {
  entries: Entry[];
  editable: boolean;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface shadow-sm">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <div className="font-semibold text-foreground">
              {entry.subject?.name}{" "}
              <span className="font-normal text-muted">
                for {entry.class?.name}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted">
              {entry.period.name} · {entry.period.startsAt} -{" "}
              {entry.period.endsAt} ·{" "}
              {entry.period.dayOfWeek ? days[entry.period.dayOfWeek - 1] : ""}
            </div>
            <div className="mt-1 text-xs text-muted">
              {entry.teacher?.name}
              {entry.room ? ` · ${entry.room}` : ""}
            </div>
          </div>
          {editable && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(entry)}
                aria-label="Edit lesson"
                className="rounded-lg border border-border p-2 text-brand hover:bg-brand-light"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={() => onDelete(entry)}
                aria-label="Delete lesson"
                className="rounded-lg border border-border p-2 text-error hover:bg-[#fff5f5]"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      ))}
      {!entries.length && (
        <div className="p-10 text-center text-sm text-muted">
          No lessons have been added yet.
        </div>
      )}
    </div>
  );
}

function ActionConfirmationModal({ configName, action, saving, onCancel, onConfirm }: { configName: string; action: "delete" | "archive" | "unpublish" | "deleteLesson"; saving: boolean; onCancel: () => void; onConfirm: () => void }) {
  const labels = {
    delete: { title: "Delete timetable?", detail: "All lessons and periods in this draft timetable will be removed.", button: "Delete permanently", icon: <Trash2 className="h-4 w-4" /> },
    archive: { title: "Archive timetable?", detail: "The timetable will leave active use, but its history will be retained.", button: "Archive timetable", icon: <Archive className="h-4 w-4" /> },
    unpublish: { title: "Return timetable to draft?", detail: "Teachers and parents will no longer see this timetable until it is published again.", button: "Return to draft", icon: <Undo2 className="h-4 w-4" /> },
    deleteLesson: { title: "Delete lesson?", detail: "This lesson will be removed from the timetable.", button: "Delete lesson", icon: <Trash2 className="h-4 w-4" /> },
  }[action];
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"><style>{`@keyframes timetable_confirm_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }`}</style><div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]" style={{ animation: "timetable_confirm_enter 320ms cubic-bezier(.2,.9,.2,1)" }}><div className="border-b border-border px-6 py-5" style={{ background: "linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0.04))" }}><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-brand/10 text-brand shadow-sm"><AlertCircle className="h-6 w-6" /></div><div><h2 className="text-lg font-semibold text-slate-900">{labels.title}</h2><p className="mt-1 text-sm text-slate-600">Review this action before continuing.</p></div></div></div><div className="px-6 py-5"><p className="text-sm leading-6 text-slate-700">You are about to {action === "deleteLesson" ? "delete the lesson from" : action === "unpublish" ? "return" : action === "archive" ? "archive" : "permanently delete"} <strong>“{configName}”</strong>.</p><div className="mt-4 rounded-lg border border-brand/15 bg-brand/5 p-3"><p className="text-xs text-foreground"><strong>Important:</strong> {labels.detail}</p></div></div><div className="flex gap-3 border-t border-border bg-surface px-6 py-4"><button onClick={onCancel} disabled={saving} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:opacity-50">Cancel</button><button onClick={onConfirm} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50">{saving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processing...</> : <>{labels.icon} {labels.button}</>}</button></div></div></div>;
}

function ConfigActionModal({
  configName,
  published,
  saving,
  animateState,
  onCancel,
  onConfirm,
}: {
  configName: string;
  published: boolean;
  saving: boolean;
  animateState: "enter" | "exit";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const action = published ? "Archive" : "Delete";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <style>{`@keyframes timetable_action_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } } @keyframes timetable_action_exit { from { transform: translateX(0) scale(1); opacity: 1 } to { transform: translateX(36px) scale(.98); opacity: 0 } }`}</style>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(220,38,38,0.16)]"
        style={{
          animation: `${animateState === "enter" ? "timetable_action_enter" : "timetable_action_exit"} 320ms cubic-bezier(.2,.9,.2,1)`,
        }}
      >
        <div className="border-b border-border/70 bg-error/10 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-error/20 bg-error/10 shadow-sm">
              {published ? (
                <Archive className="h-6 w-6 text-error" />
              ) : (
                <AlertCircle className="h-6 w-6 text-error" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {action} timetable?
              </h2>
              <p className="mt-1 text-sm text-muted">
                {published
                  ? "The published schedule will be removed from active use."
                  : "This action cannot be undone."}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-muted">
            You are about to {published ? "archive" : "permanently delete"}{" "}
            <strong>“{configName}”</strong>.
          </p>
          <div className="mt-4 rounded-lg border border-error/20 bg-error/10 p-3">
            <p className="text-xs text-error">
              <strong>{published ? "History retained:" : "Warning:"}</strong>{" "}
              {published
                ? "Existing lessons will remain available in the archived timetable."
                : "All lessons and periods in this draft timetable will be removed."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 border-t border-border/70 bg-background px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-error px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{" "}
                {action}ing...
              </>
            ) : (
              <>
                {published ? (
                  <Archive className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}{" "}
                {published ? "Archive timetable" : "Delete permanently"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishModal({ configName, success, saving, onCancel, onConfirm }: { configName: string; success: boolean; saving: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <style>{`@keyframes timetable_publish_enter { from { transform: translateX(36px) scale(.98); opacity: 0 } to { transform: translateX(0) scale(1); opacity: 1 } }`}</style>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]" style={{ animation: "timetable_publish_enter 320ms cubic-bezier(.2,.9,.2,1)" }}>
        <div className="border-b border-border px-6 py-5" style={{ background: "linear-gradient(90deg, rgba(10,102,194,0.12), rgba(10,102,194,0.04))" }}>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-emerald-500/10 shadow-sm">
              {success ? <Check className="h-6 w-6 text-brand" /> : <Send className="h-6 w-6 text-brand" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{success ? "Timetable published" : "Publish timetable?"}</h2>
              <p className="mt-1 text-sm text-slate-600">{success ? "Your schedule is now available to the school." : "Review before making this schedule visible."}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-slate-700">{success ? <><strong>{configName}</strong> has been published successfully. Teachers and parents can now view it.</> : <>You are about to publish <strong>“{configName}”</strong>. Teachers and parents will see the schedule after publishing.</>}</p>
          {!success && <div className="mt-4 rounded-lg border border-brand/15 bg-brand/5 p-3"><p className="text-xs text-foreground"><strong>Tip:</strong> You can return the timetable to draft later if you need to make corrections.</p></div>}
        </div>
        <div className="border-t border-border bg-surface px-6 py-4">
          {success ? <button onClick={onCancel} className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover">Done</button> : <div className="flex gap-3"><button onClick={onCancel} disabled={saving} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:opacity-50">Cancel</button><button onClick={onConfirm} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50">{saving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Publishing...</> : <><Send className="h-4 w-4" /> Publish</>}</button></div>}
        </div>
      </div>
    </div>
  );
}

function LessonEditor({
  timetableName,
  existingEntries,
  entry,
  configId,
  classes,
  subjects,
  teachers,
  periods,
  onClose,
  onSaved,
}: {
  timetableName: string;
  existingEntries: Entry[];
  entry?: Entry;
  configId?: string;
  classes: SelectorData[];
  subjects: SelectorData[];
  teachers: SelectorData[];
  periods: Period[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(entry);
  const [form, setForm] = useState({
    classId: entry?.classId || "",
    subjectId: entry?.subjectId || "",
    teacherId: entry?.teacherId || "",
    periodId: entry?.periodId || "",
    room: entry?.room || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const endpoint = isEditing
      ? `/admin/timetable/entries/${entry?.id}`
      : `/admin/timetable/configs/${configId}/entries`;
    const response = await api(endpoint, {
      method: isEditing ? "PATCH" : "POST",
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(data.conflicts)
        ? ` ${data.conflicts.map((item: any) => item.message).join(" ")}`
        : "";
      setError(
        (data.message ||
          data.error ||
          `Unable to ${isEditing ? "update" : "add"} lesson`) + detail,
      );
    } else {
      onSaved();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-brand/10 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand">
              {isEditing ? <Edit3 size={15} /> : <ListPlus size={15} />}{" "}
              {isEditing ? "Edit lesson" : "Add lesson"}
            </div>
            <h2 className="mt-2 text-2xl font-bold text-foreground">
              {isEditing
                ? "Update timetable assignment"
                : "Add a lesson to this timetable"}
            </h2>
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-brand-light px-3 py-2 text-sm font-semibold text-brand">
              <CalendarDays size={15} />{" "}
              <span className="truncate">{timetableName}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {isEditing
                ? "Changes are checked for class, teacher, and room conflicts."
                : "Choose where and when this lesson should take place."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-background"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mx-6 mt-6 rounded-lg border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Already added lessons
            </h3>
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
              {existingEntries.length}
            </span>
          </div>
          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
            {existingEntries.length ? (
              existingEntries.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {item.subject?.name || "Lesson"}{" "}
                      <span className="font-normal text-muted">
                        · {item.class?.name || "Class"}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-muted">
                      {days[item.period.dayOfWeek - 1]} · {item.period.name} ·{" "}
                      {item.teacher?.name || "Teacher"}
                      {item.room ? ` · ${item.room}` : ""}
                    </p>
                  </div>
                  <Check size={14} className="shrink-0 text-emerald-600" />
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-muted">
                No lessons have been added yet.
              </p>
            )}
          </div>
        </div>
        <div className="mx-6 mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Day and period">
            <select
              required
              value={form.periodId}
              onChange={(event) =>
                setForm({ ...form, periodId: event.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="">Select period</option>
              {periods
                .filter((period) => period.name.toLowerCase() !== "break")
                .map((period) => (
                  <option key={period.id} value={period.id}>
                    {days[period.dayOfWeek - 1]} · {period.name} ·{" "}
                    {period.startsAt}-{period.endsAt}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Class">
            <select
              required
              value={form.classId}
              onChange={(event) =>
                setForm({ ...form, classId: event.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
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
              value={form.subjectId}
              onChange={(event) =>
                setForm({ ...form, subjectId: event.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
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
              value={form.teacherId}
              onChange={(event) =>
                setForm({ ...form, teacherId: event.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
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
              value={form.room}
              onChange={(event) =>
                setForm({ ...form, room: event.target.value })
              }
              placeholder="e.g. Lab 1"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </Field>
        </div>
        {error && (
          <p className="mx-6 mt-4 rounded-lg bg-[#fff5f5] px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mx-6 mt-7 flex justify-end gap-3 border-t border-border py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-brand"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : isEditing ? "Save changes" : "Add lesson"}
          </button>
        </div>
      </form>
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
function Composer({
  academicYears,
  onClose,
  onCreated,
}: {
  academicYears: Array<{ id: string; name: string }>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [academicYearId, setAcademicYearId] = useState(
    academicYears[0]?.id || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await api("/admin/timetable/configs", {
      method: "POST",
      body: JSON.stringify({ name, academicYearId }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Could not create timetable");
    else {
      onCreated();
      onClose();
    }
    setSaving(false);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/50 p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Create timetable
            </h2>
            <p className="mt-1 text-sm text-muted">
              Set up a weekly board for an academic year.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>
        <label className="mt-6 block text-sm font-semibold text-foreground">
          Timetable name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="2026/2027 First Term"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold text-foreground">
          Academic year
          <select
            required
            value={academicYearId}
            onChange={(event) => setAcademicYearId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="">Select academic year</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <button
          disabled={saving || !academicYearId}
          className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create draft"}
        </button>
      </form>
    </div>
  );
}
