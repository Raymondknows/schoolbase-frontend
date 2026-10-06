"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Activity, Clock3, ClipboardList, ExternalLink, Search, ListFilter, RotateCcw, TrendingUp, Users, AlertTriangle, RefreshCw } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { Pagination } from "@/components/ui/pagination";

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

interface ActivitySummary {
  days: number;
  totals: { events: number; recentEvents?: number; protectedEvents?: number; schools: number; activeSchools: number; silentSchools: number };
  actionBreakdown: { event?: string; action: string; count: number }[];
  trend: { date: string; count: number }[];
  schoolActivity: { id: string; name: string; status?: string | null; activityCount: number; lastActivity?: string | null; actionCount: number }[];
}

function formatAuditDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function formatApiActionLabel(details?: string | null) {
  const match = details?.match(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/i);
  if (!match) return "Platform activity";

  const method = match[1].toUpperCase();
  const path = match[2].toLowerCase();
  const isFailed = /(?:status|statusCode):\s*[45]\d\d\b/i.test(details || "");

  if (path.includes("/whatsapp/send-message")) return isFailed ? "WhatsApp message failed" : "WhatsApp message sent";
  if (path.includes("/whatsapp/connect")) return "WhatsApp connection started";
  if (path.includes("/whatsapp/disconnect")) return "WhatsApp disconnected";
  if (path.includes("/signups/approve")) return "Signup approved";
  if (path.includes("/signups/remind")) return "Signup reminder sent";
  if (path.includes("/ads/apply")) return "Advertiser application received";
  if (path.includes("/ads/advertisers") && path.includes("/verify")) return "Advertiser verified";
  if (path.includes("/ads/advertisers") && path.includes("/reject")) return "Advertiser rejected";
  if (path.includes("/ads/campaigns") && path.includes("/submit")) return "Campaign submitted for review";
  if (path.includes("/ads/campaigns") && path.includes("/approve")) return "Campaign approved";
  if (path.includes("/ads/campaigns") && path.includes("/live")) return "Campaign activated";
  if (path.includes("/settings")) return "Platform settings updated";
  if (path.includes("/schools")) return method === "GET" ? "Viewed school records" : "School records updated";

  const resource = path.split("/").filter(Boolean).at(-1)?.replace(/[-_]/g, " ") || "platform records";
  const verb = method === "GET" ? "Viewed" : method === "DELETE" ? "Removed" : method === "POST" ? "Created" : "Updated";
  return `${verb} ${resource}`.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatActionLabel(action?: string | null, details?: string | null) {
  const value = (action || "").toString().trim().toUpperCase();
  if (!value) return "Platform activity";

  if (value.startsWith("API_")) {
    return formatApiActionLabel(details);
  }

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
    SCHOOL_SIGNUP_COMPLETED: "New school signup",
    STUDENT_REGISTERED: "Student registered",
    STUDENT_ACTIVITY: "Student activity",
    STUDENTS_IMPORTED: "Students imported",
    ADMISSION_CONVERTED_TO_STUDENT: "Admission converted",
    ADMISSION_ACTIVITY: "Admission activity",
    FEE_SCHEDULE_CREATED: "Fee schedule created",
    INVOICE_ISSUED: "Invoice issued",
    PAYMENT_RECORDED: "Payment recorded",
    RESULTS_PUBLISHED: "Results published",
    ATTENDANCE_RECORDED: "Attendance recorded",
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

  if (["ACTIVATE", "VERIFY", "VERIFIED", "SCHOOL_SIGNUP_COMPLETED", "STUDENT_REGISTERED", "ADMISSION_CONVERTED_TO_STUDENT", "PAYMENT_RECORDED", "RESULTS_PUBLISHED"].includes(value)) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (["IMPERSONATE"].includes(value)) {
    return "bg-violet-100 text-violet-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDetailText(details?: string | null, action?: string | null) {
  if (!details) return null;

  const trimmed = details.trim();
  if (!trimmed) return null;

  if ((action || "").toString().trim().toUpperCase().startsWith("API_") && /^\s*(GET|POST|PUT|PATCH|DELETE)\s+\S+/i.test(trimmed)) {
    return null;
  }

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
  const [totalEvents, setTotalEvents] = useState(0);
  const [schools, setSchools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("90D");
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchQuery(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchMetadata() {
      const backendUrl = getBackendUrl();
      const [schoolsResponse, summaryResponse] = await Promise.all([
        fetch(`${backendUrl}/schoolbase-admin/api/schools?limit=1000`, { credentials: "include", signal: controller.signal }),
        fetch(`${backendUrl}/schoolbase-admin/api/activity-summary?days=90`, { credentials: "include", signal: controller.signal }),
      ]);
      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json();
        setSchools((schoolsData.schools || []).map((school: { name?: string | null }) => school.name).filter(Boolean).sort());
      }
      if (summaryResponse.ok) setSummary(await summaryResponse.json());
    }
    void fetchMetadata().catch((metadataError) => {
      if (!(metadataError instanceof DOMException && metadataError.name === "AbortError")) {
        console.error("Failed to load audit summary:", metadataError);
      }
    });
    return () => controller.abort();
  }, [refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const backendUrl = getBackendUrl();
        const days = timeFilter === "24H" ? 1 : timeFilter === "7D" ? 7 : timeFilter === "30D" ? 30 : 90;
        const params = new URLSearchParams({ page: String(page), limit: String(pageSize), days: String(days) });
        if (searchQuery) params.set("search", searchQuery);
        if (schoolFilter !== "ALL") params.set("school", schoolFilter);
        if (actionFilter !== "ALL") params.set("action", actionFilter);
        const response = await fetch(`${backendUrl}/schoolbase-admin/api/audit-logs?${params.toString()}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Audit activity could not be loaded. Check your connection and try again.");
        }

        const data = await response.json();
        setLogs(data.logs || []);
        setTotalEvents(Number(data.pagination?.total ?? data.logs?.length ?? 0));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Failed to load audit logs:", error);
        setError(error instanceof Error ? error.message : "Audit activity could not be loaded.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void fetchLogs();
    return () => controller.abort();
  }, [actionFilter, page, pageSize, refreshToken, schoolFilter, searchQuery, timeFilter]);

  const stats = useMemo(() => {
    return {
      total: summary?.totals.events ?? totalEvents,
      recent: summary?.totals.recentEvents ?? 0,
      protected: summary?.totals.protectedEvents ?? 0,
    };
  }, [summary, totalEvents]);

  const schoolOptions = useMemo(
    () => Array.from(new Set([
      ...schools,
      ...logs.map((log) => log.school?.name).filter(Boolean) as string[],
    ])).sort(),
    [logs, schools],
  );
  const actionOptions = useMemo(() => summary?.actionBreakdown || [], [summary]);
  const totalPages = Math.max(1, Math.ceil(totalEvents / pageSize));
  const paginatedLogs = logs;
  const peakDay = summary?.trend.reduce((peak, day) => day.count > peak.count ? day : peak, { date: "", count: 0 });
  const maxTrend = Math.max(...(summary?.trend.map((day) => day.count) || [1]), 1);
  const firstVisible = totalEvents === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, totalEvents);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
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

      <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total events", value: stats.total, sub: "Recorded in the last 90 days", icon: Activity, tone: "bg-slate-100 text-slate-700" },
            { label: "Recent (24h)", value: stats.recent, sub: "Within the last day", icon: Clock3, tone: "bg-sky-100 text-sky-700" },
        { label: "Protected", value: stats.protected, sub: "Verification-related activity · 90 days", icon: ShieldCheck, tone: "bg-emerald-100 text-emerald-700" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="border border-border bg-surface p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2 text-brand">
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">{card.label}</span>
                </div>
                <div className="text-3xl font-semibold tabular-nums text-foreground">{card.value}</div>
                <div className="mt-1 text-xs text-muted">{card.sub}</div>
              </div>
            );
          })}
      </section>

      {summary ? (
        <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="border border-border bg-surface p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 text-brand"><TrendingUp className="h-[18px] w-[18px]" /><h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">School activity health</h2></div>
                <p className="mt-2 text-sm text-muted">Meaningful platform activity across the last {summary.days} days.</p>
              </div>
              <div className="text-left sm:text-right"><p className="text-2xl font-semibold text-foreground">{summary.totals.activeSchools}/{summary.totals.schools}</p><p className="text-xs text-muted">schools active</p></div>
            </div>
            <div className="mt-6 flex h-28 items-end gap-1 border-b border-border pb-3" role="img" aria-label={`Daily platform activity for ${summary.days} days. Peak ${peakDay?.count || 0} events on ${peakDay?.date || "no date"}.`}>
              {summary.trend.map((day) => <div key={day.date} title={`${day.date}: ${day.count} events`} className="min-w-0 flex-1 bg-brand/70 transition hover:bg-brand" style={{ height: `${Math.max(5, (day.count / maxTrend) * 100)}%` }} />)}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted"><span>{summary.trend[0]?.date}</span><span>Peak: {peakDay?.date || "—"} ({peakDay?.count || 0})</span><span>{summary.trend.at(-1)?.date}</span></div>
          </div>
          <div className="border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-brand"><Users className="h-[18px] w-[18px]" /><h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">Engagement signals</h2></div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted">Recorded events</span><strong className="text-foreground">{summary.totals.events}</strong></div>
              <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted">Active schools</span><strong className="text-emerald-700">{summary.totals.activeSchools}</strong></div>
              <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted">Silent schools</span><strong className="text-amber-700">{summary.totals.silentSchools}</strong></div>
              <div className="flex items-center justify-between"><span className="text-muted">Average events / active school</span><strong className="text-foreground">{summary.totals.activeSchools ? (summary.totals.events / summary.totals.activeSchools).toFixed(1) : "0"}</strong></div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="min-w-0 border border-border bg-surface p-4 sm:p-5">
          <div className="mb-5 border-b border-border pb-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-brand"><ListFilter className="h-4 w-4" /><span className="text-sm font-semibold text-foreground">Filter activity</span></div>
              <button type="button" onClick={() => { setRefreshing(true); setRefreshToken((value) => value + 1); }} disabled={loading} className="inline-flex min-h-9 items-center justify-center gap-2 self-start border border-border px-3 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50 sm:self-auto"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh</button>
            </div>
            <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="flex min-w-0 items-center gap-2 border border-border bg-background px-3 py-2.5">
                <Search className="h-4 w-4 text-muted" />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search action, actor, school, or details" aria-label="Search audit activity" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none" />
              </label>
              <select value={schoolFilter} onChange={(event) => { setSchoolFilter(event.target.value); setPage(1); }} aria-label="Filter by school" className="min-w-0 max-w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                <option value="ALL">All schools</option>
                {schoolOptions.map((school) => <option key={school} value={school}>{school}</option>)}
              </select>
              <select value={actionFilter} onChange={(event) => { setActionFilter(event.target.value); setPage(1); }} aria-label="Filter by event type" className="min-w-0 max-w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                <option value="ALL">All actions</option>
                {actionOptions.map((action) => <option key={action.event || action.action} value={action.event || action.action}>{formatActionLabel(action.action)}</option>)}
              </select>
              <select value={timeFilter} onChange={(event) => { setTimeFilter(event.target.value); setPage(1); }} aria-label="Filter by date range" className="min-w-0 max-w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand">
                <option value="90D">Last 90 days</option>
                <option value="24H">Last 24 hours</option>
                <option value="7D">Last 7 days</option>
                <option value="30D">Last 30 days</option>
              </select>
              <button type="button" onClick={() => { setSearch(""); setSearchQuery(""); setSchoolFilter("ALL"); setActionFilter("ALL"); setTimeFilter("90D"); setPage(1); }} className="inline-flex items-center justify-center gap-2 border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light"><RotateCcw className="h-4 w-4" /> Reset</button>
            </div>
            <p className="mt-3 text-xs text-muted">{totalEvents.toLocaleString()} matching events · last {timeFilter === "24H" ? "24 hours" : timeFilter === "7D" ? "7 days" : timeFilter === "30D" ? "30 days" : "90 days"}</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 border border-border bg-background px-4 py-12 text-sm text-muted" role="status"><RefreshCw className="h-4 w-4 animate-spin" /> Loading audit activity…</div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900" role="alert"><p>{error}</p><button type="button" onClick={() => { setRefreshing(true); setRefreshToken((value) => value + 1); }} className="inline-flex items-center gap-2 font-semibold underline underline-offset-2"><RefreshCw className="h-4 w-4" /> Try again</button></div>
          ) : logs.length === 0 ? (
            <div className="border border-border bg-background px-4 py-12 text-center"><p className="text-sm font-semibold text-foreground">No matching activity</p><p className="mt-1 text-sm text-muted">Adjust the filters or reset them to see more audit events.</p></div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Recent platform activity</p>
                  <label className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <span>Entries per page</span>
                    <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-brand">
                      {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </label>
                </div>
                <div className="text-sm text-muted">{firstVisible.toLocaleString()}–{lastVisible.toLocaleString()} of {totalEvents.toLocaleString()}</div>
              </div>

              <div className="overflow-hidden border border-border">
                <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.8fr] bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted md:grid">
                  <div>Action</div>
                  <div>Actor</div>
                  <div>School</div>
                  <div>Time</div>
                </div>
                <div className="divide-y divide-border bg-surface">
                  {paginatedLogs.map((log) => {
                    const actionLabel = formatActionLabel(log.action, log.details);
                    const detailText = formatDetailText(log.details, log.action);
                    const actorName = log.user?.name || log.user?.email || "Platform admin";
                    const schoolName = log.school?.name || "—";

                    return (
                      <article key={log.id} className="grid gap-3 px-4 py-4 text-sm text-foreground md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr] md:items-start md:px-4 md:py-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getActionTone(log.action)}`}>
                              {actionLabel}
                            </span>
                          </div>
                          {detailText ? <p className="mt-2 text-xs text-muted">{detailText}</p> : null}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs md:block md:text-sm"><span className="font-semibold uppercase tracking-wide text-muted md:sr-only">Actor</span><span className="break-words text-foreground md:text-muted">{actorName}</span></div>
                        <div className="grid grid-cols-2 gap-2 text-xs md:block md:text-sm"><span className="font-semibold uppercase tracking-wide text-muted md:sr-only">School</span><span className="break-words text-foreground md:text-muted">{schoolName}</span></div>
                        <time className="grid grid-cols-2 gap-2 text-xs text-muted md:block md:text-sm" dateTime={log.createdAt || undefined}><span className="font-semibold uppercase tracking-wide text-muted md:sr-only">Time</span><span>{formatAuditDate(log.createdAt)}</span></time>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">Showing {firstVisible.toLocaleString()}–{lastVisible.toLocaleString()} of {totalEvents.toLocaleString()} events</p>
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="mt-2 justify-end"
              />
            </div>
          )}
        </section>

        <aside className="h-fit space-y-4">
          {summary ? <div className="border border-border bg-surface p-5"><div className="mb-4 flex items-center gap-2 text-brand"><AlertTriangle className="h-[18px] w-[18px]" /><h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">Schools needing attention</h2></div><div className="space-y-3">{summary.schoolActivity.filter((school) => school.activityCount === 0).slice(0, 5).map((school) => <button key={school.id} type="button" onClick={() => setSchoolFilter(school.name)} className="flex w-full items-center justify-between border-b border-border pb-3 text-left text-sm last:border-0 last:pb-0 hover:text-brand"><span className="truncate pr-3 text-foreground">{school.name}</span><span className="shrink-0 text-xs text-muted">View</span></button>)}{summary.totals.silentSchools === 0 ? <p className="text-sm text-muted">Every school has recorded activity in this period.</p> : null}</div></div> : null}
          {summary ? <div className="border border-border bg-surface p-5"><div className="mb-4 flex items-center gap-2 text-brand"><Activity className="h-[18px] w-[18px]" /><h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">Top activity</h2></div><div className="space-y-3">{summary.actionBreakdown.slice(0, 6).map((item) => <div key={item.event || item.action} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-muted">{formatActionLabel(item.action)}</span><span className="font-semibold tabular-nums text-foreground">{item.count}</span></div>)}</div></div> : null}
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2 text-brand"><Activity className="h-[18px] w-[18px]" /><h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">Audit pulse</h2></div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted">Events · 90 days</span><strong className="text-foreground">{stats.total}</strong></div>
              <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted">Last 24 hours</span><strong className="text-foreground">{stats.recent}</strong></div>
              <div className="flex items-center justify-between"><span className="text-muted">Protected events · 90 days</span><strong className="text-foreground">{stats.protected}</strong></div>
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
