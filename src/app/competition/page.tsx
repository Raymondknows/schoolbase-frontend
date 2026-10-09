"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Award, Check, CheckCircle2, Clock3, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { ErrorModal } from "@/components/ui/error-modal";
import CompetitionHero from "@/components/competition/competition-hero";

type Challenge = { id: string; title: string; description: string | null; gradeLabel: string | null; questionCount: number; durationSeconds: number; closesAt: string | null; attemptLimit: number; attemptsUsed: number };
type LearnerIdentity = { pupilId: string; classId: string | null; firstName: string | null; lastName: string | null; className: string | null };
type LearnerPracticeSummary = { completedChallenges: number; latestCompletionAt: string | null };
type ChildOption = { pupilId: string; firstName: string; lastName: string; className: string | null };
type Question = { id: string; type: string; prompt: string; options: Array<{ id: string; content: string }> };
type Attempt = { id: string; status: string; startedAt: string; deadlineAt: string; questions: Question[] };
type Result = { status: string; score: number; correctCount: number; questionCount: number; accuracyPercent: number | null; elapsedMs: number | null; firstCompletion?: boolean };

function formatChallengeAudience(audience: string | null): string {
  if (!audience) return "Audience details incomplete";
  if (/^Ages \d{1,2}-\d{1,2} · .+/.test(audience)) return audience;
  return `${audience} · age range not specified`;
}

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
  const [learnerIdentity, setLearnerIdentity] = useState<LearnerIdentity | null>(null);
  const [practiceSummary, setPracticeSummary] = useState<LearnerPracticeSummary>({ completedChallenges: 0, latestCompletionAt: null });
  const [selectedPupilId, setSelectedPupilId] = useState("");
  const [attempts, setAttempts] = useState<Array<{ id: string; challengeId: string; status: string; score: number; submittedAt: string | null }>>([]);
  const [ineligibleChallengeCount, setIneligibleChallengeCount] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [challengeToStart, setChallengeToStart] = useState<Challenge | null>(null);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showFirstCompletion, setShowFirstCompletion] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
      if (data.error === "ATTEMPT_LIMIT_REACHED") throw new Error("You have used all attempts available for this challenge.");
      if (data.error === "ATTEMPT_ALREADY_CREATED") throw new Error("An attempt is already being started. Refresh your challenge list before trying again.");
      if (data.error === "CHALLENGE_AUDIENCE_MISMATCH") throw new Error("This challenge is not eligible for the selected student’s recorded class and age. No attempt was started.");
      throw new Error(data.error || "Competition request failed.");
    }
    return data as T;
  }

  async function loadChallenges(pupilId = selectedPupilId) {
    setLoading(true);
    setError(null);
    try {
      const query = pupilId ? `?pupilId=${encodeURIComponent(pupilId)}` : "";
      const data = await api<{ identity: LearnerIdentity; challenges: Challenge[]; attempts: typeof attempts; ineligibleChallengeCount: number; practiceSummary: LearnerPracticeSummary }>(`/student/challenges${query}`);
      setDailyChallengesActive(true);
      setLearnerIdentity(data.identity || null);
      setChallenges(data.challenges || []);
      setAttempts(data.attempts || []);
      setIneligibleChallengeCount(data.ineligibleChallengeCount || 0);
      setPracticeSummary(data.practiceSummary || { completedChallenges: 0, latestCompletionAt: null });
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
    setChallengeToStart(null);
    setBusy(true);
    setError(null);
    setResult(null);
    setSelected({});
    setAnswered([]);
    setCurrentQuestionIndex(0);
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
    setShowFinishConfirmation(false);
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
  const currentQuestion = attempt?.questions[currentQuestionIndex] || null;
  const answerProgress = attempt ? Math.round((answered.length / attempt.questions.length) * 100) : 0;

  return (
    <main className={`mx-auto max-w-5xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 ${attempt || result ? "pb-32" : ""}`}>
      {!attempt ? <CompetitionHero compact eyebrow="Student challenges · School pilot" title="Learn. Compete. Represent Your School." description="Sign in through the SchoolBase parent portal. Challenges and results are tied to the student you select from your linked children." /> : null}

      {!attempt && !result && learnerIdentity?.firstName ? <section aria-label="Student Competition overview" className="grid gap-3 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-wide text-brand">Your practice space</p><h2 className="mt-1 text-lg font-semibold text-foreground">Ready for a challenge, {learnerIdentity.firstName}?</h2><p className="mt-1 text-sm text-muted">{learnerIdentity.className || "Class not assigned"} · Your progress is private to your linked family account.</p></div>
        <div className="border-l-2 border-brand/30 pl-3"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Completed</p><p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{practiceSummary.completedChallenges}</p></div>
        <div className="border-l-2 border-emerald-500/50 pl-3"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Available now</p><p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{challenges.length}</p></div>
      </section> : null}

      {children.length > 1 ? <section className="max-w-xl space-y-4 border border-border bg-surface p-5"><div><h2 className="font-semibold text-foreground">Choose a student</h2><p className="mt-1 text-sm text-muted">Select which linked student will take part. The choice is verified against your SchoolBase guardian account.</p></div><label className="block text-xs font-semibold text-muted">Student<select value={selectedPupilId} onChange={(event) => { const nextPupilId = event.target.value; setSelectedPupilId(nextPupilId); setAttempt(null); setResult(null); setSelected({}); setAnswered([]); if (nextPupilId) void loadChallenges(nextPupilId); }} disabled={loading} className="mt-1 h-11 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose a linked student</option>{children.map((child) => <option key={child.pupilId} value={child.pupilId}>{child.firstName} {child.lastName}{child.className ? ` · ${child.className}` : ""}</option>)}</select></label></section> : null}

      {result ? <section className="border border-border bg-surface p-6"><p className="text-xs font-bold uppercase tracking-wide text-brand">Challenge result</p><h2 className="mt-2 text-2xl font-semibold text-foreground">{result.score} points</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Correct</p><p className="mt-1 text-lg font-semibold text-foreground">{result.correctCount} / {result.questionCount}</p></div><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Accuracy</p><p className="mt-1 text-lg font-semibold text-foreground">{result.accuracyPercent ?? 0}%</p></div><div className="border border-border bg-background p-3"><p className="text-xs text-muted">Time</p><p className="mt-1 text-lg font-semibold text-foreground">{Math.floor((result.elapsedMs ?? 0) / 1000)} sec</p></div></div><button type="button" onClick={() => { setResult(null); void loadChallenges(); }} className="mt-5 border border-border px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">Back to challenges</button></section> : null}
      {showFirstCompletion ? <div role="status" aria-live="polite" className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center overflow-hidden px-4 pt-24 sm:pt-32"><div className="first-completion-burst absolute inset-x-0 top-0 h-72" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <span key={index} className="first-completion-particle" style={{ "--particle-index": index } as React.CSSProperties} />)}</div><div className="pointer-events-auto relative flex max-w-md items-start gap-4 border border-emerald-200 bg-surface px-5 py-4 shadow-lg"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="flex items-center gap-2 font-semibold text-foreground"><Sparkles className="h-4 w-4 text-amber-500" /> First challenge complete!</p><p className="mt-1 text-sm leading-5 text-muted">A great start. Keep practising and building confidence.</p></div><button type="button" onClick={() => setShowFirstCompletion(false)} aria-label="Dismiss celebration" className="p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button></div><style>{`@keyframes first-completion-fall { 0% { transform: translate3d(calc((var(--particle-index) - 12) * 7vw), -24px, 0) rotate(0deg); opacity: 0 } 12% { opacity: 1 } 100% { transform: translate3d(calc((var(--particle-index) - 12) * 9vw), 240px, 0) rotate(540deg); opacity: 0 } } .first-completion-particle { position: absolute; top: 0; left: 50%; width: 8px; height: 12px; border-radius: 2px; background: hsl(calc(var(--particle-index) * 31), 72%, 52%); animation: first-completion-fall 1.9s ease-out forwards; animation-delay: calc(var(--particle-index) * 24ms); } @media (prefers-reduced-motion: reduce) { .first-completion-burst { display: none; } .first-completion-particle { animation: none; } }`}</style></div> : null}

      {attempt && currentQuestion ? (
        <section className="mx-auto max-w-4xl space-y-4">
          <header className="border border-border bg-surface shadow-sm">
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 shadow-sm sm:px-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Challenge in progress</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Question {currentQuestionIndex + 1} of {attempt.questions.length}</p>
              </div>
              <div aria-live="polite" className={`flex items-center gap-2 border px-3 py-2 text-sm font-bold tabular-nums ${secondsLeft < 30 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-border bg-background text-foreground"}`}>
                <Clock3 className="h-4 w-4" />
                <span>{secondsLeft === 0 ? "00:00" : formatRemaining}</span>
                <span className="hidden text-xs font-medium text-muted sm:inline">{secondsLeft === 0 ? "time expired" : "remaining"}</span>
              </div>
            </div>
            <div className="border-t border-border px-4 py-3 sm:px-5">
              <div className="mb-3 flex items-center justify-between text-xs text-muted">
                <span>Answer progress</span>
                <span className="font-semibold tabular-nums text-foreground">{answered.length} / {attempt.questions.length}</span>
              </div>
              <div role="progressbar" aria-label="Challenge answer progress" aria-valuemin={0} aria-valuemax={attempt.questions.length} aria-valuenow={answered.length} className="h-1.5 overflow-hidden bg-border">
                <div className="h-full bg-brand transition-[width] duration-300" style={{ width: `${answerProgress}%` }} />
              </div>
              <nav aria-label="Question navigation" className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {attempt.questions.map((question, index) => {
                  const isAnswered = answered.includes(question.id);
                  const isCurrent = currentQuestionIndex === index;
                  return (
                    <button key={question.id} type="button" onClick={() => setCurrentQuestionIndex(index)} aria-label={`Question ${index + 1}${isAnswered ? ", answered" : ", unanswered"}`} aria-current={isCurrent ? "step" : undefined} className={`flex h-9 w-9 shrink-0 items-center justify-center border text-xs font-semibold transition ${isCurrent ? "border-brand bg-brand text-white" : isAnswered ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-background text-muted hover:border-brand hover:text-brand"}`}>
                      {isAnswered ? <Check className="h-4 w-4" /> : index + 1}
                    </button>
                  );
                })}
              </nav>
            </div>
          </header>

          {secondsLeft === 0 ? <p role="status" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800">Time is up. Your recorded answers are saved; finish now to see the result. Unanswered questions will count as unanswered.</p> : null}

          <article className="scroll-mt-20 border border-border bg-surface">
            <div className="border-b border-border px-5 py-5 sm:px-8 sm:py-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-brand/20 bg-brand-light px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand">Question {currentQuestionIndex + 1}</span>
                {answered.includes(currentQuestion.id) ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Answer recorded</span> : null}
                {!answered.includes(currentQuestion.id) && selected[currentQuestion.id] ? <span className="text-xs font-semibold text-brand">Selected · submit to record</span> : null}
              </div>
              <h1 className="mt-4 max-w-3xl text-xl font-semibold leading-8 text-foreground sm:text-2xl">{currentQuestion.prompt}</h1>
            </div>
            <div role="radiogroup" aria-label="Answer options" className="grid gap-2.5 p-4 sm:p-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selected[currentQuestion.id] === option.id;
                return (
                  <label key={option.id} className={`flex min-h-14 cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition ${isSelected ? "border-brand bg-brand-light/40 text-foreground ring-1 ring-brand" : "border-border bg-background text-foreground hover:border-brand/60"} ${answered.includes(currentQuestion.id) ? "cursor-default opacity-70" : ""}`}>
                    <input type="radio" name={currentQuestion.id} value={option.id} checked={isSelected} disabled={answered.includes(currentQuestion.id) || busy} onChange={() => setSelected((current) => ({ ...current, [currentQuestion.id]: option.id }))} className="h-4 w-4 shrink-0 accent-[#0A66C2]" />
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-current/20 text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                    <span className="min-w-0 flex-1 leading-6">{option.content}</span>
                  </label>
                );
              })}
            </div>
            <footer className="flex flex-col gap-3 border-t border-border bg-background/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button type="button" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))} className="inline-flex h-10 items-center justify-center gap-2 border border-border px-3 text-sm font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Previous</button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {!answered.includes(currentQuestion.id) ? <button type="button" disabled={busy || secondsLeft === 0 || !selected[currentQuestion.id]} onClick={() => void submitAnswer(currentQuestion)} className="inline-flex h-10 items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Saving answer…" : secondsLeft === 0 ? "Time expired" : "Submit answer"}</button> : null}
                {currentQuestionIndex < attempt.questions.length - 1 ? <button type="button" onClick={() => setCurrentQuestionIndex((index) => Math.min(attempt.questions.length - 1, index + 1))} className="inline-flex h-10 items-center justify-center gap-2 border border-brand px-4 text-sm font-semibold text-brand hover:bg-brand-light">Next question <ArrowRight className="h-4 w-4" /></button> : null}
              </div>
            </footer>
          </article>

          <div className="flex flex-col gap-3 border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-muted">{answered.length === attempt.questions.length ? "All answers are recorded." : `${attempt.questions.length - answered.length} question${attempt.questions.length - answered.length === 1 ? "" : "s"} still unanswered.`}</p>
            <button type="button" disabled={busy} onClick={() => setShowFinishConfirmation(true)} className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Send className="h-4 w-4" /> Review & finish</button>
          </div>
        </section>
      ) : null}

      {showFinishConfirmation && attempt ? <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"><section role="dialog" aria-modal="true" aria-labelledby="finish-challenge-title" className="w-full max-w-md border border-border bg-surface p-5 shadow-2xl sm:p-6"><p className="text-xs font-bold uppercase tracking-wide text-brand">Finish challenge</p><h2 id="finish-challenge-title" className="mt-2 text-xl font-semibold text-foreground">Submit your attempt?</h2><p className="mt-2 text-sm leading-6 text-muted">{secondsLeft === 0 ? "Time has expired. Your recorded answers will be scored now." : answered.length === attempt.questions.length ? "All answers are recorded. Submitting will end your attempt and show your result." : `${attempt.questions.length - answered.length} question${attempt.questions.length - answered.length === 1 ? " is" : "s are"} unanswered. Unanswered questions will count as incorrect, and you cannot return after submitting.`}</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowFinishConfirmation(false)} className="h-10 border border-border px-4 text-sm font-semibold text-foreground hover:bg-background">Keep working</button><button type="button" disabled={busy} onClick={() => void finishAttempt()} className="inline-flex h-10 items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Send className="h-4 w-4" /> {busy ? "Submitting…" : "Submit attempt"}</button></div></section></div> : null}

      {dailyChallengesActive === false && !attempt && !result ? <section aria-live="polite" className="flex flex-col gap-4 border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-start"><div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-300 bg-white text-amber-800"><Award className="h-5 w-5" /></div><div><h2 className="font-semibold text-foreground">Daily challenges aren’t active yet</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted">SchoolBase Competition is being prepared for its pilot. Challenges will appear here when the daily challenge experience is enabled. Your parent portal and linked student records are unchanged.</p></div></section> : null}

      {dailyChallengesActive !== false && !attempt && !result && (children.length === 0 || Boolean(selectedPupilId)) ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Available challenges</h2>
              <p className="mt-1 text-sm text-muted">Only challenges that match the selected student’s recorded class and age appear here.</p>
            </div>
            <button type="button" onClick={() => void loadChallenges()} disabled={loading} aria-label="Refresh challenges" className="flex h-10 w-10 items-center justify-center border border-border text-brand hover:bg-brand-light disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
          </div>
          {loading ? <div className="border border-border bg-surface p-10 text-center text-sm text-muted">Checking challenges for this student…</div> : challenges.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {challenges.map((challenge, index) => {
                const prior = attempts.filter((item) => item.challengeId === challenge.id);
                const attemptsRemaining = Math.max(0, challenge.attemptLimit - challenge.attemptsUsed);
                const attemptInProgress = prior.some((item) => item.status === "STARTED");
                const latestResult = prior.find((item) => item.status === "SUBMITTED" || item.status === "EXPIRED");
                return (
                  <article key={challenge.id} style={{ animationDelay: `${Math.min(index, 6) * 65}ms` }} className="competition-challenge-enter flex h-full flex-col border border-border bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h3 className="font-semibold text-foreground">{challenge.title}</h3><p className="mt-1 text-sm text-muted">{formatChallengeAudience(challenge.gradeLabel)}</p></div>
                      <Award className="h-5 w-5 shrink-0 text-brand" />
                    </div>
                    {challenge.description ? <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted">{challenge.description}</p> : null}
                    <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-3 text-xs">
                      <div><p className="text-muted">Questions</p><p className="mt-1 font-semibold text-foreground">{challenge.questionCount}</p></div>
                      <div><p className="text-muted">Time limit</p><p className="mt-1 font-semibold text-foreground">{Math.ceil(challenge.durationSeconds / 60)} minutes</p></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted">Attempts remaining</span>
                      <span className={`font-semibold ${attemptsRemaining ? "text-foreground" : "text-rose-700"}`}>{attemptsRemaining} of {challenge.attemptLimit}</span>
                    </div>
                    {latestResult ? <p className="mt-2 text-xs text-muted">Last result: {latestResult.score} points · {latestResult.status === "EXPIRED" ? "time expired" : "submitted"}</p> : null}
                    <button type="button" onClick={() => setChallengeToStart(challenge)} disabled={busy || attemptInProgress || attemptsRemaining === 0} className="mt-auto inline-flex h-10 w-full items-center justify-center border border-brand bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:border-border disabled:bg-background disabled:text-muted">
                      {busy ? "Starting…" : attemptInProgress ? "Attempt in progress" : attemptsRemaining === 0 ? "Attempts used" : "Review challenge"}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : !error ? (
            <div className="border border-border bg-surface p-8 text-center sm:p-10">
              <Award className="mx-auto h-8 w-8 text-brand" />
              {ineligibleChallengeCount > 0 ? <><p className="mt-3 font-semibold text-foreground">No challenges match this student yet</p><p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-muted">{ineligibleChallengeCount} active challenge{ineligibleChallengeCount === 1 ? " is" : "s are"} outside this student’s recorded age or class. Ask the school to verify the student profile or publish a challenge for the right audience.</p></> : <><p className="mt-3 font-semibold text-foreground">No eligible challenges available</p><p className="mt-1 text-sm text-muted">New challenges for this student will appear here when published.</p></>}
            </div>
          ) : null}
          <style>{`@keyframes competition-challenge-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } .competition-challenge-enter { animation: competition-challenge-enter 360ms cubic-bezier(.2,.7,.2,1) both; } @media (prefers-reduced-motion: reduce) { .competition-challenge-enter { animation: none; } }`}</style>
        </section>
      ) : null}

      {challengeToStart ? <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setChallengeToStart(null); }}><section role="dialog" aria-modal="true" aria-labelledby="challenge-brief-title" className="w-full max-w-lg border border-border bg-surface p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-brand">Challenge briefing</p><h2 id="challenge-brief-title" className="mt-2 text-xl font-semibold text-foreground">{challengeToStart.title}</h2></div><button type="button" onClick={() => setChallengeToStart(null)} aria-label="Close challenge briefing" className="p-1 text-muted hover:text-foreground"><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm font-medium text-foreground">{formatChallengeAudience(challengeToStart.gradeLabel)}</p>{challengeToStart.description ? <p className="mt-3 text-sm leading-6 text-muted">{challengeToStart.description}</p> : null}<dl className="mt-5 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm"><div><dt className="text-xs text-muted">Questions</dt><dd className="mt-1 font-semibold text-foreground">{challengeToStart.questionCount}</dd></div><div><dt className="text-xs text-muted">Time limit</dt><dd className="mt-1 font-semibold text-foreground">{Math.ceil(challengeToStart.durationSeconds / 60)} minutes</dd></div><div><dt className="text-xs text-muted">Attempts remaining</dt><dd className="mt-1 font-semibold text-foreground">{Math.max(0, challengeToStart.attemptLimit - challengeToStart.attemptsUsed)} of {challengeToStart.attemptLimit}</dd></div><div><dt className="text-xs text-muted">Scoring</dt><dd className="mt-1 font-semibold text-foreground">Results after submission</dd></div></dl><p className="mt-4 text-xs leading-5 text-muted">The timer starts as soon as you begin. Each answer is recorded once and cannot be changed after submission.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setChallengeToStart(null)} className="h-10 border border-border px-4 text-sm font-semibold text-foreground hover:bg-background">Not now</button><button type="button" onClick={() => void startChallenge(challengeToStart)} className="h-10 bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover">Start challenge</button></div></section></div> : null}
      <ErrorModal isOpen={Boolean(error)} onClose={() => setError(null)} title="Competition request failed" message={error || "The challenge request could not be completed."} type="error" confirmLabel="Okay" />
    </main>
  );
}
