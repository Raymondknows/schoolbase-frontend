"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Save, AlertCircle } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import AdminSkeleton from "@/components/ui/skeleton";

interface ScoreEntry {
  pupilId: string;
  caScore: number | null;
  testScore: number | null;
  examScore: number | null;
}

interface Pupil {
  id: string;
  name: string;
  admissionNo: string;
}

interface AssessmentComponent {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  sortOrder?: number;
}

interface Assessment {
  id: string;
  name: string;
  status: string;
  isLocked?: boolean;
  canEdit?: boolean;
  components?: AssessmentComponent[];
  results: Array<{
    pupilId: string;
    caScore: number | null;
    testScore: number | null;
    examScore: number | null;
    totalScore: number | null;
    pupil: { id: string; name: string };
  }>;
}

const DEFAULT_COMPONENTS: AssessmentComponent[] = [
  { id: "ca", name: "Continuous Assessment", maxScore: 20, weight: 20, sortOrder: 1 },
  { id: "test", name: "Test", maxScore: 20, weight: 20, sortOrder: 2 },
  { id: "exam", name: "Examination", maxScore: 60, weight: 60, sortOrder: 3 },
];

export default function TeacherScoreEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/assessments/${id}`);
      if (!response.ok) throw new Error("Failed to fetch assessment");
      const data = await response.json();
      setAssessment(data.assessment);

      const uniquePupils: Record<string, Pupil> = {};
      const initialScores: Record<string, ScoreEntry> = {};

      data.assessment.results.forEach((result: any) => {
        const pupilId = result.pupilId;
        if (!uniquePupils[pupilId]) {
          uniquePupils[pupilId] = {
            id: pupilId,
            name: result.pupilName,
            admissionNo: result.admissionNo,
          };
        }

        initialScores[pupilId] = {
          pupilId,
          caScore: result.caScore,
          testScore: result.testScore,
          examScore: result.examScore,
        };
      });

      setPupils(Object.values(uniquePupils));
      setScores(initialScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const handleScoreChange = (
    pupilId: string,
    field: "caScore" | "testScore" | "examScore",
    value: string
  ) => {
    setScores((prev) => ({
      ...prev,
      [pupilId]: {
        ...prev[pupilId],
        [field]: value ? parseFloat(value) : null,
      },
    }));
  };

  const components = (assessment?.components && assessment.components.length > 0
    ? [...assessment.components]
    : DEFAULT_COMPONENTS
  ).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const calculateTotal = (
    caScore: number | null,
    testScore: number | null,
    examScore: number | null
  ) => {
    const values = [caScore, testScore, examScore];
    if (values.some((score) => score === null)) return null;

    return components
      .reduce((total, component, index) => {
        const score = values[index] ?? 0;
        return total + (score / component.maxScore) * component.weight;
      }, 0)
      .toFixed(1);
  };

  const handleSave = async () => {
    if (!assessment) return;
    setSaving(true);
    setMessage(null);

    try {
      const entries = Object.values(scores)
        .map((entry) => {
          const computedTotal = calculateTotal(entry.caScore, entry.testScore, entry.examScore);
          return {
            ...entry,
            ...(computedTotal !== null ? { totalScore: parseFloat(computedTotal) } : {}),
          };
        })
        .filter((entry) => entry.caScore !== null || entry.testScore !== null || entry.examScore !== null);

      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/teacher/results`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: id,
          entries,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error || "Failed to save scores");
        } catch {
          throw new Error(errorText || "Failed to save scores");
        }
      }

      setMessage({ type: "success", text: "Scores saved successfully" });
      await fetchAssessment();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save scores",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-4">
        <Link
          href={`/teacher/results/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error || "Assessment not found"}</p>
        </div>
      </div>
    );
  }

  const isLocked = Boolean(assessment?.isLocked);
  const canEdit = Boolean(assessment?.canEdit);
  const isDraft = assessment.status === "DRAFT" && canEdit && !isLocked;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4">
      <Link
        href={`/teacher/results/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Assessment
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{assessment.name}</h1>
          <p className="text-sm text-muted mt-1">Enter scores for your students</p>
        </div>
        <Badge variant={isDraft ? "default" : "secondary"} className="bg-brand/10 text-brand border-brand/30">
          {isDraft ? "Draft - Editing Allowed" : "Status: " + assessment.status}
        </Badge>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Scoring Standard</h3>
        <div className="flex flex-wrap gap-2">
          {components.map((component) => (
            <Badge key={component.id} variant="secondary" className="bg-brand/10 text-brand border-brand/30">
              {component.name} ({component.maxScore})
            </Badge>
          ))}
        </div>
      </div>

      {!isDraft && (
        <div className="mb-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Assessment Locked</h3>
            <p className="text-sm text-amber-800 mt-1">
              {isLocked
                ? "This assessment is locked and score entry is disabled."
                : "This assessment is no longer in draft status. Score entry is disabled."}
            </p>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {pupils.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-muted">No students assigned to this assessment</p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                  <th className="px-4 py-3 text-center font-semibold">Admission No</th>
                  {components.map((component) => (
                    <th key={component.id} className="px-4 py-3 text-center font-semibold">
                      {component.name} ({component.maxScore})
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {pupils.map((pupil, index) => {
                  const score = scores[pupil.id];
                  const total = calculateTotal(score?.caScore ?? null, score?.testScore ?? null, score?.examScore ?? null);
                  return (
                    <tr key={pupil.id} className={index % 2 === 0 ? "bg-surface" : "bg-background/50"}>
                      <td className="px-4 py-3 font-medium">{pupil.name}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted">{pupil.admissionNo}</td>
                      {components.map((component, componentIndex) => {
                        const field = ["caScore", "testScore", "examScore"][componentIndex] as
                          | "caScore"
                          | "testScore"
                          | "examScore";

                        return (
                          <td key={component.id} className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max={component.maxScore}
                              step="0.1"
                              value={score?.[field] ?? ""}
                              onChange={(e) => handleScoreChange(pupil.id, field, e.target.value)}
                              disabled={!isDraft}
                              className="w-full max-w-20 rounded border border-border bg-surface px-2 py-1 text-center text-sm disabled:bg-gray-100 disabled:text-gray-500"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-semibold">{total ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isDraft && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push(`/teacher/results/${id}`)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-brand hover:bg-brand-dark">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Scores"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
