"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { BookOpen, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import AdminSkeleton from "@/components/ui/skeleton";
import TeacherPageHeader from "@/components/teacher-page-header";

interface Subject {
  id: string;
  name: string;
}

export default function TeacherSubjectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teacher/subjects?assessmentId=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error("Failed to fetch subjects");
        const data = await response.json();
        setSubjects(data.subjects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return <AdminSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-4">
        <Link href={`/teacher/results/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">Back to assessment</Link>
        <div className="mt-4 flex items-start gap-3 border border-red-200 bg-red-50 p-4">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-4">
        <Link href={`/teacher/results/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">Back to assessment</Link>
        <div className="mt-6 border border-dashed border-[#9ac7ea] bg-[#f3f9fe] px-6 py-14 text-center">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No Subjects Assigned</h2>
          <p className="text-sm text-muted">
            You have not been assigned any subjects for scoring yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6 lg:px-8">
      <TeacherPageHeader icon={BookOpen} title="Enter subject scores" description="Choose a subject to open its score-entry workspace and record student results." count={`${subjects.length} subjects`} actionLabel="Assessment" actionHref={`/teacher/results/${id}`} />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border border-border bg-surface p-5"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand"><BookOpen className="h-4 w-4" /></div><p className="mt-4 text-[11px] font-bold uppercase tracking-[.14em] text-muted">Available subjects</p><p className="mt-1 text-2xl font-semibold text-foreground">{subjects.length}</p><p className="mt-1 text-xs text-muted">Ready for score entry</p></div>
        <div className="border border-border bg-surface p-5"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div><p className="mt-4 text-[11px] font-bold uppercase tracking-[.14em] text-muted">Workflow</p><p className="mt-1 text-2xl font-semibold text-foreground">Subject by subject</p><p className="mt-1 text-xs text-muted">Focused, accurate entry</p></div>
        <div className="border border-border bg-surface p-5"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-700"><BookOpen className="h-4 w-4" /></div><p className="mt-4 text-[11px] font-bold uppercase tracking-[.14em] text-muted">Next step</p><p className="mt-1 text-2xl font-semibold text-foreground">Choose a subject</p><p className="mt-1 text-xs text-muted">Open the gradebook below</p></div>
      </section>

      <section className="border border-border bg-surface">
        <div className="border-b border-border bg-background px-5 py-4"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-brand">Score-entry queue</p><h2 className="mt-1 text-lg font-semibold text-foreground">Select a subject</h2><p className="mt-1 text-sm text-muted">Each subject opens a dedicated gradebook for this assessment.</p></div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            href={`/teacher/results/${id}/subjects/${encodeURIComponent(subject.id)}`}
          >
            <div className="h-full border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-brand/50 hover:bg-brand-light/20 hover:shadow-sm group">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white"><BookOpen className="h-5 w-5" /></div>
                <span className="text-xs font-semibold text-muted">Ready</span>
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors">
                {subject.name}
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted">Open the subject gradebook and enter scores for every learner.</p>
              <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">Enter scores <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></div>
            </div>
          </Link>
        ))}
      </div>
      </section>
    </div>
  );
}
