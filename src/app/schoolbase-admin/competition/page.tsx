"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, Circle, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";

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

const allFeaturesDisabled = Object.fromEntries(featureKeys.map(([key]) => [key, false])) as FeatureState;

export default function CompetitionFoundationPage() {
  const [features, setFeatures] = useState<FeatureState>(allFeaturesDisabled);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFeatures() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/schoolbase-admin/api/settings", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not read Competition feature settings.");
      const data = await response.json();
      const configured = data?.settings?.competitionFeatures ?? data?.defaults?.competitionFeatures ?? {};
      setFeatures(Object.fromEntries(featureKeys.map(([key]) => [key, configured[key] === true])) as FeatureState);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load Competition status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetch("/schoolbase-admin/api/settings", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not read Competition feature settings.");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const configured = data?.settings?.competitionFeatures ?? data?.defaults?.competitionFeatures ?? {};
        setFeatures(Object.fromEntries(featureKeys.map(([key]) => [key, configured[key] === true])) as FeatureState);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load Competition status.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const activeFeatureCount = featureKeys.filter(([key]) => features[key]).length;
  const readiness = [
    { label: "Default-deny server feature gate", complete: true },
    { label: "Platform-admin feature controls", complete: true },
    { label: "Optional pupil-link schema and server identity resolver", complete: true },
    { label: "Review and apply additive identity-link migration", complete: false },
    { label: "Student account invitation and admin link workflow", complete: false },
    { label: "Question review and approved content workflow", complete: false },
    { label: "Server-authoritative challenge attempts and scoring", complete: false },
    { label: "Tenant-isolation and answer-secrecy route tests", complete: false },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-brand/10 to-transparent" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-brand">
              <Award className="h-4 w-4" /> Product foundation · Preview
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">SchoolBase Competition</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Learn. Compete. Represent Your School.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/schoolbase-admin/settings" className="inline-flex items-center gap-2 border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-light">
              Feature controls <ExternalLink className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => void loadFeatures()} disabled={loading} className="inline-flex items-center gap-2 border border-brand bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-200 bg-amber-50 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Build mode · no Competition workflows are active</h2>
              <p className="mt-1 text-sm leading-6 text-muted">This page is an admin testing surface only. Student, teacher, school, tournament, and public Competition workflows have not been mounted. Keep all capabilities off until their implementation and security checks are complete.</p>
            </div>
          </div>
          {error ? <p className="mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p> : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Active capabilities</p><p className="mt-2 text-2xl font-semibold text-foreground">{loading ? "—" : `${activeFeatureCount} / ${featureKeys.length}`}</p></div>
            <div className="border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Student identity</p><p className="mt-2 text-sm font-semibold text-amber-700">Not linked</p></div>
            <div className="border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Student-facing routes</p><p className="mt-2 text-sm font-semibold text-foreground">Not installed</p></div>
          </div>
        </div>

        <div className="border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[.12em] text-foreground">Foundation readiness</h2>
          <ul className="mt-4 space-y-3">
            {readiness.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                {item.complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />}
                <span className={item.complete ? "text-foreground" : "text-muted"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border border-border bg-surface">
        <div className="flex flex-col justify-between gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div><h2 className="text-sm font-semibold text-foreground">Server-managed capability flags</h2><p className="mt-1 text-xs text-muted">Read-only here. Manage them in Platform Settings; every child capability requires the master switch.</p></div>
          <span className={`w-fit border px-2.5 py-1 text-xs font-semibold ${features["competition.enabled"] ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {loading ? "Checking" : features["competition.enabled"] ? "Master switch on · workflows still unavailable" : "All workflows disabled"}
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
    </main>
  );
}