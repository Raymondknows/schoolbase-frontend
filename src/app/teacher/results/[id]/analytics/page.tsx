"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ChevronLeft, BarChart3, TrendingUp, AlertCircle, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminSkeleton from "@/components/ui/skeleton";

interface StudentResult {
  pupilId: string;
  pupilName: string;
  admissionNo: string;
  totalScore: number;
  grade: string;
}

interface Statistics {
  totalStudents: number;
  totalResults: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  passCount: number;
  passRate: number;
  gradeDistribution: Record<string, number>;
}

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-green-100", text: "text-green-800" },
  B: { bg: "bg-blue-100", text: "text-blue-800" },
  C: { bg: "bg-yellow-100", text: "text-yellow-800" },
  D: { bg: "bg-orange-100", text: "text-orange-800" },
  E: { bg: "bg-red-100", text: "text-red-800" },
  F: { bg: "bg-red-200", text: "text-red-900" },
};

const PERFORMANCE_BANDS = [
  { name: "Excellent (90-100%)", min: 90, max: 100, color: "bg-green-500" },
  { name: "Very Good (80-89%)", min: 80, max: 89, color: "bg-blue-500" },
  { name: "Good (70-79%)", min: 70, max: 79, color: "bg-cyan-500" },
  { name: "Satisfactory (60-69%)", min: 60, max: 69, color: "bg-yellow-500" },
  { name: "Fair (50-59%)", min: 50, max: 59, color: "bg-orange-500" },
  { name: "Poor (<50%)", min: 0, max: 49, color: "bg-red-500" },
];

export default function TeacherAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<any>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assessmentRes, statsRes] = await Promise.all([
          fetch(`/api/teacher/assessments/${id}`),
          fetch(`/api/report-cards/assessment/${id}/statistics`),
        ]);

        if (!assessmentRes.ok || !statsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const assessmentData = await assessmentRes.json();
        const statsData = await statsRes.json();

        setAssessment(assessmentData.assessment);
        // Merge top-level stats with nested statistics object
        setStatistics({
          totalStudents: statsData.totalStudents || 0,
          totalResults: statsData.totalResults || 0,
          ...statsData.statistics,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <AdminSkeleton />;
  }

  if (error || !statistics || !assessment) {
    return (
      <div className="space-y-4">
        <Link
          href={`/teacher/results/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Assessment
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error || "Analytics not available"}</p>
        </div>
      </div>
    );
  }

  // Calculate performance bands distribution
  const bandDistribution = PERFORMANCE_BANDS.map((band) => {
    const count = assessment.results?.filter(
      (r: StudentResult) => r.totalScore >= band.min && r.totalScore <= band.max
    ).length || 0;
    return { ...band, count };
  });

  // Get top and bottom performers
  const sortedByScore = [...(assessment.results || [])].sort(
    (a: StudentResult, b: StudentResult) => b.totalScore - a.totalScore
  );
  const topPerformers = sortedByScore.slice(0, 5);
  const bottomPerformers = sortedByScore.slice(-5).reverse();

  // Calculate grade distribution chart width
  const maxGradeCount = Math.max(...Object.values(statistics.gradeDistribution as Record<string, number>));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/teacher/results/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Assessment
        </Link>
        <h1 className="text-3xl font-bold mb-2">{assessment.name} - Analytics</h1>
        <p className="text-muted">Comprehensive performance analysis and statistics</p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-muted font-medium mb-2">Average Score</p>
          <p className="text-3xl font-bold text-foreground">
            {statistics.averageScore.toFixed(1)}
          </p>
          <p className="text-xs text-muted mt-2">Class Average</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-muted font-medium mb-2">Median Score</p>
          <p className="text-3xl font-bold text-foreground">
            {statistics.medianScore.toFixed(1)}
          </p>
          <p className="text-xs text-muted mt-2">Middle Value</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-muted font-medium mb-2">Pass Rate</p>
          <p className="text-3xl font-bold text-green-600">
            {statistics.passRate}%
          </p>
          <p className="text-xs text-muted mt-2">
            {statistics.passCount} of {statistics.totalResults} passed
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-muted font-medium mb-2">Std. Deviation</p>
          <p className="text-3xl font-bold text-foreground">
            {statistics.standardDeviation.toFixed(2)}
          </p>
          <p className="text-xs text-muted mt-2">Score Variation</p>
        </div>
      </div>

      {/* Score Range Card */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold mb-4">Score Range</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted mb-2">Highest Score</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.highestScore}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Lowest Score</p>
            <p className="text-2xl font-bold text-red-600">
              {statistics.lowestScore}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Range</p>
            <p className="text-2xl font-bold text-foreground">
              {statistics.highestScore - statistics.lowestScore}
            </p>
          </div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold mb-4">Grade Distribution</h2>
        <div className="space-y-3">
          {Object.entries(statistics.gradeDistribution)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([grade, count]) => {
              const percentage = Math.round(
                (count / statistics.totalResults) * 100
              );
              const colors = GRADE_COLORS[grade] || { bg: "bg-gray-100", text: "text-gray-800" };
              return (
                <div key={grade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Grade {grade}</span>
                    <span className="text-sm text-muted">
                      {count} students ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-6 rounded-lg bg-background overflow-hidden">
                    <div
                      className={`h-full ${colors.bg} flex items-center justify-center transition-all`}
                      style={{
                        width: `${(count / maxGradeCount) * 100}%`,
                      }}
                    >
                      <span className={`text-xs font-bold ${colors.text}`}>
                        {percentage > 10 && percentage + "%"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Performance Bands */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Bands</h2>
        <div className="space-y-3">
          {bandDistribution.map((band, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{band.name}</span>
                <span className="text-sm text-muted">
                  {band.count} students
                </span>
              </div>
              <div className="w-full h-8 rounded-lg bg-background overflow-hidden">
                <div
                  className={`h-full ${band.color} flex items-center justify-center transition-all`}
                  style={{
                    width: `${(band.count / statistics.totalStudents) * 100 || 5}%`,
                  }}
                >
                  <span className="text-xs font-bold text-white">
                    {Math.round(
                      (band.count / statistics.totalStudents) * 100
                    )}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold">Top 5 Performers</h2>
        </div>
        <div className="space-y-2">
          {topPerformers.map((result: StudentResult, idx: number) => (
            <div
              key={result.pupilId}
              className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{result.pupilName}</p>
                  <p className="text-xs text-muted">{result.admissionNo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {result.totalScore}
                </p>
                <Badge className="mt-1">Grade {result.grade}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* At-Risk Students (Bottom Performers) */}
      <div className="rounded-lg border border-border bg-surface p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">At-Risk Students</h2>
        </div>
        <div className="space-y-2">
          {bottomPerformers.map((result: StudentResult, idx: number) => {
            const isFailure = result.grade === "F" || result.grade === "E";
            return (
              <div
                key={result.pupilId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isFailure ? "bg-white border-l-4 border-red-600" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isFailure ? "bg-red-100 text-red-900" : "bg-yellow-100 text-yellow-900"
                  } font-bold text-sm`}>
                    {bottomPerformers.length - idx}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{result.pupilName}</p>
                    <p className="text-xs text-muted">{result.admissionNo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {result.totalScore}
                  </p>
                  <Badge variant={isFailure ? "error" : "secondary"}>
                    Grade {result.grade}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Statistics Table */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-background rounded">
            <p className="text-xs text-muted mb-1">Total Students</p>
            <p className="text-2xl font-bold">{statistics.totalStudents}</p>
          </div>
          <div className="p-3 bg-background rounded">
            <p className="text-xs text-muted mb-1">Results Entered</p>
            <p className="text-2xl font-bold">{statistics.totalResults}</p>
          </div>
          <div className="p-3 bg-background rounded">
            <p className="text-xs text-muted mb-1">Completion Rate</p>
            <p className="text-2xl font-bold">
              {Math.round(
                (statistics.totalResults / statistics.totalStudents) * 100
              )}%
            </p>
          </div>
          <div className="p-3 bg-background rounded">
            <p className="text-xs text-muted mb-1">Passed</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.passCount}
            </p>
          </div>
          <div className="p-3 bg-background rounded">
            <p className="text-xs text-muted mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {Math.max(0, (statistics.totalResults || 0) - (statistics.passCount || 0))}
            </p>
          </div>
          <div className="p-3 bg-background rounded">
            <p className="text-xs text-muted mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.passRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
