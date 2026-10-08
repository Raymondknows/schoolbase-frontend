"use client";

import { FormEvent, useEffect, useState } from "react";
import { CircleAlert, Play, Plus, RefreshCw } from "lucide-react";

type Category = { id: string; name: string };
type QuestionSet = { id: string; name: string; status: string; _count?: { questions: number } };
type Policy = { id: string; name: string; version: number; policyJson: string };
type Challenge = { id: string; title: string; status: string; questionCount: number; durationSeconds: number; category: { name: string }; _count: { attempts: number } };

export default function CompetitionChallengesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [name, setName] = useState("SchoolBase Daily Challenge");
  const [policyName, setPolicyName] = useState("Default points v1");
  const [categoryId, setCategoryId] = useState("");
  const [questionSetId, setQuestionSetId] = useState("");
  const [scoringPolicyId, setScoringPolicyId] = useState("");
  const [gradeLabel, setGradeLabel] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [minutes, setMinutes] = useState(10);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(`/schoolbase-admin/api/competition${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error === "FEATURE_DISABLED" ? "Enable Daily challenges in Platform Settings to configure this capability." : data.error || "Competition request failed.");
    return data;
  }

  async function load() {
    setError("");
    try {
      const [categoryData, setData, policyData, challengeData] = await Promise.all([
        request("/admin/categories"),
        request("/admin/question-sets"),
        request("/admin/scoring-policies"),
        request("/admin/challenges"),
      ]);
      setCategories(categoryData.categories || []);
      setSets(setData.questionSets || []);
      setPolicies(policyData.policies || []);
      setChallenges(challengeData.challenges || []);
      if (!categoryId && categoryData.categories?.[0]) setCategoryId(categoryData.categories[0].id);
      if (!questionSetId && setData.questionSets?.[0]) setQuestionSetId(setData.questionSets[0].id);
      if (!scoringPolicyId && policyData.policies?.[0]) setScoringPolicyId(policyData.policies[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load challenge configuration.");
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  async function createPolicy(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request("/admin/scoring-policies", { method: "POST", body: JSON.stringify({ name: policyName, version: 1, policy: { basePoints: 100, difficultyMultipliers: { EASY: 1, MEDIUM: 1.25, HARD: 1.5, EXPERT: 2 }, speedBonusEnabled: false, streakBonusEnabled: false } }) });
      setScoringPolicyId(data.scoringPolicy.id);
      setMessage("Scoring policy created. Used policy versions are immutable.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not create scoring policy.");
    } finally { setBusy(false); }
  }

  async function createChallenge(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request("/admin/challenges", { method: "POST", body: JSON.stringify({ title: name, categoryId, questionSetId, scoringPolicyId, gradeLabel, questionCount, durationSeconds: minutes * 60, attemptLimit, difficultyMix: { EASY: 5, MEDIUM: 3, HARD: 2 } }) });
      setMessage("Challenge saved as draft. Activate it only after the question set has enough approved questions and pilot checks are complete.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not create challenge.");
    } finally { setBusy(false); }
  }

  async function setChallengeStatus(challengeId: string, status: "ACTIVE" | "PAUSED") {
    setBusy(true);
    setError("");
    try {
      await request(`/admin/challenges/${challengeId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update challenge.");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <header className="flex flex-col justify-between gap-4 border border-border bg-surface p-6 sm:flex-row sm:items-end sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Competition administration</p><h1 className="mt-2 text-3xl font-semibold text-foreground">Challenges & scoring</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Configure versioned scoring and challenge definitions. New challenges start in draft; activation checks approved question coverage.</p></div><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button></header>
      {error ? <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert"><CircleAlert className="mt-0.5 h-4 w-4" />{error}</div> : null}
      {message ? <div className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{message}</div> : null}

      <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={(event) => void createPolicy(event)} className="space-y-4 border border-border bg-surface p-5"><div><h2 className="font-semibold text-foreground">Scoring policy</h2><p className="mt-1 text-xs text-muted">Stored as a versioned snapshot. Don’t edit a policy after live attempts use it.</p></div><label className="block text-xs font-semibold text-muted">Policy name<input required value={policyName} onChange={(event) => setPolicyName(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><button disabled={busy} className="inline-flex h-10 items-center gap-2 border border-brand px-4 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Plus className="h-4 w-4" /> Create v1 scoring policy</button><label className="block text-xs font-semibold text-muted">Selected policy<select value={scoringPolicyId} onChange={(event) => setScoringPolicyId(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose policy</option>{policies.map((policy) => <option key={policy.id} value={policy.id}>{policy.name} · v{policy.version}</option>)}</select></label></form>

        <form onSubmit={(event) => void createChallenge(event)} className="grid gap-3 border border-border bg-surface p-5 sm:grid-cols-2"><div className="sm:col-span-2"><h2 className="font-semibold text-foreground">Create challenge definition</h2><p className="mt-1 text-xs text-muted">This creates configuration only. It never seeds questions or publishes results.</p></div><label className="text-xs font-semibold text-muted">Title<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Grade/class level<input value={gradeLabel} onChange={(event) => setGradeLabel(event.target.value)} placeholder="Primary 5" className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-xs font-semibold text-muted">Question set<select required value={questionSetId} onChange={(event) => setQuestionSetId(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose set</option>{sets.map((set) => <option key={set.id} value={set.id}>{set.name} · {set.status} · {set._count?.questions ?? 0}</option>)}</select></label><label className="text-xs font-semibold text-muted">Questions<input type="number" min={1} max={100} value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Minutes<input type="number" min={1} max={120} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Attempts per student<input type="number" min={1} max={10} value={attemptLimit} onChange={(event) => setAttemptLimit(Number(event.target.value))} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><button disabled={busy || !categoryId || !questionSetId || !scoringPolicyId} className="inline-flex h-10 items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 sm:col-span-2"><Plus className="h-4 w-4" /> Save challenge draft</button></form>
      </section>

      <section className="border border-border bg-surface p-5"><h2 className="font-semibold text-foreground">Challenge schedule</h2><div className="mt-4 divide-y divide-border border-y border-border">{challenges.map((challenge) => <article key={challenge.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{challenge.title}</p><span className="border border-border bg-background px-2 py-0.5 text-[11px] font-bold uppercase text-muted">{challenge.status}</span></div><p className="mt-1 text-xs text-muted">{challenge.category.name} · {challenge.questionCount} questions · {Math.ceil(challenge.durationSeconds / 60)} min · {challenge._count.attempts} attempts</p></div><div className="flex gap-2">{challenge.status === "ACTIVE" ? <button type="button" disabled={busy} onClick={() => void setChallengeStatus(challenge.id, "PAUSED")} className="h-9 border border-border px-3 text-xs font-semibold text-muted disabled:opacity-50">Pause</button> : challenge.status !== "ARCHIVED" && challenge.status !== "COMPLETED" ? <button type="button" disabled={busy} onClick={() => void setChallengeStatus(challenge.id, "ACTIVE")} className="inline-flex h-9 items-center gap-1 border border-brand px-3 text-xs font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Play className="h-3.5 w-3.5" /> Activate</button> : null}</div></article>)}</div></section>
    </main>
  );
}
