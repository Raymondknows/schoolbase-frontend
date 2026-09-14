"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { ChevronLeft, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminSkeleton from "@/components/ui/skeleton";

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
        <Link
          href={`/teacher/results/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!subjects || subjects.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-4">
        <Link
          href={`/teacher/results/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="mt-8 text-center py-12 rounded-lg border border-border bg-surface">
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
    <div className="mx-auto max-w-6xl px-3 py-4">
      <Link
        href={`/teacher/results/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Select Subject</h1>
        <p className="text-sm text-muted mt-1">
          Choose a subject to enter scores for students
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Link
            key={subject.id}
            href={`/teacher/results/${id}/subjects/${encodeURIComponent(subject.id)}`}
          >
            <div className="h-full p-6 rounded-xl border border-border bg-surface hover:border-brand hover:bg-brand/5 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <BookOpen className="w-8 h-8 text-brand group-hover:text-brand" />
                <Badge variant="default" className="bg-brand/10 text-brand">
                  Subject
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors mb-2">
                {subject.name}
              </h3>
              <p className="text-xs text-muted mb-4">
                Click to enter scores for this subject
              </p>
              <Button
                className="w-full bg-brand hover:bg-brand/90 text-white"
              >
                Enter Scores
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
