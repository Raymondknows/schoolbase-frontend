"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  GraduationCap,
  Megaphone,
  RefreshCw,
  School,
  Users,
  WalletCards,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
import { useEffectiveCurrency, useParentSchool } from "./parent-school-context";

type DashboardData = {
  guardianName: string;
  childrenCount: number;
  outstandingFees: number;
  children: ChildRecord[];
  recentResults: ResultRecord[];
  announcements: AnnouncementRecord[];
};

type ChildRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  outstandingFee?: number;
  class?: { name?: string; section?: string } | null;
};

type ResultRecord = {
  childName?: string;
  subject?: string;
  score?: number;
  grade?: string;
};

type AnnouncementRecord = {
  title?: string;
  body?: string;
  content?: string;
  createdAt?: string;
};

const actions = [
  { href: "/parent/children", label: "Children", detail: "View profiles and records", icon: Users },
  { href: "/parent/invoices", label: "Fees and invoices", detail: "Review balances and payments", icon: WalletCards },
  { href: "/parent/results", label: "Results", detail: "Track academic progress", icon: GraduationCap },
  { href: "/parent/publications", label: "Publications", detail: "Read school updates", icon: Megaphone },
];

export default function ParentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { school: parentSchool } = useParentSchool();
  const currency = useEffectiveCurrency(parentSchool);

  async function loadData() {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch(`${getBackendUrl()}/api/parent/dashboard`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to load dashboard");

      const data = await response.json();
      setDashboardData({
        guardianName: data.guardianName || "Parent",
        childrenCount: data.children?.length || 0,
        outstandingFees: data.outstandingFees || 0,
        children: (data.children || []) as ChildRecord[],
        recentResults: (data.recentResults || []) as ResultRecord[],
        announcements: (data.announcements || []) as AnnouncementRecord[],
      });
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, []);

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="w-full space-y-6">
          <div className="border border-border bg-surface p-6 sm:p-8">
            <div className="h-3 w-28 animate-pulse bg-slate-200" />
            <div className="mt-4 h-10 w-64 animate-pulse bg-slate-200" />
            <div className="mt-3 h-4 w-80 max-w-full animate-pulse bg-slate-100" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse border border-border bg-surface" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((item) => <div key={item} className="h-56 animate-pulse border border-border bg-surface" />)}
          </div>
        </div>
      </ParentPageShell>
    );
  }

  if (error || !dashboardData) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="border border-red-200 bg-red-50 p-5 text-red-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-semibold">We could not load your dashboard</h2>
              <p className="mt-1 text-sm text-red-800">{error || "Please try again."}</p>
              <button type="button" onClick={loadData} className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-900 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800">
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        </div>
      </ParentPageShell>
    );
  }

  const metrics = [
    { label: "Children", value: dashboardData.childrenCount, detail: "Profiles connected", icon: Users, href: "/parent/children", tone: "text-brand", iconBg: "bg-brand/10" },
    { label: "Outstanding fees", value: formatMoney(dashboardData.outstandingFees, currency), detail: dashboardData.outstandingFees > 0 ? "Payment required" : "Account is up to date", icon: CreditCard, href: "/parent/invoices", tone: dashboardData.outstandingFees > 0 ? "text-amber-700" : "text-emerald-700", iconBg: dashboardData.outstandingFees > 0 ? "bg-amber-50" : "bg-emerald-50" },
    { label: "Recent results", value: dashboardData.recentResults.length, detail: "Academic records available", icon: GraduationCap, href: "/parent/results", tone: "text-sky-700", iconBg: "bg-sky-50" },
    { label: "School updates", value: dashboardData.announcements.length, detail: "Latest publications", icon: Bell, href: "/parent/publications", tone: "text-violet-700", iconBg: "bg-violet-50" },
  ];

  return (
    <ParentPageShell onRefresh={loadData}>
      <div className="w-full space-y-6 pb-6">
        <header className="relative overflow-hidden border border-border bg-surface px-6 pb-7 pt-10 sm:px-8 sm:pb-9 sm:pt-12">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-brand-light/40 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand"><CalendarDays className="h-4 w-4" /> Parent workspace</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Welcome, {dashboardData.guardianName}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Everything important about your children, school fees, academic progress, and school communications in one place.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Account active</div>
              <button type="button" onClick={loadData} disabled={refreshing} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh</button>
              <Link href="/parent/school" className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"><School className="h-4 w-4" /> School information <ChevronRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Link key={metric.label} href={metric.href} className="group border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-md ${metric.iconBg}`}><Icon className={`h-4 w-4 ${metric.tone}`} /></div><ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-brand" /></div>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-muted">{metric.label}</p>
                <p className={`mt-1 text-2xl font-semibold tracking-tight ${metric.tone}`}>{metric.value}</p>
                <p className="mt-1 text-xs text-muted">{metric.detail}</p>
              </Link>
            );
          })}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><CheckCircle2 className="h-4 w-4 text-brand" /> Quick actions</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => {
              const Icon = action.icon;
              return <Link key={action.href} href={action.href} className="group flex items-center gap-3 border border-border bg-surface px-4 py-4 transition hover:border-brand/50 hover:bg-brand-light/30"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand text-white"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{action.label}</span><span className="mt-0.5 block truncate text-xs text-muted">{action.detail}</span></span><ChevronRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" /></Link>;
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_1.45fr]">
          <div className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Family records</p><h2 className="mt-1 font-semibold text-foreground">My children</h2></div><Users className="h-5 w-5 text-brand" /></div>
            {dashboardData.children.length ? <ul className="divide-y divide-border px-5">{dashboardData.children.slice(0, 5).map((child) => <li key={child.id} className="flex items-center justify-between gap-3 py-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-brand">{`${child.firstName || ""} ${child.lastName || ""}`.trim().slice(0, 2).toUpperCase() || "CH"}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{[child.lastName, child.firstName].filter(Boolean).join(" ")}</p><p className="mt-1 text-xs text-muted">{child.class?.name || "Class not assigned"}{child.class?.section ? ` · ${child.class.section}` : ""}</p></div></div>{child.outstandingFee && child.outstandingFee > 0 ? <span className="shrink-0 border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">Balance due</span> : <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Up to date</span>}</li>)}</ul> : <div className="px-5 py-10 text-center"><Users className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 text-sm font-semibold text-foreground">No children connected yet</p><p className="mt-1 text-xs text-muted">Connected student profiles will appear here.</p></div>}
            <Link href="/parent/children" className="flex items-center justify-end gap-1 border-t border-border px-5 py-3 text-xs font-semibold text-brand hover:bg-brand-light/30">View all children <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>

          <div className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Academic records</p><h2 className="mt-1 font-semibold text-foreground">Recent results</h2></div><BookOpen className="h-5 w-5 text-brand" /></div>
            {dashboardData.recentResults.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-background text-[10px] uppercase tracking-[.12em] text-muted"><tr><th className="px-5 py-3 font-bold">Child</th><th className="px-5 py-3 font-bold">Subject</th><th className="px-5 py-3 font-bold">Score</th><th className="px-5 py-3 font-bold">Grade</th></tr></thead><tbody>{dashboardData.recentResults.slice(0, 5).map((result, index) => <tr key={`${result.childName}-${result.subject}-${index}`} className="border-b border-border last:border-0 hover:bg-background/50"><td className="px-5 py-3 font-medium text-foreground">{result.childName || "Student"}</td><td className="px-5 py-3 text-muted">{result.subject || "Assessment"}</td><td className="px-5 py-3 font-semibold text-foreground">{result.score ?? "-"}{result.score !== undefined ? "/100" : ""}</td><td className="px-5 py-3"><span className="border border-border bg-background px-2 py-1 text-[10px] font-bold text-muted">{result.grade || "N/A"}</span></td></tr>)}</tbody></table></div> : <div className="px-5 py-10 text-center"><GraduationCap className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 text-sm font-semibold text-foreground">No results published yet</p><p className="mt-1 text-xs text-muted">New academic results will appear here.</p></div>}
            <Link href="/parent/results" className="flex items-center justify-end gap-1 border-t border-border px-5 py-3 text-xs font-semibold text-brand hover:bg-brand-light/30">View all results <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
        </section>

        <section className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">School communications</p><h2 className="mt-1 font-semibold text-foreground">Latest publications</h2></div><Link href="/parent/publications" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">View all <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
          {dashboardData.announcements.length ? <div className="grid gap-0 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">{dashboardData.announcements.slice(0, 3).map((announcement, index) => <article key={`${announcement.title}-${index}`} className="px-5 py-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-brand"><FileText className="h-3.5 w-3.5" /> Update</div><h3 className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{announcement.title || "School update"}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{announcement.body || announcement.content || "Read the latest news from your school."}</p><p className="mt-4 text-[11px] text-muted">{announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently published"}</p></article>)}</div> : <div className="px-5 py-10 text-center"><Megaphone className="mx-auto h-8 w-8 text-muted" /><p className="mt-3 text-sm font-semibold text-foreground">No publications yet</p><p className="mt-1 text-xs text-muted">School updates will be posted here.</p></div>}
        </section>
      </div>
    </ParentPageShell>
  );
}
