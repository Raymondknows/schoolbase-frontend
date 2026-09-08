"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Users,
  BookOpen,
  Bell,
  AlertCircle,
  Download,
  CalendarDays,
  ChevronRight,
  WalletCards,
  Megaphone,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { getBackendUrl } from "@/lib/backend-url";
import ParentPageShell from "@/components/parent-page-shell";
import { useEffectiveCurrency, useParentSchool } from "./parent-school-context";

export default function ParentDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      
      // Fetch dashboard data
      const dashRes = await fetch(`${backendUrl}/api/parent/dashboard`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!dashRes.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = await dashRes.json();
      
      setDashboardData({
        guardianName: data.guardianName || 'Parent',
        childrenCount: data.children?.length || 0,
        outstandingFees: data.outstandingFees || 0,
        children: data.children || [],
        recentResults: data.recentResults || [],
        announcements: data.announcements || [],
        attendance: data.attendance || {},
      });
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { school: parentSchool } = useParentSchool();
  const currency = useEffectiveCurrency(parentSchool);

  if (loading) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
            <div className="space-y-3">
              <div className="h-4 w-32 animate-pulse bg-slate-200"></div>
              <div className="h-9 w-56 animate-pulse bg-slate-200"></div>
              <div className="h-4 w-72 animate-pulse bg-slate-100"></div>
            </div>
            <div className="h-10 w-40 animate-pulse border border-border bg-surface"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-border bg-surface p-5">
                <div className="h-4 w-24 animate-pulse bg-slate-100"></div>
                <div className="mt-4 h-8 w-20 animate-pulse bg-slate-200"></div>
                <div className="mt-2 h-3 w-28 animate-pulse bg-slate-100"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="border-b border-border bg-[#f6f8fa] p-4">
                <div className="h-4 w-32 animate-pulse bg-slate-200"></div>
              </div>
              <div className="space-y-3 p-4">
                <div className="h-4 w-full animate-pulse bg-slate-100"></div>
                <div className="h-4 w-4/5 animate-pulse bg-slate-100"></div>
                <div className="h-4 w-3/5 animate-pulse bg-slate-100"></div>
              </div>
            </div>
            ))}
          </div>
        </div>
      </ParentPageShell>
    );
  }

  if (error) {
    return (
      <ParentPageShell onRefresh={loadData}>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#a61b29]">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Error Loading Dashboard</h3>
            <p className="text-sm text-error/80 mt-1">{error}</p>
          </div>
        </div>
        </div>
      </ParentPageShell>
    );
  }

  const stats = [
    {
      label: "Children",
      value: String(dashboardData?.childrenCount || 0),
      sub: `${dashboardData?.childrenCount} child${dashboardData?.childrenCount !== 1 ? 'ren' : ''}`,
      icon: Users,
      href: "/parent/children",
    },
    {
      label: "Fees",
      value: formatMoney(dashboardData?.outstandingFees || 0, currency),
      sub: dashboardData?.outstandingFees > 0 ? "Amount due" : "No balance",
      icon: CreditCard,
      href: "/parent/invoices",
    },
    {
      label: "Results",
      value: String(dashboardData?.recentResults?.length || 0),
      sub: "Available results",
      icon: BookOpen,
      href: "/parent/results",
    },
    {
      label: "News",
      value: String(dashboardData?.announcements?.length || 0),
      sub: "School updates",
      icon: Bell,
      href: "/parent/publications",
    },
  ];

  return (
    <ParentPageShell onRefresh={loadData}>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <CalendarDays className="h-4 w-4" /> Parent workspace
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            Welcome, {dashboardData?.guardianName}
          </h1>
          <p className="mt-1 text-sm text-muted">
          {dashboardData?.childrenCount === 1
            ? "You have 1 child registered in the system"
            : `You have ${dashboardData?.childrenCount} children registered in the system`}
          </p>
        </div>
        <Link href="/parent/school" className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light sm:self-auto">
          School information <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <Link key={idx} href={stat.href} className="group block">
              <div className="border border-border bg-surface p-5 transition hover:border-brand/40">
                <div className="mb-4 flex items-center gap-2 text-brand">
                  <IconComponent className="h-[18px] w-[18px]" />
                  <span className="text-xs font-bold uppercase tracking-[.12em] text-muted">{stat.label}</span>
                </div>
                <div className="text-3xl font-semibold text-foreground">{stat.value}</div>
                <div className="mt-1 text-xs text-muted">{stat.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold uppercase tracking-[.12em] text-muted">Family board</span>
        <Link href="/parent/children" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-light">
          <Users className="h-4 w-4" /> Children
        </Link>
        <Link href="/parent/invoices" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light">
          <WalletCards className="h-4 w-4" /> Fees and invoices
        </Link>
        <Link href="/parent/results" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light">
          <Download className="h-4 w-4" /> Results
        </Link>
        <Link href="/parent/publications" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light">
          <Megaphone className="h-4 w-4" /> Publications
        </Link>
        </div>
        <div className="flex rounded-lg border border-border bg-surface p-1 text-sm">
          <Link href="/parent" className="rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Overview</Link>
          <Link href="/parent/school" className="rounded-md px-3 py-1.5 font-semibold text-muted hover:text-foreground">School</Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1.45fr]">
      {/* My Children Section */}
      {dashboardData?.children && dashboardData.children.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-[#f6f8fa] px-4 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Family records</p>
              <h2 className="mt-1 text-sm font-semibold text-foreground">My Children</h2>
            </div>
            <span className="text-xs font-bold uppercase tracking-[.1em] text-muted">Latest</span>
          </div>
          
          {dashboardData.children.length > 0 ? (
            <ul className="divide-y divide-border px-4">
              {dashboardData.children.slice(0, 5).map((child: any) => (
                <li key={child.id} className="flex items-center justify-between gap-2 border-b border-border py-3 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {[child.lastName, child.firstName].filter(Boolean).join(' ')}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {child.class?.name || "Class"}{child.class?.section ? ` ${child.class.section}` : ""} · {child.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {child.outstandingFee > 0 && (
                      <span className="inline-flex items-center border border-[#f5c2c7] bg-[#fff5f5] px-2 py-1 text-[11px] font-semibold text-[#a61b29]">
                        ₦{(child.outstandingFee / 1000).toFixed(0)}k Due
                      </span>
                    )}
                    {child.latestGrade && (
                      <span className="text-xs text-muted flex-shrink-0">
                        {child.latestGrade}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <Link href="/parent/children" className="flex items-center justify-end gap-1 border-t border-border px-4 py-2.5 text-xs font-semibold text-brand transition hover:bg-brand-light">
            View all children <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Recent Results Section */}
      {dashboardData?.recentResults && dashboardData.recentResults.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-[#f6f8fa] px-4 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Academic records</p>
              <h2 className="mt-1 text-sm font-semibold text-foreground">Recent Results</h2>
            </div>
            <span className="text-xs font-bold uppercase tracking-[.1em] text-muted">Latest</span>
          </div>
          
          <div className="overflow-x-auto px-4 py-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2.5 text-left font-bold uppercase tracking-[.1em] text-muted">Child</th>
                  <th className="py-2.5 text-left font-bold uppercase tracking-[.1em] text-muted">Subject</th>
                  <th className="py-2.5 text-left font-bold uppercase tracking-[.1em] text-muted">Score</th>
                  <th className="py-2.5 text-left font-bold uppercase tracking-[.1em] text-muted">Grade</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentResults.slice(0, 5).map((result: any, idx: number) => (
                  <tr key={idx} className="border-b border-border hover:bg-background/50 transition">
                    <td className="py-2.5 text-foreground">{result.childName}</td>
                    <td className="py-2.5 text-foreground">{result.subject}</td>
                    <td className="py-2.5 font-semibold text-foreground">{result.score}/100</td>
                    <td className="py-2.5">
                      <span className="bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                        {result.grade || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/parent/results" className="flex items-center justify-end gap-1 border-t border-border px-4 py-2.5 text-xs font-semibold text-brand transition hover:bg-brand-light">
            View all results <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      </div>

      {/* Announcements Section */}
      {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-[#f6f8fa] px-4 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">School communications</p>
              <h2 className="mt-1 text-sm font-semibold text-foreground">Announcements</h2>
            </div>
            <span className="text-xs font-bold uppercase tracking-[.1em] text-muted">Latest</span>
          </div>
          
          <ul className="divide-y divide-border px-4">
            {dashboardData.announcements.slice(0, 5).map((announcement: any, idx: number) => (
              <li key={idx} className="py-3 first:pt-0 last:pb-0">
                <h3 className="text-sm font-semibold text-foreground">{announcement.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{announcement.body || announcement.content}</p>
                <p className="mt-2 text-[11px] text-muted">
                  {new Date(announcement.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/parent/publications" className="flex items-center justify-end gap-1 border-t border-border px-4 py-2.5 text-xs font-semibold text-brand transition hover:bg-brand-light">
            View all announcements <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
      </div>
    </ParentPageShell>
  );
}
