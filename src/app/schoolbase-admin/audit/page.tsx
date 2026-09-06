"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Activity, Clock3, ClipboardList, ExternalLink, Search, ListFilter, RotateCcw } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";

interface AuditLog {
  id: string;
  action?: string | null;
  details?: string | null;
  createdAt?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  school?: {
    name?: string | null;
  } | null;
}

function formatAuditDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatActionLabel(action?: string | null) {
  const value = (action || "").toString().trim().toUpperCase();
  if (!value) return "Platform activity";

  const map: Record<string, string> = {
    UPGRADE: "Plan upgrade",
    SETPLAN: "Plan update",
    SET_PLAN: "Plan update",
    EXTENDTRIAL: "Trial extended",
    EXTEND_TRIAL: "Trial extended",
    CANCEL: "Subscription cancelled",
    SUSPEND: "School suspended",
    ACTIVATE: "School activated",
    IMPERSONATE: "School impersonated",
    VERIFY: "Verification updated",
    VERIFIED: "Verification updated",
    LOGIN_SUCCESS: "Login succeeded",
    LOGIN_FAILED: "Login failed",
    PARENT_LOGIN_SUCCESS: "Parent login succeeded",
    PARENT_LOGIN_FAILED: "Parent login failed",
  };

  return map[value] || value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getActionTone(action?: string | null) {
  const value = (action || "").toString().trim().toUpperCase();

  if (["UPGRADE", "SETPLAN", "SET_PLAN"].includes(value)) {
    return "bg-sky-100 text-sky-700";
  }

  if (["CANCEL", "SUSPEND"].includes(value)) {
    return "bg-rose-100 text-rose-700";
  }

  if (["ACTIVATE", "VERIFY", "VERIFIED"].includes(value)) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (["IMPERSONATE"].includes(value)) {
    return "bg-violet-100 text-violet-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDetailText(details?: string | null) {
  if (!details) return null;

  const trimmed = details.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (typeof parsed.plan === "string" && parsed.plan) {
        const expiresAt = typeof parsed.expiresAt === "string" ? new Date(parsed.expiresAt) : null;
        const expiresLabel = expiresAt && !Number.isNaN(expiresAt.getTime()) ? ` • expires ${expiresAt.toLocaleDateString()}` : "";
        return `Plan set to ${parsed.plan}${expiresLabel}`;
      }

      if (typeof parsed.by === "string" && parsed.by) {
        return `Updated by ${parsed.by}`;
      }
    }
  } catch {
    // fall back to plain text
  }

  return trimmed;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");

  useEffect(() => {
    async function fetchLogs() {
      try {
        const backendUrl = getBackendUrl();
        const [response, schoolsResponse] = await Promise.all([
          fetch(`${backendUrl}/schoolbase-admin/api/audit-logs?limit=200`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
          fetch(`${backendUrl}/schoolbase-admin/api/schools?limit=1000`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        if (!response.ok) {
          throw new Error("Failed to load audit logs");
        }

        const data = await response.json();
        setLogs(data.logs || []);
        if (schoolsResponse.ok) {
          const schoolsData = await schoolsResponse.json();
          setSchools((schoolsData.schools || []).map((school: { name?: string | null }) => school.name).filter(Boolean).sort());
        }
      } catch (error) {
        console.error("Failed to load audit logs:", error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const stats = useMemo(() => {
    const total = logs.length;
    const recent = logs.filter((log) => {
      if (!log.createdAt) return false;
      const created = new Date(log.createdAt).getTime();
      const cutoff = Date.now() - 1000 * 60 * 60 * 24;
      return created >= cutoff;
    }).length;

    return { total, recent };
  }, [logs]);

  const schoolOptions = useMemo(
    () => Array.from(new Set([
      ...schools,
      ...logs.map((log) => log.school?.name).filter(Boolean) as string[],
    ])).sort(),
    [logs, schools],
  );
  const actionOptions = useMemo(
    () => Array.from(new Set([
      "Login succeeded",
      "Login failed",
      "Parent login succeeded",
      "Parent login failed",
      ...logs.map((log) => formatActionLabel(log.action)),
    ])).sort(),
    [logs],
  );
  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();
    return logs.filter((log) => {
      const haystack = `${formatActionLabel(log.action)} ${log.details || ""} ${log.user?.name || ""} ${log.user?.email || ""} ${log.school?.name || ""}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesSchool = schoolFilter === "ALL" || log.school?.name === schoolFilter;
      const matchesAction = actionFilter === "ALL" || formatActionLabel(log.action) === actionFilter;
      const age = log.createdAt ? now - new Date(log.createdAt).getTime() : Number.POSITIVE_INFINITY;
      const matchesTime = timeFilter === "ALL" || (timeFilter === "24H" && age <= 24 * 60 * 60 * 1000) || (timeFilter === "7D" && age <= 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && matchesSchool && matchesAction && matchesTime;
    });
  }, [actionFilter, logs, schoolFilter, search, timeFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, logs.length, schoolFilter, search, timeFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand"><ClipboardList size={17} /> Governance operations</div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Audit Trail</h1>
          <p className="mt-1 text-muted">Review recent platform and school administrative activity</p>
        </div>
        <Link href="/schoolbase-admin" className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light sm:self-auto">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total events", value: stats.total, sub: "All recorded events", icon: Activity, tone: "bg-slate-100 text-slate-700" },
            { label: "Recent (24h)", value: stats.recent, sub: "Within the last day", icon: Clock3, tone: "bg-sky-100 text-sky-700" },
            { label: "Protected", value: logs.filter((log) => (log.action || "").toLowerCase().includes("verify") || (log.details || "").toLowerCase().includes("verify")).length, sub: "Verification-related activity", icon: ShieldCheck, tone: "bg-emerald-100 text-emerald-700" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="border border-border bg-surface p-5 transition hover:border-brand/50">
                <div className="mb-4 flex items-center gap-2 text-brand">
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">{card.label}</span>
                </div>
                <div className="text-3xl font-semibold text-foreground">{card.value}</div>
                <div className="mt-1 text-xs text-muted">{card.sub}</div>
              </div>
            );
          })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="min-w-0 border border-border bg-surface p-5">
          <div className="mb-5 border-b border-border pb-5">
            <div className="flex items-center gap-2 text-brand"><ListFilter className="h-4 w-4" /><span className="text-sm font-semibold text-foreground">Filter activity</span></div>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
              <label className="flex items-center gap-2 border border-border bg-background px-3 py-2.5">
                <Search className="h-4 w-4 text-muted" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search action, actor, school, or details" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none" />
              </label>
              <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)} className="border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                <option value="ALL">All schools</option>
                {schoolOptions.map((school) => <option key={school} value={school}>{school}</option>)}
              </select>
              <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                <option value="ALL">All actions</option>
                {actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}
              </select>
              <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} className="border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                <option value="ALL">Any time</option>
                <option value="24H">Last 24 hours</option>
                <option value="7D">Last 7 days</option>
              </select>
              <button type="button" onClick={() => { setSearch(""); setSchoolFilter("ALL"); setActionFilter("ALL"); setTimeFilter("ALL"); }} className="inline-flex items-center justify-center gap-2 border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"><RotateCcw className="h-4 w-4" /> Reset</button>
            </div>
            <p className="mt-3 text-xs text-muted">Showing {filteredLogs.length} of {logs.length} recorded events across all schools.</p>
          </div>
          {loading ? (
            <div className="border border-border bg-background px-4 py-8 text-sm text-muted">Loading audit logs…</div>
          ) : filteredLogs.length === 0 ? (
            <div className="border border-border bg-background px-4 py-8 text-sm text-muted">No audit events match the current filters.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Recent platform activity</p>
                  <p className="text-sm text-muted">Showing {Math.min(pageSize, filteredLogs.length)} entries per page</p>
                </div>
                <div className="text-sm text-muted">Page {page} of {totalPages}</div>
              </div>

              <div className="overflow-hidden border border-border">
                <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  <div>Action</div>
                  <div>Actor</div>
                  <div>School</div>
                  <div>Time</div>
                </div>
                <div className="divide-y divide-border bg-white">
                  {paginatedLogs.map((log) => {
                    const actionLabel = formatActionLabel(log.action);
                    const detailText = formatDetailText(log.details);
                    const actorName = log.user?.name || log.user?.email || "Platform admin";
                    const schoolName = log.school?.name || "—";

                    return (
                      <div key={log.id} className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] gap-3 px-4 py-3 text-sm text-foreground">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getActionTone(log.action)}`}>
                              {actionLabel}
                            </span>
                          </div>
                          {detailText ? <p className="mt-2 text-xs text-muted">{detailText}</p> : null}
                        </div>
                        <div className="text-muted">{actorName}</div>
                        <div className="text-muted">{schoolName}</div>
                        <div className="text-muted">{formatAuditDate(log.createdAt)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  Showing {filteredLogs.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} events
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="h-fit space-y-4">
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 text-brand"><Activity className="h-[18px] w-[18px]" /><h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">Audit pulse</h2></div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted">Total events</span><strong className="text-foreground">{stats.total}</strong></div>
              <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted">Last 24 hours</span><strong className="text-foreground">{stats.recent}</strong></div>
              <div className="flex items-center justify-between"><span className="text-muted">Protected events</span><strong className="text-foreground">{logs.filter((log) => (log.action || "").toLowerCase().includes("verify") || (log.details || "").toLowerCase().includes("verify")).length}</strong></div>
            </div>
          </div>
          <div className="border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-brand"><ExternalLink className="h-4 w-4" /><h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">Operations</h2></div>
            <div className="space-y-2">
              <Link href="/schoolbase-admin" className="flex items-center justify-between border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-brand/5"><span>Platform overview</span><ExternalLink className="h-3.5 w-3.5 text-muted" /></Link>
              <Link href="/schoolbase-admin/schools" className="flex items-center justify-between border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-brand/5"><span>School operations</span><ExternalLink className="h-3.5 w-3.5 text-muted" /></Link>
              <Link href="/schoolbase-admin/support" className="flex items-center justify-between border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-brand/5"><span>Support queue</span><ExternalLink className="h-3.5 w-3.5 text-muted" /></Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
