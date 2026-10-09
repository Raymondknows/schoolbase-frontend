"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Plus, RefreshCw } from "lucide-react";
import { ErrorModal } from "@/components/ui/error-modal";
import CompetitionHero from "@/components/competition/competition-hero";

type Category = { id: string; code: string; name: string };
type QuestionSet = { id: string; name: string; gradeLabel: string | null; topic: string | null; status: string; _count?: { questions: number } };
type Question = { id: string; prompt: string; status: string; difficulty: string; questionSet?: { name?: string | null } | null; options: Array<{ id: string; content: string; isCorrect: boolean }> };

export default function CompetitionQuestionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [setName, setSetName] = useState("");
  const [gradeLabel, setGradeLabel] = useState("");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [busy, setBusy] = useState(false);
  const [questionBankActive, setQuestionBankActive] = useState<boolean | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(`/schoolbase-admin/api/competition${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.error === "FEATURE_DISABLED") {
        const unavailable = new Error("Question bank is not active.");
        unavailable.name = "QuestionBankUnavailableError";
        throw unavailable;
      }
      throw new Error(data.error || "Competition request failed.");
    }
    return data;
  }

  async function load(): Promise<string | null> {
    try {
      const [categoryData, setData, questionData] = await Promise.all([
        request("/admin/categories"),
        request("/admin/question-sets"),
        request(`/admin/questions${selectedSet ? `?questionSetId=${encodeURIComponent(selectedSet)}` : ""}`),
      ]);
      setQuestionBankActive(true);
      setCategories(categoryData.categories || []);
      if (!selectedCategory && categoryData.categories?.[0]) setSelectedCategory(categoryData.categories[0].id);
      setSets(setData.questionSets || []);
      setQuestions(questionData.questions || []);
      if (!selectedSet && setData.questionSets?.[0]) setSelectedSet(setData.questionSets[0].id);
      return null;
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "QuestionBankUnavailableError") {
        setQuestionBankActive(false);
        setCategories([]);
        setSets([]);
        setQuestions([]);
        return null;
      }
      setQuestionBankActive(null);
      const message = loadError instanceof Error ? loadError.message : "Unable to load question bank.";
      setFeedbackModal({ type: "error", title: "Question bank could not be loaded", message });
      return message;
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [selectedSet]);

  async function submit(event: FormEvent, path: string, body: unknown, reset: () => void) {
    event.preventDefault();
    setBusy(true);
    setFeedbackModal(null);
    try {
      await request(path, { method: "POST", body: JSON.stringify(body) });
      reset();
      const refreshError = await load();
      const success = path === "/admin/categories"
        ? { title: "Category created", message: "The Competition category has been created." }
        : path === "/admin/question-sets"
          ? { title: "Question set created", message: "The question set was saved as a draft." }
          : { title: "Question saved as draft", message: "The question is saved as a draft and must be reviewed and approved before a challenge can use it." };
      setFeedbackModal(refreshError
        ? { type: "error", title: "Saved, but question bank refresh failed", message: "Your change was saved, but the updated question bank could not be loaded.", details: refreshError }
        : { type: "success", ...success });
    } catch (submitError) {
      if (submitError instanceof Error && submitError.name === "QuestionBankUnavailableError") {
        setQuestionBankActive(false);
      } else {
        setFeedbackModal({ type: "error", title: "Competition item could not be saved", message: submitError instanceof Error ? submitError.message : "Unable to save." });
      }
    } finally {
      setBusy(false);
    }
  }

  async function review(questionId: string, action: "APPROVE" | "REJECT" | "REQUEST_CHANGES") {
    setBusy(true);
    setFeedbackModal(null);
    try {
      await request(`/admin/questions/${questionId}/review`, { method: "POST", body: JSON.stringify({ action }) });
      const refreshError = await load();
      const actionText = action === "APPROVE" ? "approved" : action === "REJECT" ? "rejected" : "sent back for changes";
      setFeedbackModal(refreshError
        ? { type: "error", title: `Question ${actionText}; refresh failed`, message: `The question was ${actionText}, but the review queue could not be refreshed.`, details: refreshError }
        : { type: "success", title: `Question ${actionText}`, message: `The question has been ${actionText}.` });
    } catch (reviewError) {
      if (reviewError instanceof Error && reviewError.name === "QuestionBankUnavailableError") {
        setQuestionBankActive(false);
      } else {
        setFeedbackModal({ type: "error", title: "Question review failed", message: reviewError instanceof Error ? reviewError.message : "Review action failed." });
      }
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-8 sm:py-8 lg:px-12">
      <CompetitionHero compact eyebrow="Competition administration · Content" title="Question bank" description="Create versioned content, review answer keys, and approve questions before any challenge can use them."><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex h-10 items-center gap-2 border border-white/60 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button></CompetitionHero>
      {questionBankActive === false ? <section aria-live="polite" className="flex flex-col gap-4 border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-start"><div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-300 bg-white text-amber-800"><Check className="h-5 w-5" /></div><div><h2 className="font-semibold text-foreground">Question bank isn’t active yet</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted">Question authoring and review are currently turned off for Competition. A platform administrator can review the Competition capability switches in Platform Settings when this feature is ready to be used.</p><Link href="/schoolbase-admin/settings" className="mt-3 inline-flex h-10 items-center gap-2 border border-amber-300 bg-white px-3 text-sm font-semibold text-foreground hover:border-brand hover:text-brand">Open Platform Settings</Link></div></section> : null}
      <section className={`grid gap-5 xl:grid-cols-2 ${questionBankActive === false ? "hidden" : ""}`}>
        <form onSubmit={(event) => void submit(event, "/admin/categories", { code: categoryCode, name: categoryName }, () => { setCategoryCode(""); setCategoryName(""); })} className="space-y-4 border border-border bg-surface p-5">
          <div><h2 className="font-semibold text-foreground">Create category</h2><p className="mt-1 text-xs text-muted">Use existing school subjects where they fit; category codes must be unique.</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-muted">Code<input required value={categoryCode} onChange={(event) => setCategoryCode(event.target.value.toUpperCase())} maxLength={40} placeholder="MATHEMATICS" className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Name<input required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={191} placeholder="Mathematics" className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label></div>
          <button disabled={busy} className="inline-flex h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Plus className="h-4 w-4" /> Create category</button>
        </form>

        <form onSubmit={(event) => void submit(event, "/admin/question-sets", { categoryId: selectedCategory, name: setName, gradeLabel, topic }, () => { setSetName(""); setGradeLabel(""); setTopic(""); })} className="space-y-4 border border-border bg-surface p-5">
          <div><h2 className="font-semibold text-foreground">Create question set</h2><p className="mt-1 text-xs text-muted">Question sets remain drafts until content has been reviewed.</p></div>
          <label className="block text-xs font-semibold text-muted">Category<select required value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold text-muted">Set name<input required value={setName} onChange={(event) => setSetName(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Grade<input value={gradeLabel} onChange={(event) => setGradeLabel(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-semibold text-muted">Topic<input value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-1 h-10 w-full border border-border bg-background px-3 text-sm text-foreground" /></label></div>
          <button disabled={busy || !categories.length} className="inline-flex h-10 items-center gap-2 border border-brand px-4 text-sm font-semibold text-brand hover:bg-brand-light disabled:opacity-50"><Plus className="h-4 w-4" /> Create set</button>
        </form>
      </section>

      <section className={`grid gap-5 xl:grid-cols-[.8fr_1.2fr] ${questionBankActive === false ? "hidden" : ""}`}>
        <div className="border border-border bg-surface p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-foreground">Question sets</h2><p className="mt-1 text-xs text-muted">{sets.length} loaded</p></div><select value={selectedSet} onChange={(event) => setSelectedSet(event.target.value)} className="h-9 max-w-[60%] border border-border bg-background px-2 text-sm text-foreground"><option value="">All sets</option>{sets.map((set) => <option key={set.id} value={set.id}>{set.name} · {set.status}</option>)}</select></div><div className="mt-4 divide-y divide-border border-y border-border">{sets.map((set) => <button key={set.id} type="button" onClick={() => setSelectedSet(set.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-background"><span><span className="block text-sm font-medium text-foreground">{set.name}</span><span className="text-xs text-muted">{set.gradeLabel || "All grades"} · {set.topic || "No topic"}</span></span><span className="text-xs text-muted">{set._count?.questions ?? 0} · {set.status}</span></button>)}</div></div>

        <form onSubmit={(event) => void submit(event, "/admin/questions", { questionSetId: selectedSet, prompt, type: "MULTIPLE_CHOICE", difficulty: "MEDIUM", options: options.map((content, index) => ({ content, isCorrect: correctOption === index })).filter((option) => option.content.trim()) }, () => { setPrompt(""); setOptions(["", "", "", ""]); setCorrectOption(0); })} className="space-y-4 border border-border bg-surface p-5">
          <div><h2 className="font-semibold text-foreground">Add multiple-choice question</h2><p className="mt-1 text-xs text-muted">Correct answers are stored server-side and never returned by the learner API.</p></div>
          <label className="block text-xs font-semibold text-muted">Question prompt<textarea required value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} maxLength={12000} className="mt-1 w-full border border-border bg-background p-3 text-sm text-foreground" /></label>
          <div className="space-y-2">{options.map((option, index) => <div key={index} className="flex items-center gap-2"><input type="radio" name="correct-option" checked={correctOption === index} onChange={() => setCorrectOption(index)} aria-label={`Mark option ${index + 1} correct`} /><input required value={option} onChange={(event) => setOptions((current) => current.map((value, item) => item === index ? event.target.value : value))} placeholder={`Option ${index + 1}`} className="h-10 min-w-0 flex-1 border border-border bg-background px-3 text-sm text-foreground" /></div>)}</div>
          <button disabled={busy || !selectedSet} className="inline-flex h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"><Plus className="h-4 w-4" /> Save draft question</button>
        </form>
      </section>

      <section className={`border border-border bg-surface p-5 ${questionBankActive === false ? "hidden" : ""}`}><div><h2 className="font-semibold text-foreground">Review queue</h2><p className="mt-1 text-xs text-muted">Questions in draft can’t appear in live challenges.</p></div><div className="mt-4 divide-y divide-border border-y border-border">{questions.map((question) => <article key={question.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="border border-border bg-background px-2 py-1 text-[11px] font-bold uppercase text-muted">{question.status}</span><span className="text-xs text-muted">{question.questionSet?.name ?? "Unassigned set"} · {question.difficulty}</span></div><p className="mt-2 text-sm font-medium text-foreground">{question.prompt}</p><ul className="mt-2 grid gap-1 sm:grid-cols-2">{question.options.map((option) => <li key={option.id} className={`border px-2 py-1 text-xs ${option.isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border text-muted"}`}>{option.content}{option.isCorrect ? " · Answer key" : ""}</li>)}</ul></div>{question.status !== "APPROVED" ? <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void review(question.id, "APPROVE")} className="inline-flex h-9 items-center gap-1 border border-emerald-300 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button><button type="button" disabled={busy} onClick={() => void review(question.id, "REJECT")} className="h-9 border border-border px-3 text-xs font-semibold text-muted hover:bg-background disabled:opacity-50">Reject</button></div> : null}</article>)}</div></section>
      <ErrorModal isOpen={Boolean(feedbackModal)} onClose={() => setFeedbackModal(null)} title={feedbackModal?.title} message={feedbackModal?.message || ""} details={feedbackModal?.details} type={feedbackModal?.type || "error"} confirmLabel={feedbackModal?.type === "success" ? "Done" : "Okay"} />
    </main>
  );
}
