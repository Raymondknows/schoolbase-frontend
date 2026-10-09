"use client";

import { useEffect, useState } from "react";
import { Award, Check, Clock3, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { ErrorModal } from "@/components/ui/error-modal";
import CompetitionHero from "@/components/competition/competition-hero";

type Challenge = { id: string; title: string; description: string | null; gradeLabel: string | null; questionCount: number; durationSeconds: number; closesAt: string | null };
type ChildOption = { pupilId: string; firstName: string; lastName: string; className: string | null };
type Question = { id: string; type: string; prompt: string; options: Array<{ id: string; content: string }> };
type Attempt = { id: string; status: string; startedAt: string; deadlineAt: string; questions: Question[] };
type Result = { status: string; score: number; correctCount: number; questionCount: number; accuracyPercent: number | null; elapsedMs: number | null; firstCompletion?: boolean };

class ChildSelectionRequiredError extends Error {
  constructor(public children: ChildOption[]) {
    super("Choose which student will use Competition.");
  }
}

function isCompetitionFeatureUnavailable(error: unknown): boolean {
  return error instanceof Error && error.name === "CompetitionFeatureUnavailableError";
}

export default function StudentCompetitionPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedPupilId, setSelectedPupilId] = useState("");
  const [attempts, setAttempts] = useState<Array<{ id: string; challengeId: string; status: string; score: number; submittedAt: string | null }>>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showFirstCompletion, setShowFirstCompletion] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dailyChallengesActive, setDailyChallengesActive] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${getBackendUrl()}/api/competition${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.error === "FEATURE_DISABLED") {
        const unavailable = new Error("FEATURE_DISABLED");
        unavailable.name = "CompetitionFeatureUnavailableError";
        throw unavailable;
      }
      if (data.error === "CHILD_SELECTION_REQUIRED") throw new ChildSelectionRequiredError(data.children || []);
      if (data.error === "STUDENT_IDENTITY_NOT_LINKED") throw new Error("No active student linked to this guardian is enabled for Competition yet. Ask your school administrator to connect the student’s existing SchoolBase guardian relationship.");
      if (data.error === "GUARDIAN_PUPIL_NOT_LINKED") throw new Error("That student is not linked to your parent account for Competition.");
      throw new Error(data.error || "Competition request failed.");
    }
    return data as T;
  }

  async function loadChallenges(pupilId = selectedPupilId) {
    setLoading(true);
    setError(null);
    try {
      const query = pupilId ? `?pupilId=${encodeURIComponent(pupilId)}` : "";
      const data = await api<{ identity: { pupilId: string }; challenges: Challenge[]; attempts: typeof attempts }>(`/student/challenges${query}`);
      setDailyChallengesActive(true);
      setChallenges(data.challenges || []);
      setAttempts(data.attempts || []);
      setSelectedPupilId(data.identity?.pupilId || pupilId);
    } catch (loadError) {
      if (isCompetitionFeatureUnavailable(loadError)) {
        setDailyChallengesActive(false);
        setChallenges([]);
        setAttempts([]);
      } else if (loadError instanceof ChildSelectionRequiredError) {
        setChildren(loadError.children);
        setSelectedPupilId("");
        setChallenges([]);
        setAttempts([]);
      } else {
        setError(loadError instanceof Error ? loadError.message : "Unable to load challenges.");
      }
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

  useEffect(() => {
    if (!showFirstCompletion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timeout = window.setTimeout(() => setShowFirstCompletion(false), 4200);
    return () => window.clearTimeout(timeout);
  }, [showFirstCompletion]);

  async function startChallenge(challenge: Challenge) {
    setBusy(true);
    setError(null);
    setResult(null);
    setSelected({});
    setAnswered([]);
    try {
      const data = await api<{ attempt: Attempt }>(`/student/challenges/${challenge.id}/attempts`, { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), pupilId: selectedPupilId || undefined }) });
      setAttempt(data.attempt);
    } catch (startError) {
      if (isCompetitionFeatureUnavailable(startError)) {
        setDailyChallengesActive(false);
        setChallenges([]);
        setAttempts([]);
      } else {
        setError(startError instanceof Error ? startError.message : "Unable to start challenge.");
      }
    } finally { setBusy(false); }
  }

  async function submitAnswer(question: Question) {
    if (!attempt || !selected[question.id]) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/student/attempts/${attempt.id}/answers/${question.id}`, { method: "POST", body: JSON.stringify({ optionId: selected[question.id], pupilId: selectedPupilId || undefined }) });
      setAnswered((current) => [...current, question.id]);
    } catch (answerError) {
      if (isCompetitionFeatureUnavailable(answerError)) {
        setAttempt(null);
        setDailyChallengesActive(false);
        setChallenges([]);
        setAttempts([]);
      } else {
        setError(answerError instanceof Error ? answerError.message : "Answer could not be recorded.");
      }
    } finally { setBusy(false); }
  }

  async function finishAttempt() {
    if (!attempt) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ result: Result }>(`/student/attempts/${attempt.id}/submit`, { method: "POST", body: JSON.stringify({ pupilId: selectedPupilId || undefined }) });
      setResult(data.result);
      setShowFirstCompletion(data.result.firstCompletion === true);
      setAttempt(null);
      await loadChallenges();
    } catch (finishError) {
      if (isCompetitionFeatureUnavailable(finishError)) {
        setAttempt(null);
        setDailyChallengesActive(false);
        setChallenges([]);
        setAttempts([]);
      } else {
        setError(finishError instanceof Error ? finishError.message : "Unable to finish challenge.");
      }
    } finally { setBusy(false); }
  }

  const formatRemaining = `${Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-2 py-6 sm:px-8 sm:py-8">
      <CompetitionHero eyebrow="Student challenges · School pilot" title="Learn. Compete. Represent Your School." description="Sign in through the SchoolBase parent portal. Challenges and results are tied to the student you select from your linked children." />

      {children.length > 1 ? <section className="max-w-xl space-y-4 border border-border bg-surface p-5"><div><h2 className="font-semibold text-foreground">Choose a student</h2><p className="mt-1 text-sm text-muted">Select which linked student will take part. The choice is verified against your SchoolBase guardian account.</p></div><label className="block text-xs font-semibold text-muted">Student<select value={selectedPupilId} onChange={(event) => { const nextPupilId = event.target.value; setSelectedPupilId(nextPupilId); setAttempt(null); setResult(null); setSelected({}); setAnswered([]); if (nextPupilId) void loadChallenges(nextPupilId); }} disabled={loading} className="mt-1 h-11 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose a linked student</option>{children.map((child) => <option key={child.pupilId} value={child.pupilId}>{child.firstName} {child.lastName}{child.className ? ` · ${child.className}` : ""}</option>)}</select></label></section> : null}

      {result ? <section className="border border-border bg-surface p-6"><p className="text-xs font-bold uppercase tracking-wide text-brand">Challenge result</p><h2 className="mt-2 text-2xl font-semibold text-foreground">{result.score} points</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Correct</p><p className="mt-1 text-lg font-semibold text-foreground">{result.correctCount} / {result.questionCount}</p></div><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Accuracy</p><p className="mt-1 text-lg font-semibold text-foreground">{result.accuracyPercent ?? 0}%</p></div><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Time</p><p className="mt-1 text-lg font-semibold text-foreground">{Math.floor((result.elapsedMs ?? 0) / 1000)} sec</p></div></div><button type="button" onClick={() => { setResult(null); void loadChallenges(); }} className="mt-5 border border-border px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">Back to challenges</button></section> : null}
      {showFirstCompletion ? <div role="status" aria-live="polite" className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center overflow-hidden px-4 pt-24 sm:pt-32"><div className="first-completion-burst absolute inset-x-0 top-0 h-72" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <span key={index} className="first-completion-particle" style={{ "--particle-index": index } as React.CSSProperties} />)}</div><div className="pointer-events-auto relative flex max-w-md items-start gap-4 border border-emerald-200 bg-surface px-5 py-4 shadow-lg"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="flex items-center gap-2 font-semibold text-foreground"><Sparkles className="h-4 w-4 text-amber-500" /> First challenge complete!</p><p className="mt-1 text-sm leading-5 text-muted">A great start. Keep practising and building confidence.</p></div><button type="button" onClick={() => setShowFirstCompletion(false)} aria-label="Dismiss celebration" className="p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button></div><style>{`@keyframes first-completion-fall { 0% { transform: translate3d(calc((var(--particle-index) - 12) * 7vw), -24px, 0) rotate(0deg); opacity: 0 } 12% { opacity: 1 } 100% { transform: translate3d(calc((var(--particle-index) - 12) * 9vw), 240px, 0) rotate(540deg); opacity: 0 } } .first-completion-particle { position: absolute; top: 0; left: 50%; width: 8px; height: 12px; border-radius: 2px; background: hsl(calc(var(--particle-index) * 31), 72%, 52%); animation: first-completion-fall 1.9s ease-out forwards; animation-delay: calc(var(--particle-index) * 24ms); } @media (prefers-reduced-motion: reduce) { .first-completion-burst { display: none; } .first-completion-particle { animation: none; } }`}</style></div> : null}

      {attempt ? <section className="space-y-4"><div className="sticky top-0 z-10 flex items-center justify-between border border-border bg-surface px-4 py-3"><div><p className="text-xs font-bold uppercase tracking-wide text-muted">Challenge in progress</p><p className="text-sm text-foreground">{answered.length} / {attempt.questions.length} answered</p></div><div className={`flex items-center gap-2 text-lg font-bold tabular-nums ${secondsLeft < 30 ? "text-rose-700" : "text-brand"}`}><Clock3 className="h-4 w-4" />{formatRemaining}</div></div>{attempt.questions.map((question, index) => <article key={question.id} className="border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted">Question {index + 1}</p><h2 className="mt-2 text-base font-semibold leading-6 text-foreground">{question.prompt}</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options.map((option) => <label key={option.id} className={`flex cursor-pointer items-start gap-3 border px-3 py-3 text-sm ${selected[question.id] === option.id ? "border-brand bg-brand-light/40 text-foreground" : "border-border bg-background text-foreground"} ${answered.includes(question.id) ? "cursor-default opacity-70" : ""}`}><input type="radio" name={question.id} value={option.id} checked={selected[question.id] === option.id} disabled={answered.includes(question.id) || busy} onChange={() => setSelected((current) => ({ ...current, [question.id]: option.id }))} className="mt-0.5 accent-[#0A66C2]" />{option.content}</label>)}</div><button type="button" disabled={busy || answered.includes(question.id) || !selected[question.id]} onClick={() => void submitAnswer(question)} className="mt-4 h-9 border border-brand px-3 text-sm font-semibold text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40">{answered.includes(question.id) ? "Answer recorded" : "Submit answer"}</button></article>)}<button type="button" disabled={busy} onClick={() => void finishAttempt()} className="inline-flex h-11 items-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Send className="h-4 w-4" /> Finish challenge</button></section> : null}

      {dailyChallengesActive === false && !attempt && !result ? <section aria-live="polite" className="flex flex-col gap-4 border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-start"><div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-300 bg-white text-amber-800"><Award className="h-5 w-5" /></div><div><h2 className="font-semibold text-foreground">Daily challenges aren’t active yet</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted">SchoolBase Competition is being prepared for its pilot. Challenges will appear here when the daily challenge experience is enabled. Your parent portal and linked student records are unchanged.</p></div></section> : null}

      {dailyChallengesActive !== false && !attempt && !result && (children.length === 0 || Boolean(selectedPupilId)) ? <section className="space-y-4"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-foreground">Available challenges</h2><p className="mt-1 text-sm text-muted">Your school and class determine which challenges are available.</p></div><button type="button" onClick={() => void loadChallenges()} disabled={loading} aria-label="Refresh challenges" className="flex h-10 w-10 items-center justify-center border border-border text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>{loading ? <div className="border border-border bg-surface p-10 text-center text-sm text-muted">Loading challenges…</div> : challenges.length ? <div className="grid gap-3 sm:grid-cols-2">{challenges.map((challenge) => { const prior = attempts.filter((item) => item.challengeId === challenge.id); return <article key={challenge.id} className="border border-border bg-surface p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">{challenge.title}</h3><p className="mt-1 text-sm text-muted">{challenge.gradeLabel || "All grades"}</p></div><Award className="h-5 w-5 text-brand" /></div><div className="mt-4 flex gap-4 text-xs text-muted"><span>{challenge.questionCount} questions</span><span>{Math.ceil(challenge.durationSeconds / 60)} minutes</span></div>{prior.length ? <p className="mt-3 text-xs text-muted">Previous attempts: {prior.length}</p> : null}<button type="button" onClick={() => void startChallenge(challenge)} disabled={busy || prior.some((item) => item.status === "STARTED")} className="mt-5 h-10 w-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">{busy ? "Starting…" : prior.some((item) => item.status === "STARTED") ? "Attempt in progress" : "Start challenge"}</button></article>; })}</div> : !error ? <div className="border border-border bg-surface p-10 text-center"><Award className="mx-auto h-8 w-8 text-brand" /><p className="mt-3 font-semibold text-foreground">No challenges available yet</p><p className="mt-1 text-sm text-muted">Approved challenges published for your school will appear here.</p></div> : null}</section> : null}
      <ErrorModal isOpen={Boolean(error)} onClose={() => setError(null)} title="Competition request failed" message={error || "The challenge request could not be completed."} type="error" confirmLabel="Okay" />
    </main>
  );
}
