"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ShieldCheck, Sparkles } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { ErrorModal } from "@/components/ui/error-modal";
import CompetitionHero from "@/components/competition/competition-hero";

type ChildAchievements = { id: string; displayName: string; className: string | null; xp: number; achievements: Array<{ code: string; title: string; description: string; iconUrl: string | null; awardedAt: string }> };

export default function ParentCompetitionPage() {
  const [children, setChildren] = useState<ChildAchievements[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${getBackendUrl()}/api/parent/competition/achievements`, { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 404 && data.error === "FEATURE_DISABLED") return { disabled: true, children: [] };
        if (!response.ok) throw new Error(data.error || "Unable to load Competition achievements.");
        return { disabled: false, children: data.children || [] };
      })
      .then((data) => { if (active) { setEnabled(!data.disabled); setChildren(data.children); } })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load Competition achievements."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <main className="mx-auto max-w-5xl space-y-6 px-2 py-6 sm:px-8 sm:py-8"><CompetitionHero eyebrow="Parent portal · Student achievement" title="Celebrate every step forward." description="See your linked children’s Competition-only achievements and XP. These celebrate practice and progress, and do not affect official school results." />
    {!enabled && !loading && !error ? <section className="flex items-start gap-3 border border-border bg-surface p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand/20 bg-brand-light text-brand"><Award className="h-5 w-5" /></div><div><h2 className="font-semibold text-foreground">Competition achievements are not enabled yet</h2><p className="mt-1 text-sm leading-6 text-muted">When the school activates this feature, this page will show only achievements belonging to children linked to your parent account.</p><Link href="/parent/results" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover"><ShieldCheck className="h-4 w-4" /> View official school results</Link></div></section> : null}
    {loading ? <div className="border border-border bg-surface p-10 text-center text-sm text-muted">Checking Competition availability…</div> : null}
    {enabled && !loading ? children.map((child) => <section key={child.id} className="border border-border bg-surface p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-foreground">{child.displayName}</h2><p className="mt-1 text-sm text-muted">{child.className || "Class not assigned"}</p></div><div className="border border-brand/20 bg-brand-light px-3 py-2 text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Competition XP</p><p className="text-xl font-semibold tabular-nums text-brand">{child.xp}</p></div></div><div className="mt-5"><h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles className="h-4 w-4 text-brand" /> Achievements</h3>{child.achievements.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{child.achievements.map((achievement) => <div key={achievement.code} className="border border-border bg-background p-3"><p className="text-sm font-semibold text-foreground">{achievement.title}</p><p className="mt-1 text-xs leading-5 text-muted">{achievement.description}</p><p className="mt-2 text-[11px] text-muted">Earned {new Date(achievement.awardedAt).toLocaleDateString()}</p></div>)}</div> : <p className="mt-2 text-sm text-muted">No achievements yet.</p>}</div></section>) : null}
    {enabled && !loading && children.length === 0 ? <p className="border border-border bg-surface p-5 text-sm text-muted">No linked children found for this parent account.</p> : null}
    <ErrorModal isOpen={Boolean(error)} onClose={() => setError(null)} title="Competition achievements could not be loaded" message={error || "Unable to load Competition achievements."} type="error" confirmLabel="Okay" />
  </main>;
}
