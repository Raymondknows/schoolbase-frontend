"use client";

import Link from "next/link";
import { Fragment, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Save, AlertCircle } from "lucide-react";
import { getBackendUrl } from "@/lib/backend-url";
import { ErrorModal } from "@/components/ui/error-modal";
import AdminSkeleton from "@/components/ui/skeleton";

interface ScoreEntry {
  pupilId: string;
  caScore: number | null;
  testScore: number | null;
  examScore: number | null;
}

interface AssessmentResult {
  pupilId: string;
  pupilName: string;
  admissionNo: string;
  classId: string | null;
  className: string | null;
  caScore: number | null;
  testScore: number | null;
  examScore: number | null;
  totalScore: number | null;
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
  phase: string;
  status: string;
  isLocked?: boolean;
  canEdit?: boolean;
  components?: AssessmentComponent[];
  results: AssessmentResult[];
}

const DEFAULT_COMPONENTS: AssessmentComponent[] = [
  { id: "ca", name: "CA", maxScore: 20, weight: 20, sortOrder: 1 },
  { id: "test", name: "Test", maxScore: 20, weight: 20, sortOrder: 2 },
  { id: "exam", name: "Examination", maxScore: 60, weight: 60, sortOrder: 3 },
];

const getComponentDisplayName = (component: AssessmentComponent) =>
  component.id === "ca" ? "CA" : component.name;

export default function TeacherSubjectScoresPage({
  params,
}: {
  params: Promise<{ id: string; subjectId: string }>;
}) {
  const { id, subjectId } = use(params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState<string>(
    typeof subjectId === "string" ? decodeURIComponent(subjectId) : ""
  );

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalType, setSaveModalType] = useState<"success" | "error">("success");
  const [saveModalTitle, setSaveModalTitle] = useState("Scores saved");
  const [saveModalMessage, setSaveModalMessage] = useState("");

  const router = useRouter();

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/teacher/assessments/${id}?subjectId=${encodeURIComponent(subjectId)}`
      );
      if (!response.ok) throw new Error("Failed to fetch assessment");
      const data = await response.json();
      setAssessment(data.assessment);

      const seenPupils = new Set<string>();
      const uniqueResults: AssessmentResult[] = [];

      data.assessment.results.forEach((result: AssessmentResult) => {
        if (!seenPupils.has(result.pupilId)) {
          seenPupils.add(result.pupilId);
          uniqueResults.push(result);
        }
      });

      const initialScores: Record<string, ScoreEntry> = {};
      uniqueResults.forEach((result: AssessmentResult) => {
        initialScores[result.pupilId] = {
          pupilId: result.pupilId,
          caScore: result.caScore,
          testScore: result.testScore,
          examScore: result.examScore,
        };
      });

      setResults(uniqueResults);
      setScores(initialScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSubjectName = async () => {
      try {
        const response = await fetch(
          `/api/teacher/subjects?assessmentId=${encodeURIComponent(id)}`
        );
        if (!response.ok) return;

        const data = await response.json();
        const matchedSubject = (data.subjects || []).find(
          (subject: { id: string; name: string }) => subject.id === subjectId,
        );

        if (matchedSubject?.name) {
          setSubjectName(matchedSubject.name);
        }
      } catch {
        // Keep the fallback label based on the ID.
      }
    };

    if (subjectId) {
      fetchSubjectName();
      fetchAssessment();
    }
  }, [id, subjectId]);

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

    try {
      const entries = Object.entries(scores)
        .map(([pupilId, entry]) => {
          const computedTotal = calculateTotal(entry.caScore, entry.testScore, entry.examScore);
          return {
            pupilId,
            caScore: entry.caScore,
            testScore: entry.testScore,
            examScore: entry.examScore,
            ...(computedTotal !== null ? { totalScore: parseFloat(computedTotal) } : {}),
          };
        })
        .filter(
          (entry) =>
            entry.caScore !== null || entry.testScore !== null || entry.examScore !== null
        );

      if (entries.length === 0) {
        setSaveModalType("error");
        setSaveModalTitle("Nothing to save");
        setSaveModalMessage("Please enter at least one score before saving.");
        setSaveModalOpen(true);
        setSaving(false);
        return;
      }

      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/teacher/results`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: id,
          subjectId,
          scores: entries,
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

      setSaveModalType("success");
      setSaveModalTitle("Scores saved");
      setSaveModalMessage("Scores were saved successfully for this subject.");
      setSaveModalOpen(true);
      await fetchAssessment();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save scores";
      setSaveModalType("error");
      setSaveModalTitle("Save failed");
      setSaveModalMessage(message);
      setSaveModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-4">
        <Link
          href={`/teacher/results/${id}/subjects`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error || "Assessment not found"}</p>
        </div>
      </div>
    );
  }

  const isPublished = assessment.status === "PUBLISHED";
  const isLocked = Boolean(assessment.isLocked);
  const canEdit = Boolean(assessment.canEdit);
  const readOnly = isPublished || !canEdit || isLocked;
  const phaseLabel = assessment.phase.replace(/_/g, " ");

  const groupedResults = Array.from(
    results.reduce((groups, result) => {
      const classKey = result.classId || result.className || "unassigned";
      const currentGroup = groups.get(classKey) ?? {
        classId: result.classId,
        className: result.className || "Class not assigned",
        results: [] as AssessmentResult[],
      };

      currentGroup.results.push(result);
      groups.set(classKey, currentGroup);
      return groups;
    }, new Map<string, { classId: string | null; className: string; results: AssessmentResult[] }>())
  ).sort((a, b) => a[1].className.localeCompare(b[1].className));

  return (
    <div className="mx-auto max-w-6xl px-3 py-4">
      <Link
        href={`/teacher/results/${id}/subjects`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Subjects
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{assessment.name}</h1>
          <p className="text-sm text-muted mt-1">Subject: {subjectName}</p>
          <p className="text-xs text-muted mt-1">Phase: {phaseLabel}</p>
        </div>
        <Badge variant="secondary" className="bg-brand/10 text-brand border-brand/30">
          West African Standard
        </Badge>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Scoring Standard</h3>
        <div className="flex flex-wrap gap-2">
          {components.map((component) => (
            <Badge
              key={component.id}
              variant="secondary"
              className="bg-brand/10 text-brand border-brand/30"
            >
              {getComponentDisplayName(component)} ({component.maxScore})
            </Badge>
          ))}
        </div>
      </div>

      <ErrorModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title={saveModalTitle}
        message={saveModalMessage}
        type={saveModalType}
        confirmLabel={saveModalType === "success" ? "Done" : "Review"}
      />

      {(isPublished || isLocked) && (
        <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-700">
            {isLocked
              ? "This assessment is locked and cannot be edited."
              : "This assessment is published and cannot be edited."}
          </p>
        </div>
      )}

      {results.length === 0 ? (
        <div className="py-12 text-center rounded-lg border border-border bg-surface">
          <p className="text-muted">No students found for this subject</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                      Admission No
                    </th>
                    {components.map((component) => (
                      <th
                        key={component.id}
                        className="px-4 py-3 text-center text-sm font-semibold text-foreground"
                      >
                        {getComponentDisplayName(component)} ({component.maxScore})
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedResults.map(([classKey, group], groupIndex) => (
                    <Fragment key={`class-${classKey}`}>
                      <tr
                        className={
                          groupIndex === 0
                          ? "border-y-2 border-border bg-background"
                          : "border-y-4 border-brand/40 bg-brand/5"
                        }
                      >
                        <td
                          colSpan={2 + components.length + 1}
                        className="px-4 py-3"
                        >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                            Phase: {phaseLabel}
                            {group.className && group.className !== 'Class not assigned' ? ` · Class: ${group.className}` : ''}
                          </span>
                          <div className="h-px flex-1 bg-brand/40" />
                          <span className="text-[10px] font-medium normal-case tracking-normal text-muted whitespace-nowrap">
                            {group.results.length} student{group.results.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        </td>
                      </tr>
                      {group.results.map((result) => {
                        const entry = scores[result.pupilId];
                        const total = calculateTotal(
                          entry?.caScore ?? null,
                          entry?.testScore ?? null,
                          entry?.examScore ?? null
                        );

                        return (
                          <tr
                            key={result.pupilId}
                            className="border-b border-border hover:bg-surface/50"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-foreground">
                              {result.pupilName}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted">
                              {result.admissionNo}
                            </td>
                            {components.map((component, index) => {
                              const field = ["caScore", "testScore", "examScore"][index] as
                                | "caScore"
                                | "testScore"
                                | "examScore";

                              return (
                                <td key={component.id} className="px-4 py-3 text-center border border-border">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*([.,][0-9]+)?"
                                    min="0"
                                    max={component.maxScore}
                                    value={entry?.[field] ?? ""}
                                    onChange={(e) =>
                                      handleScoreChange(result.pupilId, field, e.target.value)
                                    }
                                    disabled={readOnly}
                                    className="w-16 px-2 py-1 rounded border border-border bg-background text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center font-semibold text-foreground">
                              {total || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <Link href={`/teacher/results/${id}/subjects`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={saving || readOnly}
              className="bg-brand hover:bg-brand/90 text-white"
            >
              {saving ? "Saving..." : <Save className="w-4 h-4 mr-2" />}
              Save Scores
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
