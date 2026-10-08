"use client";

import { useEffect, useState } from "react";
import { Activity, Award, CircleAlert, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";

type RoleOverview = { attempts?: number; challenges?: number; tournaments?: number; participants?: number; assignedClasses?: number };

export default function CompetitionRoleOverview({ audience }: { audience: "school" | "teacher" }) {
  const [data, setData] = useState<RoleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${getBackendUrl()}/api/competition/school/overview`, { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error === "FEATURE_DISABLED" ? "Competition reporting is not enabled yet." : body.error || "Unable to load Competition reporting.");
      setData(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Competition reporting.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const cards = audience === "teacher"
    ? [{ label: "Assigned classes", value: data?.assignedClasses ?? 0, icon: Users }, { label: "Challenges available", value: data?.challenges ?? 0, icon: Award }, { label: "Class attempts", value: data?.attempts ?? 0, icon: Activity }]
    : [{ label: "School challenges", value: data?.challenges ?? 0, icon: Award }, { label: "Student attempts", value: data?.attempts ?? 0, icon: Activity }, { label: "Tournament entries", value: data?.tournaments ?? 0, icon: Users }, { label: "Participants", value: data?.participants ?? 0, icon: ShieldCheck }];

  return <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12"><header className="flex flex-col justify-between gap-4 border border-border bg-surface p-6 sm:flex-row sm:items-end sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">{audience === "teacher" ? "Teacher workspace" : "School workspace"}</p><h1 className="mt-2 text-3xl font-semibold text-foreground">Competition</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">School-scoped academic practice and participation reporting. Results here do not change official assessments.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button></header>
    {error ? <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
    <section className={`grid gap-3 ${cards.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4"}`}>{cards.map(({ label, value, icon: Icon }) => <div key={label} className="border border-border bg-surface p-5"><div className="flex items-center gap-2 text-brand"><Icon className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wide text-muted">{label}</span></div><p className="mt-4 text-3xl font-semibold tabular-nums text-foreground">{loading ? "—" : value}</p></div>)}</section>
    <section className="border border-border bg-surface p-5"><h2 className="font-semibold text-foreground">Participation scope</h2><p className="mt-2 text-sm leading-6 text-muted">{audience === "teacher" ? "Reporting is restricted to classes assigned to your authenticated teacher account. Student-level performance detail will be added only with the privacy and access rules reviewed." : "All counts are limited to your authenticated school. Competition is currently gated until its pilot workflows and privacy review are complete."}</p></section>
  </main>;
}
