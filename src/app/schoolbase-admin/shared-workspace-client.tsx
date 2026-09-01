"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  CheckSquare,
  Filter,
  Grip,
  ListTodo,
  Plus,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";

type Agent = { id: string; name: string; email: string };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assignedTo?: string | null;
  dueAt?: string | null;
  assignee?: Agent | null;
};
type Props = { mode?: "floating" | "page" };
const positionKey = "schoolbase:shared-workspace-position";

function priorityClass(priority: string) {
  if (priority === "CRITICAL") return "bg-rose-100 text-rose-800";
  if (priority === "HIGH") return "bg-amber-100 text-amber-800";
  if (priority === "LOW") return "bg-slate-100 text-slate-700";
  return "bg-sky-100 text-sky-700";
}

export default function SharedWorkspaceClient({ mode = "floating" }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [open, setOpen] = useState(mode === "page");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueAt, setDueAt] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 96 });
  const dragRef = useRef<{
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const movedRef = useRef(false);

  const loadData = async () => {
    try {
      const backendUrl = getBackendUrl();
      const [tasksResponse, agentsResponse] = await Promise.all([
        fetch(`${backendUrl}/schoolbase-admin/api/support/tasks`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${backendUrl}/schoolbase-admin/api/support/agents`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);
      if (tasksResponse.ok) setTasks((await tasksResponse.json()).tasks ?? []);
      if (agentsResponse.ok)
        setAgents((await agentsResponse.json()).agents ?? []);
    } catch (error) {
      console.error("Unable to load shared workspace:", error);
    }
  };

  useEffect(() => {
    void loadData();
    if (mode === "floating") {
      try {
        const stored = window.localStorage.getItem(positionKey);
        if (stored) {
          const saved = JSON.parse(stored);
          const width = Math.min(window.innerWidth * 0.94, 520);
          setPosition({
            x: Math.max(12, Math.min(window.innerWidth - width - 12, Number(saved.x) || 12)),
            y: Math.max(12, Math.min(window.innerHeight - 64, Number(saved.y) || 96)),
          });
        } else {
          const width = Math.min(window.innerWidth * 0.94, 520);
          setPosition({ x: Math.max(12, window.innerWidth - width - 12), y: 96 });
        }
      } catch {
        const width = Math.min(window.innerWidth * 0.94, 520);
        setPosition({ x: Math.max(12, window.innerWidth - width - 12), y: 96 });
      }
    }
    const intervalId = window.setInterval(() => void loadData(), 15000);
    return () => window.clearInterval(intervalId);
  }, [mode]);

  useEffect(() => {
    if (mode === "floating")
      window.localStorage.setItem(positionKey, JSON.stringify(position));
  }, [mode, position]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragRef.current) return;
      if (
        Math.abs(event.clientX - dragRef.current.startX) > 6 ||
        Math.abs(event.clientY - dragRef.current.startY) > 6
      ) {
        movedRef.current = true;
      }
      setPosition({
        x: Math.max(
          12,
          Math.min(
            window.innerWidth - Math.min(window.innerWidth * 0.94, 520) - 12,
            event.clientX - dragRef.current.offsetX,
          ),
        ),
        y: Math.max(
          12,
          Math.min(
            window.innerHeight - 64,
            event.clientY - dragRef.current.offsetY,
          ),
        ),
      });
    };
    const stop = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, []);

  const updateTask = async (
    task: Task,
    data: Record<string, string | null>,
  ) => {
    const response = await fetch(
      `${getBackendUrl()}/schoolbase-admin/api/support/tasks/${task.id}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (response.ok) {
      const result = await response.json();
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? result.task : item)),
      );
    }
  };

  const createTask = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/schoolbase-admin/api/support/tasks`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            assignedTo: assignee || undefined,
            priority,
            dueAt: dueAt || undefined,
          }),
        },
      );
      if (response.ok) {
        const result = await response.json();
        setTasks((current) => [result.task, ...current]);
        setTitle("");
        setDescription("");
        setAssignee("");
        setPriority("MEDIUM");
        setDueAt("");
      }
    } finally {
      setBusy(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OPEN"
        ? task.status !== "DONE"
        : task.status === "DONE");
    const haystack =
      `${task.title} ${task.description || ""} ${task.assignee?.name || ""}`.toLowerCase();
    return (
      matchesStatus &&
      (!search.trim() || haystack.includes(search.trim().toLowerCase()))
    );
  });

  const taskRow = (task: Task) => (
    <div
      key={task.id}
      className={
        mode === "page"
          ? "border-b border-border bg-surface p-4 last:border-b-0"
          : "rounded-lg border border-border bg-background p-3"
      }
    >
      <div
        className={
          mode === "page"
            ? "grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_140px_120px] sm:items-center"
            : "flex items-start gap-3"
        }
      >
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() =>
              void updateTask(task, {
                status: task.status === "DONE" ? "OPEN" : "DONE",
              })
            }
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] text-white ${task.status === "DONE" ? "border-brand bg-brand" : "border-border"}`}
            aria-label={`Mark ${task.title} ${task.status === "DONE" ? "open" : "done"}`}
          >
            {task.status === "DONE" ? "✓" : ""}
          </button>
          <div className="min-w-0">
            <p
              className={`truncate text-sm font-semibold ${task.status === "DONE" ? "text-muted line-through" : "text-foreground"}`}
            >
              {task.title}
            </p>
            <p className="mt-1 text-xs text-muted">
              {task.description || "No description"}
            </p>
          </div>
        </div>
        <select
          value={task.assignedTo ?? ""}
          onChange={(event) =>
            void updateTask(task, { assignedTo: event.target.value || null })
          }
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-muted outline-none"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          {task.dueAt ? (
            <>
              <CalendarClock className="h-3 w-3" />
              {new Date(task.dueAt).toLocaleDateString()}
            </>
          ) : (
            "No due date"
          )}
        </span>
        <span
          className={`w-fit rounded-full px-2 py-1 text-[10px] font-semibold ${priorityClass(task.priority)}`}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );

  const form = (
    <div className="space-y-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Task title"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Optional detail"
        className="min-h-16 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <div className="grid gap-2 sm:grid-cols-4">
        <select
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <input
          type="date"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-2 text-xs outline-none"
        />
        <button
          type="button"
          disabled={busy || !title.trim()}
          onClick={() => void createTask()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {busy ? "Adding..." : "Add task"}
        </button>
      </div>
    </div>
  );

  const metrics: Array<{
    icon: typeof ListTodo;
    label: string;
    value: number;
    detail: string;
  }> = [
    { icon: ListTodo, label: "Total tasks", value: tasks.length, detail: "All team work" },
    {
      icon: CheckSquare,
      label: "Open work",
      value: tasks.filter((task) => task.status !== "DONE").length,
      detail: "Needs attention",
    },
    { icon: UsersRound, label: "Support agents", value: agents.length, detail: "Available owners" },
    {
      icon: CalendarClock,
      label: "Unassigned",
      value: tasks.filter((task) => !task.assignedTo && task.status !== "DONE").length,
      detail: "Ready for ownership",
    },
  ];

  if (mode === "page")
    return (
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ icon: MetricIcon, label, value, detail }) => {
            return (
              <div
                key={label}
                className="border border-border bg-surface p-5"
              >
                <div className="mb-4 flex items-center gap-2 text-brand">
                  <MetricIcon className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-muted">
                    {label}
                  </span>
                </div>
                <div className="text-3xl font-semibold text-foreground">
                  {value}
                </div>
                <div className="mt-1 text-xs text-muted">{detail}</div>
              </div>
            );
          })}
        </section>
        <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, owners, or details"
                className="w-full border border-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full border border-border bg-surface py-2.5 pl-9 pr-8 text-sm outline-none sm:w-40"
              >
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="DONE">Completed</option>
              </select>
            </div>
          </div>
        </section>
        <section className="overflow-hidden border border-border bg-surface">
          <div className="hidden grid-cols-[minmax(0,1fr)_180px_140px_120px] gap-3 border-b border-border bg-background px-4 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-muted sm:grid">
            <span>Task</span>
            <span>Owner</span>
            <span>Due</span>
            <span>Priority</span>
          </div>
          {filteredTasks.map(taskRow)}
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">
              No tasks match the current view.
            </div>
          ) : null}
        </section>
        <section className="border-t border-border pt-5">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Add shared task
          </p>
          {form}
        </section>
      </div>
    );

  const beginDrag = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    movedRef.current = false;
    dragRef.current = {
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const panel = (
    <div
      className="fixed z-[70] w-[min(94vw,520px)]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div
          className="flex cursor-move touch-none items-center justify-between border-b border-border bg-slate-950 px-4 py-3 text-white"
          onPointerDown={beginDrag}
        >
          <div className="flex items-center gap-2">
            <Grip className="h-4 w-4 text-slate-300" />
            <CheckSquare className="h-4 w-4" />
            <span className="text-sm font-semibold">Shared workspace</span>
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close shared workspace"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted">
                Team operations
              </p>
              <p className="mt-1 text-xs text-muted">
                {tasks.filter((task) => task.status !== "DONE").length} open
                tasks
              </p>
            </div>
            <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-semibold text-brand">
              {tasks.length} total
            </span>
          </div>
          <div className="space-y-2">{tasks.slice(0, 8).map(taskRow)}</div>
          <div className="mt-5 border-t border-border pt-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Add shared task
            </p>
            {form}
          </div>
        </div>
      </div>
    </div>
  );
  return open ? (
    panel
  ) : (
    <button
      type="button"
      onPointerDown={beginDrag}
      onClick={() => {
        if (movedRef.current) {
          movedRef.current = false;
          return;
        }
        setOpen(true);
      }}
      className="fixed z-[70] inline-flex cursor-move touch-none items-center gap-2 rounded-full border border-border bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl"
      style={{ left: position.x, top: position.y }}
    >
      <Grip className="h-4 w-4 text-slate-300" />
      <CheckSquare className="h-4 w-4" />
      Workspace{" "}
      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">
        {tasks.filter((task) => task.status !== "DONE").length}
      </span>
    </button>
  );
}
