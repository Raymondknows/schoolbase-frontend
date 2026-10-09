"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorModal } from "@/components/ui/error-modal";
import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  Circle,
  Database,
  ExternalLink,
  Files,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "lucide-react";

const featureKeys = [
  ["competition.enabled", "Competition master switch"],
  ["competition.dailyChallenge.enabled", "Daily challenge"],
  ["competition.questionBank.enabled", "Question bank"],
  ["competition.leaderboard.enabled", "Leaderboards"],
  ["competition.gamification.enabled", "XP and achievements"],
  ["competition.studentVsStudent.enabled", "Student challenges"],
  ["competition.classCompetition.enabled", "Class competitions"],
  ["competition.schoolTournament.enabled", "School tournaments"],
  ["competition.publicTournament.enabled", "Public tournament pages"],
  ["competition.sponsors.enabled", "Sponsors"],
  ["competition.prizes.enabled", "Prizes"],
  ["competition.certificates.enabled", "Certificates"],
  ["competition.regional.enabled", "Regional competitions"],
  ["competition.national.enabled", "National competitions"],
  ["competition.international.enabled", "International competitions"],
] as const;

type FeatureKey = typeof featureKeys[number][0];
type FeatureState = Record<FeatureKey, boolean>;
type OverviewSummary = {
  questionSets: number;
  questions: number;
  challenges: number;
  attempts: number;
  tournaments: number;
  openFlags: number;
};

const allFeaturesDisabled = Object.fromEntries(featureKeys.map(([key]) => [key, false])) as FeatureState;
const defaultOverview: OverviewSummary = {
  questionSets: 0,
  questions: 0,
  challenges: 0,
  attempts: 0,
  tournaments: 0,
  openFlags: 0,
};

export default function CompetitionFoundationPage() {
  const [features, setFeatures] = useState<FeatureState>(allFeaturesDisabled);
  const [overview, setOverview] = useState<OverviewSummary>(defaultOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [settingsResponse, overviewResponse] = await Promise.all([
        fetch("/schoolbase-admin/api/settings", { credentials: "include", cache: "no-store" }),
        fetch("/schoolbase-admin/api/competition/admin/overview", { credentials: "include", cache: "no-store" }),
      ]);

      if (!settingsResponse.ok) throw new Error("Could not read Competition feature settings.");
      const settingsData = await settingsResponse.json();
      const configured = settingsData?.settings?.competitionFeatures ?? settingsData?.defaults?.competitionFeatures ?? {};
      setFeatures(Object.fromEntries(featureKeys.map(([key]) => [key, configured[key] === true])) as FeatureState);

      if (!overviewResponse.ok) {
        const overviewData = await overviewResponse.json().catch(() => ({}));
        if (overviewData?.error === "FEATURE_DISABLED") {
          setOverview(defaultOverview);
        } else {
          throw new Error("Could not load Competition overview.");
        }
      } else {
        const overviewData = await overviewResponse.json();
        setOverview({
          questionSets: Number(overviewData?.questionSets ?? 0),
          questions: Number(overviewData?.questions ?? 0),
          challenges: Number(overviewData?.challenges ?? 0),
          attempts: Number(overviewData?.attempts ?? 0),
          tournaments: Number(overviewData?.tournaments ?? 0),
          openFlags: Number(overviewData?.openFlags ?? 0),
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Competition dashboard.");
    } finally {
      setLoading(false);
    }
  }

  const activeFeatureCount = featureKeys.filter(([key]) => features[key]).length;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const masterEnabled = features["competition.enabled"];
  const actionCards = [
    { label: "Question bank", href: "/schoolbase-admin/competition/questions", icon: Files, enabled: features["competition.questionBank.enabled"] },
    { label: "Challenges", href: "/schoolbase-admin/competition/challenges", icon: Activity, enabled: features["competition.dailyChallenge.enabled"] },
    { label: "Tournaments", href: "/schoolbase-admin/competition/tournaments", icon: Trophy, enabled: features["competition.schoolTournament.enabled"] || features["competition.publicTournament.enabled"] },
    { label: "Sponsors", href: "/schoolbase-admin/competition/sponsors", icon: Sparkles, enabled: features["competition.sponsors.enabled"] },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-brand/10 to-transparent" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
              <Award className="h-4 w-4" /> Competition command center
            </div>
            <h1 className="competition-heading-light mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">SchoolBase Competition</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Operational overview for the Competition platform, including the active server feature set and the current content pipeline.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/schoolbase-admin/settings" className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light">
              Feature controls <ExternalLink className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="inline-flex items-center gap-2 border border-brand bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Active features", value: `${activeFeatureCount} / ${featureKeys.length}`, icon: CheckCircle2, accent: "text-emerald-600" },
          { label: "Question sets", value: loading ? "—" : String(overview.questionSets), icon: Files, accent: "text-brand" },
          { label: "Questions", value: loading ? "—" : String(overview.questions), icon: Database, accent: "text-violet-600" },
          { label: "Challenges", value: loading ? "—" : String(overview.challenges), icon: Activity, accent: "text-sky-600" },
          { label: "Attempts", value: loading ? "—" : String(overview.attempts), icon: Trophy, accent: "text-amber-600" },
          { label: "Open flags", value: loading ? "—" : String(overview.openFlags), icon: ShieldAlert, accent: "text-rose-600" },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">{label}</p>
              <Icon className={`h-4 w-4 ${accent}`} />
            </div>
            <p className="mt-4 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">System readiness</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {loading
                  ? "Loading platform status..."
                  : masterEnabled
                    ? "The master Competition switch is enabled. Review the active modules below and manage them through Platform Settings."
                    : "The master Competition switch is currently off. All Competition workflows remain unavailable until it is enabled."}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {["competition.enabled", "competition.questionBank.enabled", "competition.dailyChallenge.enabled", "competition.schoolTournament.enabled", "competition.sponsors.enabled"].map((key) => {
              const featureLabel = featureKeys.find(([featureKey]) => featureKey === key)?.[1] ?? key;
              const enabled = Boolean(features[key as FeatureKey]);
              return (
                <div key={key} className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2.5">
                  <span className="text-sm text-foreground">{featureLabel}</span>
                  <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-bold uppercase ${enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-surface text-muted"}`}>
                    {enabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {enabled ? "On" : "Off"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Quick actions</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {actionCards.map(({ label, href, icon: Icon, enabled }) => (
              <Link key={label} href={href} className={`group border p-4 transition ${enabled ? "border-border bg-background hover:border-brand/50 hover:bg-brand-light" : "border-dashed border-border bg-surface text-muted opacity-60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {enabled ? "Available in the current configuration." : "Disabled until the matching feature flag is enabled."}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border border-border bg-surface">
        <div className="flex flex-col justify-between gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Server-managed capability flags</h2>
            <p className="mt-1 text-xs text-muted">Read-only from Platform Settings. Each child capability requires the master switch.</p>
          </div>
          <span className={`w-fit border px-2.5 py-1 text-xs font-semibold ${masterEnabled ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {loading ? "Checking" : masterEnabled ? "Competition enabled" : "Competition disabled"}
          </span>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3 bg-surface px-5 py-3">
              <span className="text-sm text-foreground">{label}</span>
              <span className={`border px-2 py-0.5 text-[11px] font-bold uppercase ${features[key] ? "border-amber-200 bg-amber-50 text-amber-800" : "border-border bg-background text-muted"}`}>
                {loading ? "…" : features[key] ? "On" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </section>
      <ErrorModal isOpen={Boolean(error)} onClose={() => setError(null)} title="Competition dashboard could not be loaded" message={error || "Could not load Competition dashboard."} type="error" confirmLabel="Okay" />
    </main>
  );
}