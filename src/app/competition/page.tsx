"use client";

import { useEffect, useState } from "react";
import { Award, CircleAlert, Clock3, RefreshCw, Send } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";

type Challenge = { id: string; title: string; description: string | null; gradeLabel: string | null; questionCount: number; durationSeconds: number; closesAt: string | null };
type Question = { id: string; type: string; prompt: string; options: Array<{ id: string; content: string }> };
type Attempt = { id: string; status: string; startedAt: string; deadlineAt: string; questions: Question[] };
type Result = { status: string; score: number; correctCount: number; questionCount: number; accuracyPercent: number | null; elapsedMs: number | null };

export default function StudentCompetitionPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [attempts, setAttempts] = useState<Array<{ id: string; challengeId: string; status: string; score: number; submittedAt: string | null }>>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${getBackendUrl()}/api/competition${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.error === "FEATURE_DISABLED") throw new Error("Daily Challenge is not enabled for this SchoolBase account yet.");
      if (data.error === "STUDENT_IDENTITY_NOT_LINKED") throw new Error("Your student account is not linked to a school student record yet. Ask your school administrator for help.");
      throw new Error(data.error || "Competition request failed.");
    }
    return data as T;
  }

  async function loadChallenges() {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ challenges: Challenge[]; attempts: typeof attempts }>("/student/challenges");
      setChallenges(data.challenges || []);
      setAttempts(data.attempts || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load challenges.");
    } finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void loadChallenges(); }, []);

  useEffect(() => {
    if (!attempt?.deadlineAt) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(attempt.deadlineAt).getTime() - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [attempt?.deadlineAt]);

  async function startChallenge(challenge: Challenge) {
    setBusy(true);
    setError("");
    setResult(null);
    setSelected({});
    setAnswered([]);
    try {
      const data = await api<{ attempt: Attempt }>(`/student/challenges/${challenge.id}/attempts`, { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }) });
      setAttempt(data.attempt);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start challenge.");
    } finally { setBusy(false); }
  }

  async function submitAnswer(question: Question) {
    if (!attempt || !selected[question.id]) return;
    setBusy(true);
    setError("");
    try {
      await api(`/student/attempts/${attempt.id}/answers/${question.id}`, { method: "POST", body: JSON.stringify({ optionId: selected[question.id] }) });
      setAnswered((current) => [...current, question.id]);
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : "Answer could not be recorded.");
    } finally { setBusy(false); }
  }

  async function finishAttempt() {
    if (!attempt) return;
    setBusy(true);
    setError("");
    try {
      const data = await api<{ result: Result }>(`/student/attempts/${attempt.id}/submit`, { method: "POST", body: JSON.stringify({}) });
      setResult(data.result);
      setAttempt(null);
      await loadChallenges();
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Unable to finish challenge.");
    } finally { setBusy(false); }
  }

  const formatRemaining = `${Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-2 py-6 sm:px-8 sm:py-8">
      <header className="relative overflow-hidden border border-border bg-surface px-6 pb-8 pt-8 sm:px-8 sm:pb-10"><div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-brand/10 to-transparent" /><div className="relative"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand"><Award className="h-4 w-4" /> Student workspace</p><h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">SchoolBase Competition</h1><p className="mt-2 text-sm leading-6 text-muted">Learn. Compete. Represent Your School.</p></div></header>
      {error ? <div role="alert" className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}

      {result ? <section className="border border-border bg-surface p-6"><p className="text-xs font-bold uppercase tracking-wide text-brand">Challenge result</p><h2 className="mt-2 text-2xl font-semibold text-foreground">{result.score} points</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Correct</p><p className="mt-1 text-lg font-semibold text-foreground">{result.correctCount} / {result.questionCount}</p></div><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Accuracy</p><p className="mt-1 text-lg font-semibold text-foreground">{result.accuracyPercent ?? 0}%</p></div><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Time</p><p className="mt-1 text-lg font-semibold text-foreground">{Math.floor((result.elapsedMs ?? 0) / 1000)} sec</p></div></div><button type="button" onClick={() => { setResult(null); void loadChallenges(); }} className="mt-5 border border-border px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">Back to challenges</button></section> : null}

      {attempt ? <section className="space-y-4"><div className="sticky top-0 z-10 flex items-center justify-between border border-border bg-surface px-4 py-3"><div><p className="text-xs font-bold uppercase tracking-wide text-muted">Challenge in progress</p><p className="text-sm text-foreground">{answered.length} / {attempt.questions.length} answered</p></div><div className={`flex items-center gap-2 text-lg font-bold tabular-nums ${secondsLeft < 30 ? "text-rose-700" : "text-brand"}`}><Clock3 className="h-4 w-4" />{formatRemaining}</div></div>{attempt.questions.map((question, index) => <article key={question.id} className="border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted">Question {index + 1}</p><h2 className="mt-2 text-base font-semibold leading-6 text-foreground">{question.prompt}</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options.map((option) => <label key={option.id} className={`flex cursor-pointer items-start gap-3 border px-3 py-3 text-sm ${selected[question.id] === option.id ? "border-brand bg-brand-light/40 text-foreground" : "border-border bg-background text-foreground"} ${answered.includes(question.id) ? "cursor-default opacity-70" : ""}`}><input type="radio" name={question.id} value={option.id} checked={selected[question.id] === option.id} disabled={answered.includes(question.id) || busy} onChange={() => setSelected((current) => ({ ...current, [question.id]: option.id }))} className="mt-0.5 accent-[#0A66C2]" />{option.content}</label>)}</div><button type="button" disabled={busy || answered.includes(question.id) || !selected[question.id]} onClick={() => void submitAnswer(question)} className="mt-4 h-9 border border-brand px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40">{answered.includes(question.id) ? "Answer recorded" : "Submit answer"}</button></article>)}<button type="button" disabled={busy} onClick={() => void finishAttempt()} className="inline-flex h-11 items-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Send className="h-4 w-4" /> Finish challenge</button></section> : null}

      {!attempt && !result ? <section className="space-y-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-foreground">Available challenges</h2><p className="mt-1 text-sm text-muted">Your school and class determine which challenges are available.</p></div><button type="button" onClick={() => void loadChallenges()} disabled={loading} aria-label="Refresh challenges" className="flex h-10 w-10 items-center justify-center border border-border text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>{loading ? <div className="border border-border bg-surface p-10 text-center text-sm text-muted">Loading challenges…</div> : challenges.length ? <div className="grid gap-3 sm:grid-cols-2">{challenges.map((challenge) => { const prior = attempts.filter((item) => item.challengeId === challenge.id); return <article key={challenge.id} className="border border-border bg-surface p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">{challenge.title}</h3><p className="mt-1 text-sm text-muted">{challenge.gradeLabel || "All grades"}</p></div><Award className="h-5 w-5 text-brand" /></div><div className="mt-4 flex gap-4 text-xs text-muted"><span>{challenge.questionCount} questions</span><span>{Math.ceil(challenge.durationSeconds / 60)} minutes</span></div>{prior.length ? <p className="mt-3 text-xs text-muted">Previous attempts: {prior.length}</p> : null}<button type="button" onClick={() => void startChallenge(challenge)} disabled={busy || prior.some((item) => item.status === "STARTED")} className="mt-5 h-10 w-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">{busy ? "Starting…" : prior.some((item) => item.status === "STARTED") ? "Attempt in progress" : "Start challenge"}</button></article>; })}</div> : !error ? <div className="border border-border bg-surface p-10 text-center"><Award className="mx-auto h-8 w-8 text-brand" /><p className="mt-3 font-semibold text-foreground">No challenges available yet</p><p className="mt-1 text-sm text-muted">Approved challenges published for your school will appear here.</p></div> : null}</section> : null}
    </main>
  );
}
